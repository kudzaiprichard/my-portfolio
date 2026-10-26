// lib/analytics.ts
// Custom Vercel Analytics events. Names live here so every phase reuses them.

import { track } from '@vercel/analytics'

export const ANALYTICS_EVENTS = {
    bootSkipped: 'boot_skipped',
    bootCompleted: 'boot_completed',
    soundMuted: 'sound_muted',
    firstCommand: 'first_command',
    agentQuestion: 'agent_question',
    cvDownloaded: 'cv_downloaded',
} as const

type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]

/** Fire a custom event. Never throws: analytics must not break the page. */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): void {
    try {
        track(event, properties)
    } catch {
        // Ignore — analytics is best-effort.
    }
}
