// app/page.tsx
"use client"

import { useEffect } from 'react'
import ScrollSection from '@/src/components/shared/ScrollSection'
import HeroSection from '@/src/components/sections/HeroSection'
import AboutSection from '@/src/components/sections/AboutSection'
import ProjectsSection from '@/src/components/sections/ProjectsSection'
import ExperienceSection from '@/src/components/sections/ExperienceSection'
import ContactSection from '@/src/components/sections/ContactSection'

export default function Home() {
    // Handle initial page load - set hash to #home if no hash exists
    useEffect(() => {
        if (!window.location.hash) {
            window.history.replaceState(null, '', '#home')
        }
    }, [])

    // Keyboard navigation with arrow keys
    useEffect(() => {
        const sections = ['home', 'about', 'projects', 'experience', 'contact']

        const handleKeyDown = (e: KeyboardEvent) => {
            // Get current section from hash
            const currentHash = window.location.hash.replace('#', '') || 'home'
            const currentIndex = sections.indexOf(currentHash)

            if (currentIndex === -1) return

            let targetIndex = currentIndex

            // Arrow Down or Arrow Right - next section
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault()
                targetIndex = Math.min(currentIndex + 1, sections.length - 1)
            }
            // Arrow Up or Arrow Left - previous section
            else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault()
                targetIndex = Math.max(currentIndex - 1, 0)
            }

            // Scroll to target section if changed
            if (targetIndex !== currentIndex) {
                const targetSection = document.getElementById(sections[targetIndex])
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' })
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    return (
        <main>
            <ScrollSection id="home">
                <HeroSection />
            </ScrollSection>

            <ScrollSection id="about">
                <AboutSection />
            </ScrollSection>

            <ScrollSection id="projects">
                <ProjectsSection />
            </ScrollSection>

            <ScrollSection id="experience">
                <ExperienceSection />
            </ScrollSection>

            <ScrollSection id="contact">
                <ContactSection />
            </ScrollSection>
        </main>
    )
}