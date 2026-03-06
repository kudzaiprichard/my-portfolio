import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { ContactConfirmation, ContactNotification } from '@/src/components/shared/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prichard.co.zw'
const ownerEmail = process.env.NEXT_PUBLIC_EMAIL!

export async function POST(req: Request) {
    console.log('[contact] --- Incoming request ---')
    console.log('[contact] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY)
    console.log('[contact] CONTACT_TO_EMAIL:', ownerEmail)

    let body
    try {
        body = await req.json()
        console.log('[contact] Request body:', JSON.stringify(body))
    } catch (err) {
        console.error('[contact] Failed to parse request body:', err)
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, email, message } = body

    if (!name || !email || !message) {
        console.warn('[contact] Missing fields:', { name: !!name, email: !!email, message: !!message })
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    try {
        console.log('[contact] Sending emails...')

        const [notificationResult, confirmationResult] = await Promise.all([
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

        console.log('[contact] Notification result:', JSON.stringify(notificationResult))
        console.log('[contact] Confirmation result:', JSON.stringify(confirmationResult))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(`[contact] Failed to send email from ${siteUrl}:`, error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
}