// components/layout/CustomCursor.tsx
"use client"

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/src/hooks/useReducedMotion'
import { onFrame } from '@/src/lib/fxScheduler'

const TEXT_INPUT_TYPES = new Set([
    '', 'text', 'email', 'password', 'search', 'url', 'tel', 'number'
])

// Section energy levels — derived from typingConfig pacing.
// hero (90ms/char, dramatic) → brighter; about/experience (reading) → dimmer;
// terminal (25ms/char, direct manipulation) → brightest.
const SECTION_GLOW_MULTIPLIERS: Record<string, number> = {
    home: 1.2,
    about: 0.8,
    projects: 1.0,
    experience: 0.8,
    contact: 1.0,
    terminal: 1.3,
}

// Terminal section types at 25ms/char (machine-like), so it uses a faster
// caret blink (0.75s). All other sections use 1s.
const SECTION_BLINK_RATES: Record<string, string> = {
    terminal: '0.75s',
}
const DEFAULT_BLINK_RATE = '1s'

// Set on <html> while a mouse is driving the page; the CSS only hides the
// system cursor under this class. Touch and pen input remove it, so a
// touchscreen laptop always has a cursor of one kind or the other.
const ACTIVE_CLASS = 'has-custom-cursor'

// One 60 Hz frame. Per-frame constants are scaled by (deltaTime / FRAME_MS)
// so the cursor feels the same at 60, 120 or 144 Hz.
const FRAME_MS = 1000 / 60

// Controls the ring wraps around on hover (inline text links keep the circle)
const HUG_SELECTOR = 'button, [role="button"], [role="menuitemradio"], summary, .keycap'

function getHugTarget(target: Element): HTMLElement | null {
    const el = target.closest<HTMLElement>(HUG_SELECTOR)
    if (el) return el
    // Links that are laid out as blocks or buttons (not inline text)
    const link = target.closest<HTMLElement>('a')
    if (link && getComputedStyle(link).display !== 'inline') return link
    return null
}

