// hooks/useGlitch.ts
"use client"

import { useEffect, useRef } from 'react'
import { startPeriodicGlitch, startBorderGlitch, type GlitchConfig, defaultGlitchConfig } from '@/lib/glitch'

interface UseGlitchOptions {
    enabled?: boolean
    config?: Partial<GlitchConfig>
    enableBorderGlitch?: boolean
}

/**
 * Hook to apply periodic glitch effects to an element
 */
export function useGlitch({
                              enabled = true,
                              config = {},
                              enableBorderGlitch = false
                          }: UseGlitchOptions = {}) {
    const elementRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!enabled || !elementRef.current) return

        const element = elementRef.current
        const fullConfig = { ...defaultGlitchConfig, ...config }

        // Start text glitch effects
        const cleanupTextGlitch = startPeriodicGlitch(element, fullConfig)

        // Start border glitch if enabled
        let cleanupBorderGlitch: (() => void) | undefined
        if (enableBorderGlitch) {
            cleanupBorderGlitch = startBorderGlitch(element, fullConfig.borderGlitchInterval)
        }

        return () => {
            cleanupTextGlitch()
            cleanupBorderGlitch?.()
        }
    }, [enabled, config, enableBorderGlitch])

    return elementRef
}