// hooks/useTypingAnimation.ts
"use client"

/**
 * Hook for creating typing animations with human-like patterns
 * Integrates with AnimationController for proper cancellation
 *
 * Now imports all defaults from typingConfig.ts — no hardcoded speeds or patterns.
 * Character-class multipliers (digits, uppercase, symbols) are applied here.
 */

import { useState, useCallback, useRef } from 'react'
import {
    AnimationStep,
    TypingAnimationConfig,
    HumanTypingPattern,
    KeyType,
} from '@/src/lib/animationTypes'
import {
    globalTypingPattern,
    getCharClassMultiplier,
} from '@/src/constants/typingConfig'

interface UseTypingAnimationOptions {
    /**
     * Base typing speed in milliseconds.
     * If not provided, the calling code should pass one
     * (typically from getBaseSpeedForSection).
     */
    baseSpeed?: number

    /**
     * Human typing pattern overrides.
     * Merged on top of globalTypingPattern from typingConfig.
     */
    humanPattern?: Partial<HumanTypingPattern>

    /**
     * Auto-reset text on new typing sequence
     * @default true
     */
    autoReset?: boolean
}

interface UseTypingAnimationReturn {
    text: string
    setText: (text: string) => void
    generateSteps: (fullText: string, config?: TypingAnimationConfig) => AnimationStep[]
    reset: () => void
    length: number
}

/**
 * Hook for creating typing animations
 *
 * @example
 * import { getBaseSpeedForSection, getPatternForSection } from '@/src/constants/typingConfig'
 *
 * const typing = useTypingAnimation({
 *   baseSpeed: getBaseSpeedForSection('hero'),
 *   humanPattern: getPatternForSection('hero'),
 * })
 */
export function useTypingAnimation(
    options: UseTypingAnimationOptions = {}
): UseTypingAnimationReturn {
    const {
        baseSpeed,
        humanPattern = {},
        autoReset = true,
    } = options

    const [text, setText] = useState('')

    // Merge: globalTypingPattern < humanPattern overrides
    const patternRef = useRef<Required<HumanTypingPattern>>({
        ...globalTypingPattern,
        ...humanPattern,
    })

    patternRef.current = {
        ...globalTypingPattern,
        ...humanPattern,
    }

    /**
     * Calculate human-like delay for a character.
     * Applies positional multipliers, slow-char rules,
     * character-class multipliers, and random hesitation.
     */
    const calculateDelay = useCallback((
        char: string,
        index: number,
        fullText: string,
        speed: number
    ): number => {
        const pattern = patternRef.current
        let delay = speed

        // ---- Character-class multiplier (digits, uppercase, symbols, space) ----
        delay *= getCharClassMultiplier(char)

        // ---- File extension slowdown (.txt, .sh, etc.) ----
        // Full multiplier on the dot and first extension char, then
        // linear ramp back toward 1.0 for subsequent characters so the
        // typist "finishes" the known filename at near-normal speed.
        const hasExtension = /\.[a-z]{2,4}$/i.test(fullText)
        if (hasExtension) {
            const extensionStart = fullText.lastIndexOf('.')
            const offset = index - extensionStart

            if (offset >= 0) {
                const extMultiplier = pattern.extensionSpeedMultiplier

                if (offset <= 1) {
                    // Dot and first extension character: full slowdown
                    delay *= extMultiplier
                } else {
                    // Remaining extension characters: ramp linearly toward 1.0
                    const extensionLength = fullText.length - extensionStart
                    const rampCount = extensionLength - 2 // chars after the first two
                    const rampIndex = offset - 2           // 0-based within the ramp
                    const t = (rampIndex + 1) / rampCount  // 1/n … n/n (reaches 1.0 at last char)
                    delay *= extMultiplier + (1.0 - extMultiplier) * t
                }
            }
        }

        // ---- Positional multipliers ----
        const isInExtension = hasExtension && index >= fullText.lastIndexOf('.')

        // Start of text — slower (thinking/starting)
        if (index < 3) {
            delay *= pattern.startSpeedMultiplier
        }

        // Middle of text — faster (in the flow)
        const middleStart = Math.floor(fullText.length * 0.3)
        const middleEnd = Math.floor(fullText.length * 0.7)
        if (index >= middleStart && index <= middleEnd && !isInExtension) {
            delay *= pattern.middleSpeedMultiplier
        }

        // End of text — slightly slower (finishing)
        if (index > fullText.length - 4 && !isInExtension) {
            delay *= pattern.endSpeedMultiplier
        }

        // ---- Slow characters (path separators, punctuation) ----
        if (pattern.slowCharacters.includes(char)) {
            delay *= pattern.slowCharMultiplier
        }

        // ---- Repeated characters (muscle memory = faster) ----
        const prevChar = fullText[index - 1]
        if (index > 0 && char === prevChar) {
            delay *= pattern.repeatedCharMultiplier
        }

        // ---- Random micro-pauses (hesitation) ----
        if (Math.random() < pattern.randomPauseProbability && !isInExtension) {
            delay *= pattern.randomPauseMultiplier
        }

        // ---- Natural variation (±30%) ----
        const variation = delay * 0.3
        delay += (Math.random() * variation * 2 - variation)

        return Math.max(10, delay)
    }, [])

    /**
     * Determine key type for audio feedback
     */
    const getKeyType = useCallback((char: string, isLast: boolean): KeyType => {
        if (isLast) return 'enter'
        if (char === ' ') return 'space'
        return 'regular'
    }, [])

    /**
     * Generate animation steps for typing text
     */
    const generateSteps = useCallback((
        fullText: string,
        config: TypingAnimationConfig = {}
    ): AnimationStep[] => {
        const {
            baseSpeed: configSpeed,
            onKeystroke,
            getDelay,
        } = config

        // Resolve speed: config override > hook option > fallback 80
        const resolvedSpeed = configSpeed ?? baseSpeed ?? 80

        const steps: AnimationStep[] = []

        if (autoReset) {
            steps.push({
                id: 'reset-text',
                action: () => setText(''),
                duration: 0,
            })
        }

        for (let i = 0; i <= fullText.length; i++) {
            const currentText = fullText.slice(0, i)
            const char = fullText[i - 1]
            const isLast = i === fullText.length

            steps.push({
                id: `type-${i}`,
                action: () => {
                    setText(currentText)

                    if (i > 0 && onKeystroke) {
                        onKeystroke(char, i - 1, isLast)
                    }
                },
                duration: i < fullText.length
                    ? (getDelay?.(fullText[i], i, fullText) ??
                        calculateDelay(fullText[i], i, fullText, resolvedSpeed))
                    : 0,
                metadata: {
                    char,
                    index: i,
                    isLast,
                },
            })
        }

        return steps
    }, [baseSpeed, autoReset, calculateDelay, getKeyType])

    const reset = useCallback(() => {
        setText('')
    }, [])

    return {
        text,
        setText,
        generateSteps,
        reset,
        length: text.length,
    }
}