function getInteractiveType(target: Element): 'link' | 'input' | null {
    // Text inputs → caret
    const inputEl = target.closest(
        'input, textarea, [contenteditable]:not([contenteditable="false"])'
    )
    if (inputEl) {
        if (inputEl.matches('textarea, [contenteditable]:not([contenteditable="false"])')) {
            return 'input'
        }
        if (inputEl.matches('input')) {
            const type = (inputEl as HTMLInputElement).type.toLowerCase()
            if (TEXT_INPUT_TYPES.has(type)) return 'input'
            return 'link'
        }
    }

    // Clickable elements → pointer ring
    if (target.closest(
        'a, button, select, summary, [role="button"], label[for], [tabindex]:not([tabindex="-1"])'
    )) {
        return 'link'
    }

    return null
}

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null)
    const reducedMotion = useReducedMotion()

    useEffect(() => {
        const cursor = cursorRef.current
        if (!cursor) return

        const dot = cursor.querySelector('.custom-cursor__dot') as HTMLElement
        const ring = cursor.querySelector('.custom-cursor__ring') as HTMLElement
        if (!dot || !ring) return

        const root = document.documentElement

        let mouseX = 0
        let mouseY = 0
        let cursorX = 0
        let cursorY = 0
        let visible = false
        let mouseActive = false
        let currentState = 'default'
        let stopFrames: (() => void) | null = null

        // Idle tracking — modeled on hub-particle pulse (0.03 rad/frame)
        const IDLE_THRESHOLD = 1.5       // px — below this delta the cursor is "stopped"
        const IDLE_MS_TO_PULSE = 500     // stillness before the pulse engages
        let idleTimeMs = 0
        let pulsing = false
        let pulsePhase = 0

        // Button the ring is hugging (null: the ring is a circle on the pointer)
        let hugTarget: HTMLElement | null = null
        let hugging = false

        // Section tracking
        let currentSectionId: string | null = null
        let sectionGlowMultiplier = 1.0

        const setState = (state: string) => {
            if (state === currentState) return
            currentState = state
            cursor.dataset.state = state

            // Update blink rate when entering input state
            if (state === 'input') {
                const rate = currentSectionId
                    ? (SECTION_BLINK_RATES[currentSectionId] ?? DEFAULT_BLINK_RATE)
                    : DEFAULT_BLINK_RATE
                cursor.style.setProperty('--cursor-blink-rate', rate)
            }
        }

        const setPressed = (val: boolean) => {
            cursor.dataset.pressed = String(val)
        }

        const updateSection = (target: Element) => {
            const section = target.closest('section[id]')
            const sectionId = section ? section.id : null
            if (sectionId === currentSectionId) return

            currentSectionId = sectionId
            sectionGlowMultiplier = sectionId
                ? (SECTION_GLOW_MULTIPLIERS[sectionId] ?? 1.0)
                : 1.0

            if (sectionId) {
                cursor.dataset.section = sectionId
            } else {
                delete cursor.dataset.section
            }

            // Re-evaluate blink rate if already in input state
            if (currentState === 'input') {
                const rate = sectionId
                    ? (SECTION_BLINK_RATES[sectionId] ?? DEFAULT_BLINK_RATE)
                    : DEFAULT_BLINK_RATE
                cursor.style.setProperty('--cursor-blink-rate', rate)
            }
        }

        const hide = () => {
            visible = false
            cursor.style.opacity = '0'
        }

        const activateMouse = (e: PointerEvent) => {
            if (!mouseActive) {
                mouseActive = true
                root.classList.add(ACTIVE_CLASS)
                // Jump to the pointer instead of sliding in from the last position
                cursorX = e.clientX
                cursorY = e.clientY
                stopFrames = onFrame(animate)
            }
        }

        const deactivateMouse = () => {
            if (!mouseActive) return
            mouseActive = false
            root.classList.remove(ACTIVE_CLASS)
            hide()
            stopFrames?.()
            stopFrames = null
        }

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return
            activateMouse(e)

            mouseX = e.clientX
            mouseY = e.clientY

            if (!visible) {
                visible = true
                cursor.style.opacity = '1'
            }

            const type = getInteractiveType(e.target as Element)
            setState(type || 'default')
            updateSection(e.target as Element)
            hugTarget = type === 'link' ? getHugTarget(e.target as Element) : null
        }

        // Catches state changes from DOM mutations or scroll
        // without requiring mouse movement
        const handlePointerOver = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return
            const type = getInteractiveType(e.target as Element)
            setState(type || 'default')
            updateSection(e.target as Element)
            hugTarget = type === 'link' ? getHugTarget(e.target as Element) : null
        }

        // Click ripple — uses existing @keyframes mouse-ripple
        // and .mouse-ripple class from globals.css (300px ring, 1s ease-out)
        const spawnRipple = () => {
            const ripple = document.createElement('div')
            ripple.className = 'mouse-ripple'
            ripple.style.left = `${cursorX}px`
            ripple.style.top = `${cursorY}px`
            ripple.style.transform = 'translate(-50%, -50%)'
            document.body.appendChild(ripple)
            setTimeout(() => {
                if (ripple.parentNode) ripple.parentNode.removeChild(ripple)
            }, 1000)
        }

        const handlePointerDown = (e: PointerEvent) => {
            // Touch or pen takes over: hand the screen back to the system cursor
            if (e.pointerType !== 'mouse') {
                deactivateMouse()
                return
            }
            setPressed(true)
            spawnRipple()
        }
        const handlePointerUp = (e: PointerEvent) => {
            if (e.pointerType === 'mouse') setPressed(false)
        }

        const handleMouseLeave = () => {
            if (mouseActive) hide()
        }

        // Driven by the shared FX loop (lib/fxScheduler), which supplies the frame delta
        const animate = (_now: number, deltaTime: number) => {
            const frames = deltaTime / FRAME_MS

            const dx = mouseX - cursorX
            const dy = mouseY - cursorY
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Adaptive trailing — fast flicks (dist ≫ 0) → snappy 0.35,
            // slow precision (dist ≈ 0) → heavy 0.12. Smooth ramp over 300px.
            // Mirrors typing config's character-class multipliers principle.
            // Reduced motion → instant positioning (lerp 1.0)
            let k: number
            if (reducedMotion) {
                k = 1.0
            } else {
                const lerp = 0.12 + Math.min(dist / 300, 1) * (0.35 - 0.12)
                k = 1 - Math.pow(1 - lerp, frames)
            }

            cursorX += dx * k
            cursorY += dy * k

            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`

            // Ring hugs the hovered button: it morphs to the button's box
            // (size and corners spring via CSS, --ease-spring)
            if (hugTarget && hugTarget.isConnected && currentState === 'link') {
                const r = hugTarget.getBoundingClientRect()
                const pad = 6
                ring.style.width = `${r.width + pad * 2}px`
                ring.style.height = `${r.height + pad * 2}px`
                ring.style.transform = `translate(${r.left + r.width / 2 - cursorX}px, ${r.top + r.height / 2 - cursorY}px) translate(-50%, -50%)`
                if (!hugging) {
                    hugging = true
                    cursor.dataset.hug = 'true'
                }
            } else if (hugging) {
                hugging = false
                delete cursor.dataset.hug
                ring.style.width = ''
                ring.style.height = ''
                ring.style.transform = ''
            }

            // Idle detection
            if (dist < IDLE_THRESHOLD) {
                idleTimeMs += deltaTime

                // Idle glow pulse — sinusoidal on box-shadow,
                // modeled on hub-particle pulsing (0.03 rad/frame, ±0.12 amplitude).
                // ±10% random variation on phase increment prevents mechanical feel.
                // Only in default state (link has its own brighter glow, input hides dot).
                if (idleTimeMs > IDLE_MS_TO_PULSE && !reducedMotion && currentState === 'default') {
                    pulsing = true
                    const variation = 1 + (Math.random() - 0.5) * 0.2
                    pulsePhase += 0.03 * variation * frames

                    const t = Math.sin(pulsePhase)
                    // Oscillate blur: 8→12px (inner), 15→18px (outer)
                    // Oscillate opacity: 0.4→0.55 (inner), 0.15→0.23 (outer)
                    const blur1 = 8 + t * 4
                    const o1 = Math.min((0.4 + t * 0.15) * sectionGlowMultiplier, 1)
                    const blur2 = 15 + t * 3
                    const o2 = Math.min((0.15 + t * 0.08) * sectionGlowMultiplier, 1)

                    dot.style.boxShadow =
                        `0 0 ${blur1.toFixed(1)}px rgb(var(--glow) / ${o1.toFixed(3)}), ` +
                        `0 0 ${blur2.toFixed(1)}px rgb(var(--glow) / ${o2.toFixed(3)})`
                }
            } else {
                // Moving — reset idle state, clear pulse glow back to CSS default
                if (pulsing) {
                    dot.style.boxShadow = ''
                    pulsing = false
                }
                idleTimeMs = 0
                pulsePhase = 0
            }
        }

        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerover', handlePointerOver)
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('pointerup', handlePointerUp)
        document.body.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerover', handlePointerOver)
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('pointerup', handlePointerUp)
            document.body.removeEventListener('mouseleave', handleMouseLeave)
            stopFrames?.()
            root.classList.remove(ACTIVE_CLASS)
        }
    }, [reducedMotion])

    return (
        <div
            ref={cursorRef}
            className={`custom-cursor${reducedMotion ? ' custom-cursor--reduced-motion' : ''}`}
            data-state="default"
            data-pressed="false"
            style={{ opacity: 0 }}
            aria-hidden="true"
        >
            <div className="custom-cursor__dot" />
            <div className="custom-cursor__ring" />
            <div className="custom-cursor__caret" />
        </div>
    )
}
