// components/shared/reveal/SectionReveal.tsx
"use client"

/**
 * Reveals a server-rendered section like a terminal session.
 *
 * The section's final content is already in the HTML (server component
 * children). This island only *reveals* it, driven by markup:
 *
 * - `data-reveal="type"`  (TypedLine) — a person types it: bursts, the odd
 *   corrected typo, keystroke audio, and a phosphor afterglow on each glyph
 * - `data-reveal="show"`  — machine output: its lines print ~30 ms apart,
 *   each with a short flare
 * - `data-delay`          — pause before that step: a number (ms) or a
 *   sequenceTimings key; otherwise the sequenceTimings defaults
 *
 * Any key or click finishes the intro at once (a dim hint says so the first
 * time). Scrolling away mid-intro resets it, so it types from the start when
 * the visitor comes back. If the browser still blocks sound (after a
 * refresh), the intro waits for the first key or click, so it is heard.
 *
 * Steps run on the cancellation-safe AnimationController (via
 * useSectionAnimation), typing writes straight into DOM nodes through the
 * frame typewriter, and React never re-renders per character. Pending items
 * are hidden by CSS from the first paint (html.reveal-ready, set in <head>).
 */

import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import TerminalContainer from '@/src/components/shared/TerminalContainer'
import { useSectionAnimation, type SectionStepTools } from '@/src/hooks/useSectionAnimation'
import { AnimationController } from '@/src/lib/animationController'
import { planKeystrokes, planDuration } from '@/src/lib/typingDelay'
import { playKeystrokes, type TypewriterHandle } from '@/src/lib/typewriter'
import { hasSeenSkipHint, markSkipHintSeen, subscribeSkipHint } from '@/src/lib/skipHint'
import type { AnimationStep } from '@/src/lib/animationTypes'
import {
    getSectionTyping,
    outputTimings,
    sequenceTimings,
    type SectionId,
} from '@/src/constants/typingConfig'

interface RevealState {
    /** The intro sequence has finished (or was skipped). */
    completed: boolean
    isInView: boolean
    prefersReducedMotion: boolean
}

const RevealContext = createContext<RevealState>({ completed: false, isInView: false, prefersReducedMotion: false })

/** Reveal state of the enclosing section, for client islands inside it. */
export function useSectionReveal(): RevealState {
    return useContext(RevealContext)
}

interface SectionRevealProps {
    sectionId: SectionId
    title?: string
    titleContent?: ReactNode
    ariaLabel: string
    children: ReactNode
    /** Mounted once the intro completes (e.g. the section's mini-shell). */
    afterComplete?: ReactNode
}

const REVEALED = 'is-revealed'
const TYPING = 'is-typing'
// The typed glyphs stay on screen (still cooling) after typing ends
const HAS_LIVE = 'has-live'
const LINE_IN = 'ln-in'

// Keys that never count as "press any key to skip"
// Keys that never count as "press any key to skip": modifiers, and the keys
// that move between sections (leaving mid-intro restarts it instead)
const NOT_A_SKIP = new Set([
    'Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ',
])

function revealItems(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
}

/** A step's pause: data-delay as ms or a sequenceTimings key, else the default. */
function stepDelay(el: HTMLElement, fallback: number): number {
    const raw = el.dataset.delay
    if (raw === undefined || raw === '') return fallback
    if (raw in sequenceTimings) return sequenceTimings[raw as keyof typeof sequenceTimings]
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
}

/**
 * The "lines" of an output block, flared one after another. A block with its
 * own text is one line; otherwise each child element is a line.
 */
function outputLines(el: HTMLElement): HTMLElement[] {
    const ownText = Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
    if (ownText) return [el]
    const children = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement && !c.hasAttribute('data-reveal'))
    return children.length ? children : [el]
}

function clearLive(el: HTMLElement) {
    const live = el.querySelector('[data-type-live]')
    if (live) live.textContent = ''
    el.classList.remove(TYPING, HAS_LIVE)
}

