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
                    // Update URL when section comes into view
                    const newUrl = `/${id}`

                    // Only update if the URL is different
                    if (window.location.pathname !== newUrl) {
                        window.history.replaceState(null, '', newUrl)
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

    // Handle initial page load - scroll to section if URL matches
    useEffect(() => {
        const currentPath = window.location.pathname.replace('/', '')

        if (currentPath === id) {
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