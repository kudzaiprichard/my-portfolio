// app/api/chat/route.ts
//
// Server-side proxy to Google AI Studio (Gemini). The API key is server-only
// (GEMINI_API_KEY, never NEXT_PUBLIC) so it never reaches the browser bundle.
//
// Responsibilities:
//   - Rate limit (per-IP/minute + a crude global daily cap) to protect the
//     free-tier quota from abuse.
//   - Build the grounded request (persona + knowledge base + tools).
//   - Run the function-calling round-trip so the model can both act and reply.
//   - Return a clean { text, actions } payload the terminal can animate/execute.

import { NextResponse } from 'next/server'
import {
    buildSystemInstruction,
    TOOL_DECLARATIONS,
    SERVER_TOOL_NAMES,
    toAgentAction,
    parseReply,
    type AgentAction,
    type ChatMessage,
} from '@/src/lib/aiAgent'
import { executeServerTool } from '@/src/lib/agentTools'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const API_KEY = process.env.GEMINI_API_KEY
const ENDPOINT = (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

// ── Guardrail limits ───────────────────────────────────────────────────────
const MAX_MESSAGE_CHARS = 1000   // single user message
const MAX_HISTORY = 12           // turns kept (older are dropped)
const RATE_PER_MINUTE = 8        // requests per IP per rolling minute
// Hard ceiling across all visitors/day. Kept near Gemini's free-tier daily
// request allowance so we stop cleanly instead of spraying 429s. Note: each
// request that triggers a tool call costs TWO upstream calls (the function-
// calling round-trip), so budget accordingly. Raise this if you add billing.
const DAILY_GLOBAL_CAP = 200

// ── In-memory rate-limit state ─────────────────────────────────────────────
// Note: on serverless this is per-instance, not global. It's a cheap first
// line of defense, not a billing guarantee — the daily cap is the real seatbelt.
const ipHits = new Map<string, number[]>()
let dayKey = new Date().toISOString().slice(0, 10)
let dayCount = 0

function rateLimited(ip: string): boolean {
    // Roll the global daily counter at UTC midnight.
    const today = new Date().toISOString().slice(0, 10)
    if (today !== dayKey) {
        dayKey = today
        dayCount = 0
    }
    if (dayCount >= DAILY_GLOBAL_CAP) return true

    const now = Date.now()
    const windowStart = now - 60_000
    const hits = (ipHits.get(ip) || []).filter(t => t > windowStart)
    if (hits.length >= RATE_PER_MINUTE) {
        ipHits.set(ip, hits)
        return true
    }
    hits.push(now)
    ipHits.set(ip, hits)
    dayCount++
    return false
}

// ── Gemini wire types (partial — only what we read) ────────────────────────
interface GeminiPart {
    text?: string
    functionCall?: { name: string; args?: Record<string, unknown> }
}
interface GeminiContent {
    role?: string
    parts?: GeminiPart[]
}
interface GeminiResponse {
    candidates?: Array<{ content?: GeminiContent; finishReason?: string }>
    promptFeedback?: { blockReason?: string }
}

/** Thrown when Gemini itself returns a non-2xx (vs a local/network failure). */
class GeminiError extends Error {
    constructor(public status: number, detail: string) {
        super(`Gemini ${status}: ${detail.slice(0, 200)}`)
    }
}

// Models tried in order: the configured model first, then resilient fallbacks.
// Each model has INDEPENDENT free-tier quota and load, so if one is exhausted
// (429) or overloaded (503), we transparently fall through to the next.
const MODEL_CHAIN: string[] = Array.from(new Set([
    MODEL,
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
]))

async function callModel(model: string, body: unknown): Promise<GeminiResponse> {
    const res = await fetch(`${ENDPOINT(model)}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new GeminiError(res.status, detail)
    }
    return res.json()
}

async function callGemini(body: unknown): Promise<GeminiResponse> {
    let lastErr: unknown
    for (const model of MODEL_CHAIN) {
        try {
            return await callModel(model, body)
        } catch (err) {
            lastErr = err
            // Fall through to the next model on quota/overload/server errors;
            // surface anything else (e.g. a 400 bad request) immediately.
            if (err instanceof GeminiError && [429, 500, 503].includes(err.status)) {
                continue
            }
            throw err
        }
    }
    throw lastErr
}

function extractParts(resp: GeminiResponse): GeminiPart[] {
    return resp.candidates?.[0]?.content?.parts ?? []
}

function joinText(parts: GeminiPart[]): string {
    return parts
        .map(p => p.text || '')
        .join('')
        .trim()
}

/** A sensible spoken confirmation if the model couldn't produce one itself. */
function confirmationFor(actions: AgentAction[]): string {
    const a = actions[0]
    if (!a) return 'On it.'
    switch (a.type) {
        case 'navigate': return `Taking you to my ${a.section} now.`
        case 'showSection': return `Here's my ${a.section}.`
        case 'downloadResume': return "Downloading my CV for you now."
        case 'openLink': return `Opening my ${a.target} for you.`
        case 'runCommand': return `Running \`${a.command}\`.`
        case 'startTour': return "Starting the tour — here we go."
        default: return 'On it.'
    }
}

export async function POST(req: Request) {
    if (!API_KEY) {
        // Graceful degradation: never 500 the visitor into a broken page.
        return NextResponse.json(
            {
                text: "My AI side is offline right now — but try `help` for commands, or `email` to reach me directly.",
                actions: [],
            },
            { status: 200 },
        )
    }

    // Identify caller for rate limiting.
    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'

    if (rateLimited(ip)) {
        return NextResponse.json(
            {
                text: "Easy there — too many questions too fast. Give me a few seconds and try again.",
                actions: [],
            },
            { status: 429 },
        )
    }

    // Parse + validate the request body.
    let body: { messages?: ChatMessage[] }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const messages = Array.isArray(body.messages) ? body.messages : []
    if (messages.length === 0) {
        return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Clamp history length + message size (defense against context-flooding).
    const trimmed = messages
        .slice(-MAX_HISTORY)
        .filter(m => m && (m.role === 'user' || m.role === 'model') && typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))

    if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== 'user') {
        return NextResponse.json({ error: 'Last message must be from the user' }, { status: 400 })
    }

    const systemInstruction = { parts: [{ text: buildSystemInstruction() }] }
    const contents: GeminiContent[] = trimmed.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
    }))

    // thinkingBudget: 0 disables Gemini 2.5's internal "thinking" pass — it adds
    // latency and token cost we don't need for grounded, concise Q&A. (Ignored
    // by non-thinking models, so it's safe across model overrides.)
    const generationConfig = {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 0 },
    }

    try {
        // ── Round 1: let the model answer and/or call tools ──
        const first = await callGemini({
            systemInstruction,
            contents,
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            generationConfig,
        })

        const firstParts = extractParts(first)
        const actions: AgentAction[] = []
        const rawCalls: NonNullable<GeminiPart['functionCall']>[] = []

        for (const part of firstParts) {
            if (part.functionCall) {
                rawCalls.push(part.functionCall)
                // Client actions are returned to the browser; server tools are
                // executed below and produce no client action.
                const action = toAgentAction(part.functionCall.name, part.functionCall.args)
                if (action) actions.push(action)
            }
        }

        let text = joinText(firstParts)

        // ── Execute any server-side tools now, collecting real results to feed
        // back to the model (send_message, get_repo_stats). ──
        const hasServerTool = rawCalls.some(fc => SERVER_TOOL_NAMES.has(fc.name))
        const toolResults = await Promise.all(
            rawCalls.map(async fc => {
                if (SERVER_TOOL_NAMES.has(fc.name)) {
                    return { name: fc.name, response: await executeServerTool(fc.name, fc.args) }
                }
                // Client action — acknowledge so the model knows it's handled.
                return {
                    name: fc.name,
                    response: { status: 'ok', note: "Action performed on the visitor's screen." },
                }
            }),
        )

        // ── Round 2: required when a server tool ran (so the reply reflects the
        // real result) or when the model called tools but gave no prose. Tools
        // are disabled this turn (mode NONE) so it can't loop. This is wrapped in
        // its own try/catch: if generating the confirmation prose fails, we still
        // return the actions from round 1 with a fallback message — the action
        // must NOT be lost just because the wording couldn't be produced. ──
        if (rawCalls.length > 0 && (hasServerTool || !text)) {
            const modelTurn: GeminiContent = {
                role: 'model',
                parts: rawCalls.map(fc => ({ functionCall: fc })),
            }
            const toolTurn = {
                role: 'user',
                parts: toolResults.map(r => ({
                    functionResponse: { name: r.name, response: r.response },
                })),
            } as unknown as GeminiContent

            try {
                const second = await callGemini({
                    systemInstruction,
                    contents: [...contents, modelTurn, toolTurn],
                    // Re-declare tools so the model understands the functionResponse
                    // parts (some models 400 without them), but force mode NONE so
                    // it replies in prose instead of calling another tool.
                    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
                    toolConfig: { functionCallingConfig: { mode: 'NONE' } },
                    generationConfig,
                })
                text = joinText(extractParts(second))
            } catch (e) {
                console.error('[chat] round-2 confirmation failed; returning actions anyway:', e)
            }
        }

        // Split the visible reply from the model's suggested follow-up chips.
        const { text: visibleText, suggestions } = parseReply(text)
        text = visibleText

        // Final safety net: never return an empty bubble. If an action was
        // chosen, confirm it; otherwise nudge the visitor.
        if (!text) {
            if (actions.length > 0) text = confirmationFor(actions)
            else if (rawCalls.length > 0) text = 'Done — anything else I can help with?'
            else text = first.promptFeedback?.blockReason
                ? "I can't help with that one — but ask me anything about my work, projects, or how to reach me."
                : 'Ask me about my experience, projects, skills, or how to get in touch.'
        }

        return NextResponse.json({ text, actions, suggestions })
    } catch (err) {
        console.error('[chat] Gemini error:', err)
        // Quota/overload upstream (all fallback models busy) → it's busy, not broken.
        if (err instanceof GeminiError && (err.status === 429 || err.status === 503)) {
            return NextResponse.json(
                {
                    text: "I'm getting a lot of questions right now and my AI is briefly maxed out. Try again in a moment — or type `email` and I'll take a message directly.",
                    actions: [],
                },
                { status: 200 },
            )
        }
        return NextResponse.json(
            {
                text: "Something glitched on my end. Try again in a moment — or type `email` to reach me directly.",
                actions: [],
            },
            { status: 200 },
        )
    }
}
