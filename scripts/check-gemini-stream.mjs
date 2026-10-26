// scripts/check-gemini-stream.mjs
//
// Live check of every model in the agent's fallback chain (src/lib/gemini.ts):
// does `:streamGenerateContent?alt=sse` work with function declarations, and
// does a tool call come back in the stream? Forums report errors and empty
// final text on some models, so run this whenever MODEL_CHAIN changes.
//
//   GEMINI_API_KEY=… node scripts/check-gemini-stream.mjs
//   (or put the key in .env.local)
//
// Costs two small requests per model on the free tier.

import { readFileSync, existsSync } from 'node:fs'

if (!process.env.GEMINI_API_KEY && existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
}
const KEY = process.env.GEMINI_API_KEY
if (!KEY) {
    console.error('GEMINI_API_KEY is not set (env or .env.local).')
    process.exit(1)
}

// Keep in step with modelChain() in src/lib/gemini.ts
const CHAIN = [...new Set([process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'])]

const tools = [{
    functionDeclarations: [{
        name: 'navigate_to_section',
        description: 'Scroll the page to a section.',
        parameters: { type: 'object', properties: { section: { type: 'string', enum: ['home', 'about', 'projects'] } }, required: ['section'] },
    }],
}]

async function stream(model, prompt) {
    const t0 = Date.now()
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            tools,
            generationConfig: { maxOutputTokens: 120, thinkingConfig: { thinkingBudget: 0 } },
        }),
    })
    if (!res.ok) return { error: `${res.status} ${(await res.text()).slice(0, 120)}` }
    const body = await res.text()
    let text = ''
    let calls = 0
    let firstAt = null
    for (const ev of body.split(/\r?\n\r?\n/)) {
        const data = ev.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5)).join('')
        if (!data.trim()) continue
        const parts = JSON.parse(data).candidates?.[0]?.content?.parts ?? []
        for (const p of parts) {
            if (p.text) { text += p.text; firstAt ??= Date.now() - t0 }
            if (p.functionCall) calls++
        }
    }
    return { text: text.trim(), calls, firstMs: firstAt, totalMs: Date.now() - t0 }
}

let failures = 0
for (const model of CHAIN) {
    const plain = await stream(model, 'In one short sentence, what is a terminal emulator?')
    const tool = await stream(model, 'Take me to the projects section.')
    const ok = !plain.error && plain.text && !tool.error && tool.calls > 0
    if (!ok) failures++
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${model.padEnd(24)} text: ${plain.error ?? `${plain.text.length} chars, first token ${plain.firstMs} ms`} | tool call: ${tool.error ?? (tool.calls ? 'yes' : 'NO (empty)')}`)
}
process.exit(failures ? 1 : 0)
