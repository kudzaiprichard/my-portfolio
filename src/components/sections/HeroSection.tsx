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
import { useBootContext } from "@/src/components/layout/context/BootContext"
import {
    getBaseSpeedForSection,
    getPatternForSection,
    audioConfig,
    sequenceTimings,
} from '@/src/constants/typingConfig'

const heroPattern = getPatternForSection('hero')
const heroSpeed = getBaseSpeedForSection('hero')

export default function HeroSection() {
    const { isBooted } = useBootContext()
    const [showNameOutput, setShowNameOutput] = useState(false)
    const [showRoleOutput, setShowRoleOutput] = useState(false)
    const [showDescriptionOutput, setShowDescriptionOutput] = useState(false)

    const audio = useKeystrokeAudio({
        sectionId: 'hero',
        enabled: true,
        volume: audioConfig.baseVolume,
        volumeRampEnabled: audioConfig.volumeRampEnabled,
    })

    const { onTypingKeystroke } = useTypingAudioCallback(audio)

    const animation = useAnimationController({
        onComplete: () => {
            console.log('[HeroSection] Animation completed')
        },
        debug: false,
    })

    const command1Typing = useTypingAnimation({ baseSpeed: heroSpeed, humanPattern: heroPattern })
    const command2Typing = useTypingAnimation({ baseSpeed: heroSpeed, humanPattern: heroPattern })
    const command3Typing = useTypingAnimation({ baseSpeed: heroSpeed, humanPattern: heroPattern })

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
        steps.push(AnimationController.createDelayStep(sequenceTimings.initialDelay))
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )
        steps.push(...command1Typing.generateSteps(command1, {
            onKeystroke: onTypingKeystroke
        }))
        steps.push(
            AnimationController.createDelayStep(sequenceTimings.postCommandDelay),
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
            AnimationController.createDelayStep(sequenceTimings.postCommandDelay),
            AnimationController.createActionStep(() => {
                setShowRoleOutput(true)
            })
        )
        steps.push(AnimationController.createDelayStep(sequenceTimings.betweenCommandsDelay))
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
            AnimationController.createDelayStep(sequenceTimings.postCommandDelay),
            AnimationController.createActionStep(() => {
                setShowDescriptionOutput(true)
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
        if (!isBooted) return
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
        isBooted,
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
                    margin: 0;
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
                }

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
                }
            `}</style>
        </>
    )
}