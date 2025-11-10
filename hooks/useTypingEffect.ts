// hooks/useTypingEffect.ts
"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTypingEffectOptions {
    text: string
    speed?: number // milliseconds per character
    delay?: number // delay before typing starts
    onComplete?: () => void
    enabled?: boolean // allows enabling/disabling the effect
}

interface UseTypingEffectReturn {
    displayedText: string
    isTyping: boolean
    isComplete: boolean
    reset: () => void
}

/**
 * Hook for creating typing animation effects
 *
 * @example
 * const { displayedText, isTyping } = useTypingEffect({
 *   text: "AI & Full Stack Developer",
 *   speed: 100,
 *   delay: 500,
 * })
 */
export function useTypingEffect({
                                    text,
                                    speed = 100,
                                    delay = 0,
                                    onComplete,
                                    enabled = true,
                                }: UseTypingEffectOptions): UseTypingEffectReturn {
    const [displayedText, setDisplayedText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTyping, setIsTyping] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [isDelayed, setIsDelayed] = useState(delay > 0)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const onCompleteRef = useRef(onComplete)

    // Keep onComplete ref up to date
    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    // Reset function
    const reset = useCallback(() => {
        setDisplayedText('')
        setCurrentIndex(0)
        setIsTyping(false)
        setIsComplete(false)
        setIsDelayed(delay > 0)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [delay])

    // Reset when text changes
    useEffect(() => {
        reset()
    }, [text, reset])

    // Handle initial delay
    useEffect(() => {
        if (!enabled || !isDelayed) return

        timeoutRef.current = setTimeout(() => {
            setIsDelayed(false)
            setIsTyping(true)
        }, delay)

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [enabled, isDelayed, delay])

    // Handle typing animation
    useEffect(() => {
        if (!enabled) {
            setDisplayedText(text)
            setIsComplete(true)
            return
        }

        if (isDelayed || !isTyping) return

        if (currentIndex < text.length) {
            timeoutRef.current = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex])
                setCurrentIndex((prev) => prev + 1)
            }, speed)
        } else if (currentIndex === text.length) {
            setIsTyping(false)
            setIsComplete(true)
            onCompleteRef.current?.()
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [enabled, isDelayed, isTyping, currentIndex, text, speed])

    return {
        displayedText,
        isTyping,
        isComplete,
        reset,
    }
}

/**
 * Hook for creating multiple sequential typing effects
 *
 * @example
 * const { currentText, currentIndex } = useSequentialTyping({
 *   texts: ["Developer", "Designer", "Creator"],
 *   speed: 100,
 *   deleteSpeed: 50,
 *   pauseDuration: 2000,
 * })
 */
interface UseSequentialTypingOptions {
    texts: string[]
    speed?: number // typing speed
    deleteSpeed?: number // deleting speed
    pauseDuration?: number // pause after typing completes
    loop?: boolean // whether to loop through texts
}

interface UseSequentialTypingReturn {
    currentText: string
    currentIndex: number
    isTyping: boolean
    isDeleting: boolean
}

export function useSequentialTyping({
                                        texts,
                                        speed = 100,
                                        deleteSpeed = 50,
                                        pauseDuration = 2000,
                                        loop = true,
                                    }: UseSequentialTypingOptions): UseSequentialTypingReturn {
    const [currentTextIndex, setCurrentTextIndex] = useState(0)
    const [currentText, setCurrentText] = useState('')
    const [isTyping, setIsTyping] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const currentFullText = texts[currentTextIndex]

        if (isTyping && !isDeleting) {
            // Typing forward
            if (currentText.length < currentFullText.length) {
                timeoutRef.current = setTimeout(() => {
                    setCurrentText(currentFullText.slice(0, currentText.length + 1))
                }, speed)
            } else {
                // Finished typing, pause before deleting
                timeoutRef.current = setTimeout(() => {
                    setIsDeleting(true)
                    setIsTyping(false)
                }, pauseDuration)
            }
        } else if (isDeleting) {
            // Deleting backward
            if (currentText.length > 0) {
                timeoutRef.current = setTimeout(() => {
                    setCurrentText(currentText.slice(0, -1))
                }, deleteSpeed)
            } else {
                // Finished deleting, move to next text
                setIsDeleting(false)
                setIsTyping(true)

                if (currentTextIndex === texts.length - 1) {
                    if (loop) {
                        setCurrentTextIndex(0)
                    }
                } else {
                    setCurrentTextIndex((prev) => prev + 1)
                }
            }
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [
        currentText,
        currentTextIndex,
        texts,
        isTyping,
        isDeleting,
        speed,
        deleteSpeed,
        pauseDuration,
        loop,
    ])

    return {
        currentText,
        currentIndex: currentTextIndex,
        isTyping: !isDeleting,
        isDeleting,
    }
}