export default function SectionReveal({ sectionId, title, titleContent, ariaLabel, children, afterComplete }: SectionRevealProps) {
    const rootRef = useRef<HTMLDivElement>(null)
    const typingRef = useRef<TypewriterHandle | null>(null)
    const hintSeen = useSyncExternalStore(subscribeSkipHint, hasSeenSkipHint, () => true)

    // Keep the newest revealed item in view inside the terminal's scroll area
    // Measured on the next frame, once the newly revealed item has its full height
    const ensureVisible = (el: HTMLElement) => {
        requestAnimationFrame(() => {
            const scroller = rootRef.current?.closest('.terminal-content') as HTMLElement | null
            if (!scroller) return
            const overflow = el.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom
            if (overflow > 0) scroller.scrollTo({ top: scroller.scrollTop + overflow + 8, behavior: 'smooth' })
        })
    }

    /** Show an output block: its lines flare in ~30 ms apart. */
    const showBlock = (el: HTMLElement) => {
        outputLines(el).forEach((line, i) => {
            line.style.setProperty('--ln', String(i))
            line.classList.add(LINE_IN)
        })
        el.classList.add(REVEALED)
        ensureVisible(el)
    }

    const beginType = (el: HTMLElement, text: string, onKeystroke: SectionStepTools['onKeystroke'], plan: ReturnType<typeof planKeystrokes>) => {
        el.classList.add(TYPING)
        const live = el.querySelector('[data-type-live]')
        if (!live) return
        live.textContent = ''
        ensureVisible(el)
        typingRef.current = playKeystrokes(plan, (k, skipped) => {
            if (skipped) {
                live.textContent = text
                return
            }
            if (k.key === '\b') {
                live.lastChild?.remove()
            } else if (k.key !== '\n') {
                // Each glyph lands white-hot and cools (the `phos` afterglow)
                const glyph = document.createElement('span')
                glyph.className = 'k'
                glyph.textContent = k.key
                live.appendChild(glyph)
            }
            onKeystroke(k.key, 0, k === plan[plan.length - 1])
        }, () => { typingRef.current = null })
    }

    const endType = (el: HTMLElement) => {
        typingRef.current?.finish()
        typingRef.current = null
        el.classList.remove(TYPING)
        // The typed glyphs stay (still cooling) in place of the static text
        if (el.querySelector('[data-type-live]')?.textContent) el.classList.add(HAS_LIVE)
        el.classList.add(REVEALED)
    }

    const buildSteps = ({ onKeystroke, resetVolumeRamp, instant }: SectionStepTools): AnimationStep[] => {
        const root = rootRef.current
        if (!root) return []
        const typing = getSectionTyping(sectionId)
        const steps: AnimationStep[] = []
        let prev: 'type' | 'show' | null = null

        for (const el of revealItems(root)) {
            const kind = el.dataset.reveal === 'type' ? 'type' : 'show'

            // Returning visitors: everything prints at machine speed
            if (instant) {
                steps.push(AnimationController.createActionStep(() => showBlock(el), outputTimings.lineMs))
                prev = kind
                continue
            }

            const delay = stepDelay(el,
                prev === null ? sequenceTimings.initialDelay
                : kind === 'type' ? sequenceTimings.betweenCommandsDelay
                : prev === 'type' ? sequenceTimings.postCommandDelay
                : sequenceTimings.staggerDelay)

            if (kind === 'type') {
                const text = el.querySelector('[data-type-full]')?.textContent ?? ''
                // Typed lines are commands: they end with Enter
                const plan = planKeystrokes(text, { speedScale: typing.speedScale, allowCorrections: typing.corrections, pressEnter: true })
                if (delay) steps.push(AnimationController.createDelayStep(delay))
                steps.push(AnimationController.createActionStep(() => {
                    resetVolumeRamp()
                    beginType(el, text, onKeystroke, plan)
                }, planDuration(plan)))
                steps.push(AnimationController.createActionStep(() => endType(el)))
            } else {
                if (delay) steps.push(AnimationController.createDelayStep(delay))
                steps.push(AnimationController.createActionStep(() => showBlock(el), outputLines(el).length * outputTimings.lineMs))
            }
            prev = kind
        }
        return steps
    }

    /** Finish now: every item revealed, typed lines shown in full, no effects. */
    const revealAll = () => {
        const root = rootRef.current
        if (!root) return
        typingRef.current?.cancel()
        typingRef.current = null
        for (const el of revealItems(root)) {
            clearLive(el)
            el.classList.add(REVEALED)
        }
    }

    /** Start over: clear what was typed and revealed (left mid-intro). */
    const resetDisplay = () => {
        const root = rootRef.current
        if (!root) return
        typingRef.current?.cancel()
        typingRef.current = null
        for (const el of revealItems(root)) {
            clearLive(el)
            el.classList.remove(REVEALED)
            for (const line of [el, ...outputLines(el)]) {
                line.classList.remove(LINE_IN)
                line.style.removeProperty('--ln')
            }
        }
        const scroller = root.closest('.terminal-content') as HTMLElement | null
        scroller?.scrollTo({ top: 0 })
    }

    const { ref, isInView, isBooted, prefersReducedMotion, animation, finish, waitingForSound } = useSectionAnimation({
        sectionId,
        buildSteps,
        revealAll,
        resetDisplay,
    })
    const completed = animation.isCompleted
    const running = animation.isRunning

    // Waiting caret: once booted, the first typed line shows its prompt and a
    // blinking caret until typing starts.
    useEffect(() => {
        const root = rootRef.current
        if (!root || !isBooted || completed || prefersReducedMotion || running) return
        const first = revealItems(root)[0]
        if (first?.dataset.reveal === 'type' && !first.classList.contains(REVEALED)) first.classList.add(TYPING)
    }, [isBooted, completed, prefersReducedMotion, running])

    // Any key, or a click on the section itself, finishes the running intro
    // instantly. Clicks on the page chrome (tmux bar, theme, mute…) and the
    // navigation keys don't: they move on, and the intro restarts later.
    useEffect(() => {
        if (!running || !isInView) return
        const skip = () => {
            markSkipHintSeen()
            finish()
        }
        const onKey = (e: KeyboardEvent) => { if (!NOT_A_SKIP.has(e.key)) skip() }
        const onPointer = (e: PointerEvent) => {
            if (ref.current?.contains(e.target as Node)) skip()
        }
        window.addEventListener('keydown', onKey)
        window.addEventListener('pointerdown', onPointer)
        return () => {
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('pointerdown', onPointer)
        }
    }, [running, isInView, finish, ref])

    // The hint shows during the first intro only
    useEffect(() => {
        if (completed) markSkipHintSeen()
    }, [completed])

    // Intro done (typed out or skipped): follow it to the very end, so the
    // last output and the section's prompt underneath are in view
    useEffect(() => {
        if (!completed || prefersReducedMotion) return
        let raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => {
                const scroller = rootRef.current?.closest('.terminal-content') as HTMLElement | null
                scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
            })
        })
        return () => cancelAnimationFrame(raf)
    }, [completed, prefersReducedMotion])

    return (
        <RevealContext.Provider value={{ completed, isInView, prefersReducedMotion }}>
            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <TerminalContainer title={title} titleContent={titleContent} ariaLabel={ariaLabel}>
                    <div ref={rootRef} className="section-reveal">
                        {waitingForSound && (
                            <div className="section-skip-hint section-start-hint" aria-hidden="true"># press any key or click to start ▸</div>
                        )}
                        {running && !hintSeen && (
                            <div className="section-skip-hint" aria-hidden="true"># press any key to skip</div>
                        )}
                        {children}
                        {completed && afterComplete}
                    </div>
                </TerminalContainer>
            </div>
        </RevealContext.Provider>
    )
}
