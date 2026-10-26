// app/api/chat/route.ts
//
// Server-side proxy to Google AI Studio (Gemini). The API key is server-only
// (GEMINI_API_KEY, never NEXT_PUBLIC) so it never reaches the browser bundle.
//
// Responsibilities:
//   - Rate limit: 8 / IP / minute and 200 / day globally, shared across
//     instances in Upstash Redis (lib/rateLimit), to protect the free tier.
//   - Validate and clamp the conversation.
//   - Run the agent turn (lib/gemini): grounded request, function-calling
//     round-trip, guarded server tools.
//   - Reply as a stream (`Accept: text/event-stream`) or as JSON.
//
// Stream format (text/event-stream):
//   event: delta   data: {"text": "…"}            visible text as it arrives
//   event: done    data: { text, actions, suggestions }   the final reply
// The final reply is authoritative; the client replaces what it typed with it.

import { NextResponse } from 'next/server'
import type { AgentReply, ChatMessage } from '@/src/lib/aiAgent'
import { runChat, GeminiError } from '@/src/lib/gemini'
import { allow, clientIp } from '@/src/lib/rateLimit'

// ── Guardrail limits ───────────────────────────────────────────────────────
const MAX_MESSAGE_CHARS = 1000   // single user message
const MAX_HISTORY = 12           // turns kept (older are dropped)

const OFFLINE: AgentReply = {
    text: "My AI side is offline right now — but try `help` for commands, or `email` to reach me directly.",
    actions: [],
    suggestions: [],
}
const RATE_LIMITED: AgentReply = {
    text: 'Easy there — too many questions too fast. Give me a few seconds and try again.',
    actions: [],
    suggestions: [],
}
const BUSY: AgentReply = {
    text: "I'm getting a lot of questions right now and my AI is briefly maxed out. Try again in a moment — or type `email` and I'll take a message directly.",
    actions: [],
    suggestions: [],
}
const BROKEN: AgentReply = {
    text: 'Something glitched on my end. Try again in a moment — or type `email` to reach me directly.',
    actions: [],
    suggestions: [],
}

function failureReply(err: unknown): AgentReply {
    console.error('[chat] Gemini error:', err)
    // Quota/overload upstream (all fallback models busy) → it's busy, not broken.
    return err instanceof GeminiError && (err.status === 429 || err.status === 503) ? BUSY : BROKEN
}

function sse(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/** A one-shot reply in whichever format the client asked for. */
function reply(body: AgentReply, streaming: boolean, status = 200): Response {
    if (!streaming) return NextResponse.json(body, { status })
    return new Response(sse('done', body), { status, headers: SSE_HEADERS })
}

const SSE_HEADERS = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
}

export async function POST(req: Request) {
    const streaming = (req.headers.get('accept') ?? '').includes('text/event-stream')

    // Graceful degradation: never 500 the visitor into a broken page.
    if (!process.env.GEMINI_API_KEY) return reply(OFFLINE, streaming)

    const ip = clientIp(req)
    if (!(await allow('chat', ip)) || !(await allow('daily', 'global'))) {
        return reply(RATE_LIMITED, streaming, 429)
    }

    // Parse + validate the request body.
    let body: { messages?: ChatMessage[]; guard?: unknown }
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

    const toolContext = { ip, guard: body.guard }

    if (!streaming) {
        try {
            return NextResponse.json<AgentReply>(await runChat(trimmed, { toolContext }))
        } catch (err) {
            return NextResponse.json(failureReply(err))
        }
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)))
            try {
                const final = await runChat(trimmed, { toolContext, onDelta: text => send('delta', { text }) })
                send('done', final)
            } catch (err) {
                send('done', failureReply(err))
            }
            controller.close()
        },
    })
    return new Response(stream, { headers: SSE_HEADERS })
}
