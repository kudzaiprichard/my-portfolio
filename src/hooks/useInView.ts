// hooks/useInView.ts
"use client"

/**
 * Hook for detecting when an element is in viewport
 * Updated to work seamlessly with new animation system
 *
 * Key improvements:
 * - Better integration with InViewConfig type
 * - Stable callback handling
 * - Enhanced control options
 * - Better TypeScript support
 */

import {useEffect, useState, useRef, RefObject, useCallback} from 'react'
import { InViewConfig } from '@/src/lib/animationTypes'

interface UseInViewOptions extends InViewConfig {
    /**
     * Root element for intersection observer
     */
    root?: Element | null
}

interface UseInViewReturn {
    /**
     * Ref to attach to the element to observe
     */
    ref: RefObject<HTMLDivElement | null>

    /**
     * Whether element is currently in view
     */
    isInView: boolean

    /**
     * Whether element has ever been in view
     */
    hasBeenInView: boolean

    /**
     * Entry object from IntersectionObserver (for advanced usage)
     */
    entry: IntersectionObserverEntry | null
}

/**
 * Hook for detecting element visibility in viewport
 *
 * @example
 * const { ref, isInView } = useInView({
 *   threshold: 0.3,
 *   triggerOnce: false,
 *   onInViewChange: (inView) => {
 *     if (inView) startAnimation()
 *     else cancelAnimation()
 *   }
 * })
 *
 * return <div ref={ref}>Content</div>
 */
export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
    const {
        threshold = 0.3,
        rootMargin = '0px',
        triggerOnce = false,
        onInViewChange,
        root = null,
    } = options

    // State
    const [isInView, setIsInView] = useState(false)
    const [hasBeenInView, setHasBeenInView] = useState(false)
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

    // Refs
    const ref = useRef<HTMLDivElement>(null)
    const onInViewChangeRef = useRef(onInViewChange)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Keep callback ref up to date WITHOUT causing re-observation
    useEffect(() => {
        onInViewChangeRef.current = onInViewChange
    }, [onInViewChange])

    // Setup IntersectionObserver
    useEffect(() => {
        const element = ref.current
        if (!element) return

        // If triggerOnce and already been in view, don't observe
        if (triggerOnce && hasBeenInView) {
            return
        }

        // Clean up existing observer if any
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        // Create observer
        const observer = new IntersectionObserver(
            ([observerEntry]) => {
                const inView = observerEntry.isIntersecting

                // Update state
                setIsInView(inView)
                setEntry(observerEntry)

                // Fire callback using ref (always gets latest version)
                if (onInViewChangeRef.current) {
                    onInViewChangeRef.current(inView)
                }

                // Mark as having been in view
                if (inView && !hasBeenInView) {
                    setHasBeenInView(true)
                }

                // If triggerOnce and now in view, disconnect observer
                if (triggerOnce && inView) {
                    observer.disconnect()
                }
            },
            {
                threshold,
                rootMargin,
                root,
            }
        )

        observerRef.current = observer
        observer.observe(element)

        return () => {
            observer.disconnect()
            observerRef.current = null
        }
    }, [threshold, rootMargin, triggerOnce, hasBeenInView, root])

    return {
        ref,
        isInView: triggerOnce ? hasBeenInView : isInView,
        hasBeenInView,
        entry,
    }
}

/**
 * Hook for detecting when element enters viewport with delay
 * Useful for preventing animations from triggering too quickly
 *
 * @example
 * const { ref, isInView } = useInViewWithDelay({
 *   threshold: 0.3,
 *   delay: 500, // Wait 500ms before triggering
 *   onInViewChange: (inView) => console.log('In view:', inView)
 * })
 */
interface UseInViewWithDelayOptions extends UseInViewOptions {
    /**
     * Delay in milliseconds before triggering inView
     * @default 0
     */
    delay?: number
}

export function useInViewWithDelay(
    options: UseInViewWithDelayOptions = {}
): UseInViewReturn {
    const { delay = 0, onInViewChange, ...inViewOptions } = options

    const [delayedIsInView, setDelayedIsInView] = useState(false)
    const delayTimerRef = useRef<NodeJS.Timeout | null>(null)

    const handleInViewChange = (inView: boolean) => {
        // Clear any pending timer
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current)
            delayTimerRef.current = null
        }

        if (inView && delay > 0) {
            // Delay the trigger
            delayTimerRef.current = setTimeout(() => {
                setDelayedIsInView(true)
                onInViewChange?.(true)
            }, delay)
        } else {
            // Immediate response when leaving view or no delay
            setDelayedIsInView(inView)
            onInViewChange?.(inView)
        }
    }

    const inViewResult = useInView({
        ...inViewOptions,
        onInViewChange: handleInViewChange,
    })

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (delayTimerRef.current) {
                clearTimeout(delayTimerRef.current)
            }
        }
    }, [])

    return {
        ...inViewResult,
        isInView: delayedIsInView,
    }
}

