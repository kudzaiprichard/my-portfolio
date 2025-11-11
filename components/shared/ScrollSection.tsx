// components/shared/ScrollSection.tsx
"use client"

import { useEffect, useRef } from 'react'
import type { ScrollSectionProps } from '@/types'

export default function ScrollSection({
                                          id,
                                          children,
                                          className = '',
                                      }: ScrollSectionProps) {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const section = sectionRef.current
        if (!section) return

        // IntersectionObserver to detect when section is in view
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Update URL hash when section comes into view
                    const newHash = `#${id}`

                    // Only update if the hash is different
                    if (window.location.hash !== newHash) {
                        // Use replaceState to update hash without triggering scroll
                        window.history.replaceState(null, '', newHash)
                    }
                }
            },
            {
                threshold: 0.5, // Section is "active" when 50% visible
                rootMargin: '0px',
            }
        )

        observer.observe(section)

        return () => {
            observer.disconnect()
        }
    }, [id])

    // Handle initial page load - scroll to section if hash matches
    useEffect(() => {
        // Check if there's a hash in the URL
        const hash = window.location.hash.replace('#', '')

        if (hash === id) {
            const section = sectionRef.current
            if (section) {
                // Small delay to ensure page is fully loaded
                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth' })
                }, 100)
            }
        }
    }, [id])

    return (
        <section
            id={id}
            ref={sectionRef}
            className={className}
        >
            {children}
        </section>
    )
}