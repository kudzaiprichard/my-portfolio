// components/sections/HeroSection.tsx
"use client"

import { useState, useEffect } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import { useTypingEffect } from '@/hooks/useTypingEffect'
import { delay } from '@/lib/utils'

export default function HeroSection() {
    const [showName, setShowName] = useState(false)
    const [showRole, setShowRole] = useState(false)
    const [showDescription, setShowDescription] = useState(false)
    const [showButtons, setShowButtons] = useState(false)

    // Typing effect for the role
    const roleTyping = useTypingEffect({
        text: 'AI & Full Stack Developer',
        speed: 80,
        delay: 0,
        enabled: showRole,
        onComplete: async () => {
            await delay(300)
            setShowDescription(true)
            await delay(200)
            setShowButtons(true)
        },
    })

    // Animation sequence
    useEffect(() => {
        const runAnimation = async () => {
            await delay(100) // Initial delay
            setShowName(true)
            await delay(1400) // Wait for name to appear
            setShowRole(true)
        }

        runAnimation()
    }, [])

    const handleProjectsClick = () => {
        const projectsSection = document.getElementById('projects')
        if (projectsSection) {
            projectsSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const handleContactClick = () => {
        const contactSection = document.getElementById('contact')
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <TerminalContainer title="developer@portfolio:~$">
            {/* Command 1: whoami */}
            <div
                className={`command-line ${showName ? 'fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: '0.1s' }}
            >
                <span className="prompt">$</span> whoami
            </div>

            {/* Output 1: Name with cursor */}
            <div
                className={`command-line ${showName ? 'fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: '0.3s' }}
            >
                <div className="name-wrapper">
                    <span className="name">kudzai prichard</span>
                    <span className="name-cursor" />
                </div>
            </div>

            {/* Command 2: cat role.txt */}
            <div
                className={`command-line ${showRole ? 'fade-in-up' : 'opacity-0'}`}
                style={{
                    marginTop: '20px',
                    animationDelay: '0s',
                }}
            >
                <span className="prompt">$</span> cat role.txt
            </div>

            {/* Output 2: Role with typing effect */}
            {showRole && (
                <div className="command-line" style={{ marginBottom: '8px' }}>
                    <div className="title-wrapper">
            <span className="typing-text-custom">
              {roleTyping.displayedText}
                {roleTyping.isTyping && <span className="typing-cursor-inline">|</span>}
            </span>
                    </div>
                </div>
            )}

            {/* Command 3: cat description.txt */}
            <div
                className={`command-line ${showDescription ? 'fade-in-up' : 'opacity-0'}`}
                style={{
                    marginTop: '20px',
                    animationDelay: '0s',
                }}
            >
                <span className="prompt">$</span> cat description.txt
            </div>

            {/* Output 3: Description */}
            {showDescription && (
                <div className="output-section">
                    <p className="description fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Building intelligent systems and scalable applications.<br />
                        Specializing in AI/ML, backend architecture, and modern web technologies.<br />
                        Transforming complex problems into elegant solutions.
                    </p>

                    {/* CTA Buttons */}
                    {showButtons && (
                        <div className="cta-buttons fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <button
                                onClick={handleProjectsClick}
                                className="cta-btn primary"
                            >
                                ./view_projects.sh
                            </button>
                            <button
                                onClick={handleContactClick}
                                className="cta-btn"
                            >
                                ./contact_me.sh
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        .name-wrapper {
          display: inline-block;
        }

        .name {
          font-size: 48px;
          font-weight: normal;
          color: #00ff41;
          margin-bottom: 5px;
          display: inline;
        }

        .name-cursor {
          display: inline-block;
          width: 12px;
          height: 48px;
          background: #00ff41;
          margin-left: 4px;
          animation: blink 1s infinite;
          vertical-align: bottom;
        }

        .title-wrapper {
          font-size: 20px;
          color: rgba(0, 255, 65, 0.9);
          margin-bottom: 8px;
        }

        .typing-text-custom {
          display: inline-block;
          color: #00ff41;
        }

        .typing-cursor-inline {
          display: inline-block;
          margin-left: 2px;
          animation: blink 0.7s infinite;
        }

        .description {
          font-size: 16px;
          color: #00ff41;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .name {
            font-size: 32px;
          }

          .name-cursor {
            height: 32px;
          }

          .title-wrapper {
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .name {
            font-size: 28px;
          }

          .name-cursor {
            height: 28px;
          }

          .title-wrapper {
            font-size: 16px;
          }

          .description {
            font-size: 14px;
          }
        }
      `}</style>
        </TerminalContainer>
    )
}