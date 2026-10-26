// lib/gemini.ts
//
// SERVER-ONLY. The Gemini side of the terminal agent: the model fallback
// chain, the function-calling round-trip, and streaming.
//
// Streaming (`:streamGenerateContent?alt=sse`): round 1 streams its text
// deltas to the caller as they arrive. Function calls arrive as their own
// parts in the stream, so tools still run. If streaming fails before any
// text arrives (an error status, or a stream that ends empty — forums report
// both with function declarations on some models), we retry that round on
// the non-streaming endpoint. Round 2 (the reply after a tool ran) is a
// normal request; its text is emitted as one delta.

import {
    buildSystemInstruction,
    TOOL_DECLARATIONS,
    SERVER_TOOL_NAMES,
    SUGGEST_MARKER,
    toAgentAction,
    parseReply,
    type AgentAction,
    type AgentReply,
    type ChatMessage,
} from '@/src/lib/aiAgent'
import { executeServerTool, type ToolContext } from '@/src/lib/agentTools'

// ── Gemini wire types (partial — only what we read) ────────────────────────
interface GeminiPart {
    text?: string
    functionCall?: { name: string; args?: Record<string, unknown> }
}
interface GeminiContent {
    role?: string
    parts?: GeminiPart[]
}
export interface GeminiResponse {
    candidates?: Array<{ content?: GeminiContent; finishReason?: string }>
    promptFeedback?: { blockReason?: string }
}

/** Thrown when Gemini itself returns a non-2xx (vs a local/network failure). */
export class GeminiError extends Error {
    constructor(public status: number, detail: string) {
        super(`Gemini ${status}: ${detail.slice(0, 200)}`)
    }
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Models tried in order: the configured model first, then fallbacks. Each
 * has independent free-tier quota, so a 429/503 on one falls through.
 */
export function modelChain(configured = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'): string[] {
    return Array.from(new Set([
        configured,
        'gemini-2.5-flash-lite',
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
    ]))
}

const RETRYABLE = [429, 500, 503]

function apiKey(): string {
    return process.env.GEMINI_API_KEY ?? ''
}

async function callModel(model: string, body: unknown): Promise<GeminiResponse> {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new GeminiError(res.status, await res.text().catch(() => ''))
    return res.json()
}

/** Non-streaming request across the model chain. */
async function callGemini(body: unknown, chain = modelChain()): Promise<GeminiResponse> {
    let lastErr: unknown
    for (const model of chain) {
        try {
            return await callModel(model, body)
        } catch (err) {
            lastErr = err
            if (err instanceof GeminiError && RETRYABLE.includes(err.status)) continue
            throw err
        }
    }
    throw lastErr
}

/**
 * Parse a Gemini SSE body (`data: {json}` events separated by blank lines)
 * into response chunks. Exported for tests.
 */
export async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<GeminiResponse> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
        const { value, done } = await reader.read()
        if (value) buffer += decoder.decode(value, { stream: true })
        if (done) buffer += '\n\n'
        let sep: number
        while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
            const event = buffer.slice(0, sep)
            buffer = buffer.slice(buffer.slice(sep).match(/^\r?\n\r?\n/)![0].length + sep)
            const data = event.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('')
            if (!data || data === '[DONE]') continue
            try { yield JSON.parse(data) as GeminiResponse } catch { /* skip a malformed event */ }
        }
        if (done) return
    }
}

