// lib/viewTransition.ts
/**
 * CRT transitions through the View Transitions API, one line per change:
 *
 *   runTransition('chan', () => jumpToSection())   // 420 ms collapse-and-rebuild
 *   runTransition('crton', () => removeBootScreen()) // power-on, --dur-crt
 *
 * `html[data-vt]` names the transition while it runs so globals.css can pick
 * the keyframes for ::view-transition-old/new(root). Unsupported browsers
 * and reduced motion just apply the update instantly.
 *
 * The update may change React state (wrap it in flushSync) or an external
 * store; we yield one task before the new snapshot so React has committed.
 */

export type TransitionKind = 'chan' | 'crton'

type DocumentWithVT = Document & {
    startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> }
}

export function canTransition(): boolean {
    if (typeof document === 'undefined') return false
    return typeof (document as DocumentWithVT).startViewTransition === 'function'
        && !matchMedia('(prefers-reduced-motion: reduce)').matches
        && document.documentElement.dataset.mode !== 'plain'
}

/** Run `update` inside a view transition of the given kind. Returns when it has finished. */
export function runTransition(kind: TransitionKind, update: () => void): Promise<void> {
    if (!canTransition()) {
        update()
        return Promise.resolve()
    }
    const root = document.documentElement
    root.dataset.vt = kind
    const transition = (document as DocumentWithVT).startViewTransition!(async () => {
        update()
        await new Promise(resolve => setTimeout(resolve, 0))
    })
    return transition.finished
        .catch(() => { /* skipped or interrupted: the update already ran */ })
        .finally(() => { if (root.dataset.vt === kind) delete root.dataset.vt })
}
