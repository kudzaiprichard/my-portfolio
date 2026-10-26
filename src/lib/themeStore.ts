// lib/themeStore.ts
/**
 * The active theme lives on <html data-theme="…">, set before first paint by
 * the inline script in app/layout.tsx. This module changes it, persists the
 * choice, keeps the browser's theme-color in step, and notifies subscribers
 * (the picker, the agent orb, the terminal's `theme` command).
 */

import { DEFAULT_THEME, THEMES, THEME_IDS, THEME_STORAGE_KEY, type ThemeId } from '@/src/lib/themes'

const listeners = new Set<() => void>()

function isThemeId(value: string | null | undefined): value is ThemeId {
    return !!value && (THEME_IDS as readonly string[]).includes(value)
}

/** The theme currently applied to the page (p1 on the server and before hydration). */
export function getTheme(): ThemeId {
    if (typeof document === 'undefined') return DEFAULT_THEME
    const current = document.documentElement.dataset.theme
    return isThemeId(current) ? current : DEFAULT_THEME
}

export function setTheme(id: ThemeId): void {
    const root = document.documentElement
    root.dataset.theme = id
    try { localStorage.setItem(THEME_STORAGE_KEY, id) } catch { /* storage blocked */ }
    const meta = document.querySelector('meta[name="theme-color"]')
    const info = THEMES.find(t => t.id === id)
    if (meta && info) meta.setAttribute('content', info.colors.bg)
    listeners.forEach(fn => fn())
}

export function subscribeTheme(fn: () => void): () => void {
    listeners.add(fn)
    // Another tab changed the theme
    const onStorage = (e: StorageEvent) => {
        if (e.key === THEME_STORAGE_KEY && isThemeId(e.newValue)) setTheme(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => {
        listeners.delete(fn)
        window.removeEventListener('storage', onStorage)
    }
}
