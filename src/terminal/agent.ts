// terminal/agent.ts
// Client half of the AI agent: the /api/chat round-trip and the browser
// side-effects behind its tool calls.

import { contact } from '@/src/content'
import type { AgentAction, ChatMessage } from '@/src/lib/aiAgent'
import { ANALYTICS_EVENTS, trackEvent } from '@/src/lib/analytics'
import { goToSection } from '@/src/lib/sectionNav'
import type { SpamGuardFields } from '@/src/lib/spamGuard'

export interface AgentResult {
    text?: string
    actions?: AgentAction[]
    suggestions?: string[]
}

/**
 * POST the conversation to /api/chat and stream the reply: `onDelta` gets
 * visible text as it is generated; the returned promise resolves with the
 * final reply (authoritative). Falls back to a JSON reply if the server
 * (or a proxy) doesn't stream. Throws on network failure.
 */
export async function askAgent(
    messages: ChatMessage[],
    guard: SpamGuardFields,
    onDelta?: (text: string) => void,
): Promise<AgentResult> {
    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
        body: JSON.stringify({ messages, guard }),
    })
    if (!(res.headers.get('content-type') ?? '').includes('text/event-stream') || !res.body) return res.json()

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
        const { value, done } = await reader.read()
        if (value) buffer += decoder.decode(value, { stream: true })
        let sep: number
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, sep)
            buffer = buffer.slice(sep + 2)
            const event = /^event: (.*)$/m.exec(raw)?.[1]
            const data = /^data: (.*)$/m.exec(raw)?.[1]
            if (!data) continue
            const payload = JSON.parse(data)
            if (event === 'delta' && typeof payload.text === 'string') onDelta?.(payload.text)
            if (event === 'done') return payload as AgentResult
        }
        if (done) throw new Error('The reply stream ended early')
    }
}

/** Inline renders and the tour run after the reply finishes typing. */
export function isDeferredAction(a: AgentAction): boolean {
    return a.type === 'showSection' || a.type === 'runCommand' || a.type === 'startTour'
}

/** Go to a page section (channel change) and move focus there. */
export function scrollToSection(id: string): void {
    goToSection(id)
}

/** Download a same-origin file, or open an external URL in a new tab. */
export function downloadOrOpen(url: string): void {
    if (/^https?:\/\//.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer')
        return
    }
    const link = document.createElement('a')
    link.href = url
    link.rel = 'noopener'
    // Empty `download` lets the browser use Content-Disposition or the URL filename
    link.setAttribute('download', '')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Map an agent action onto an existing terminal side-effect. Only the
 * "instant" effects live here (navigate / open link / download). Inline
 * renders (showSection / runCommand) are deferred by the caller so they
 * appear AFTER the agent's spoken reply, not on top of it.
 */
export function executeAgentAction(action: AgentAction): void {
    switch (action.type) {
        case 'navigate':
            scrollToSection(action.section)
            break
        case 'openLink': {
            const url =
                action.target === 'github' ? contact.githubUrl
                : action.target === 'linkedin' ? contact.linkedinUrl
                : action.target === 'twitter' ? contact.twitterUrl
                : `mailto:${contact.email}`
            window.open(url, '_blank', 'noopener,noreferrer')
            break
        }
        case 'downloadResume':
            trackEvent(ANALYTICS_EVENTS.cvDownloaded, { source: 'agent' })
            downloadOrOpen(contact.resumeUrl)
            break
        // 'showSection', 'runCommand' and 'startTour' are deferred — see isDeferredAction.
    }
}
