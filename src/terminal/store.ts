// terminal/store.ts
/**
 * Holds one TerminalSession per section and the page's single terminal
 * keyboard listener.
 *
 * Keys go to the session whose <input> has focus; otherwise to the most
 * recently activated session (a section becomes active once its intro has
 * finished and it is in view). Before, every active section attached its own
 * document listener, so two terminals in view could both react to one key.
 */

import { TerminalSession } from './session'
import type { TerminalSectionId } from './types'

const sessions = new Map<TerminalSectionId, TerminalSession>()
/** Active sections, most recently activated last. */
const activeOrder: TerminalSectionId[] = []
let listening = false

export function getTerminalSession(sectionId: TerminalSectionId): TerminalSession {
    let session = sessions.get(sectionId)
    if (!session) {
        session = new TerminalSession(sectionId)
        sessions.set(sectionId, session)
    }
    return session
}

/**
 * Run a command in the main terminal (the last section) from anywhere: go
 * there, then run it once the move has settled. Used when a game is asked
 * for in another section's mini-shell.
 */
export function runInTerminal(command: string, goTo: (id: string) => void): void {
    goTo('terminal')
    setTimeout(() => getTerminalSession('terminal').submitCommand(command), 900)
}

export function setTerminalActive(sectionId: TerminalSectionId, active: boolean): void {
    const i = activeOrder.indexOf(sectionId)
    if (i !== -1) activeOrder.splice(i, 1)
    if (active) activeOrder.push(sectionId)
    ensureListener()
}

/** Marks the real terminal <input> (TerminalInput), so the listener knows which session owns it. */
const TERMINAL_INPUT_ATTR = 'data-terminal-input'

function isOtherEditable(el: Element | null): boolean {
    if (!el || el.hasAttribute(TERMINAL_INPUT_ATTR)) return false
    const tag = el.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' ||
        (el as HTMLElement).isContentEditable
}

function handleKeyDown(e: KeyboardEvent): void {
    const focused = document.activeElement

    // The visitor is typing in a terminal's own input: that session owns the key
    const ownerId = focused?.getAttribute(TERMINAL_INPUT_ATTR) as TerminalSectionId | null
    if (ownerId) {
        sessions.get(ownerId)?.handleKeyDown(e, { fromInput: true })
        return
    }

    // Other form fields and buttons keep their keys (contact form, chips, mic)
    if (isOtherEditable(focused)) return

    const activeId = activeOrder[activeOrder.length - 1]
    if (activeId) sessions.get(activeId)?.handleKeyDown(e, { fromInput: false })
}

function ensureListener(): void {
    if (listening || typeof document === 'undefined') return
    listening = true
    document.addEventListener('keydown', handleKeyDown)
}
