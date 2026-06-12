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

import {useEffect, useState, useRef, RefObject} from 'react'
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
    const hasBeenInViewRef = useRef(false)

    // Keep callback ref up to date WITHOUT causing re-observation
    useEffect(() => {
        onInViewChangeRef.current = onInViewChange
    }, [onInViewChange])

    // Setup IntersectionObserver
    // Note: hasBeenInView is read via ref, not a dependency, to avoid
    // tearing down and recreating the observer when a section first enters.
    useEffect(() => {
        const element = ref.current
        if (!element) return

        // If triggerOnce and already been in view, don't observe
        if (triggerOnce && hasBeenInViewRef.current) {
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
                if (inView && !hasBeenInViewRef.current) {
                    hasBeenInViewRef.current = true
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threshold, rootMargin, triggerOnce, root])

    return {
        ref,
        isInView: triggerOnce ? hasBeenInView : isInView,
        hasBeenInView,
        entry,
    }
}

