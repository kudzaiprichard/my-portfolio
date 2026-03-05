import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { ContactConfirmation, ContactNotification } from '@/src/api/contact/templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prichard.co.zw'
const ownerEmail = process.env.CONTACT_TO_EMAIL!

export async function POST(req: Request) {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    try {
        await Promise.all([
            resend.emails.send({
                from: `Portfolio Contact <onboarding@resend.dev>`,
                to: ownerEmail,
                subject: `New message from ${name}`,
                react: ContactNotification({ name, email, message }),
            }),
            resend.emails.send({
                from: `Kudzai Prichard <onboarding@resend.dev>`,
                to: email,
                subject: 'Message received — kudzai@portfolio',
                react: ContactConfirmation({ name, email, message }),
            }),
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(`[contact] Failed to send email from ${siteUrl}:`, error)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
}