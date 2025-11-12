// components/sections/HeroSection.tsx
"use client"

import {useEffect, useRef, useState} from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import {useInView} from '@/hooks/useInView'
import {startCharacterGlitch} from '@/lib/glitch'

export default function HeroSection() {
    // Detect when section is in view
    const { ref, isInView } = useInView({
        threshold: 0.3,
        triggerOnce: true
    })

    // Animation stages
    const [stage, setStage] = useState(0)
    const [command1Text, setCommand1Text] = useState('')
    const [command2Text, setCommand2Text] = useState('')
    const [command3Text, setCommand3Text] = useState('')
    const [roleText, setRoleText] = useState('')
    const [showNameOutput, setShowNameOutput] = useState(false)
    const [showRoleOutput, setShowRoleOutput] = useState(false)
    const [showDescriptionOutput, setShowDescriptionOutput] = useState(false)
    const [buttonsVisible, setButtonsVisible] = useState(false)

    const mountedRef = useRef(false)
    const timerRefs = useRef<NodeJS.Timeout[]>([])
    const animationStartedRef = useRef(false)

    // Refs for glitch effects
    const nameRef = useRef<HTMLHeadingElement>(null)

    const command1 = 'whoami'
    const command2 = 'cat role.txt'
    const command3 = 'cat description.txt'


    // Apply CHARACTER GLITCH to name when it's visible
    // Now with 2-phase glitch cycle
    useEffect(() => {
        if (!nameRef.current || !showNameOutput || !isInView) return

        return startCharacterGlitch(nameRef.current, {
            intensity: 'low',
            singleCharInterval: 10000,           // Wait 10 seconds between single char glitches
            multiCharInterval: 15000,            // Wait 15 seconds between multi char glitches
            glitchCharDisplayDuration: 3000,     // Glitch char stays visible for 3 seconds
        })
    }, [showNameOutput, isInView])

    // Clear all timers on unmount
    useEffect(() => {
        mountedRef.current = true

        return () => {
            mountedRef.current = false
            timerRefs.current.forEach(timer => clearTimeout(timer))
            timerRefs.current = []
        }
    }, [])

    // Main animation sequence - only starts when in view
    useEffect(() => {
        // Only start animation once when in view
        if (!isInView || !mountedRef.current || animationStartedRef.current) return

        animationStartedRef.current = true

        const addTimer = (callback: () => void, delay: number) => {
            const timer = setTimeout(callback, delay)
            timerRefs.current.push(timer)
            return timer
        }

        // Start typing first command
        addTimer(() => {
            if (mountedRef.current) setStage(1)
        }, 100)

    }, [isInView])

    // Type command 1: whoami
    useEffect(() => {
        if (stage !== 1) return

        let currentIndex = 0
        const typeChar = () => {
            if (currentIndex <= command1.length && mountedRef.current) {
                setCommand1Text(command1.slice(0, currentIndex))
                currentIndex++

                if (currentIndex <= command1.length) {
                    const timer = setTimeout(typeChar, 80)
                    timerRefs.current.push(timer)
                } else {
                    // Command typed, show output
                    const timer = setTimeout(() => {
                        if (mountedRef.current) {
                            setShowNameOutput(true)
                            // Start command 2
                            setTimeout(() => {
                                if (mountedRef.current) setStage(2)
                            }, 800)
                        }
                    }, 200)
                    timerRefs.current.push(timer)
                }
            }
        }

        typeChar()
    }, [stage])

    // Type command 2: cat role.txt
    useEffect(() => {
        if (stage !== 2) return

        let currentIndex = 0
        const typeChar = () => {
            if (currentIndex <= command2.length && mountedRef.current) {
                setCommand2Text(command2.slice(0, currentIndex))
                currentIndex++

                if (currentIndex <= command2.length) {
                    const timer = setTimeout(typeChar, 60)
                    timerRefs.current.push(timer)
                } else {
                    // Command typed, start typing role output
                    const timer = setTimeout(() => {
                        if (mountedRef.current) {
                            setShowRoleOutput(true)
                            setStage(3)
                        }
                    }, 200)
                    timerRefs.current.push(timer)
                }
            }
        }

        typeChar()
    }, [stage])

    // Type role text
    useEffect(() => {
        if (stage !== 3) return

        // Just show the role immediately, no typing
        setRoleText('AI & Full Stack Developer')

        // Start command 3 after a delay
        const timer = setTimeout(() => {
            if (mountedRef.current) setStage(4)
        }, 800)
        timerRefs.current.push(timer)
    }, [stage])

    // Type command 3: cat description.txt
    useEffect(() => {
        if (stage !== 4) return

        let currentIndex = 0
        const typeChar = () => {
            if (currentIndex <= command3.length && mountedRef.current) {
                setCommand3Text(command3.slice(0, currentIndex))
                currentIndex++

                if (currentIndex <= command3.length) {
                    const timer = setTimeout(typeChar, 60)
                    timerRefs.current.push(timer)
                } else {
                    // Command typed, show description
                    const timer = setTimeout(() => {
                        if (mountedRef.current) {
                            setShowDescriptionOutput(true)
                            // Show buttons
                            setTimeout(() => {
                                if (mountedRef.current) setButtonsVisible(true)
                            }, 300)
                        }
                    }, 200)
                    timerRefs.current.push(timer)
                }
            }
        }

        typeChar()
    }, [stage])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TerminalContainer title="developer@portfolio:~$">
                <div>
                    {/* Command 1: whoami (typed) */}
                    {stage >= 1 && (
                        <div className="command-line fade-in" style={{ marginBottom: '8px' }}>
                            <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                            <span>{command1Text}</span>
                            {stage === 1 && command1Text.length < command1.length && (
                                <span style={{
                                    display: 'inline-block',
                                    marginLeft: '2px',
                                    animation: 'blink 0.7s infinite'
                                }}>|</span>
                            )}
                        </div>
                    )}

                    {/* Output 1: Name - WITH 2-PHASE CHARACTER GLITCH */}
                    {showNameOutput && (
                        <div style={{
                            marginBottom: '20px',
                            animation: 'fadeIn 0.8s ease forwards',
                            opacity: 0
                        }}>
                            <h1
                                ref={nameRef}
                                style={{
                                    fontSize: '48px',
                                    fontWeight: 'normal',
                                    color: '#00ff41',
                                    display: 'inline',
                                    margin: 0
                                }}
                            >
                                kudzai prichard
                            </h1>
                        </div>
                    )}

                    {/* Command 2: cat role.txt (typed) */}
                    {stage >= 2 && (
                        <div className="command-line fade-in" style={{ marginBottom: '8px' }}>
                            <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                            <span>{command2Text}</span>
                            {stage === 2 && command2Text.length < command2.length && (
                                <span style={{
                                    display: 'inline-block',
                                    marginLeft: '2px',
                                    animation: 'blink 0.7s infinite'
                                }}>|</span>
                            )}
                        </div>
                    )}

                    {/* Output 2: Role (not typed, just displayed) */}
                    {showRoleOutput && (
                        <div style={{
                            marginBottom: '20px',
                            animation: 'fadeIn 0.8s ease forwards',
                            opacity: 0
                        }}>
                            <h2 style={{
                                fontSize: '20px',
                                fontWeight: 'normal',
                                color: '#00ff41',
                                margin: 0,
                                display: 'inline'
                            }}>
                                {roleText}
                            </h2>
                        </div>
                    )}

                    {/* Command 3: cat description.txt (typed) with permanent cursor at end */}
                    {stage >= 4 && (
                        <div className="command-line fade-in" style={{ marginBottom: '8px' }}>
                            <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                            <span>{command3Text}</span>
                            {/* Always show cursor after command is fully typed */}
                            {command3Text.length === command3.length && (
                                <span style={{
                                    display: 'inline-block',
                                    marginLeft: '4px',
                                    animation: 'blink 0.7s infinite'
                                }}>|</span>
                            )}
                            {/* Show cursor while typing */}
                            {stage === 4 && command3Text.length < command3.length && (
                                <span style={{
                                    display: 'inline-block',
                                    marginLeft: '2px',
                                    animation: 'blink 0.7s infinite'
                                }}>|</span>
                            )}
                        </div>
                    )}

                    {/* Output 3: Description */}
                    {showDescriptionOutput && (
                        <div style={{
                            marginTop: '15px',
                            paddingTop: '15px',
                            borderTop: '1px solid rgba(0, 255, 65, 0.2)',
                            animation: 'fadeIn 1s ease forwards',
                            opacity: 0
                        }}>
                            <p style={{
                                fontSize: '16px',
                                color: '#00ff41',
                                lineHeight: '1.6',
                                marginBottom: '30px'
                            }}>
                                Building intelligent systems and scalable applications.<br />
                                Specializing in AI/ML, backend architecture, and modern web technologies.<br />
                                Transforming complex problems into elegant solutions.
                            </p>

                            {/* Buttons */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '20px',
                                    marginTop: '20px',
                                    flexWrap: 'wrap',
                                    opacity: buttonsVisible ? 1 : 0,
                                    transition: 'opacity 1s ease',
                                    transitionDelay: '0.3s'
                                }}
                            >
                                <button
                                    onClick={() => scrollToSection('projects')}
                                    className="hero-button"
                                    style={{
                                        padding: '12px 28px',
                                        background: 'rgba(0, 255, 65, 0.05)',
                                        border: '1px solid #00ff41',
                                        color: '#00ff41',
                                        fontSize: '14px',
                                        fontWeight: 'normal',
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: "'Courier New', monospace"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.3)'
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 255, 65, 0.05)'
                                        e.currentTarget.style.boxShadow = 'none'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                    }}
                                >
                                    ./view_projects.sh
                                </button>
                                <button
                                    onClick={() => scrollToSection('contact')}
                                    className="hero-button"
                                    style={{
                                        padding: '12px 28px',
                                        background: 'transparent',
                                        border: '1px solid #00ff41',
                                        color: '#00ff41',
                                        fontSize: '14px',
                                        fontWeight: 'normal',
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: "'Courier New', monospace"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.3)'
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.boxShadow = 'none'
                                        e.currentTarget.style.transform = 'translateY(0)'
                                    }}
                                >
                                    ./contact_me.sh
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .command-line {
                        color: #00ff41;
                        font-size: 16px;
                        font-family: 'Courier New', monospace;
                    }

                    .fade-in {
                        animation: fadeIn 0.6s ease forwards;
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }

                    @media (max-width: 768px) {
                        h1 {
                            font-size: 32px !important;
                        }
                        h2 {
                            font-size: 18px !important;
                        }
                        .command-line, p {
                            font-size: 14px !important;
                        }
                    }

                    @media (max-width: 480px) {
                        h1 {
                            font-size: 28px !important;
                        }
                        h2 {
                            font-size: 16px !important;
                        }
                    }
                `}</style>
            </TerminalContainer>
        </div>
    )
}