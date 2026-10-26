// lib/typewriter.ts
/**
 * Frame-driven typewriter. Plays a keystroke plan on the shared FX loop and
 * hands each keystroke to `onKey` (which edits the DOM directly), so typing
 * never re-renders React. Several keystrokes may land in one frame when they
 * are shorter than a frame.
 */

import { onFrame } from '@/src/lib/fxScheduler'
import type { Keystroke } from '@/src/lib/typingDelay'

export interface TypewriterHandle {
    /** Jump to the end now and fire onDone. */
    finish: () => void
    /** Stop without firing onDone. */
    cancel: () => void
}

/**
 * Play `plan`. Keystroke 0 lands after its own delay; each later one after
 * the previous. `finish()` reports the remaining keystrokes with `skipped`
 * set, so the caller can show the final text without sounds or effects.
 */
export function playKeystrokes(
    plan: Keystroke[],
    onKey: (k: Keystroke, skipped: boolean) => void,
    onDone: () => void,
): TypewriterHandle {
    const at: number[] = new Array(plan.length)
    let t = 0
    for (let i = 0; i < plan.length; i++) {
        t += plan[i].delay
        at[i] = t
    }

    let elapsed = 0
    let next = 0
    let stopped = false

    const stop = onFrame((_, delta) => {
        elapsed += delta
        while (next < plan.length && at[next] <= elapsed) onKey(plan[next++], false)
        if (next === plan.length) complete()
    })

    function complete() {
        if (stopped) return
        stopped = true
        stop()
        onDone()
    }

    return {
        finish: () => {
            if (stopped) return
            while (next < plan.length) onKey(plan[next++], true)
            complete()
        },
        cancel: () => {
            if (stopped) return
            stopped = true
            stop()
        },
    }
}

/**
 * Reveal `text` at a constant rate (agent replies). `write` receives each
 * new prefix; the first character appears immediately.
 */
export function typewrite(
    text: string,
    msPerChar: number,
    write: (visible: string) => void,
    onDone: () => void,
): TypewriterHandle {
    const plan: Keystroke[] = Array.from(text, (key, i) => ({ delay: i === 0 ? 0 : msPerChar, visible: text.slice(0, i + 1), key }))
    let last = ''
    return playKeystrokes(plan, k => {
        last = k.visible
        write(last)
    }, () => {
        if (last !== text) write(text)
        onDone()
    })
}
