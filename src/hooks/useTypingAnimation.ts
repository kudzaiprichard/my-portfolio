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
        const hasExtension = /\.[a-z]{2,4}$/i.test(fullText)
        if (hasExtension) {
            const extensionStart = fullText.lastIndexOf('.')
            const isInExtension = index >= extensionStart

            if (isInExtension) {
                delay *= pattern.extensionSpeedMultiplier
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

/**
 * Hook for typing multiple texts sequentially
 */
interface TypingSequenceItem {
    text: string
    baseSpeed?: number
    onComplete?: () => void
    onKeystroke?: (char: string, index: number, isLast: boolean) => void
    delayAfter?: number
}

interface UseMultiTypingOptions {
    baseSpeed?: number
    humanPattern?: Partial<HumanTypingPattern>
}

export function useMultiTyping(options: UseMultiTypingOptions = {}) {
    const [texts, setTexts] = useState<string[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    const typing = useTypingAnimation({
        baseSpeed: options.baseSpeed,
        humanPattern: options.humanPattern,
        autoReset: false,
    })

    const generateSequence = useCallback((
        items: TypingSequenceItem[]
    ): AnimationStep[] => {
        const allSteps: AnimationStep[] = []

        allSteps.push({
            id: 'reset-sequence',
            action: () => {
                setTexts([])
                setCurrentIndex(0)
            },
            duration: 0,
        })

        items.forEach((item, itemIndex) => {
            const {
                text,
                baseSpeed: itemSpeed,
                onComplete,
                onKeystroke,
                delayAfter = 350,
            } = item

            allSteps.push({
                id: `init-text-${itemIndex}`,
                action: () => {
                    setTexts((prev) => [...prev, ''])
                    setCurrentIndex(itemIndex)
                },
                duration: 0,
            })

            const typingSteps = typing.generateSteps(text, {
                baseSpeed: itemSpeed,
                onKeystroke,
            })

            typingSteps.forEach((step, stepIndex) => {
                const originalAction = step.action
                allSteps.push({
                    ...step,
                    id: `item-${itemIndex}-step-${stepIndex}`,
                    action: () => {
                        originalAction()
                        setTexts((prev) => {
                            const updated = [...prev]
                            updated[itemIndex] = typing.text
                            return updated
                        })
                    },
                })
            })

            if (delayAfter > 0) {
                allSteps.push({
                    id: `delay-after-${itemIndex}`,
                    action: () => {},
                    duration: delayAfter,
                })
            }

            if (onComplete) {
                allSteps.push({
                    id: `complete-${itemIndex}`,
                    action: onComplete,
                    duration: 0,
                })
            }
        })

        return allSteps
    }, [typing])

    const reset = useCallback(() => {
        setTexts([])
        setCurrentIndex(0)
        typing.reset()
    }, [typing])

    return {
        texts,
        currentIndex,
        generateSequence,
        reset,
    }
}

/**
 * Hook for typing with cursor
 */
interface UseTypingWithCursorOptions extends UseTypingAnimationOptions {
    cursorWhileTyping?: boolean
    cursorAfterComplete?: boolean
}

export function useTypingWithCursor(
    options: UseTypingWithCursorOptions = {}
) {
    const {
        cursorWhileTyping = true,
        cursorAfterComplete = true,
        ...typingOptions
    } = options

    const typing = useTypingAnimation(typingOptions)
    const [isTyping, setIsTyping] = useState(false)
    const [isComplete, setIsComplete] = useState(false)

    const generateSteps = useCallback((
        fullText: string,
        config: TypingAnimationConfig = {}
    ): AnimationStep[] => {
        const steps: AnimationStep[] = [{
            id: 'start-typing',
            action: () => {
                setIsTyping(true)
                setIsComplete(false)
            },
            duration: 0,
        }]

        steps.push(...typing.generateSteps(fullText, config))

        steps.push({
            id: 'complete-typing',
            action: () => {
                setIsTyping(false)
                setIsComplete(true)
            },
            duration: 0,
        })

        return steps
    }, [typing])

    const reset = useCallback(() => {
        typing.reset()
        setIsTyping(false)
        setIsComplete(false)
    }, [typing])

    const showCursor =
        (isTyping && cursorWhileTyping) ||
        (isComplete && cursorAfterComplete)

    return {
        ...typing,
        generateSteps,
        reset,
        showCursor,
        isTyping,
        isComplete,
    }
}