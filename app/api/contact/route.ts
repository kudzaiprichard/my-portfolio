// app/api/contact/route.ts
// Contact form (and the terminal's `email` flow). Protected by the honeypot +
// minimum fill time (lib/spamGuard) and the shared `message` rate limit.

import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/src/lib/sendContactEmail'
import { checkGuard } from '@/src/lib/spamGuard'
import { allow, clientIp } from '@/src/lib/rateLimit'

export async function POST(req: Request) {
    let body
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, email, message, guard } = body ?? {}

    // A bot filled the honeypot: pretend it worked, send nothing
    const verdict = checkGuard(guard)
    if (verdict === 'bot') return NextResponse.json({ success: true })
    if (verdict !== 'ok') {
        return NextResponse.json({ error: 'Please take a moment and try again.' }, { status: 400 })
    }

    if (!name || !email || !message) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!(await allow('message', clientIp(req)))) {
        return NextResponse.json({ error: 'Too many messages in the last hour. Please try again later.' }, { status: 429 })
    }

    const result = await sendContactEmail({ name, email, message })

    if (!result.success) {
        const status = result.error?.includes('required') || result.error?.includes('valid') ? 400 : 500
        return NextResponse.json({ error: result.error || 'Failed to send email' }, { status })
    }

    return NextResponse.json({ success: true })
}
