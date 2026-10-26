// lib/spamGuard.ts
//
// Protection for the two ways a message reaches Kudzai's inbox: the contact
// form (/api/contact, also used by the terminal's `email` flow) and the
// agent's send_message tool (/api/chat). No third-party widget, no keys:
//
// - a honeypot field (`website`) that people never see or fill; bots that
//   fill every field give themselves away
// - a minimum fill time: the guard carries when the page loaded, and
//   anything sent sooner than MIN_FILL_MS after that is refused
// - plus the shared `message` rate limit (lib/rateLimit: 3 / IP / hour)
//
// The client sends `{ website, startedAt }` as `guard` with every request.
// Shared by client and server (no secrets here).

export const HONEYPOT_FIELD = 'website'
export const MIN_FILL_MS = 2500

export interface SpamGuardFields {
    /** The honeypot: always empty from the real UI. */
    website?: string
    /** Epoch ms when the visitor started (form shown / chat session opened). */
    startedAt?: number
}

export type GuardVerdict = 'ok' | 'bot' | 'too-fast' | 'missing'

export function checkGuard(guard: unknown, now = Date.now()): GuardVerdict {
    if (!guard || typeof guard !== 'object') return 'missing'
    const g = guard as SpamGuardFields
    if (typeof g.website === 'string' && g.website.trim() !== '') return 'bot'
    if (typeof g.startedAt !== 'number' || !Number.isFinite(g.startedAt)) return 'missing'
    if (now - g.startedAt < MIN_FILL_MS) return 'too-fast'
    return 'ok'
}

/**
 * A guard for client code: honeypot empty, started when the page loaded
 * (performance.timeOrigin — no clock read during render, which Next.js
 * prerendering forbids).
 */
export function newGuard(): Required<SpamGuardFields> {
    const loaded = typeof performance !== 'undefined' && performance.timeOrigin ? performance.timeOrigin : 0
    return { website: '', startedAt: Math.round(loaded) }
}
