// components/shared/GlitchText.tsx
"use client"

/**
 * Text that glitches now and then (lib/glitchDirector picks when and how).
 * Each character is a span holding the real character plus an empty overlay
 * (`.gch-x`) — the only thing the glitch ever writes into, so React's text
 * is never touched. The text appears once (crawlers, copy-paste and screen
 * readers read it normally); the overlays are aria-hidden and empty at rest.
 */

import { useEffect, useRef } from 'react'
import { registerGlitch } from '@/src/lib/glitchDirector'

export default function GlitchText({ text, className }: { text: string; className?: string }) {
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        return registerGlitch(el)
    }, [])

    return (
        <span ref={ref} className={`glitch-text${className ? ` ${className}` : ''}`}>
            {Array.from(text).map((c, i) =>
                c === ' '
                    ? ' '
                    : <span key={i} className="gch">{c}<span className="gch-x" aria-hidden="true" /></span>
            )}
        </span>
    )
}
