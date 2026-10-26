// lib/fxState.ts
/**
 * Page-wide reasons to pause ambient effects (e.g. the boot screen is
 * covering the page, or a terminal game is running). Each reason is set and
 * cleared by its owner; effects pause while any reason is active.
 */

type PauseReason = 'boot' | 'game' | 'plain'

const reasons = new Set<PauseReason>()
const listeners = new Set<() => void>()

export function setFxPaused(reason: PauseReason, paused: boolean): void {
    const had = reasons.has(reason)
    if (paused === had) return
    if (paused) reasons.add(reason)
    else reasons.delete(reason)
    listeners.forEach(fn => fn())
}

export function isFxPaused(): boolean {
    return reasons.size > 0
}

export function subscribeFxPaused(fn: () => void): () => void {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
}
