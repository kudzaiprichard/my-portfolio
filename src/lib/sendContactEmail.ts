// lib/sendContactEmail.ts
//
// Single source of truth for sending a contact message. Used by both the
// contact form (app/api/contact) and the AI agent's send_message tool, so the
// two paths can never drift apart. Server-only: imports Resend + the email key.

import { Resend } from 'resend'
import { ContactConfirmation, ContactNotification } from '@/src/components/shared/email-templates'
import { contact } from '@/src/content'

export interface ContactPayload {
    name: string
    email: string
    message: string
}

export interface SendResult {
    success: boolean
    /** Present on failure — a short reason (already user-safe). */
    error?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate + send a contact message: a notification to Kudzai and a confirmation
 * to the visitor. Returns a structured result rather than throwing, so callers
 * (HTTP route, agent tool) can react without try/catch noise.
 */
export async function sendContactEmail(payload: ContactPayload): Promise<SendResult> {
    const name = payload.name?.trim()
    const email = payload.email?.trim()
    const message = payload.message?.trim()

    if (!name || !email || !message) {
        return { success: false, error: 'Name, email, and message are all required.' }
    }
    if (!EMAIL_RE.test(email)) {
        return { success: false, error: 'That email address does not look valid.' }
    }

    const apiKey = process.env.RESEND_API_KEY
    // From src/content: NEXT_PUBLIC_EMAIL when set, else the address in personal.ts
    const ownerEmail = contact.email
    if (!apiKey) {
        console.error('[sendContactEmail] Missing RESEND_API_KEY')
        return { success: false, error: 'Messaging is not configured right now.' }
    }

    const resend = new Resend(apiKey)

    try {
        const [notification, confirmation] = await Promise.all([
            // Replying to the notification answers the sender directly
            resend.emails.send({
                from: 'Portfolio Contact <noreply@prichard.co.zw>',
                replyTo: email,
                to: ownerEmail,
                subject: `New message from ${name}`,
                react: ContactNotification({ name, email, message }),
            }),
            resend.emails.send({
                from: 'Kudzai Prichard Matizirofa <noreply@prichard.co.zw>',
                replyTo: ownerEmail,
                to: email,
                subject: 'Message received — kudzai@portfolio',
                react: ContactConfirmation({ name, email, message }),
            }),
        ])

        if (notification.error || confirmation.error) {
            console.error('[sendContactEmail] Send error:', notification.error || confirmation.error)
            return { success: false, error: 'Failed to send the message.' }
        }
        return { success: true }
    } catch (error) {
        console.error('[sendContactEmail] Unexpected error:', error)
        return { success: false, error: 'Failed to send the message.' }
    }
}
