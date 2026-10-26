// hooks/useSectionAnimation.ts
"use client"

/**
 * The lifecycle every animated section shares:
 *
 * - claims the keystroke audio channel while ≥30% in view, releases it on exit
 * - starts the typing sequence once booted, in view and owning the audio
 * - if scrolled away mid-intro, cancels and resets it, so it types from the
 *   beginning next time (sectionStart.onScrollAway; 'finish' completes it
 *   instead). Cancellation is load-bearing — see README
 * - waits for the first click / key press when the browser still blocks
 *   sound (after a refresh), so the typing is heard (sectionStart.waitForSound)
 * - `finish()` does the same on demand (any key or click skips the intro)
 * - returning visitors can get `instant` steps (output printed at machine
 *   speed) — off by default, see `returningVisitors` in typingConfig
 * - under prefers-reduced-motion, or in plain mode (`--no-tty`), reveals
 *   everything at once and completes
 * - releases audio and cancels timers on unmount
 *
 * Sections keep their own typing hooks and render state; they hand this hook
 * two callbacks. The callbacks are read through refs, so they may change on
 * every render without restarting anything.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useBootContext } from '@/src/components/layout/context/BootContext'
import { useReducedMotion } from '@/src/hooks/useReducedMotion'
import { useInView } from '@/src/hooks/useInView'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/src/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/src/hooks/useAnimationController'
import { audioController } from '@/src/lib/audioController'
import { isPlainMode, subscribePlainMode } from '@/src/lib/plainMode'
import { audioConfig, returningVisitors, sectionStart } from '@/src/constants/typingConfig'
import { audioEngine } from '@/src/lib/audioEngine'
import type { AnimationStep } from '@/src/lib/animationTypes'

export interface SectionStepTools {
    /** Pass as `onKeystroke` to generateSteps so typed characters click. */
    onKeystroke: (char: string, index: number, isLast: boolean) => void
    /** Call at the start of each typed command (softens the first keystrokes). */
    resetVolumeRamp: () => void
    /** Returning visitor: print everything at machine speed, no typing. */
    instant: boolean
}

interface UseSectionAnimationOptions {
    /** Audio ownership key (also the typing-config section key). */
    sectionId: string
    /** Build the full typing sequence. Called when the animation starts. */
    buildSteps: (tools: SectionStepTools) => AnimationStep[]
    /** Show every output at once (reduced motion, skip, scroll-away). */
    revealAll: () => void
    /** Clear everything typed and revealed so the intro can start over. */
    resetDisplay: () => void
}

export function useSectionAnimation({
    sectionId,
    buildSteps,
    revealAll,
    resetDisplay,
}: UseSectionAnimationOptions) {
    const { isBooted, isReturning } = useBootContext()
    const reducedMotion = useReducedMotion()
    const plain = useSyncExternalStore(subscribePlainMode, isPlainMode, () => false)
    // Plain mode behaves exactly like reduced motion here: no typing at all
    const prefersReducedMotion = reducedMotion || plain

    const audio = useKeystrokeAudio({
        sectionId,
        enabled: true,
        volume: audioConfig.baseVolume,
        volumeRampEnabled: audioConfig.volumeRampEnabled,
    })
    const { onTypingKeystroke } = useTypingAudioCallback(audio)

    const hasCompletedOnceRef = useRef(false)
    const animation = useAnimationController({
        onComplete: () => { hasCompletedOnceRef.current = true },
    })

    // Latest section callbacks and values, for handlers and effects that
    // shouldn't re-run when they change.
    const latest = useRef({ buildSteps, revealAll, resetDisplay, audio, animation, onTypingKeystroke })
    useEffect(() => {
        latest.current = { buildSteps, revealAll, resetDisplay, audio, animation, onTypingKeystroke }
    })

    // Sound is blocked until the first click / key press (e.g. after a refresh)
    const soundLocked = useSyncExternalStore(audioEngine.subscribe, audioEngine.waitingForGesture, () => false)
        && sectionStart.waitForSound

    // Finish the running intro now: stop its timers, show everything
    const [finish] = useState(() => () => {
        const { animation, revealAll } = latest.current
        if (!animation.isRunning) return
        revealAll()
        animation.complete()
        hasCompletedOnceRef.current = true
    })

    // Left before the intro finished: start over next time (or finish it)
    const [leave] = useState(() => () => {
        const { animation, resetDisplay } = latest.current
        if (!animation.isRunning) return
        if (sectionStart.onScrollAway === 'finish') {
            finish()
            return
        }
        resetDisplay()
        animation.reset()
    })

    const { ref, isInView } = useInView({
        threshold: 0.3,
        onInViewChange: (inView: boolean) => {
            const { audio } = latest.current
            if (inView) {
                audio.requestAudioControl()
            } else {
                audio.releaseAudioControl()
                leave()
            }
        },
    })

    // While on screen, claim the keystroke channel whenever it is freed (another
    // section scrolled away), so the section in view always owns the audio
    useEffect(() => {
        if (!isInView) return
        return audioController.onRelease(() => latest.current.audio.requestAudioControl())
    }, [isInView])

    // Skip all animations when reduced motion is preferred
    useEffect(() => {
        if (prefersReducedMotion && isBooted && !animation.isCompleted) {
            latest.current.revealAll()
            animation.complete()
            hasCompletedOnceRef.current = true
        }
    }, [prefersReducedMotion, isBooted, animation])

    // Start the sequence once everything is ready
    useEffect(() => {
        if (!isBooted) return
        if (prefersReducedMotion) return
        if (hasCompletedOnceRef.current) return
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) return
        if (animation.isCompleted || animation.isRunning) return
        // Wait for the first click / key press, so the typing is heard
        if (soundLocked) return

        const { buildSteps, onTypingKeystroke, audio: currentAudio } = latest.current
        animation.start(buildSteps({
            onKeystroke: onTypingKeystroke,
            resetVolumeRamp: currentAudio.resetVolumeRamp,
            instant: isReturning && returningVisitors.printInstantly,
        }))
    }, [isBooted, isReturning, isInView, audio.isAudioReady, audio.hasAudioControl, animation, prefersReducedMotion, soundLocked])

    // Unmount: give up the audio channel (useAnimationController cancels itself)
    useEffect(() => {
        return () => latest.current.audio.releaseAudioControl()
    }, [])

    // Booted and on screen, but holding for the first gesture
    const waitingForSound = soundLocked && isBooted && isInView && !prefersReducedMotion && !animation.isCompleted && !animation.isRunning

    return { ref, isInView, isBooted, prefersReducedMotion, animation, finish, waitingForSound }
}
