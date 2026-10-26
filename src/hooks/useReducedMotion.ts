// hooks/useReducedMotion.ts
"use client"

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
    const mql = window.matchMedia(QUERY)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches
// Server render and hydration assume full motion, then the real value applies.
const getServerSnapshot = () => false

/**
 * Hook that checks for `prefers-reduced-motion: reduce`.
 * Returns true when the user has requested reduced motion.
 * Listens for changes so it reacts if the preference toggles mid-session.
 */
export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
