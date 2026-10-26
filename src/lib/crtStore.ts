// lib/crtStore.ts
/**
 * The opt-in CRT look (scanlines, slow flicker, and the WebGL tube on the
 * hero and boot screen). Off by default. <html data-crt="on"> is set before
 * first paint by the inline script in app/layout.tsx; CSS ignores it under
 * prefers-reduced-motion.
 */

export const CRT_STORAGE_KEY = 'portfolio-crt'

const listeners = new Set<() => void>()

export function getCrt(): boolean {
    if (typeof document === 'undefined') return false
    return document.documentElement.dataset.crt === 'on'
}

export function setCrt(on: boolean): void {
    const root = document.documentElement
    if (on) root.dataset.crt = 'on'
    else delete root.dataset.crt
    try { localStorage.setItem(CRT_STORAGE_KEY, on ? 'on' : 'off') } catch { /* storage blocked */ }
    listeners.forEach(fn => fn())
}

export function subscribeCrt(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

/** Pure response for `crt [on|off]`. */
export function crtCommand(arg: string, active: boolean, reducedMotion: boolean): { text: string; apply?: boolean } {
    const a = arg.trim().toLowerCase()
    if (!a) {
        return { text: `CRT mode is ${active ? 'on' : 'off'}. Switch with: crt on | crt off${reducedMotion ? '\n(Your system asks for reduced motion, so the effect stays hidden.)' : ''}` }
    }
    if (a !== 'on' && a !== 'off') return { text: `crt: expected 'on' or 'off', got '${arg.trim()}'` }
    const on = a === 'on'
    if (on === active) return { text: `CRT mode is already ${a}.` }
    if (on) {
        return {
            text: reducedMotion
                ? 'CRT mode saved as on — but your system asks for reduced motion, so scanlines and flicker stay off.'
                : 'Warming up the tube… scanlines and phosphor bloom on. (crt off to switch back)',
            apply: true,
        }
    }
    return { text: 'Degaussed. Flat panel mode.', apply: false }
}