/** Open a streaming request on the first model in the chain that accepts it. */
async function openStream(body: unknown, chain: string[]): Promise<ReadableStream<Uint8Array>> {
    let lastErr: unknown
    for (const model of chain) {
        try {
            const res = await fetch(`${API_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok || !res.body) throw new GeminiError(res.status, await res.text().catch(() => ''))
            return res.body
        } catch (err) {
            lastErr = err
            if (err instanceof GeminiError && RETRYABLE.includes(err.status)) continue
            throw err
        }
    }
    throw lastErr
}

/**
 * Hides the suggestion marker (and everything after it) from the streamed
 * text: emits only text that can no longer turn into "::SUGGEST::".
 */
export class VisibleTextStream {
    private raw = ''
    private emitted = 0

    constructor(private emit: (delta: string) => void) {}

    push(chunk: string): void {
        this.raw += chunk
        const marker = this.raw.indexOf(SUGGEST_MARKER)
        let safe: number
        if (marker !== -1) {
            safe = marker
        } else {
            // Hold back a tail that could be the start of the marker
            safe = this.raw.length
            for (let k = Math.min(SUGGEST_MARKER.length - 1, this.raw.length); k > 0; k--) {
                if (SUGGEST_MARKER.startsWith(this.raw.slice(-k))) { safe = this.raw.length - k; break }
            }
        }
        // Never emit leading whitespace on its own
        if (this.emitted === 0) {
            const lead = this.raw.slice(0, safe).search(/\S/)
            if (lead === -1) return
            this.emitted = lead
        }
        if (safe > this.emitted) {
            this.emit(this.raw.slice(this.emitted, safe))
            this.emitted = safe
        }
    }

    get text(): string { return this.raw }
    get hasEmitted(): boolean { return this.emitted > 0 }
}

function partsOf(resp: GeminiResponse): GeminiPart[] {
    return resp.candidates?.[0]?.content?.parts ?? []
}

function joinText(parts: GeminiPart[]): string {
    return parts.map(p => p.text || '').join('').trim()
}

/** A sensible spoken confirmation if the model couldn't produce one itself. */
function confirmationFor(actions: AgentAction[]): string {
    const a = actions[0]
    if (!a) return 'On it.'
    switch (a.type) {
        case 'navigate': return `Taking you to my ${a.section} now.`
        case 'showSection': return `Here's my ${a.section}.`
        case 'downloadResume': return 'Downloading my CV for you now.'
        case 'openLink': return `Opening my ${a.target} for you.`
        case 'runCommand': return `Running \`${a.command}\`.`
        case 'startTour': return 'Starting the tour — here we go.'
        default: return 'On it.'
    }
}

// thinkingBudget: 0 disables Gemini 2.5's internal "thinking" pass — latency
// and tokens we don't need for grounded, concise Q&A. Ignored by other models.
const GENERATION_CONFIG = {
    temperature: 0.7,
    maxOutputTokens: 500,
    topP: 0.95,
    thinkingConfig: { thinkingBudget: 0 },
}

export interface ChatOptions {
    /** Stream round 1 and report visible text deltas as they arrive. */
    onDelta?: (text: string) => void
    chain?: string[]
    /** Caller identity for server tools (send_message is guarded). */
    toolContext?: ToolContext
}

/**
 * Run one agent turn: round 1 (answer and/or call tools), server tools,
 * round 2 when needed. Returns the final reply; with `onDelta` the visible
 * text is also streamed while it is generated.
 */
export async function runChat(messages: ChatMessage[], { onDelta, chain = modelChain(), toolContext }: ChatOptions = {}): Promise<AgentReply> {
    const systemInstruction = { parts: [{ text: buildSystemInstruction() }] }
    const contents: GeminiContent[] = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
    const round1 = {
        systemInstruction,
        contents,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        generationConfig: GENERATION_CONFIG,
    }

    // ── Round 1 ──
    const visible = new VisibleTextStream(delta => onDelta?.(delta))
    let firstParts: GeminiPart[] = []
    let blockReason: string | undefined
    let streamed = false

    if (onDelta) {
        try {
            const stream = await openStream(round1, chain)
            const calls: GeminiPart[] = []
            for await (const chunk of parseSSE(stream)) {
                blockReason ??= chunk.promptFeedback?.blockReason
                for (const part of partsOf(chunk)) {
                    if (part.text) visible.push(part.text)
                    if (part.functionCall) calls.push(part)
                }
            }
            firstParts = [...(visible.text ? [{ text: visible.text }] : []), ...calls]
            streamed = firstParts.length > 0 || !!blockReason
        } catch (err) {
            // Nothing shown yet: fall back to the plain request below.
            // Text already shown can't be retracted, so then we give up.
            if (visible.hasEmitted) throw err
            console.warn('[chat] streaming failed, falling back:', err instanceof Error ? err.message : err)
        }
    }
    if (!streamed) {
        const first = await callGemini(round1, chain)
        blockReason = first.promptFeedback?.blockReason
        firstParts = partsOf(first)
    }

    const actions: AgentAction[] = []
    const rawCalls: NonNullable<GeminiPart['functionCall']>[] = []
    for (const part of firstParts) {
        if (!part.functionCall) continue
        rawCalls.push(part.functionCall)
        const action = toAgentAction(part.functionCall.name, part.functionCall.args)
        if (action) actions.push(action)
    }
    let text = joinText(firstParts)

    // ── Server tools (send_message, get_repo_stats) ──
    const hasServerTool = rawCalls.some(fc => SERVER_TOOL_NAMES.has(fc.name))
    const toolResults = await Promise.all(rawCalls.map(async fc => SERVER_TOOL_NAMES.has(fc.name)
        ? { name: fc.name, response: await executeServerTool(fc.name, fc.args, toolContext) }
        : { name: fc.name, response: { status: 'ok', note: "Action performed on the visitor's screen." } }))

    // ── Round 2: when a server tool ran, or tools were called with no prose.
    // Tools are re-declared but forced to mode NONE so it can't loop. If it
    // fails, the actions from round 1 still go back to the visitor. ──
    if (rawCalls.length > 0 && (hasServerTool || !text)) {
        const modelTurn: GeminiContent = { role: 'model', parts: rawCalls.map(fc => ({ functionCall: fc })) }
        const toolTurn = {
            role: 'user',
            parts: toolResults.map(r => ({ functionResponse: { name: r.name, response: r.response } })),
        } as unknown as GeminiContent
        try {
            const second = await callGemini({
                systemInstruction,
                contents: [...contents, modelTurn, toolTurn],
                tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
                toolConfig: { functionCallingConfig: { mode: 'NONE' } },
                generationConfig: GENERATION_CONFIG,
            }, chain)
            const secondText = joinText(partsOf(second))
            if (secondText) {
                // Already-streamed round-1 text stays; the new text follows it
                text = visible.hasEmitted ? `${parseReply(text).text}\n\n${secondText}` : secondText
                if (onDelta) {
                    const { text: shown } = parseReply(secondText)
                    if (shown) onDelta((visible.hasEmitted ? '\n\n' : '') + shown)
                }
            }
        } catch (e) {
            console.error('[chat] round-2 confirmation failed; returning actions anyway:', e)
        }
    }

    const { text: visibleText, suggestions } = parseReply(text)
    text = visibleText
    if (!text) {
        if (actions.length > 0) text = confirmationFor(actions)
        else if (rawCalls.length > 0) text = 'Done — anything else I can help with?'
        else text = blockReason
            ? "I can't help with that one — but ask me anything about my work, projects, or how to reach me."
            : 'Ask me about my experience, projects, skills, or how to get in touch.'
    }
    return { text, actions, suggestions }
}
