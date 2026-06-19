// components/layout/CustomCursor.tsx
"use client"

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/src/hooks/useReducedMotion'

const TEXT_INPUT_TYPES = new Set([
    '', 'text', 'email', 'password', 'search', 'url', 'tel', 'number'
])

// Priority 8: Section energy levels — derived from typingConfig pacing.
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

// Priority 7: Terminal section types at 25ms/char (machine-like),
// so it uses the faster blink rate matching .typing-text (0.75s).
// All other sections use 1s matching .cursor / .name-cursor.
const SECTION_BLINK_RATES: Record<string, string> = {
    terminal: '0.75s',
}
const DEFAULT_BLINK_RATE = '1s'

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
        'a, button, select, summary, [role="button"], label[for], .cta-btn, [tabindex]:not([tabindex="-1"])'
    )) {
        return 'link'
    }

    return null
}

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null)
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const reducedMotion = useReducedMotion()

    useEffect(() => {
        const check = () => {
            const hasTouch = (
                ('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0)
            )
            const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
            setIsTouchDevice(hasTouch || hasCoarsePointer)
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    useEffect(() => {
        if (isTouchDevice) return

        const cursor = cursorRef.current
        if (!cursor) return

        const dot = cursor.querySelector('.custom-cursor__dot') as HTMLElement
        if (!dot) return

        let mouseX = 0
        let mouseY = 0
        let cursorX = 0
        let cursorY = 0
        let visible = false
        let currentState = 'default'
        let rafId: number

        // Priority 1: Idle tracking — modeled on hub-particle pulse (0.03 rad/frame)
        let idleFrames = 0
        const IDLE_THRESHOLD = 1.5   // px — below this delta the cursor is "stopped"
        const IDLE_FRAMES_TO_PULSE = 30  // ~0.5s at 60fps before pulse engages
        let pulsePhase = 0

        // Priority 6: Micro-glitch — rarer (8–15s) and briefer (2–4 frames) than
        // the text glitch system's low-intensity preset (3s interval, 2s display)
        let idleTimeMs = 0
        let lastFrameTime = 0
        let nextGlitchTime = 8000 + Math.random() * 7000
        let glitchFramesRemaining = 0
        let glitchOffsetX = 0
        let glitchOffsetY = 0

        // Priority 8: Section tracking
        let currentSectionId: string | null = null
        let sectionGlowMultiplier = 1.0

        const setState = (state: string) => {
            if (state === currentState) return
            currentState = state
            cursor.dataset.state = state

            // Priority 7: Update blink rate when entering input state
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

            // Priority 7: Re-evaluate blink rate if already in input state
            if (currentState === 'input') {
                const rate = sectionId
                    ? (SECTION_BLINK_RATES[sectionId] ?? DEFAULT_BLINK_RATE)
                    : DEFAULT_BLINK_RATE
                cursor.style.setProperty('--cursor-blink-rate', rate)
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY

            if (!visible) {
                visible = true
                cursor.style.opacity = '1'
            }

            const type = getInteractiveType(e.target as Element)
            setState(type || 'default')
            updateSection(e.target as Element)
        }

        // Catches state changes from DOM mutations or scroll
        // without requiring mouse movement
        const handleMouseOver = (e: MouseEvent) => {
            const type = getInteractiveType(e.target as Element)
            setState(type || 'default')
            updateSection(e.target as Element)
        }

        // Priority 4: Click ripple — uses existing @keyframes mouse-ripple
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

        const handleMouseDown = () => {
            setPressed(true)
            spawnRipple()
        }
        const handleMouseUp = () => setPressed(false)

        const handleMouseLeave = () => {
            visible = false
            cursor.style.opacity = '0'
        }

        const handleMouseEnter = () => {
            // Visibility restored on next mousemove
        }

        const animate = (timestamp: number) => {
            if (!lastFrameTime) lastFrameTime = timestamp
            const deltaTime = Math.min(timestamp - lastFrameTime, 100)
            lastFrameTime = timestamp

            const dx = mouseX - cursorX
            const dy = mouseY - cursorY
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Priority 3: Adaptive trailing — fast flicks (dist ≫ 0) → snappy 0.35,
            // slow precision (dist ≈ 0) → heavy 0.12. Smooth ramp over 300px.
            // Mirrors typing config's character-class multipliers principle.
            // Priority 2: Reduced motion → instant positioning (lerp 1.0)
            let lerp: number
            if (reducedMotion) {
                lerp = 1.0
            } else {
                lerp = 0.12 + Math.min(dist / 300, 1) * (0.35 - 0.12)
            }

            cursorX += dx * lerp
            cursorY += dy * lerp

            // Priority 6: Apply micro-glitch position offset
            let translateX = cursorX
            let translateY = cursorY

            if (glitchFramesRemaining > 0) {
                translateX += glitchOffsetX
                translateY += glitchOffsetY
                glitchFramesRemaining--
            }

            cursor.style.transform = `translate(${translateX}px, ${translateY}px)`

            // Idle detection
            if (dist < IDLE_THRESHOLD) {
                idleFrames++
                idleTimeMs += deltaTime

                // Priority 1: Idle glow pulse — sinusoidal on box-shadow,
                // modeled on hub-particle pulsing (0.03 rad/frame, ±0.12 amplitude).
                // ±10% random variation on phase increment prevents mechanical feel.
                // Only in default state (link has its own brighter glow, input hides dot).
                if (idleFrames > IDLE_FRAMES_TO_PULSE && !reducedMotion && currentState === 'default') {
                    const variation = 1 + (Math.random() - 0.5) * 0.2
                    pulsePhase += 0.03 * variation

                    const t = Math.sin(pulsePhase)
                    // Oscillate blur: 8→12px (inner), 15→18px (outer)
                    // Oscillate opacity: 0.4→0.55 (inner), 0.15→0.23 (outer)
                    const blur1 = 8 + t * 4
                    const o1 = Math.min((0.4 + t * 0.15) * sectionGlowMultiplier, 1)
                    const blur2 = 15 + t * 3
                    const o2 = Math.min((0.15 + t * 0.08) * sectionGlowMultiplier, 1)

                    dot.style.boxShadow =
                        `0 0 ${blur1.toFixed(1)}px rgba(0, 255, 65, ${o1.toFixed(3)}), ` +
                        `0 0 ${blur2.toFixed(1)}px rgba(0, 255, 65, ${o2.toFixed(3)})`
                }

                // Priority 6: Micro-glitch — fires after 8–15s idle (randomized).
                // 2–4 frame position offset (1–3px) + opacity flash (~66ms).
                // Rarer and briefer than low-intensity text glitch (3s/2s).
                // Closest duration reference: chromatic aberration (200ms), digital noise (180ms).
                if (!reducedMotion && currentState === 'default' &&
                    idleTimeMs > nextGlitchTime && glitchFramesRemaining === 0) {

                    glitchFramesRemaining = 2 + Math.floor(Math.random() * 3) // 2–4 frames
                    const angle = Math.random() * Math.PI * 2
                    const magnitude = 1 + Math.random() * 2 // 1–3px
                    glitchOffsetX = Math.cos(angle) * magnitude
                    glitchOffsetY = Math.sin(angle) * magnitude

                    // Brief opacity flash — sub-100ms, a CRT scanline hit
                    dot.style.opacity = '0.4'
                    setTimeout(() => {
                        if (currentState === 'default') {
                            dot.style.opacity = ''
                        }
                    }, 66)

                    // Schedule next glitch
                    idleTimeMs = 0
                    nextGlitchTime = 8000 + Math.random() * 7000
                }
            } else {
                // Moving — reset idle state, clear pulse glow back to CSS default
                if (idleFrames > IDLE_FRAMES_TO_PULSE) {
                    dot.style.boxShadow = ''
                }
                idleFrames = 0
                idleTimeMs = 0
                pulsePhase = 0
            }

            rafId = requestAnimationFrame(animate)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseover', handleMouseOver)
        document.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.addEventListener('mouseleave', handleMouseLeave)
        document.body.addEventListener('mouseenter', handleMouseEnter)

        rafId = requestAnimationFrame(animate)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseover', handleMouseOver)
            document.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.removeEventListener('mouseleave', handleMouseLeave)
            document.body.removeEventListener('mouseenter', handleMouseEnter)
            cancelAnimationFrame(rafId)
        }
    }, [isTouchDevice, reducedMotion])

    if (isTouchDevice) return null

    return (
        <div
            ref={cursorRef}
            className={`custom-cursor${reducedMotion ? ' custom-cursor--reduced-motion' : ''}`}
            data-state="default"
            data-pressed="false"
            style={{ opacity: 0 }}
        >
            <div className="custom-cursor__dot" />
            <div className="custom-cursor__ring" />
            <div className="custom-cursor__caret" />
        </div>
    )
}
