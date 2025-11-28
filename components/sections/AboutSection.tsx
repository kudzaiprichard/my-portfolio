// components/sections/AboutSection.tsx
"use client"

/**
 * About Section - Refactored with new animation system
 *
 * Uses the same stable architecture as HeroSection:
 * - AnimationController for state management
 * - useTypingAnimation for typing effects
 * - Proper cancellation and reset logic
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import { useInView } from '@/hooks/useInView'
import { startCharacterGlitch } from '@/lib/glitch'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/hooks/useAnimationController'
import { useTypingAnimation } from '@/hooks/useTypingAnimation'
import { AnimationController } from '@/lib/animationController'

interface SkillCategory {
    title: string
    icon: string
    technologies: string[]
}

const skillCategories: SkillCategory[] = [
    {
        title: 'AI/ML',
        icon: '🤖',
        technologies: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenAI', 'Hugging Face'],
    },
    {
        title: 'Backend',
        icon: '⚙️',
        technologies: ['Python', 'Node.js', 'Django', 'FastAPI', 'PostgreSQL'],
    },
    {
        title: 'Frontend',
        icon: '💻',
        technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Vue.js'],
    },
    {
        title: 'DevOps',
        icon: '☁️',
        technologies: ['Docker', 'AWS', 'Git', 'CI/CD', 'Linux'],
    },
]

const specializations = [
    'Machine Learning Engineering',
    'Natural Language Processing',
    'API Development',
    'System Architecture',
    'Data Engineering',
    'Cloud Computing',
]

export default function AboutSection() {
    // State for tracking visibility
    const [showOutput1, setShowOutput1] = useState(false)
    const [showOutput2, setShowOutput2] = useState(false)
    const [showOutput3, setShowOutput3] = useState(false)

    // Audio setup
    const audio = useKeystrokeAudio({
        sectionId: 'about',
        enabled: true,
        volume: 0.4,
        volumeRampEnabled: true,
    })

    const { onTypingKeystroke } = useTypingAudioCallback(audio)

    // Animation controller
    const animation = useAnimationController({
        onComplete: () => {
            console.log('[AboutSection] Animation completed')
        },
        debug: false,
    })

    // Typing animations for each command
    const command1Typing = useTypingAnimation({ baseSpeed: 80 })
    const command2Typing = useTypingAnimation({ baseSpeed: 50 })
    const command3Typing = useTypingAnimation({ baseSpeed: 60 })

    // Refs for glitch effects on specific words
    const word1Ref = useRef<HTMLSpanElement>(null)
    const word2Ref = useRef<HTMLSpanElement>(null)
    const word3Ref = useRef<HTMLSpanElement>(null)
    const word4Ref = useRef<HTMLSpanElement>(null)

    // Command strings
    const command1 = 'cat about.txt'
    const command2 = 'ls -la ./tech_stack/'
    const command3 = './list_specializations.sh'

    // Reset animation state
    const resetAnimationState = useCallback(() => {
        command1Typing.reset()
        command2Typing.reset()
        command3Typing.reset()
        setShowOutput1(false)
        setShowOutput2(false)
        setShowOutput3(false)
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
        steps.push(AnimationController.createDelayStep(500))

        // Reset volume ramp
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )

        // Command 1: cat about.txt
        steps.push(...command1Typing.generateSteps(command1, {
            onKeystroke: onTypingKeystroke
        }))

        // Show bio output
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowOutput1(true)
            })
        )

        // Delay before command 2
        steps.push(AnimationController.createDelayStep(900))

        // Reset volume ramp
        steps.push(
            AnimationController.createActionStep(() => {
                audio.resetVolumeRamp()
            })
        )

        // Command 2: ls -la ./tech_stack/
        steps.push(...command2Typing.generateSteps(command2, {
            onKeystroke: onTypingKeystroke
        }))

        // Show skills output
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowOutput2(true)
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

        // Command 3: ./list_specializations.sh
        steps.push(...command3Typing.generateSteps(command3, {
            onKeystroke: onTypingKeystroke
        }))

        // Show specializations output
        steps.push(
            AnimationController.createDelayStep(350),
            AnimationController.createActionStep(() => {
                setShowOutput3(true)
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

    // Apply glitch effects to special words
    useEffect(() => {
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
    }, [isInView, showOutput1])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            if (animation && typeof animation.cancel === 'function') {
                animation.cancel()
            }
        }
    }, [])

    // Render static completed state
    const renderStaticContent = () => (
        <div className="skills-content">
            {/* Command 1 */}
            <div className="command-line" style={{ marginBottom: '8px' }}>
                <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                <span>{command1}</span>
            </div>

            {/* Output 1 - Bio */}
            <div style={{ marginBottom: '20px' }}>
                <p className="bio-text">
                    Passionate developer with expertise in <span ref={word1Ref}>artificial intelligence</span> and full-stack
                    development. I combine <span ref={word2Ref}>cutting-edge</span> AI technologies with robust backend systems to
                    create <span ref={word3Ref}>innovative</span> solutions. Committed to writing clean, efficient code and staying
                    current with <span ref={word4Ref}>emerging technologies</span>.
                </p>
            </div>

            {/* Command 2 */}
            <div className="command-line" style={{ marginBottom: '8px' }}>
                <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                <span>{command2}</span>
            </div>

            {/* Output 2 - Skills Grid */}
            <div style={{ marginBottom: '20px' }}>
                <div className="skills-grid">
                    {skillCategories.map((category) => (
                        <div key={category.title} className="skill-category">
                            <div className="category-title">
                                <span className="category-icon">{category.icon}</span>
                                <span>{category.title}</span>
                            </div>
                            <div className="tech-stack">
                                {category.technologies.map((tech) => (
                                    <span key={tech} className="tech-badge">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Command 3 */}
            <div className="command-line" style={{ marginBottom: '8px' }}>
                <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                <span>{command3}</span>
                <span style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                    animation: 'blink 0.7s infinite'
                }}>|</span>
            </div>

            {/* Output 3 - Specializations */}
            <div>
                <div className="spec-list">
                    {specializations.map((spec) => (
                        <div key={spec} className="spec-item">
                            {spec}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    // Render animating state
    const renderAnimatingContent = () => (
        <div className="skills-content">
            {/* Command 1 - Typing */}
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

            {/* Output 1 - Bio with Animation */}
            {showOutput1 && (
                <div style={{
                    marginBottom: '20px',
                    animation: 'fadeInSuperSmooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    opacity: 0
                }}>
                    <p className="bio-text">
                        Passionate developer with expertise in <span ref={word1Ref}>artificial intelligence</span> and full-stack
                        development. I combine <span ref={word2Ref}>cutting-edge</span> AI technologies with robust backend systems to
                        create <span ref={word3Ref}>innovative</span> solutions. Committed to writing clean, efficient code and staying
                        current with <span ref={word4Ref}>emerging technologies</span>.
                    </p>
                </div>
            )}

            {/* Command 2 - Typing */}
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

            {/* Output 2 - Skills Grid with Animation */}
            {showOutput2 && (
                <div style={{
                    marginBottom: '20px',
                    animation: 'fadeInSuperSmooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    opacity: 0
                }}>
                    <div className="skills-grid">
                        {skillCategories.map((category) => (
                            <div key={category.title} className="skill-category">
                                <div className="category-title">
                                    <span className="category-icon">{category.icon}</span>
                                    <span>{category.title}</span>
                                </div>
                                <div className="tech-stack">
                                    {category.technologies.map((tech) => (
                                        <span key={tech} className="tech-badge">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Command 3 - Typing */}
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

            {/* Output 3 - Specializations with Animation */}
            {showOutput3 && (
                <div style={{
                    marginBottom: '20px',
                    animation: 'fadeInSuperSmooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    opacity: 0
                }}>
                    <div className="spec-list">
                        {specializations.map((spec) => (
                            <div key={spec} className="spec-item">
                                {spec}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TerminalContainer title="developer@portfolio:~/skills$">
                {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}

                <style jsx>{`
                    .skills-content {
                        color: #00ff41;
                    }

                    .command-line {
                        color: #00ff41;
                        font-size: 16px;
                        font-family: 'Courier New', monospace;
                    }

                    .bio-text {
                        font-size: 16px;
                        color: #00ff41;
                        line-height: 1.6;
                        margin: 0;
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
                        0%, 50% {
                            opacity: 1;
                        }
                        51%, 100% {
                            opacity: 0;
                        }
                    }

                    .skills-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                    }

                    .skill-category {
                        background: rgba(0, 255, 65, 0.05);
                        border: 1px solid rgba(0, 255, 65, 0.2);
                        padding: 16px;
                        border-radius: 4px;
                    }

                    .category-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .category-icon {
                        font-size: 20px;
                    }

                    .tech-stack {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    .tech-badge {
                        background: rgba(0, 255, 65, 0.1);
                        border: 1px solid rgba(0, 255, 65, 0.3);
                        padding: 4px 10px;
                        border-radius: 3px;
                        font-size: 13px;
                    }

                    .spec-list {
                        display: flex !important;
                        flex-direction: column !important;
                        flex-wrap: nowrap !important;
                        gap: 8px !important;
                    }

                    .spec-item {
                        padding: 8px 12px;
                        background: rgba(0, 255, 65, 0.05);
                        border-left: 2px solid #00ff41;
                        font-size: 14px;
                    }
                    
                    .spec-item::before {
                        content: '' !important;
                        margin-right: 0 !important;
                    }

                    @media (max-width: 768px) {
                        .command-line {
                            font-size: 14px;
                        }

                        .bio-text {
                            font-size: 14px;
                        }

                        .skills-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </TerminalContainer>
        </div>
    )
}