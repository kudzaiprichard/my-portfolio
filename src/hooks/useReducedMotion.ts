// hooks/useReducedMotion.ts
"use client"

import { useState, useEffect } from 'react'

/**
 * Hook that checks for `prefers-reduced-motion: reduce`.
 * Returns true when the user has requested reduced motion.
 * Listens for changes so it reacts if the preference toggles mid-session.
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mql.matches)

        const handler = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches)
        }

        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    return prefersReducedMotion
}
