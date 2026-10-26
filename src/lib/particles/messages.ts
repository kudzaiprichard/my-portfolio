// lib/particles/messages.ts
// Messages from the page to the particle worker.

import type { FieldSize } from './field'

export type ParticleMessage =
    | { type: 'init'; canvas: OffscreenCanvas; size: FieldSize; rgb: string; still: boolean }
    | { type: 'resize'; size: FieldSize }
    | { type: 'pointer'; x: number | null; y: number | null }
    | { type: 'click' }
    | { type: 'color'; rgb: string }
    /** paused: stop simulating; still: reduced motion (draw once, never animate) */
    | { type: 'run'; paused: boolean; still: boolean }