/**
 * Hook for tracking multiple elements in view
 * Useful for complex layouts with multiple animated sections
 *
 * @example
 * const { createRef, elementsInView } = useMultiInView({
 *   count: 3,
 *   threshold: 0.3
 * })
 *
 * return (
 *   <>
 *     <div ref={createRef(0)}>Section 1 {elementsInView[0] && '✓'}</div>
 *     <div ref={createRef(1)}>Section 2 {elementsInView[1] && '✓'}</div>
 *     <div ref={createRef(2)}>Section 3 {elementsInView[2] && '✓'}</div>
 *   </>
 * )
 */
interface UseMultiInViewOptions extends Omit<UseInViewOptions, 'onInViewChange'> {
    /**
     * Number of elements to track
     */
    count: number

    /**
     * Callback when any element's view state changes
     */
    onAnyInViewChange?: (index: number, isInView: boolean) => void
}

export function useMultiInView(options: UseMultiInViewOptions) {
    const { count, onAnyInViewChange, ...inViewOptions } = options

    const [elementsInView, setElementsInView] = useState<boolean[]>(
        Array(count).fill(false)
    )

    // Use useRef to store refs internally
    const refsRef = useRef<Map<number, HTMLDivElement>>(new Map())

    // Callback ref creator
    const createRef = useCallback((index: number) => {
        return (element: HTMLDivElement | null) => {
            if (element) {
                refsRef.current.set(index, element)
            } else {
                refsRef.current.delete(index)
            }
        }
    }, [])

    // Track each element
    useEffect(() => {
        const observers: IntersectionObserver[] = []

        refsRef.current.forEach((element, index) => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    const inView = entry.isIntersecting

                    setElementsInView((prev) => {
                        const updated = [...prev]
                        updated[index] = inView
                        return updated
                    })

                    onAnyInViewChange?.(index, inView)
                },
                inViewOptions
            )

            observer.observe(element)
            observers.push(observer)
        })

        return () => {
            observers.forEach((observer) => observer.disconnect())
        }
        // Re-run when count or options change, or when elements mount
    }, [count, onAnyInViewChange, inViewOptions])

    return {
        createRef,
        elementsInView,
        allInView: elementsInView.every((inView) => inView),
        anyInView: elementsInView.some((inView) => inView),
    }
}

/**
 * Hook for progressive reveal based on scroll position
 * Elements reveal as user scrolls down
 *
 * @example
 * const { ref, progress } = useScrollProgress({
 *   onProgressChange: (progress) => {
 *     console.log('Scroll progress:', progress)
 *   }
 * })
 */
interface UseScrollProgressOptions {
    /**
     * Callback when scroll progress changes
     */
    onProgressChange?: (progress: number) => void
}

export function useScrollProgress(options: UseScrollProgressOptions = {}) {
    const { onProgressChange } = options
    const [progress, setProgress] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const onProgressChangeRef = useRef(onProgressChange)

    useEffect(() => {
        onProgressChangeRef.current = onProgressChange
    }, [onProgressChange])

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                const rect = entry.boundingClientRect
                const viewportHeight = window.innerHeight

                // Calculate progress (0 to 1)
                let scrollProgress = 0
                if (entry.isIntersecting) {
                    const elementTop = rect.top
                    const elementHeight = rect.height

                    if (elementTop < viewportHeight && elementTop > -elementHeight) {
                        scrollProgress = Math.max(
                            0,
                            Math.min(1, (viewportHeight - elementTop) / (viewportHeight + elementHeight))
                        )
                    }
                }

                setProgress(scrollProgress)
                onProgressChangeRef.current?.(scrollProgress)
            },
            {
                threshold: Array.from({ length: 101 }, (_, i) => i / 100), // 0, 0.01, 0.02, ..., 1
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [])

    return {
        ref,
        progress,
        isVisible: progress > 0,
    }
}