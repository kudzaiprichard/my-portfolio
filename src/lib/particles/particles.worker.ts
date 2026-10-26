// lib/particles/particles.worker.ts
// Runs the particle field off the main thread on a transferred OffscreenCanvas,
// so typing, React and the cursor never compete with it for frame time.

import { ParticleField } from './field'
import type { ParticleMessage } from './messages'

interface WorkerScope {
    onmessage: ((e: MessageEvent<ParticleMessage>) => void) | null
    requestAnimationFrame?: (cb: (now: number) => void) => number
}
const scope = self as unknown as WorkerScope

let field: ParticleField | null = null
let paused = false
let still = false
let running = false

// Workers with OffscreenCanvas usually have requestAnimationFrame; fall back to ~60 Hz timers.
const nextFrame = (cb: (now: number) => void) =>
    scope.requestAnimationFrame
        ? scope.requestAnimationFrame(cb)
        : setTimeout(() => cb(performance.now()), 16)

function loop(now: number) {
    if (!field || paused || still) {
        running = false
        return
    }
    field.tick(now)
    nextFrame(loop)
}

function ensureRunning() {
    if (running || paused || still || !field) return
    running = true
    nextFrame(loop)
}

scope.onmessage = (e) => {
    const msg = e.data
    switch (msg.type) {
        case 'init': {
            field = new ParticleField(msg.canvas, (w, h) => new OffscreenCanvas(w, h))
            field.setColor(msg.rgb)
            field.resize(msg.size)
            still = msg.still
            field.drawStatic()
            ensureRunning()
            break
        }
        case 'resize':
            field?.resize(msg.size)
            field?.drawStatic()
            break
        case 'pointer':
            field?.setPointer(msg.x, msg.y)
            break
        case 'click':
            field?.click()
            break
        case 'color':
            field?.setColor(msg.rgb)
            if (still || paused) field?.drawStatic()
            break
        case 'run':
            paused = msg.paused
            still = msg.still
            if (still) field?.drawStatic()
            ensureRunning()
            break
    }
}
