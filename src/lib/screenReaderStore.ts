// lib/screenReaderStore.ts
/**
 * Screen-reader mode (the idea from xterm.js `screenReaderMode`): when on,
 * every finished terminal output line is mirrored into a polite live
 * region, so command output is read aloud as it prints. Agent replies are
 * always announced once they finish, mode or not. Off by default;
 * `screenreader on|off` (alias `sr`) toggles it; the choice is remembered.
 */

const SR_STORAGE_KEY = 'portfolio-screenreader'

const listeners = new Set<() => void>()

export function getScreenReaderMode(): boolean {
    try { return localStorage.getItem(SR_STORAGE_KEY) === 'on' } catch { return false }
}

export function setScreenReaderMode(on: boolean): void {
    try { localStorage.setItem(SR_STORAGE_KEY, on ? 'on' : 'off') } catch { /* storage blocked */ }
    listeners.forEach(fn => fn())
}

export function subscribeScreenReaderMode(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

/** Pure response for `screenreader [on|off]`. */
export function screenReaderCommand(arg: string, active: boolean): { text: string; apply?: boolean } {
    const a = arg.trim().toLowerCase()
    if (!a) return { text: `Screen-reader mode is ${active ? 'on' : 'off'}. Switch with: screenreader on | screenreader off` }
    if (a !== 'on' && a !== 'off') return { text: `screenreader: expected 'on' or 'off', got '${arg.trim()}'` }
    const on = a === 'on'
    if (on === active) return { text: `Screen-reader mode is already ${a}.` }
    return on
        ? { text: 'Screen-reader mode on: every line of output will be read as it prints.', apply: true }
        : { text: 'Screen-reader mode off: only AI agent replies are announced.', apply: false }
}
