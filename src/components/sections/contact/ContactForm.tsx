// components/sections/contact/ContactForm.tsx
"use client"

// The contact form: a client island inside the server-rendered Contact section.

import { useState } from 'react'
import { audioEngine } from '@/src/lib/audioEngine'
import { HONEYPOT_FIELD, newGuard } from '@/src/lib/spamGuard'

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

interface FieldErrors {
    name?: string
    email?: string
    message?: string
}

function validateEmail(emailStr: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)
}

export default function ContactForm() {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' })
    const [status, setStatus] = useState<SubmitStatus>('idle')
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    // Spam guard: when the form appeared, and a honeypot people never see
    const [guard] = useState(newGuard)
    const [honeypot, setHoneypot] = useState('')

    // Clear field error when user starts typing in that field
    const handleFieldChange = (field: keyof typeof formData, value: string) => {
        setFormData({ ...formData, [field]: value })
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const next = { ...prev }
                delete next[field]
                return next
            })
        }
        // Reset general status when user edits after error/success
        if (status === 'error' || status === 'success') {
            setStatus('idle')
        }
    }

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.name.trim()) {
            errors.name = 'missing name — please enter your name'
        }

        if (!formData.email.trim()) {
            errors.email = 'missing email — please enter your email'
        } else if (!validateEmail(formData.email.trim())) {
            errors.email = 'invalid email format — please check your email'
        }

        if (!formData.message.trim()) {
            errors.message = 'missing message — please type a message'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
        if (status === 'loading') return

        if (!validateForm()) {
            setStatus('error')
            return
        }

        setStatus('loading')
        setFieldErrors({})

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    message: formData.message.trim(),
                    guard: { ...guard, website: honeypot },
                }),
            })

            if (!res.ok) throw new Error('Failed to send')

            setStatus('success')
            audioEngine.play('success')
            setFormData({ name: '', email: '', message: '' })
        } catch {
            setStatus('error')
            audioEngine.play('error')
        }
    }

    const getButtonLabel = () => {
        switch (status) {
            case 'loading': return '> sending...'
            case 'success': return '> message sent!'
            case 'error':   return Object.keys(fieldErrors).length > 0 ? '> fix errors above' : '> failed. retry?'
            default:        return './send_message.sh'
        }
    }

    return (
        <div className="contact-section-form">
            {/* Honeypot: off-screen and skipped by keyboard and assistive tech */}
            <div className="contact-section-hp" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                    id="contact-website"
                    name={HONEYPOT_FIELD}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                />
            </div>
            <div className="contact-section-form-group">
                <label className="contact-section-form-label" htmlFor="contact-name">
                    &gt; Name
                </label>
                <input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className={`contact-section-form-input${fieldErrors.name ? ' has-error' : ''}`}
                    disabled={status === 'loading'}
                />
                {fieldErrors.name && (
                    <div className="contact-section-field-error">
                        &gt; [ERROR] {fieldErrors.name}
                    </div>
                )}
            </div>

            <div className="contact-section-form-group">
                <label className="contact-section-form-label" htmlFor="contact-email">
                    &gt; Email
                </label>
                <input
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={`contact-section-form-input${fieldErrors.email ? ' has-error' : ''}`}
                    disabled={status === 'loading'}
                />
                {fieldErrors.email && (
                    <div className="contact-section-field-error">
                        &gt; [ERROR] {fieldErrors.email}
                    </div>
                )}
            </div>

            <div className="contact-section-form-group">
                <label className="contact-section-form-label" htmlFor="contact-message">
                    &gt; Message
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    placeholder="Type your message here..."
                    value={formData.message}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    rows={6}
                    className={`contact-section-form-textarea${fieldErrors.message ? ' has-error' : ''}`}
                    disabled={status === 'loading'}
                />
                {fieldErrors.message && (
                    <div className="contact-section-field-error">
                        &gt; [ERROR] {fieldErrors.message}
                    </div>
                )}
            </div>

            {status === 'error' && Object.keys(fieldErrors).length === 0 && (
                <div className="contact-section-form-error">
                    &gt; [ERROR] Failed to send message. Please try again.
                </div>
            )}

            {status === 'success' && (
                <div className="contact-section-form-success">
                    &gt; [OK] Message sent. I&apos;ll be in touch soon.
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={status === 'loading'}
                className={`contact-section-submit-button${status === 'success' ? ' success' : ''}${status === 'error' ? ' error' : ''}`}
            >
                {getButtonLabel()}
            </button>
        </div>
    )
}
