// hooks/useInView.ts
"use client"

/**
 * Hook for detecting when an element is in viewport.
 * The callback is held in a ref, so changing it never re-creates the observer.
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
}

/**
 * Hook for detecting element visibility in viewport
 *
 * @example
 * const { ref, isInView } = useInView({
 *   threshold: 0.3,
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
        onInViewChange,
        root = null,
    } = options

    const [isInView, setIsInView] = useState(false)

    const ref = useRef<HTMLDivElement>(null)
    const onInViewChangeRef = useRef(onInViewChange)

    // Keep callback ref up to date WITHOUT causing re-observation
    useEffect(() => {
        onInViewChangeRef.current = onInViewChange
    }, [onInViewChange])

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([observerEntry]) => {
                const inView = observerEntry.isIntersecting
                setIsInView(inView)
                onInViewChangeRef.current?.(inView)
            },
            { threshold, rootMargin, root }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [threshold, rootMargin, root])

    return { ref, isInView }
}
