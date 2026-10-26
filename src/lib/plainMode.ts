// lib/plainMode.ts
/**
 * Plain mode (`--no-tty`): the recruiter's fast lane. The same content with
 * no boot, no typing, no sound, no snap scrolling and no ambient effects —
 * a clean page that reads and forwards well. Ice White is its suggested
 * theme: switching in applies it (the previous theme comes back on exit).
 *
 * <html data-mode="plain"> is set before first paint by the inline script in
 * app/layout.tsx; globals.css does most of the work from that attribute.
 */

import { getTheme, setTheme } from '@/src/lib/themeStore'
import { THEME_IDS, type ThemeId } from '@/src/lib/themes'
import { setFxPaused } from '@/src/lib/fxState'
import { audioEngine } from '@/src/lib/audioEngine'

export const PLAIN_STORAGE_KEY = 'portfolio-plain'
const THEME_BEFORE_KEY = 'portfolio-theme-before-plain'
const PLAIN_THEME: ThemeId = 'p4'

const listeners = new Set<() => void>()

export function isPlainMode(): boolean {
    if (typeof document === 'undefined') return false
    return document.documentElement.dataset.mode === 'plain'
}

export function setPlainMode(on: boolean): void {
    if (on === isPlainMode()) return
    const root = document.documentElement
    try {
        if (on) {
            localStorage.setItem(THEME_BEFORE_KEY, getTheme())
            localStorage.setItem(PLAIN_STORAGE_KEY, 'on')
        } else {
            localStorage.setItem(PLAIN_STORAGE_KEY, 'off')
        }
    } catch { /* storage blocked */ }

    if (on) {
        root.dataset.mode = 'plain'
        setTheme(PLAIN_THEME)
    } else {
        delete root.dataset.mode
        let before: string | null = null
        try { before = localStorage.getItem(THEME_BEFORE_KEY) } catch { /* storage blocked */ }
        if (before && (THEME_IDS as readonly string[]).includes(before)) setTheme(before as ThemeId)
    }
    applyPlainEffects(on)
    listeners.forEach(fn => fn())
}

/** Pause the particles and silence every sound while plain mode is on. */
export function applyPlainEffects(on: boolean): void {
    setFxPaused('plain', on)
    audioEngine.setSuppressed(on)
}

export function subscribePlainMode(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
}
