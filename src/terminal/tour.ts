// terminal/tour.ts
// Guided tour, scripted onboarding replies and contact-flow triggers (no AI round-trip).

import type { NavigableSection } from './types'

/* ============================================
   GUIDED TOUR + SCRIPTED ONBOARDING
   ============================================ */

/** Natural phrasings that launch the guided tour without an AI round-trip. */
const TOUR_TRIGGERS: ReadonlySet<string> = new Set([
    'tour', 'take a tour', 'take the tour', 'start tour', 'start the tour',
    'show me around', 'give me a tour', 'guided tour', 'walk me through',
    'show me round', 'show me around the site',
])

export function isTourTrigger(trimmed: string): boolean {
    return TOUR_TRIGGERS.has(trimmed)
}

/** Phrasings that launch the step-by-step contact flow. */
const CONTACT_TRIGGERS: ReadonlySet<string> = new Set([
    'email', 'contact', 'contact you', 'get in touch', 'send a message',
    'send message', 'message you', 'reach you', 'reach out', 'hire you',
    'i want to hire you', 'work with you', 'email you', 'leave a message',
])

export function isContactTrigger(trimmed: string): boolean {
    return CONTACT_TRIGGERS.has(trimmed)
}

/** Basic email-shape validation for the contact flow. */
export const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Scripted, instant replies for greetings and "what is this?" — the most common
 * first interaction from non-technical visitors. Handled without calling Gemini
 * so it's immediate, free, and reliable.
 */
export function matchOnboarding(trimmed: string): string | null {
    const greetings = [
        'hi', 'hello', 'hey', 'yo', 'hi there', 'hello there', 'hey there',
        'howdy', 'sup', 'greetings', 'hallo', 'hie', 'hiya', 'good morning',
        'good afternoon', 'good evening', 'hey kudzai', 'hi kudzai',
    ]
    const explainers = [
        'what is this', 'whats this', "what's this", 'what is this site',
        'what is this place', 'what can you do', 'what can i do here',
        'what do i do', 'what do i do here', 'how does this work',
        'how do i use this', 'i am lost', "i'm lost", 'im lost', 'what now',
        'where do i start', 'how do i start', 'what is this thing',
    ]
    if (greetings.includes(trimmed)) {
        return [
            "Hey — I'm Kudzai's assistant, right here in the terminal.",
            "You don't need to know any commands. Just ask me anything in plain English,",
            'like "what do you do?" or "can I see your projects?".',
            "Or type 'tour' and I'll walk you through everything.",
        ].join('\n')
    }
    if (explainers.includes(trimmed)) {
        return [
            "This is Kudzai Prichard Matizirofa's interactive portfolio — a terminal you can actually talk to.",
            "I'm his AI assistant. Ask me anything about his work, skills, projects, or how to",
            'get in touch — no commands needed.',
            "New here? Type 'tour' and I'll show you around, or tap a suggestion below.",
        ].join('\n')
    }
    return null
}

/** A stop on the guided tour: a line of narration, then that section rendered. */
export interface TourStep {
    section: NavigableSection
    narration: string
}

export const TOUR_STEPS: readonly TourStep[] = [
    { section: 'about', narration: "First, a bit about who I am and what I work on." },
    { section: 'projects', narration: "Next — some of the things I've actually built. This is where I spend most of my time." },
    { section: 'experience', narration: "Here's where I've done the work: the companies, the roles, the real production systems." },
    { section: 'contact', narration: "And that's the tour. If you'd like to talk, here's how to reach me — or just ask me to send a message." },
]

/** Prompt shown while the guided tour waits for the visitor to continue. */
export const TOUR_PROMPT = "[tour] press enter for next ▸ or ask me anything · "

/** Default chips shown after a scripted onboarding reply. */
export const ONBOARDING_SUGGESTIONS: readonly string[] = [
    'Take a tour', 'What do you do?', 'See your projects', 'How can I reach you?',
]

/** Chips shown after the guided tour finishes. */
export const POST_TOUR_SUGGESTIONS: readonly string[] = [
    'Download your CV', 'Tell me about your experience', 'How can I reach you?',
]
