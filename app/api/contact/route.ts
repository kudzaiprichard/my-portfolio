import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/src/lib/sendContactEmail'

export async function POST(req: Request) {
    let body
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, email, message } = body

    if (!name || !email || !message) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const result = await sendContactEmail({ name, email, message })

    if (!result.success) {
        const status = result.error?.includes('required') || result.error?.includes('valid') ? 400 : 500
        return NextResponse.json({ error: result.error || 'Failed to send email' }, { status })
    }

    return NextResponse.json({ success: true })
}
