// components/sections/AboutSection.tsx
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
import { skillCategories, specializations } from '@/src/content'

const aboutPattern = getPatternForSection('about')
const aboutSpeed = getBaseSpeedForSection('about')

export default function AboutSection() {
    const { isBooted } = useBootContext()
    const prefersReducedMotion = useReducedMotion()
    const [showOutput1, setShowOutput1] = useState(false)
    const [showOutput2, setShowOutput2] = useState(false)
    const [showOutput3, setShowOutput3] = useState(false)

    const audio = useKeystrokeAudio({
        sectionId: 'about',
        enabled: true,
        volume: audioConfig.baseVolume,
        volumeRampEnabled: audioConfig.volumeRampEnabled,
    })

    const hasCompletedOnceRef = useRef(false)
    const { onTypingKeystroke } = useTypingAudioCallback(audio)
    const animation = useAnimationController({
        onComplete: () => {
            hasCompletedOnceRef.current = true
            console.log('[AboutSection] Animation completed')
        },
        debug: false,
    })

    const command1Typing = useTypingAnimation({ baseSpeed: aboutSpeed, humanPattern: aboutPattern })
    const command2Typing = useTypingAnimation({ baseSpeed: aboutSpeed, humanPattern: aboutPattern })
    const command3Typing = useTypingAnimation({ baseSpeed: aboutSpeed, humanPattern: aboutPattern })

    const word1Ref = useRef<HTMLSpanElement>(null)
    const word2Ref = useRef<HTMLSpanElement>(null)
    const word3Ref = useRef<HTMLSpanElement>(null)
    const word4Ref = useRef<HTMLSpanElement>(null)

    const command1 = 'cat about.txt'
    const command2 = 'ls -la ./tech_stack/'
    const command3 = './list_specializations.sh'

    const resetAnimationState = useCallback(() => {
        command1Typing.reset()
        command2Typing.reset()
        command3Typing.reset()
        setShowOutput1(false)
        setShowOutput2(false)
        setShowOutput3(false)
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
        sectionId: 'about',
        isActive: animation.isCompleted && isInView,
    })

    const buildAnimationSequence = useCallback(() => {
        const steps = []
        steps.push(AnimationController.createDelayStep(sequenceTimings.initialDelay))
        steps.push(AnimationController.createActionStep(() => audio.resetVolumeRamp()))
        steps.push(...command1Typing.generateSteps(command1, { onKeystroke: onTypingKeystroke }))
        steps.push(
            AnimationController.createDelayStep(sequenceTimings.postCommandDelay),
            AnimationController.createActionStep(() => setShowOutput1(true))
        )
        steps.push(AnimationController.createDelayStep(sequenceTimings.betweenCommandsDelay))
        steps.push(AnimationController.createActionStep(() => audio.resetVolumeRamp()))
        steps.push(...command2Typing.generateSteps(command2, { onKeystroke: onTypingKeystroke }))
        steps.push(
            AnimationController.createDelayStep(sequenceTimings.postCommandDelay),
            AnimationController.createActionStep(() => setShowOutput2(true))
        )
        steps.push(AnimationController.createDelayStep(sequenceTimings.betweenCommandsDelay))
        steps.push(AnimationController.createActionStep(() => audio.resetVolumeRamp()))
        steps.push(...command3Typing.generateSteps(command3, { onKeystroke: onTypingKeystroke }))
        steps.push(
            AnimationController.createDelayStep(sequenceTimings.postCommandDelay),
            AnimationController.createActionStep(() => setShowOutput3(true))
        )
        return steps
    }, [command1, command2, command3, command1Typing, command2Typing, command3Typing, onTypingKeystroke, audio])

    // Skip all animations when reduced motion is preferred
    useEffect(() => {
        if (prefersReducedMotion && isBooted && !animation.isCompleted) {
            setShowOutput1(true)
            setShowOutput2(true)
            setShowOutput3(true)
            animation.complete()
            hasCompletedOnceRef.current = true
        }
    }, [prefersReducedMotion, isBooted, animation])

    useEffect(() => {
        if (!isBooted) return
        if (prefersReducedMotion) return
        if (hasCompletedOnceRef.current) return
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) return
        if (animation.isCompleted || animation.isRunning) return
        const steps = buildAnimationSequence()
        animation.start(steps)
    }, [isBooted, isInView, audio.isAudioReady, audio.hasAudioControl, animation.isCompleted, animation.isRunning, buildAnimationSequence, animation, prefersReducedMotion])

    useEffect(() => {
        if (prefersReducedMotion) return
        if (!showOutput1 || !isInView) return

        const cleanups: (() => void)[] = []

        if (word1Ref.current) {
            cleanups.push(
                startCharacterGlitch(word1Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 10000,
                    multiCharInterval: 15000,
                    glitchCharDisplayDuration: 2500,
                })
            )
        }

        if (word2Ref.current) {
            cleanups.push(
                startCharacterGlitch(word2Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 15000,
                    multiCharInterval: 10000,
                    glitchCharDisplayDuration: 2000,
                })
            )
        }

        if (word3Ref.current) {
            cleanups.push(
                startCharacterGlitch(word3Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 5000,
                    multiCharInterval: 10000,
                    glitchCharDisplayDuration: 3000,
                })
            )
        }

        if (word4Ref.current) {
            cleanups.push(
                startCharacterGlitch(word4Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 18000,
                    multiCharInterval: 15000,
                    glitchCharDisplayDuration: 2800,
                })
            )
        }

        return () => {
            cleanups.forEach(cleanup => cleanup())
        }
    }, [isInView, showOutput1, prefersReducedMotion])

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
        <div className="about-section-content">
            <div className="about-section-command-line">
                <span className="about-section-prompt">$ </span>
                <span>{command1}</span>
            </div>

            <div className="about-section-output-block">
                <p className="about-section-bio-text">
                    Passionate developer with expertise in <span ref={word1Ref}>artificial intelligence</span> and full-stack
                    development. I combine <span ref={word2Ref}>cutting-edge</span> AI technologies with robust backend systems to
                    create <span ref={word3Ref}>innovative</span> solutions. Committed to writing clean, efficient code and staying
                    current with <span ref={word4Ref}>emerging technologies</span>.
                </p>
            </div>

            <div className="about-section-command-line">
                <span className="about-section-prompt">$ </span>
                <span>{command2}</span>
            </div>

            <div className="about-section-output-block">
                <div className="about-section-skills-grid">
                    {skillCategories.map((category) => (
                        <div key={category.title} className="about-section-skill-category">
                            <div className="about-section-category-title">
                                <span className="about-section-category-icon">{category.icon}</span>
                                <span>{category.title}</span>
                            </div>
                            <div className="about-section-tech-stack">
                                {category.technologies.map((tech) => (
                                    <span key={tech} className="about-section-tech-badge">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="about-section-command-line">
                <span className="about-section-prompt">$ </span>
                <span>{command3}</span>
            </div>

            <div className="about-section-output-block about-section-output-block-compact">
                <div className="about-section-spec-grid">
                    {specializations.map((spec) => (
                        <span key={spec} className="about-section-spec-item">
                            {spec}
                        </span>
                    ))}
                </div>
            </div>

            <TerminalInput
                history={terminalInput.history}
                inputText={terminalInput.inputText}
                isTypingResponse={terminalInput.isTypingResponse}
                responseText={terminalInput.responseText}
            />
        </div>
    )

    const renderAnimatingContent = () => (
        <div className="about-section-content">
            {command1Typing.text && (
                <div className="about-section-command-line about-section-fade-in">
                    <span className="about-section-prompt">$ </span>
                    <span>{command1Typing.text}</span>
                    {command1Typing.text.length < command1.length && (
                        <span className="section-cursor-blink about-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showOutput1 && (
                <div className="about-section-output-block about-section-fade-in-smooth">
                    <p className="about-section-bio-text">
                        Passionate developer with expertise in <span ref={word1Ref}>artificial intelligence</span> and full-stack
                        development. I combine <span ref={word2Ref}>cutting-edge</span> AI technologies with robust backend systems to
                        create <span ref={word3Ref}>innovative</span> solutions. Committed to writing clean, efficient code and staying
                        current with <span ref={word4Ref}>emerging technologies</span>.
                    </p>
                </div>
            )}

            {command2Typing.text && (
                <div className="about-section-command-line about-section-fade-in">
                    <span className="about-section-prompt">$ </span>
                    <span>{command2Typing.text}</span>
                    {command2Typing.text.length < command2.length && (
                        <span className="section-cursor-blink about-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showOutput2 && (
                <div className="about-section-output-block about-section-fade-in-smooth">
                    <div className="about-section-skills-grid">
                        {skillCategories.map((category) => (
                            <div key={category.title} className="about-section-skill-category">
                                <div className="about-section-category-title">
                                    <span className="about-section-category-icon">{category.icon}</span>
                                    <span>{category.title}</span>
                                </div>
                                <div className="about-section-tech-stack">
                                    {category.technologies.map((tech) => (
                                        <span key={tech} className="about-section-tech-badge">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {command3Typing.text && (
                <div className="about-section-command-line about-section-fade-in">
                    <span className="about-section-prompt">$ </span>
                    <span>{command3Typing.text}</span>
                    <span className="section-cursor-blink about-section-cursor-blink">|</span>
                </div>
            )}

            {showOutput3 && (
                <div className="about-section-output-block about-section-output-block-compact about-section-fade-in-smooth">
                    <div className="about-section-spec-grid">
                        {specializations.map((spec) => (
                            <span key={spec} className="about-section-spec-item">
                                {spec}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <>
            {/* Screen reader accessible content */}
            <div className="sr-only" aria-live="polite">
                <h2>About</h2>
                <p>
                    Passionate developer with expertise in artificial intelligence and full-stack
                    development. I combine cutting-edge AI technologies with robust backend systems to
                    create innovative solutions. Committed to writing clean, efficient code and staying
                    current with emerging technologies.
                </p>
                <h3>Tech Stack</h3>
                <ul>
                    {skillCategories.map((category) => (
                        <li key={category.title}>
                            {category.title}: {category.technologies.join(', ')}
                        </li>
                    ))}
                </ul>
                <h3>Specializations</h3>
                <ul>
                    {specializations.map((spec) => (
                        <li key={spec}>{spec}</li>
                    ))}
                </ul>
            </div>

            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} aria-hidden="true">
                <TerminalContainer title="developer@portfolio:~/skills$" ariaLabel="About section terminal — skills and technologies">
                    {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}
                </TerminalContainer>
            </div>

            <style>{`
                .about-section-content {
                    color: var(--color-primary);
                }

                .about-section-command-line {
                    color: var(--color-primary);
                    font-size: var(--font-size-md);
                    font-family: var(--font-mono);
                    margin-bottom: var(--spacing-xs);
                    line-height: var(--line-height-normal);
                }

                .about-section-prompt {
                    color: var(--color-primary-dim);
                }

                .section-cursor-blink about-section-cursor-blink {
                    margin-left: 4px;
                }

                .about-section-output-block {
                    margin-bottom: var(--spacing-lg);
                }

                .about-section-output-block-compact {
                    margin-bottom: var(--spacing-md);
                }

                .about-section-bio-text {
                    font-size: var(--font-size-md);
                    color: var(--color-primary);
                    line-height: var(--line-height-relaxed);
                    margin: 0;
                }

                .about-section-fade-in {
                    animation: about-section-fadeIn 0.6s ease forwards;
                }

                .about-section-fade-in-smooth {
                    opacity: 0;
                    animation: about-section-fadeInSuperSmooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                @keyframes about-section-fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes about-section-fadeInSuperSmooth {
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

                .about-section-skills-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-md);
                }

                .about-section-skill-category {
                    background: rgba(0, 255, 65, 0.05);
                    border: 1px solid rgba(0, 255, 65, 0.2);
                    padding: var(--spacing-md);
                    border-radius: 4px;
                    transition: all var(--transition-fast);
                }

                .about-section-skill-category:hover {
                    background: rgba(0, 255, 65, 0.08);
                    border-color: rgba(0, 255, 65, 0.4);
                    transform: translateY(-2px);
                }

                .about-section-category-title {
                    font-size: var(--font-size-md);
                    font-weight: bold;
                    margin-bottom: var(--spacing-sm);
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    line-height: var(--line-height-tight);
                }

                .about-section-category-icon {
                    font-size: var(--font-size-lg);
                }

                .about-section-tech-stack {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-xs);
                }

                .about-section-tech-badge {
                    background: rgba(0, 255, 65, 0.1);
                    border: 1px solid rgba(0, 255, 65, 0.3);
                    padding: 4px 10px;
                    border-radius: 3px;
                    font-size: var(--font-size-xs);
                    line-height: var(--line-height-tight);
                    transition: all var(--transition-fast);
                }

                .about-section-tech-badge:hover {
                    background: rgba(0, 255, 65, 0.15);
                    transform: translateY(-1px);
                }

                .about-section-spec-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 6px;
                }

                .about-section-spec-item {
                    padding: 6px 10px;
                    background: rgba(0, 255, 65, 0.05);
                    border-left: 2px solid var(--color-primary-dimmer);
                    font-size: var(--font-size-xs);
                    line-height: var(--line-height-tight);
                    transition: all var(--transition-fast);
                }

                .about-section-spec-item:hover {
                    background: rgba(0, 255, 65, 0.08);
                    border-left-color: var(--color-primary);
                }

                @media (min-width: 480px) {
                    .about-section-spec-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .about-section-spec-item {
                        font-size: 11px;
                        padding: 7px 10px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                }

                @media (min-width: 600px) {
                    .about-section-spec-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (min-width: 768px) {
                    .about-section-skills-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .about-section-skill-category {
                        padding: 16px;
                    }

                    .about-section-tech-badge {
                        padding: 5px 10px;
                    }

                    .about-section-spec-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }

                    .about-section-spec-item {
                        font-size: var(--font-size-sm);
                        padding: 8px 12px;
                    }
                }

                @media (min-width: 1024px) {
                    .about-section-skills-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .about-section-skill-category {
                        padding: 18px;
                    }
                }

                @media (max-width: 480px) {
                    .about-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .about-section-bio-text {
                        font-size: var(--font-size-sm);
                    }

                    .about-section-category-title {
                        font-size: var(--font-size-sm);
                    }

                    .about-section-category-icon {
                        font-size: var(--font-size-md);
                    }

                    .about-section-skill-category {
                        padding: 12px;
                    }

                    .about-section-tech-badge {
                        padding: 3px 8px;
                        font-size: 10px;
                    }

                    .about-section-spec-item {
                        padding: 5px 8px;
                        font-size: 10px;
                    }
                }
            `}</style>
        </>
    )
}