// components/layout/PageIndicators.tsx
"use client"

import { useEffect, useState } from 'react'
import type { SectionId } from '@/types'

interface Section {
    id: SectionId
    label: string
}

const sections: Section[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' },
]

export default function PageIndicators() {
    const [activeSection, setActiveSection] = useState<SectionId>('home')

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY
            const windowHeight = window.innerHeight

            // Find which section is currently in view
            sections.forEach((section) => {
                const element = document.getElementById(section.id)
                if (element) {
                    const rect = element.getBoundingClientRect()
                    // Section is considered active when its top is within the viewport center
                    if (rect.top >= -windowHeight / 2 && rect.top < windowHeight / 2) {
                        setActiveSection(section.id)
                    }
                }
            })
        }

        // Initial check
        handleScroll()

        // Listen to scroll events
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const scrollToSection = (sectionId: SectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <>
            <div className="page-indicators">
                {sections.map((section) => (
                    <div
                        key={section.id}
                        className={`page-dot ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => scrollToSection(section.id)}
                        title={section.label}
                        role="button"
                        aria-label={`Navigate to ${section.label}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                scrollToSection(section.id)
                            }
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
        .page-indicators {
          position: fixed;
          right: 30px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .page-dot {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(0, 255, 65, 0.4);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
        }

        .page-dot.active {
          background: #00ff41;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.6);
          transform: scale(1.2);
        }

        .page-dot:hover {
          border-color: #00ff41;
          transform: scale(1.1);
        }

        .page-dot:focus-visible {
          outline: 2px solid #00ff41;
          outline-offset: 4px;
        }

        @media (max-width: 768px) {
          .page-indicators {
            right: 15px;
            gap: 12px;
          }

          .page-dot {
            width: 10px;
            height: 10px;
          }
        }

        @media (max-width: 480px) {
          .page-indicators {
            right: 10px;
            gap: 10px;
          }

          .page-dot {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
        </>
    )
}