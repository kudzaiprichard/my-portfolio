// lib/skipHint.ts
// "# press any key to skip" is shown the first time a section types, then
// never again (localStorage). A tiny external store for useSyncExternalStore.

import { skipConfig } from '@/src/constants/typingConfig'

const listeners = new Set<() => void>()

export function hasSeenSkipHint(): boolean {
    try { return localStorage.getItem(skipConfig.hintSeenKey) === '1' } catch { return true }
}

export function markSkipHintSeen(): void {
    if (hasSeenSkipHint()) return
    try { localStorage.setItem(skipConfig.hintSeenKey, '1') } catch { /* storage blocked */ }
    listeners.forEach(l => l())
}

export function subscribeSkipHint(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
