// hooks/useTypingAnimation.ts
"use client"

/**
 * Hook for creating typing animations with human-like patterns
 * Integrates with AnimationController for proper cancellation
 *
 * Key Features:
 * - Human-like typing patterns
 * - Proper cancellation support
 * - Audio integration ready
 * - Generates AnimationSteps for controller
 */

import { useState, useCallback, useRef } from 'react'
import {
    AnimationStep,
    TypingAnimationConfig,
    HumanTypingPattern,
    DEFAULT_HUMAN_TYPING_PATTERN,
    KeyType,
} from '@/src/lib/animationTypes'

interface UseTypingAnimationOptions {
    /**
     * Base typing speed in milliseconds
     * @default 80
     */
    baseSpeed?: number

    /**
     * Human typing pattern configuration
     */
    humanPattern?: Partial<HumanTypingPattern>

    /**
     * Auto-reset text on new typing sequence
     * @default true
     */
    autoReset?: boolean
}

interface UseTypingAnimationReturn {
    /**
     * Current displayed text
     */
    text: string

    /**
     * Set text directly (bypasses animation)
     */
    setText: (text: string) => void

    /**
     * Generate typing animation steps for a given text
     */
    generateSteps: (
        fullText: string,
        config?: TypingAnimationConfig
    ) => AnimationStep[]

    /**
     * Reset text to empty
     */
    reset: () => void

    /**
     * Current text length
     */
    length: number
}

/**
 * Hook for creating typing animations
 *
 * @example
 * const typing = useTypingAnimation({ baseSpeed: 80 })
 * const { playKeystroke } = useKeystrokeAudio({ sectionId: 'hero' })
 *
 * const steps = typing.generateSteps('Hello World', {
 *   onKeystroke: (char, index, isLast) => {
 *     playKeystroke(isLast ? 'enter' : char === ' ' ? 'space' : 'regular')
 *   }
 * })
 *
 * animation.start(steps)
 */
