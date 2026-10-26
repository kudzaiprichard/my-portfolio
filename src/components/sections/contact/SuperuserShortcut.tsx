// components/sections/contact/SuperuserShortcut.tsx
"use client"

// Easter egg: once the Contact intro has finished and the section is in view,
// a plain Enter (no modifiers, no form control focused) jumps to #terminal.

import { useEffect } from 'react'
import { useSectionReveal } from '@/src/components/shared/reveal/SectionReveal'
import { goToSection } from '@/src/lib/sectionNav'

export default function SuperuserShortcut() {
    const { completed, isInView } = useSectionReveal()

    useEffect(() => {
        if (!completed || !isInView) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Enter') return
            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return

            // Don't intercept form interactions or any focused control.
            const active = document.activeElement
            if (active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.tagName === 'BUTTON' ||
                active.tagName === 'SELECT' ||
                (active as HTMLElement).isContentEditable
            )) return

            if (!document.getElementById('terminal')) return

            e.preventDefault()
            goToSection('terminal')
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [completed, isInView])

    return null
}
