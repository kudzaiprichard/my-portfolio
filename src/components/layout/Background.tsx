// components/layout/Background.tsx
"use client"

import { useEffect, useRef } from 'react'
import { ParticleField, type FieldSize } from '@/src/lib/particles/field'
import type { ParticleMessage } from '@/src/lib/particles/messages'
import { onFrame } from '@/src/lib/fxScheduler'
import { isFxPaused, setFxPaused, subscribeFxPaused } from '@/src/lib/fxState'
import { useReducedMotion } from '@/src/hooks/useReducedMotion'
import { useBootContext } from '@/src/components/layout/context/BootContext'

const FALLBACK_RGB = '0 255 65'

/** The --glow theme token (an "R G B" triplet), read from the root element. */
function readGlowRgb(): string {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--glow').trim()
    return value || FALLBACK_RGB
}

function readSize(): FieldSize {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
        // Phones and tablets: a narrow screen or a touch-first (coarse) primary
        // pointer. Touchscreen laptops have a fine primary pointer, so they keep
        // the full desktop field.
        isMobile: window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches,
    }
}

/** Something that drives the field: a worker, or the main thread. */
interface FieldDriver {
    post: (msg: Exclude<ParticleMessage, { type: 'init' }>) => void
    dispose: () => void
}

// A canvas can be transferred to a worker only once. React's dev-mode
// double-mount (and fast refresh) remounts with the same <canvas>, so the
// driver outlives a quick unmount/remount instead of being torn down.
const drivers = new WeakMap<HTMLCanvasElement, { driver: FieldDriver; disposeTimer: ReturnType<typeof setTimeout> | null }>()

function createWorkerDriver(canvas: HTMLCanvasElement, size: FieldSize, rgb: string, still: boolean): FieldDriver {
    const worker = new Worker(new URL('../../lib/particles/particles.worker.ts', import.meta.url), { type: 'module' })
    const offscreen = canvas.transferControlToOffscreen()
    const init: ParticleMessage = { type: 'init', canvas: offscreen, size, rgb, still }
    worker.postMessage(init, [offscreen])
    return {
        post: msg => worker.postMessage(msg),
        dispose: () => worker.terminate(),
    }
}

function createMainThreadDriver(canvas: HTMLCanvasElement, size: FieldSize, rgb: string, still: boolean): FieldDriver {
    const makeCanvas = (w: number, h: number) => {
        if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        return c
    }
    const field = new ParticleField(canvas, makeCanvas)
    field.setColor(rgb)
    field.resize(size)
    field.drawStatic()

    let paused = false
    let isStill = still
    let stop: (() => void) | null = null
    const sync = () => {
        const shouldRun = !paused && !isStill
        if (shouldRun && !stop) stop = onFrame(now => { field.tick(now) })
        if (!shouldRun && stop) { stop(); stop = null }
    }
    sync()

    return {
        post: msg => {
            switch (msg.type) {
                case 'resize': field.resize(msg.size); field.drawStatic(); break
                case 'pointer': field.setPointer(msg.x, msg.y); break
                case 'click': field.click(); break
                case 'color': field.setColor(msg.rgb); if (paused || isStill) field.drawStatic(); break
                case 'run':
                    paused = msg.paused
                    isStill = msg.still
                    if (isStill) field.drawStatic()
                    sync()
                    break
            }
        },
        dispose: () => { stop?.() },
    }
}

export default function Background() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const driverRef = useRef<FieldDriver | null>(null)
    const prefersReducedMotion = useReducedMotion()
    const { isBooted } = useBootContext()

    // The boot overlay covers the field — don't animate behind it
    useEffect(() => {
        setFxPaused('boot', !isBooted)
    }, [isBooted])

    // Create (or reclaim) the driver once per canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const existing = drivers.get(canvas)
        if (existing) {
            if (existing.disposeTimer) clearTimeout(existing.disposeTimer)
            existing.disposeTimer = null
            driverRef.current = existing.driver
        } else {
            const size = readSize()
            const rgb = readGlowRgb()
            const canUseWorker = typeof Worker !== 'undefined' && 'transferControlToOffscreen' in canvas
            let driver: FieldDriver
            try {
                driver = canUseWorker
                    ? createWorkerDriver(canvas, size, rgb, false)
                    : createMainThreadDriver(canvas, size, rgb, false)
            } catch {
                driver = createMainThreadDriver(canvas, size, rgb, false)
            }
            drivers.set(canvas, { driver, disposeTimer: null })
            driverRef.current = driver
        }

        const driver = driverRef.current!

        const handleResize = () => driver.post({ type: 'resize', size: readSize() })
        const coarse = window.matchMedia('(pointer: coarse)')

        // Pointer input (mouse only — touch doesn't attract particles)
        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerType === 'mouse') driver.post({ type: 'pointer', x: e.clientX, y: e.clientY })
        }
        const handleMouseLeave = () => driver.post({ type: 'pointer', x: null, y: null })
        // Click pulses the field. The visible ripple ring is drawn by CustomCursor.
        const handlePointerDown = (e: PointerEvent) => {
            if (e.pointerType === 'mouse') driver.post({ type: 'click' })
        }

        // Theme changes swap the colour without re-seeding the field
        const themeObserver = new MutationObserver(() => driver.post({ type: 'color', rgb: readGlowRgb() }))
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] })

        window.addEventListener('resize', handleResize)
        coarse.addEventListener('change', handleResize)
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('pointerdown', handlePointerDown)

        return () => {
            window.removeEventListener('resize', handleResize)
            coarse.removeEventListener('change', handleResize)
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('pointerdown', handlePointerDown)
            themeObserver.disconnect()

            const entry = drivers.get(canvas)
            if (entry) {
                entry.disposeTimer = setTimeout(() => {
                    entry.driver.dispose()
                    drivers.delete(canvas)
                }, 1000)
            }
        }
    }, [])

    // Run state: paused while anything asks (boot, games); still under reduced motion
    useEffect(() => {
        const driver = driverRef.current
        if (!driver) return
        const sync = () => driver.post({ type: 'run', paused: isFxPaused(), still: prefersReducedMotion })
        sync()
        return subscribeFxPaused(sync)
    }, [prefersReducedMotion])

    return (
        <>
            {/* Gradient Background with Green Glows */}
            <div className="gradient-background" />

            {/* Grid Overlay */}
            <div className="grid-overlay" />

            {/* Particles Canvas */}
            <canvas
                ref={canvasRef}
                className="particle-canvas"
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            />

            {/* Vignette overlay */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, transparent 0%, rgb(var(--bg-rgb) / 0.8) 100%)',
                    pointerEvents: 'none',
                    zIndex: 3,
                }}
            />
        </>
    )
}
