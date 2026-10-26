// lib/fxScheduler.ts
/**
 * One requestAnimationFrame loop for every visual effect on the page
 * (cursor, glitch timers, typewriters, main-thread particle fallback).
 *
 * Subscribers get (now, deltaMs) each frame. The loop only runs while at
 * least one subscriber exists, and the browser pauses it in hidden tabs.
 * `after` / `every` are frame-aligned timers built on the same loop, so
 * effects never fight separate setTimeout/setInterval chains.
 */

export type FrameCallback = (now: number, deltaMs: number) => void

const subscribers = new Set<FrameCallback>()
let rafId = 0
let lastTime = 0

function loop(now: number) {
    const delta = lastTime ? Math.min(now - lastTime, 100) : 0
    lastTime = now
    for (const fn of Array.from(subscribers)) fn(now, delta)
    if (subscribers.size > 0) {
        rafId = requestAnimationFrame(loop)
    } else {
        rafId = 0
        lastTime = 0
    }
}

/** Run `fn` every animation frame. Returns an unsubscribe function. */
export function onFrame(fn: FrameCallback): () => void {
    subscribers.add(fn)
    if (!rafId && typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(loop)
    }
    return () => { subscribers.delete(fn) }
}

/** Run `fn` once after `ms` milliseconds, aligned to a frame. Returns a cancel function. */
export function after(ms: number, fn: () => void): () => void {
    let elapsed = 0
    const stop = onFrame((_, delta) => {
        elapsed += delta
        if (elapsed >= ms) {
            stop()
            fn()
        }
    })
    return stop
}

/** Run `fn` every `ms` milliseconds, aligned to frames. Returns a cancel function. */
export function every(ms: number, fn: () => void): () => void {
    let elapsed = 0
    return onFrame((_, delta) => {
        elapsed += delta
        if (elapsed >= ms) {
            elapsed -= ms
            fn()
        }
    })
}
