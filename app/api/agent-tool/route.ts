// app/api/agent-tool/route.ts
// Runs one server-side agent tool (get_repo_stats, send_message) for a
// visitor's own browser agent via WebMCP (components/shared/WebMcpTools).
// Same guards as the chat route: the shared rate limit, and send_message
// needs the page's spam guard (lib/spamGuard) plus the message limit.

import { NextResponse } from 'next/server'
import { SERVER_TOOL_NAMES } from '@/src/lib/aiAgent'
import { executeServerTool } from '@/src/lib/agentTools'
import { allow, clientIp } from '@/src/lib/rateLimit'

export async function POST(req: Request) {
    let body: { name?: string; args?: Record<string, unknown>; guard?: unknown }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ status: 'error', reason: 'Invalid request body' }, { status: 400 })
    }
    if (!body.name || !SERVER_TOOL_NAMES.has(body.name)) {
        return NextResponse.json({ status: 'error', reason: 'Unknown tool' }, { status: 400 })
    }
    const ip = clientIp(req)
    if (!(await allow('chat', ip))) {
        return NextResponse.json({ status: 'error', reason: 'Too many requests — try again in a minute.' }, { status: 429 })
    }
    return NextResponse.json(await executeServerTool(body.name, body.args ?? {}, { ip, guard: body.guard }))
}