/**
 * Hook for creating command-line style typing effect
 * Types multiple commands sequentially with outputs
 *
 * @example
 * const commands = [
 *   { command: "whoami", output: "Kudzai Prichard" },
 *   { command: "cat role.txt", output: "AI Developer" },
 * ]
 * const { visibleCommands } = useCommandTyping({ commands })
 */
interface Command {
    command: string
    output?: string
    delay?: number
}

interface UseCommandTypingOptions {
    commands: Command[]
    commandSpeed?: number
    outputSpeed?: number
    commandDelay?: number
}

interface VisibleCommand {
    command: string
    output: string
    isCommandTyping: boolean
    isOutputTyping: boolean
}

interface UseCommandTypingReturn {
    visibleCommands: VisibleCommand[]
    isComplete: boolean
    currentCommandIndex: number
}

export function useCommandTyping({
                                     commands,
                                     commandSpeed = 50,
                                     outputSpeed = 30,
                                     commandDelay = 500,
                                 }: UseCommandTypingOptions): UseCommandTypingReturn {
    const [visibleCommands, setVisibleCommands] = useState<VisibleCommand[]>([])
    const [currentCommandIndex, setCurrentCommandIndex] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const moveToNextTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const commandTyping = useTypingEffect({
        text: commands[currentCommandIndex]?.command || '',
        speed: commandSpeed,
        delay: commandDelay,
        enabled: currentCommandIndex < commands.length,
    })

    const outputTyping = useTypingEffect({
        text: commands[currentCommandIndex]?.output || '',
        speed: outputSpeed,
        delay: 200,
        enabled: commandTyping.isComplete && currentCommandIndex < commands.length,
    })

    // Handle moving to next command
    useEffect(() => {
        if (outputTyping.isComplete && currentCommandIndex < commands.length - 1) {
            moveToNextTimeoutRef.current = setTimeout(() => {
                setCurrentCommandIndex((prev) => prev + 1)
            }, 500)
        } else if (outputTyping.isComplete && currentCommandIndex === commands.length - 1) {
            setIsComplete(true)
        }

        return () => {
            if (moveToNextTimeoutRef.current) {
                clearTimeout(moveToNextTimeoutRef.current)
            }
        }
    }, [outputTyping.isComplete, currentCommandIndex, commands.length])

    // Update visible commands
    useEffect(() => {
        if (currentCommandIndex < commands.length) {
            setVisibleCommands((prev) => {
                const newVisibleCommands = [...prev]
                newVisibleCommands[currentCommandIndex] = {
                    command: commandTyping.displayedText,
                    output: outputTyping.displayedText,
                    isCommandTyping: commandTyping.isTyping,
                    isOutputTyping: outputTyping.isTyping,
                }
                return newVisibleCommands
            })
        }
    }, [
        commandTyping.displayedText,
        outputTyping.displayedText,
        commandTyping.isTyping,
        outputTyping.isTyping,
        currentCommandIndex,
        commands.length,
    ])

    return {
        visibleCommands,
        isComplete,
        currentCommandIndex,
    }
}