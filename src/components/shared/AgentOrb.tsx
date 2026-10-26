// components/shared/AgentOrb.tsx
"use client"

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { DEFAULT_THEME } from '@/src/lib/themes'
import { getTheme, subscribeTheme } from '@/src/lib/themeStore'
import { useReducedMotion } from '@/src/hooks/useReducedMotion'
import { audioEngine } from '@/src/lib/audioEngine'

type AgentOrbState = 'idle' | 'thinking' | 'speaking' | 'listening'

interface AgentOrbProps {
    /** Drives the animation: idle breathes, thinking pulses, speaking/listening react. */
    state: AgentOrbState
}

const BARS = 7

// Per-state animation profile: base height, how much it moves, and how fast.
const PROFILE: Record<AgentOrbState, { base: number; amp: number; speed: number }> = {
    idle: { base: 0.18, amp: 0.10, speed: 0.0018 },
    thinking: { base: 0.30, amp: 0.45, speed: 0.0085 },
    speaking: { base: 0.35, amp: 0.55, speed: 0.0060 },
    listening: { base: 0.30, amp: 0.62, speed: 0.0070 },
}

/**
 * A small canvas "voice bars" visualizer that gives the agent a living presence.
 * Hand-built with requestAnimationFrame (no library), matching the codebase's
 * imperative-animation style. Colour is the --agent theme token (via
 * currentColor), re-read on theme change. While listening, the bars follow
 * the real microphone level (audioEngine's analyser). Honours reduced-motion.
 */
export default function AgentOrb({ state }: AgentOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const stateRef = useRef(state)
    const rafRef = useRef<number | null>(null)
    const prefersReducedMotion = useReducedMotion()
    // Re-read the colour when the theme changes
    const theme = useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME)

    useEffect(() => { stateRef.current = state }, [state])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const cssW = 58
        const cssH = 18
        canvas.width = cssW * dpr
        canvas.height = cssH * dpr
        ctx.scale(dpr, dpr)

        const color = getComputedStyle(canvas).color
        const gap = 3
        const barW = (cssW - gap * (BARS - 1)) / BARS

        const drawBars = (heights: number[]) => {
            ctx.clearRect(0, 0, cssW, cssH)
            ctx.fillStyle = color
            for (let i = 0; i < BARS; i++) {
                const h = Math.max(1.5, heights[i] * cssH)
                const x = i * (barW + gap)
                const y = (cssH - h) / 2
                ctx.beginPath()
                ctx.roundRect(x, y, barW, h, Math.min(barW / 2, 1.5))
                ctx.fill()
            }
        }

        if (prefersReducedMotion) {
            // Static: a calm symmetric set of bars, no animation.
            const heights = Array.from({ length: BARS }, (_, i) =>
                0.3 + 0.25 * Math.sin((i / (BARS - 1)) * Math.PI),
            )
            drawBars(heights)
            return
        }

        let micLevel = 0
        const draw = (t: number) => {
            const p = PROFILE[stateRef.current] ?? PROFILE.idle
            const mic = stateRef.current === 'listening' ? audioEngine.getMicLevel() : null
            // Fast attack, slower release, so speech reads as a meter rather than flicker
            if (mic !== null) micLevel = mic > micLevel ? mic : micLevel * 0.85 + mic * 0.15
            const heights: number[] = []
            for (let i = 0; i < BARS; i++) {
                // Each bar a sine wave with a phase offset → a travelling ripple.
                const wave = Math.sin(t * p.speed + i * 0.9) * 0.5 + 0.5
                if (mic !== null) {
                    // Live mic: centre bars tallest, a little ripple so it stays alive
                    const centre = 1 - Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2) * 0.55
                    heights.push(Math.min(1, 0.12 + micLevel * centre * (0.75 + 0.25 * wave)))
                } else {
                    heights.push(Math.min(1, p.base + p.amp * wave))
                }
            }
            drawBars(heights)
            rafRef.current = requestAnimationFrame(draw)
        }

        rafRef.current = requestAnimationFrame(draw)
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        }
    }, [prefersReducedMotion, theme])

    return (
        <span
            className="agent-orb"
            aria-hidden="true"
            style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--agent)' }}
        >
            <canvas ref={canvasRef} style={{ width: 58, height: 18, display: 'block' }} />
        </span>
    )
}
