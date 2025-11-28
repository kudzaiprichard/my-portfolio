// components/sections/HeroSection.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import { useInView } from '@/hooks/useInView'
import { startCharacterGlitch } from '@/lib/glitch'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/hooks/useAnimationController'
import { useTypingAnimation } from '@/hooks/useTypingAnimation'
import { AnimationController } from '@/lib/animationController'

export default function HeroSection() {
    // State for tracking visibility
    const [showNameOutput, setShowNameOutput] = useState(false)
    const [showRoleOutput, setShowRoleOutput] = useState(false)
    const [showDescriptionOutput, setShowDescriptionOutput] = useState(false)
    const [showButtons, setShowButtons] = useState(false)

    // Audio setup
    const audio = useKeystrokeAudio({
        sectionId: 'hero',
        enabled: true,
        volume: 0.4,
        volumeRampEnabled: true,
    })

    const { onTypingKeystroke } = useTypingAudioCallback(audio)

    // Animation controller
    const animation = useAnimationController({
        onComplete: () => {
            console.log('[HeroSection] Animation completed')
        },
        debug: false,
    })

    // Typing animations for each command
    const command1Typing = useTypingAnimation({ baseSpeed: 80 })
    const command2Typing = useTypingAnimation({ baseSpeed: 50 })
    const command3Typing = useTypingAnimation({ baseSpeed: 60 })

    // Refs for glitch effects
    const nameRef = useRef<HTMLHeadingElement>(null)

    // Command strings
    const command1 = 'whoami'
    const command2 = 'cat role.txt'
    const command3 = 'cat description.txt'

    // Reset animation state
    const resetAnimationState = useCallback(() => {
        command1Typing.reset()
        command2Typing.reset()
        command3Typing.reset()
        setShowNameOutput(false)
        setShowRoleOutput(false)
        setShowDescriptionOutput(false)
        setShowButtons(false)
        animation.reset()
    }, [animation, command1Typing, command2Typing, command3Typing])

    // Stable callback for inView changes using useRef
    const onInViewChangeRef = useRef<((inView: boolean) => void) | undefined>(undefined)

    useEffect(() => {
        onInViewChangeRef.current = (inView: boolean) => {
            if (inView) {
                audio.requestAudioControl()
            } else {
                audio.releaseAudioControl()

                // Only reset if animation was interrupted
                if (animation.isRunning) {
                    resetAnimationState()
                }
            }
        }
    }, [audio, animation.isRunning, resetAnimationState])

    // View detection with stable callback
    const { ref, isInView } = useInView({
        threshold: 0.3,
        triggerOnce: false,
        onInViewChange: (inView: boolean) => {
            onInViewChangeRef.current?.(inView)
        }
    })

    // Build complete animation sequence
    const buildAnimationSequence = useCallback(() => {
        const steps = []

        // Initial delay
        steps.push(AnimationController.createDelayStep(100))

        // Reset volume ramp
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )

        // Command 1: whoami
        steps.push(...command1Typing.generateSteps(command1, {
            onKeystroke: onTypingKeystroke
        }))

        // Show name output
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowNameOutput(true)
            })
        )

        // Delay before command 2
        steps.push(AnimationController.createDelayStep(800))

        // Reset volume ramp
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )

        // Command 2: cat role.txt
        steps.push(...command2Typing.generateSteps(command2, {
            onKeystroke: onTypingKeystroke
        }))

        // Show role output
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowRoleOutput(true)
            })
        )

        // Delay before command 3
        steps.push(AnimationController.createDelayStep(900))

        // Reset volume ramp
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )

        // Delay before starting command 3
        steps.push(AnimationController.createDelayStep(400))

        // Command 3: cat description.txt
        steps.push(...command3Typing.generateSteps(command3, {
            onKeystroke: onTypingKeystroke
        }))

        // Show description output
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowDescriptionOutput(true)
            })
        )

        // Show buttons
        steps.push(
            AnimationController.createDelayStep(400),
            AnimationController.createActionStep(() => {
                setShowButtons(true)
            })
        )

        return steps
    }, [
        command1, command2, command3,
        command1Typing, command2Typing, command3Typing,
        onTypingKeystroke,
        audio
    ])

    // Start animation when conditions are met
    useEffect(() => {
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) {
            return
        }

        // Don't restart if already completed
        if (animation.isCompleted) {
            return
        }

        // Don't start if already running
        if (animation.isRunning) {
            return
        }

        // Build and start animation
        const steps = buildAnimationSequence()
        animation.start(steps)
    }, [
        isInView,
        audio.isAudioReady,
        audio.hasAudioControl,
        animation.isCompleted,
        animation.isRunning,
        buildAnimationSequence,
        animation
    ])

    // Apply glitch effect to name when visible
    useEffect(() => {
        if (!nameRef.current || !showNameOutput || !isInView) return

        return startCharacterGlitch(nameRef.current, {
            intensity: 'low',
            singleCharInterval: 10000,
            multiCharInterval: 15000,
            glitchCharDisplayDuration: 3000,
        })
    }, [isInView, showNameOutput])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            // Add a check to ensure animation exists before canceling
            if (animation && typeof animation.cancel === 'function') {
                animation.cancel()
            }
        }
    }, []) // Empty deps - only run on unmount

    // Scroll helper
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    // Render static completed state
    const renderStaticContent = () => (
        <div>
            <div className="command-line" style={{ marginBottom: '8px' }}>
                <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                <span>{command1}</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
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

            <div className="command-line" style={{ marginBottom: '8px' }}>
                <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                <span>{command2}</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'normal',
                    color: '#00ff41',
                    margin: 0,
                    display: 'inline'
                }}>
                    AI & Full Stack Developer
                </h2>
            </div>

            <div className="command-line" style={{ marginBottom: '8px' }}>
                <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                <span>{command3}</span>
                <span style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                    animation: 'blink 0.7s infinite'
                }}>|</span>
            </div>

            <div style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid rgba(0, 255, 65, 0.2)',
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

                <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginTop: '20px',
                    flexWrap: 'wrap'
                }}>
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
        </div>
    )

    // Render animating state
    const renderAnimatingContent = () => (
        <div>
            {command1Typing.text && (
                <div className="command-line fade-in" style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                    <span>{command1Typing.text}</span>
                    {command1Typing.text.length < command1.length && (
                        <span style={{
                            display: 'inline-block',
                            marginLeft: '2px',
                            animation: 'blink 0.7s infinite'
                        }}>|</span>
                    )}
                </div>
            )}

            {showNameOutput && (
                <div style={{
                    marginBottom: '20px',
                    animation: 'fadeInSuperSmooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
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

            {command2Typing.text && (
                <div className="command-line fade-in" style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                    <span>{command2Typing.text}</span>
                    {command2Typing.text.length < command2.length && (
                        <span style={{
                            display: 'inline-block',
                            marginLeft: '2px',
                            animation: 'blink 0.7s infinite'
                        }}>|</span>
                    )}
                </div>
            )}

            {showRoleOutput && (
                <div style={{
                    marginBottom: '20px',
                    animation: 'fadeInSuperSmooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    opacity: 0
                }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 'normal',
                        color: '#00ff41',
                        margin: 0,
                        display: 'inline'
                    }}>
                        AI & Full Stack Developer
                    </h2>
                </div>
            )}

            {command3Typing.text && (
                <div className="command-line fade-in" style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                    <span>{command3Typing.text}</span>
                    <span style={{
                        display: 'inline-block',
                        marginLeft: command3Typing.text.length === command3.length ? '4px' : '2px',
                        animation: 'blink 0.7s infinite'
                    }}>|</span>
                </div>
            )}

            {showDescriptionOutput && (
                <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(0, 255, 65, 0.2)',
                    animation: 'fadeInSuperSmooth 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards',
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

                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        marginTop: '20px',
                        flexWrap: 'wrap',
                        opacity: showButtons ? 1 : 0,
                        transition: 'opacity 1s ease',
                        transitionDelay: '0.3s'
                    }}>
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
    )

    return (
        <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TerminalContainer title="developer@portfolio:~$">
                {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}

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

                    @keyframes fadeInSuperSmooth {
                        0% {
                            opacity: 0;
                            transform: translateY(8px);
                        }
                        50% {
                            opacity: 0.5;
                            transform: translateY(4px);
                        }
                        100% {
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