export function useTypingAnimation(
    options: UseTypingAnimationOptions = {}
): UseTypingAnimationReturn {
    const {
        baseSpeed = 80,
        humanPattern = {},
        autoReset = true,
    } = options

    const [text, setText] = useState('')

    // Merge user pattern with defaults
    const patternRef = useRef<Required<HumanTypingPattern>>({
        ...DEFAULT_HUMAN_TYPING_PATTERN,
        ...humanPattern,
    })

    // Update pattern if options change
    patternRef.current = {
        ...DEFAULT_HUMAN_TYPING_PATTERN,
        ...humanPattern,
    }

    /**
     * Calculate human-like delay for a character
     */
    const calculateDelay = useCallback((
        char: string,
        index: number,
        fullText: string,
        speed: number
    ): number => {
        const pattern = patternRef.current
        let delay = speed

        // Check for file extensions (.txt, .sh, etc.)
        const hasExtension = /\.[a-z]{2,4}$/i.test(fullText)
        if (hasExtension) {
            const extensionStart = fullText.lastIndexOf('.')
            const isInExtension = index >= extensionStart

            if (isInExtension) {
                delay *= pattern.extensionSpeedMultiplier
            }
        }

        // Start of text - slower (thinking/starting)
        if (index < 3) {
            delay *= pattern.startSpeedMultiplier
        }

        // Middle of text - faster (in the flow)
        const middleStart = Math.floor(fullText.length * 0.3)
        const middleEnd = Math.floor(fullText.length * 0.7)
        const isInMiddle = index >= middleStart && index <= middleEnd
        const isInExtension = hasExtension && index >= fullText.lastIndexOf('.')

        if (isInMiddle && !isInExtension) {
            delay *= pattern.middleSpeedMultiplier
        }

        // End of text - slightly slower (finishing)
        if (index > fullText.length - 4 && !isInExtension) {
            delay *= pattern.endSpeedMultiplier
        }

        // Slow characters (/, ., -, _)
        const prevChar = fullText[index - 1]
        if (prevChar && pattern.slowCharacters.includes(prevChar)) {
            delay *= pattern.slowCharMultiplier
        }

        // Repeated characters
        if (index > 0 && char === prevChar) {
            delay *= pattern.repeatedCharMultiplier
        }

        // Random pauses (mimics thinking/hesitation)
        if (Math.random() < pattern.randomPauseProbability && !isInExtension) {
            delay *= pattern.randomPauseMultiplier
        }

        // Add natural variation (±30%)
        const variation = delay * 0.3
        delay += (Math.random() * variation * 2 - variation)

        return Math.max(10, delay) // Minimum 10ms
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
            baseSpeed: configSpeed = baseSpeed,
            onKeystroke,
            getDelay,
        } = config

        const steps: AnimationStep[] = []

        // Optional: Reset text before starting
        if (autoReset) {
            steps.push({
                id: 'reset-text',
                action: () => setText(''),
                duration: 0,
            })
        }

        // Generate step for each character
        for (let i = 0; i <= fullText.length; i++) {
            const currentText = fullText.slice(0, i)
            const char = fullText[i - 1]
            const isLast = i === fullText.length

            steps.push({
                id: `type-${i}`,
                action: () => {
                    // Update displayed text
                    setText(currentText)

                    // Fire keystroke callback (skip first iteration)
                    if (i > 0 && onKeystroke) {
                        const keyType = getKeyType(char, isLast)
                        onKeystroke(char, i - 1, isLast)
                    }
                },
                duration: i < fullText.length
                    ? (getDelay?.(fullText[i], i, fullText) ??
                        calculateDelay(fullText[i], i, fullText, configSpeed))
                    : 0, // No delay after last character
                metadata: {
                    char,
                    index: i,
                    isLast,
                },
            })
        }

        return steps
    }, [baseSpeed, autoReset, calculateDelay, getKeyType])

    /**
     * Reset text to empty
     */
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
 * Useful for command sequences
 *
 * @example
 * const multiTyping = useMultiTyping()
 *
 * const steps = multiTyping.generateSequence([
 *   { text: 'whoami', onComplete: () => setShowOutput1(true) },
 *   { text: 'cat role.txt', onComplete: () => setShowOutput2(true) },
 *   { text: 'ls -la', onComplete: () => setShowOutput3(true) }
 * ])
 *
 * animation.start(steps)
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

    /**
     * Generate steps for multiple text sequences
     */
    const generateSequence = useCallback((
        items: TypingSequenceItem[]
    ): AnimationStep[] => {
        const allSteps: AnimationStep[] = []

        // Reset texts array
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

            // Add placeholder for this text
            allSteps.push({
                id: `init-text-${itemIndex}`,
                action: () => {
                    setTexts((prev) => [...prev, ''])
                    setCurrentIndex(itemIndex)
                },
                duration: 0,
            })

            // Generate typing steps
            const typingSteps = typing.generateSteps(text, {
                baseSpeed: itemSpeed,
                onKeystroke,
            })

            // Modify each step to update the correct index in texts array
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

            // Add delay after this item
            if (delayAfter > 0) {
                allSteps.push({
                    id: `delay-after-${itemIndex}`,
                    action: () => {},
                    duration: delayAfter,
                })
            }

            // Fire onComplete callback
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
 * Shows blinking cursor at end of text
 *
 * @example
 * const { text, showCursor } = useTypingWithCursor()
 *
 * return (
 *   <span>
 *     {text}
 *     {showCursor && <span className="cursor">|</span>}
 *   </span>
 * )
 */
interface UseTypingWithCursorOptions extends UseTypingAnimationOptions {
    /**
     * Show cursor while typing
     * @default true
     */
    cursorWhileTyping?: boolean

    /**
     * Show cursor after completion
     * @default true
     */
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
        // Mark as typing when starting
        const steps: AnimationStep[] = [{
            id: 'start-typing',
            action: () => {
                setIsTyping(true)
                setIsComplete(false)
            },
            duration: 0,
        }]

        // Add typing steps
        steps.push(...typing.generateSteps(fullText, config))

        // Mark as complete when done
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