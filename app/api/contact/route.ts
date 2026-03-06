import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { ContactConfirmation, ContactNotification } from '@/src/components/shared/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prichard.co.zw'
const ownerEmail = process.env.NEXT_PUBLIC_EMAIL!

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

    try {
        const [notification, confirmation] = await Promise.all([
            resend.emails.send({
                from: `Portfolio Contact <noreply@prichard.co.zw>`,
                replyTo: process.env.NEXT_PUBLIC_EMAIL!,
                to: ownerEmail,
                subject: `New message from ${name}`,
                react: ContactNotification({ name, email, message }),
            }),
            resend.emails.send({
                from: `Kudzai Prichard <noreply@prichard.co.zw>`,
                to: email,
                subject: 'Message received — kudzai@portfolio',
                react: ContactConfirmation({ name, email, message }),
            }),
        ])

        if (notification.error || confirmation.error) {
            console.error('[contact] Send error:', notification.error || confirmation.error)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(`[contact] Failed to send email from ${siteUrl}:`, error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
}