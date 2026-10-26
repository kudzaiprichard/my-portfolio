import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { modelChain, parseSSE, runChat, VisibleTextStream } from '@/src/lib/gemini'
import { SUGGEST_MARKER } from '@/src/lib/aiAgent'

const enc = new TextEncoder()

/** A ReadableStream that yields the given string chunks. */
function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(c) {
            chunks.forEach(s => c.enqueue(enc.encode(s)))
            c.close()
        },
    })
}

const sseChunk = (parts: object[]) => `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] })}\r\n\r\n`
const jsonReply = (parts: object[]) => new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] }), { status: 200 })

describe('parseSSE', () => {
    it('reassembles events split across chunks', async () => {
        const body = sseChunk([{ text: 'Hel' }]) + sseChunk([{ text: 'lo' }])
        const mid = Math.floor(body.length / 2)
        const out = []
        for await (const r of parseSSE(streamOf([body.slice(0, mid), body.slice(mid)]))) out.push(r)
        expect(out.map(r => r.candidates?.[0]?.content?.parts?.[0]?.text)).toEqual(['Hel', 'lo'])
    })
})

describe('VisibleTextStream', () => {
    it('never shows the suggestion marker or what follows it', () => {
        const shown: string[] = []
        const v = new VisibleTextStream(d => shown.push(d))
        for (const piece of ['I build ', 'backends.', ' ::SUG', 'GEST:: a | b']) v.push(piece)
        expect(shown.join('')).toBe('I build backends. ')
        expect(shown.join('')).not.toContain('::')
        expect(v.text).toContain(SUGGEST_MARKER)
    })
})

describe('runChat', () => {
    beforeEach(() => { process.env.GEMINI_API_KEY = 'test-key' })
    afterEach(() => vi.unstubAllGlobals())

    it('streams round 1 and returns the final reply with suggestions split off', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            expect(url).toContain(':streamGenerateContent?alt=sse')
            return new Response(streamOf([
                sseChunk([{ text: 'Kudzai builds ' }]),
                sseChunk([{ text: 'distributed systems.' }]),
                sseChunk([{ text: `\n${SUGGEST_MARKER} Projects? | CV?` }]),
            ]), { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
        }))
        const deltas: string[] = []
        const reply = await runChat([{ role: 'user', content: 'what does he do' }], { onDelta: d => deltas.push(d) })
        expect(deltas.length).toBeGreaterThan(1)
        expect(deltas.join('').trim()).toBe('Kudzai builds distributed systems.')
        expect(reply).toEqual({ text: 'Kudzai builds distributed systems.', actions: [], suggestions: ['Projects?', 'CV?'] })
    })

    it('still executes tool calls that arrive in the stream', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(streamOf([
            sseChunk([{ functionCall: { name: 'navigate_to_section', args: { section: 'projects' } } }]),
        ]), { status: 200 })).mockImplementationOnce(async () => new Response(streamOf([
            sseChunk([{ functionCall: { name: 'navigate_to_section', args: { section: 'projects' } } }]),
        ]), { status: 200 })).mockImplementation(async () => jsonReply([{ text: 'Taking you to the projects.' }])))
        const reply = await runChat([{ role: 'user', content: 'show projects' }], { onDelta: () => {} })
        expect(reply.actions).toEqual([{ type: 'navigate', section: 'projects' }])
        expect(reply.text).toBe('Taking you to the projects.')
    })

    it('falls back to the non-streaming endpoint when streaming errors', async () => {
        const fetchMock = vi.fn(async (url: string) => url.includes('streamGenerateContent')
            ? new Response('bad', { status: 500 })
            : jsonReply([{ text: 'Fallback answer.' }]))
        vi.stubGlobal('fetch', fetchMock)
        const deltas: string[] = []
        const reply = await runChat([{ role: 'user', content: 'hi' }], { onDelta: d => deltas.push(d), chain: ['m1', 'm2'] })
        expect(reply.text).toBe('Fallback answer.')
        expect(deltas).toEqual([])
        // Both models tried for streaming, then the plain request
        expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('streamGenerateContent'))).toHaveLength(2)
    })

    it('falls back when the stream ends empty', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('streamGenerateContent')
            ? new Response(streamOf(['data: {}\n\n']), { status: 200 })
            : jsonReply([{ text: 'Recovered.' }])))
        const reply = await runChat([{ role: 'user', content: 'hi' }], { onDelta: () => {} })
        expect(reply.text).toBe('Recovered.')
    })

    it('tries the next model on 429 and works without streaming', async () => {
        const seen: string[] = []
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            seen.push(String(url).split('/models/')[1].split(':')[0])
            return seen.length === 1 ? new Response('quota', { status: 429 }) : jsonReply([{ text: 'From model two.' }])
        }))
        const reply = await runChat([{ role: 'user', content: 'hi' }], { chain: ['first', 'second'] })
        expect(seen).toEqual(['first', 'second'])
        expect(reply.text).toBe('From model two.')
    })

    it('refuses send_message without the site guard', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body))
            const last = body.contents.at(-1)
            if (last.parts[0].functionResponse) {
                // Round 2 sees the tool's refusal
                expect(last.parts[0].functionResponse.response.status).toBe('error')
                return jsonReply([{ text: 'Please use the contact form.' }])
            }
            return jsonReply([{ functionCall: { name: 'send_message', args: { name: 'A', email: 'a@b.co', message: 'hi' } } }])
        }))
        const reply = await runChat([{ role: 'user', content: 'send a message' }], { toolContext: { ip: '1.2.3.4' } })
        expect(reply.text).toBe('Please use the contact form.')
    })

    it('has a de-duplicated model chain starting with the configured model', () => {
        expect(modelChain('gemini-2.5-flash')[0]).toBe('gemini-2.5-flash')
        const chain = modelChain('gemini-2.5-flash-lite')
        expect(new Set(chain).size).toBe(chain.length)
    })
})
