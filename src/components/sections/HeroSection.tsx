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
import { useReducedMotion } from '@/src/hooks/useReducedMotion'
import { useTerminalInput } from '@/src/hooks/useTerminalInput'
import TerminalInput from '@/src/components/shared/TerminalInput'
import {
    getBaseSpeedForSection,
    getPatternForSection,
    audioConfig,
    sequenceTimings,
} from '@/src/constants/typingConfig'
import { owner } from '@/src/content'

const heroPattern = getPatternForSection('hero')
const heroSpeed = getBaseSpeedForSection('hero')

export default function HeroSection() {
    const { isBooted } = useBootContext()
    const prefersReducedMotion = useReducedMotion()
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
            hasCompletedOnceRef.current = true
            console.log('[HeroSection] Animation completed')
        },
        debug: false,
    })

    const command1Typing = useTypingAnimation({ baseSpeed: heroSpeed, humanPattern: heroPattern })
    const command2Typing = useTypingAnimation({ baseSpeed: heroSpeed, humanPattern: heroPattern })
    const command3Typing = useTypingAnimation({ baseSpeed: heroSpeed, humanPattern: heroPattern })

    const nameRef = useRef<HTMLHeadingElement>(null)
    const hasCompletedOnceRef = useRef(false)

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
                if (animation.isRunning && !hasCompletedOnceRef.current) {
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

    const terminalInput = useTerminalInput({
        sectionId: 'hero',
        isActive: animation.isCompleted && isInView,
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

    // Skip all animations when reduced motion is preferred
    useEffect(() => {
        if (prefersReducedMotion && isBooted && !animation.isCompleted) {
            setShowNameOutput(true)
            setShowRoleOutput(true)
            setShowDescriptionOutput(true)
            animation.complete()
            hasCompletedOnceRef.current = true
        }
    }, [prefersReducedMotion, isBooted, animation])

    useEffect(() => {
        if (!isBooted) return
        if (prefersReducedMotion) return
        if (hasCompletedOnceRef.current) return
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
        animation,
        prefersReducedMotion,
    ])

    useEffect(() => {
        if (prefersReducedMotion) return
        if (!nameRef.current || !showNameOutput || !isInView) return
        return startCharacterGlitch(nameRef.current, {
            intensity: 'low',
            singleCharInterval: 10000,
            multiCharInterval: 15000,
            glitchCharDisplayDuration: 3000,
        })
    }, [isInView, showNameOutput, prefersReducedMotion])

    // Unmount-only cleanup. audio.releaseAudioControl() dispatches through a
    // stable sectionId ref; animation.cancel() dispatches through controllerRef.
    // Neither captures mutable render-scope values, so the initial closure is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            animation.cancel()
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
                    {owner.name}
                </h1>
            </div>

            <div className="hero-section-command-line">
                <span className="hero-section-prompt">$ </span>
                <span>{command2}</span>
            </div>

            <div className="hero-section-output-block">
                <h2 className="hero-section-role">
                    {owner.title}
                </h2>
            </div>

            <div className="hero-section-command-line">
                <span className="hero-section-prompt">$ </span>
                <span>{command3}</span>
            </div>

            <div className="hero-section-description-section">
                <p className="hero-section-description-text">
                    Building intelligent systems and scalable applications.<br />
                    Specializing in AI/ML, backend architecture, and modern web technologies.<br />
                    Transforming complex problems into elegant solutions.
                </p>
            </div>

            <TerminalInput
                history={terminalInput.history}
                inputText={terminalInput.inputText}
                isTypingResponse={terminalInput.isTypingResponse}
                responseText={terminalInput.responseText}
            />
        </div>
    )

    const showWaitingCursor = isBooted && !animation.isRunning && !animation.isCompleted && !command1Typing.text

    const renderAnimatingContent = () => (
        <div className="hero-section-content">
            {showWaitingCursor && (
                <div className="hero-section-command-line">
                    <span className="hero-section-prompt">$ </span>
                    <span className="section-cursor-blink hero-section-cursor-blink">|</span>
                </div>
            )}

            {command1Typing.text && (
                <div className="hero-section-command-line hero-section-fade-in">
                    <span className="hero-section-prompt">$ </span>
                    <span>{command1Typing.text}</span>
                    {command1Typing.text.length < command1.length && (
                        <span className="section-cursor-blink hero-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showNameOutput && (
                <div className="hero-section-output-block hero-section-fade-in-smooth">
                    <h1 ref={nameRef} className="hero-section-name">
                        {owner.name}
                    </h1>
                </div>
            )}

            {command2Typing.text && (
                <div className="hero-section-command-line hero-section-fade-in">
                    <span className="hero-section-prompt">$ </span>
                    <span>{command2Typing.text}</span>
                    {command2Typing.text.length < command2.length && (
                        <span className="section-cursor-blink hero-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showRoleOutput && (
                <div className="hero-section-output-block hero-section-fade-in-smooth">
                    <h2 className="hero-section-role">
                        {owner.title}
                    </h2>
                </div>
            )}

            {command3Typing.text && (
                <div className="hero-section-command-line hero-section-fade-in">
                    <span className="hero-section-prompt">$ </span>
                    <span>{command3Typing.text}</span>
                    <span className="section-cursor-blink hero-section-cursor-blink">|</span>
                </div>
            )}

            {showDescriptionOutput && (
                <div className="hero-section-description-section hero-section-fade-in-smooth-delayed">
                    <p className="hero-section-description-text">
                        {owner.description[0]}<br />
                        {owner.description[1]}<br />
                        {owner.description[2]}
                    </p>
                </div>
            )}
        </div>
    )

    return (
        <>
            {/* Screen reader accessible content — always present, visually hidden */}
            <div className="sr-only" aria-live="polite">
                <h1>{owner.name}</h1>
                <h2>{owner.title}</h2>
                <p>
                    {owner.description.join(' ')}
                </p>
            </div>

            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} aria-hidden="true">
                <TerminalContainer title="developer@portfolio:~$" ariaLabel="Hero section terminal — introduction">
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

                .section-cursor-blink hero-section-cursor-blink {
                    margin-left: 4px;
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