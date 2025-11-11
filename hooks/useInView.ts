// hooks/useInView.ts
"use client"

import { useEffect, useState, useRef, RefObject } from 'react'

interface UseInViewOptions {
    threshold?: number // 0 to 1, how much of element must be visible
    triggerOnce?: boolean // only trigger animation once
    rootMargin?: string // margin around root
}

interface UseInViewReturn {
    ref: RefObject<HTMLDivElement | null>
    isInView: boolean
    hasBeenInView: boolean
}

/**
 * Hook to detect when an element enters the viewport
 * Perfect for triggering animations on scroll
 *
 * @example
 * const { ref, isInView } = useInView({ threshold: 0.3, triggerOnce: true })
 *
 * return (
 *   <div ref={ref}>
 *     {isInView && <AnimatedComponent />}
 *   </div>
 * )
 */
export function useInView({
                              threshold = 0.3,
                              triggerOnce = true,
                              rootMargin = '0px'
                          }: UseInViewOptions = {}): UseInViewReturn {
    const [isInView, setIsInView] = useState(false)
    const [hasBeenInView, setHasBeenInView] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        // If triggerOnce and already been in view, don't observe
        if (triggerOnce && hasBeenInView) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                const inView = entry.isIntersecting

                setIsInView(inView)

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
                rootMargin
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [threshold, rootMargin, triggerOnce, hasBeenInView])

    return {
        ref,
        isInView: triggerOnce ? hasBeenInView : isInView,
        hasBeenInView
    }
}