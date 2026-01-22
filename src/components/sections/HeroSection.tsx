// components/sections/HeroSection.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import TerminalContainer from '@/src/components/shared/TerminalContainer'
import { useInView } from '@/src/hooks/useInView'
import { startCharacterGlitch } from '@/src/lib/glitch'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/src/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/src/hooks/useAnimationController'
import { useTypingAnimation } from '@/src/hooks/useTypingAnimation'
import { AnimationController } from '@/src/lib/animationController'

export default function HeroSection() {
    const [showNameOutput, setShowNameOutput] = useState(false)
    const [showRoleOutput, setShowRoleOutput] = useState(false)
    const [showDescriptionOutput, setShowDescriptionOutput] = useState(false)
    const [showButtons, setShowButtons] = useState(false)

    const audio = useKeystrokeAudio({
        sectionId: 'hero',
        enabled: true,
        volume: 0.4,
        volumeRampEnabled: true,
    })

    const { onTypingKeystroke } = useTypingAudioCallback(audio)

    const animation = useAnimationController({
        onComplete: () => {
            console.log('[HeroSection] Animation completed')
        },
        debug: false,
    })

    const command1Typing = useTypingAnimation({ baseSpeed: 80 })
    const command2Typing = useTypingAnimation({ baseSpeed: 50 })
    const command3Typing = useTypingAnimation({ baseSpeed: 60 })

    const nameRef = useRef<HTMLHeadingElement>(null)

    const command1 = 'whoami'
    const command2 = 'cat role.txt'
    const command3 = 'cat description.txt'

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

    const onInViewChangeRef = useRef<((inView: boolean) => void) | undefined>(undefined)

    useEffect(() => {
        onInViewChangeRef.current = (inView: boolean) => {
            if (inView) {
                audio.requestAudioControl()
            } else {
                audio.releaseAudioControl()
                if (animation.isRunning) {
                    resetAnimationState()
                }
            }
        }
    }, [audio, animation.isRunning, resetAnimationState])

    const { ref, isInView } = useInView({
        threshold: 0.3,
        triggerOnce: false,
        onInViewChange: (inView: boolean) => {
            onInViewChangeRef.current?.(inView)
        }
    })

    const buildAnimationSequence = useCallback(() => {
        const steps = []
        steps.push(AnimationController.createDelayStep(100))
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )
        steps.push(...command1Typing.generateSteps(command1, {
            onKeystroke: onTypingKeystroke
        }))
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowNameOutput(true)
            })
        )
        steps.push(AnimationController.createDelayStep(800))
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )
        steps.push(...command2Typing.generateSteps(command2, {
            onKeystroke: onTypingKeystroke
        }))
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowRoleOutput(true)
            })
        )
        steps.push(AnimationController.createDelayStep(900))
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )
        steps.push(AnimationController.createDelayStep(400))
        steps.push(...command3Typing.generateSteps(command3, {
            onKeystroke: onTypingKeystroke
        }))
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowDescriptionOutput(true)
            })
        )
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

    useEffect(() => {
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) {
            return
        }
        if (animation.isCompleted) {
            return
        }
        if (animation.isRunning) {
            return
        }
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

    useEffect(() => {
        if (!nameRef.current || !showNameOutput || !isInView) return
        return startCharacterGlitch(nameRef.current, {
            intensity: 'low',
            singleCharInterval: 10000,
            multiCharInterval: 15000,
            glitchCharDisplayDuration: 3000,
        })
    }, [isInView, showNameOutput])

    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            if (animation && typeof animation.cancel === 'function') {
                animation.cancel()
            }
        }
    }, [])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const renderStaticContent = () => (
        <div className="hero-section-content">
            <div className="hero-section-command-line">
                <span className="hero-section-prompt">$ </span>
                <span>{command1}</span>
            </div>

            <div className="hero-section-output-block">
                <h1 ref={nameRef} className="hero-section-name">
                    kudzai prichard
                </h1>
            </div>

            <div className="hero-section-command-line">
                <span className="hero-section-prompt">$ </span>
                <span>{command2}</span>
            </div>

            <div className="hero-section-output-block">
                <h2 className="hero-section-role">
                    AI & Full Stack Developer
                </h2>
            </div>

            <div className="hero-section-command-line">
                <span className="hero-section-prompt">$ </span>
                <span>{command3}</span>
                <span className="hero-section-cursor-blink">|</span>
            </div>

            <div className="hero-section-description-section">
                <p className="hero-section-description-text">
                    Building intelligent systems and scalable applications.<br />
                    Specializing in AI/ML, backend architecture, and modern web technologies.<br />
                    Transforming complex problems into elegant solutions.
                </p>

                <div className="hero-section-buttons">
                    <button
                        onClick={() => scrollToSection('projects')}
                        className="hero-section-button hero-section-button-primary"
                    >
                        ./view_projects.sh
                    </button>
                    <button
                        onClick={() => scrollToSection('contact')}
                        className="hero-section-button"
                    >
                        ./contact_me.sh
                    </button>
                </div>
            </div>
        </div>
    )

    const renderAnimatingContent = () => (
        <div className="hero-section-content">
            {command1Typing.text && (
                <div className="hero-section-command-line hero-section-fade-in">
                    <span className="hero-section-prompt">$ </span>
                    <span>{command1Typing.text}</span>
                    {command1Typing.text.length < command1.length && (
                        <span className="hero-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showNameOutput && (
                <div className="hero-section-output-block hero-section-fade-in-smooth">
                    <h1 ref={nameRef} className="hero-section-name">
                        kudzai prichard
                    </h1>
                </div>
            )}

            {command2Typing.text && (
                <div className="hero-section-command-line hero-section-fade-in">
                    <span className="hero-section-prompt">$ </span>
                    <span>{command2Typing.text}</span>
                    {command2Typing.text.length < command2.length && (
                        <span className="hero-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showRoleOutput && (
                <div className="hero-section-output-block hero-section-fade-in-smooth">
                    <h2 className="hero-section-role">
                        AI & Full Stack Developer
                    </h2>
                </div>
            )}

            {command3Typing.text && (
                <div className="hero-section-command-line hero-section-fade-in">
                    <span className="hero-section-prompt">$ </span>
                    <span>{command3Typing.text}</span>
                    <span className="hero-section-cursor-blink">|</span>
                </div>
            )}

            {showDescriptionOutput && (
                <div className="hero-section-description-section hero-section-fade-in-smooth-delayed">
                    <p className="hero-section-description-text">
                        Building intelligent systems and scalable applications.<br />
                        Specializing in AI/ML, backend architecture, and modern web technologies.<br />
                        Transforming complex problems into elegant solutions.
                    </p>

                    <div className="hero-section-buttons" style={{ opacity: showButtons ? 1 : 0 }}>
                        <button
                            onClick={() => scrollToSection('projects')}
                            className="hero-section-button hero-section-button-primary"
                        >
                            ./view_projects.sh
                        </button>
                        <button
                            onClick={() => scrollToSection('contact')}
                            className="hero-section-button"
                        >
                            ./contact_me.sh
                        </button>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <>
            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <TerminalContainer title="developer@portfolio:~$">
                    {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}
                </TerminalContainer>
            </div>

            <style>{`
                .hero-section-content {
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                }

                .hero-section-command-line {
                    font-size: var(--font-size-md);
                    margin-bottom: var(--spacing-xs);
                    line-height: var(--line-height-normal);
                }

                .hero-section-prompt {
                    color: var(--color-primary-dim);
                }

                .hero-section-cursor-blink {
                    display: inline-block;
                    margin-left: 4px;
                    animation: hero-section-blink 0.7s infinite;
                }

                .hero-section-output-block {
                    margin-bottom: var(--spacing-lg);
                }

                .hero-section-name {
                    font-size: var(--font-size-2xl);
                    font-weight: normal;
                    color: var(--color-primary);
                    display: inline;
                    margin: 0;
                    line-height: var(--line-height-tight);
                }

                .hero-section-role {
                    font-size: var(--font-size-lg);
                    font-weight: normal;
                    color: var(--color-primary);
                    margin: 0;
                    display: inline;
                    line-height: var(--line-height-tight);
                }

                .hero-section-description-section {
                    margin-top: var(--spacing-md);
                    padding-top: var(--spacing-md);
                    border-top: 1px solid var(--color-primary-dimmest);
                }

                .hero-section-description-text {
                    font-size: var(--font-size-md);
                    color: var(--color-primary);
                    line-height: var(--line-height-relaxed);
                    margin-bottom: var(--spacing-lg);
                }

                .hero-section-buttons {
                    display: flex;
                    gap: var(--spacing-md);
                    margin-top: var(--spacing-md);
                    flex-wrap: wrap;
                    transition: opacity 1s ease;
                    transition-delay: 0.3s;
                }

                .hero-section-button {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    background: transparent;
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary);
                    font-size: var(--font-size-sm);
                    font-weight: normal;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    font-family: var(--font-mono);
                    min-height: var(--min-touch-target);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap;
                }

                .hero-section-button-primary {
                    background: rgba(0, 255, 65, 0.05);
                }

                .hero-section-button:hover,
                .hero-section-button:focus {
                    background: rgba(0, 255, 65, 0.1);
                    box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
                    transform: translateY(-2px);
                }

                .hero-section-button:active {
                    transform: translateY(0);
                }

                .hero-section-fade-in {
                    animation: hero-section-fadeIn 0.6s ease forwards;
                }

                .hero-section-fade-in-smooth {
                    opacity: 0;
                    animation: hero-section-fadeInSuperSmooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                .hero-section-fade-in-smooth-delayed {
                    opacity: 0;
                    animation: hero-section-fadeInSuperSmooth 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                @keyframes hero-section-fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes hero-section-fadeInSuperSmooth {
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

                @keyframes hero-section-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                /* Tablet & Desktop adjustments */
                @media (min-width: 768px) {
                    .hero-section-name {
                        font-size: var(--font-size-3xl);
                    }

                    .hero-section-role {
                        font-size: var(--font-size-xl);
                    }

                    .hero-section-description-text {
                        font-size: var(--font-size-lg);
                    }

                    .hero-section-button {
                        font-size: var(--font-size-base);
                    }
                }

                /* Small mobile adjustments */
                @media (max-width: 480px) {
                    .hero-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .hero-section-name {
                        font-size: var(--font-size-xl);
                    }

                    .hero-section-role {
                        font-size: var(--font-size-md);
                    }

                    .hero-section-description-text {
                        font-size: var(--font-size-sm);
                        line-height: var(--line-height-normal);
                    }

                    .hero-section-buttons {
                        flex-direction: column;
                        gap: var(--spacing-sm);
                    }

                    .hero-section-button {
                        width: 100%;
                        font-size: var(--font-size-xs);
                    }
                }
            `}</style>
        </>
    )
}