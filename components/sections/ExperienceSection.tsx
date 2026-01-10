// components/sections/ExperienceSection.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import { useInView } from '@/hooks/useInView'
import { startCharacterGlitch } from '@/lib/glitch'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/hooks/useAnimationController'
import { useTypingAnimation } from '@/hooks/useTypingAnimation'
import { AnimationController } from '@/lib/animationController'

interface Experience {
    id: string
    period: string
    role: string
    company: string
    description: string
    achievements: string[]
    technologies: string[]
}

const experiences: Experience[] = [
    {
        id: '1',
        period: '2023 - Present',
        role: 'Senior AI Engineer',
        company: '@ TechCorp Solutions',
        description: 'Leading AI/ML initiatives and developing intelligent systems for enterprise clients. Architected and deployed scalable machine learning pipelines processing millions of data points daily.',
        achievements: [
            'Built NLP models achieving 94% accuracy in sentiment analysis',
            'Reduced model inference time by 60% through optimization',
            'Mentored team of 5 junior engineers',
        ],
        technologies: ['Python', 'TensorFlow', 'AWS', 'Docker', 'PyTorch'],
    },
    {
        id: '2',
        period: '2021 - 2023',
        role: 'Full Stack Developer',
        company: '@ StartupHub Inc',
        description: 'Developed and maintained full-stack applications serving 100K+ users. Implemented RESTful APIs and modern frontend interfaces with React and Node.js.',
        achievements: [
            'Launched 3 major product features on schedule',
            'Improved application performance by 45%',
            'Collaborated with cross-functional teams',
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Git'],
    },
    {
        id: '3',
        period: '2020 - 2021',
        role: 'Freelance Developer',
        company: '@ Self-Employed',
        description: 'Delivered custom web applications and AI solutions for various clients. Specialized in rapid prototyping and MVP development.',
        achievements: [
            'Completed 15+ client projects successfully',
            'Maintained 100% client satisfaction rate',
            'Built scalable solutions for diverse industries',
        ],
        technologies: ['Python', 'Django', 'React', 'MongoDB', 'AWS'],
    },
]

export default function ExperienceSection() {
    const [showCommand, setShowCommand] = useState(false)
    const [showExperiences, setShowExperiences] = useState<boolean[]>([])

    const audio = useKeystrokeAudio({
        sectionId: 'experience',
        enabled: true,
        volume: 0.4,
        volumeRampEnabled: true,
    })

    const { onTypingKeystroke } = useTypingAudioCallback(audio)
    const animation = useAnimationController({ debug: false })
    const commandTyping = useTypingAnimation({ baseSpeed: 70 })
    const roleRefs = useRef<(HTMLSpanElement | null)[]>([])
    const command = 'git log --all --author="kudzai"'

    const resetAnimationState = useCallback(() => {
        commandTyping.reset()
        setShowCommand(false)
        setShowExperiences([])
        animation.reset()
    }, [animation, commandTyping])

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

        steps.push(AnimationController.createDelayStep(500))
        steps.push(AnimationController.createActionStep(() => audio.resetVolumeRamp()))
        steps.push(AnimationController.createActionStep(() => setShowCommand(true)))
        steps.push(...commandTyping.generateSteps(command, { onKeystroke: onTypingKeystroke }))
        steps.push(AnimationController.createDelayStep(350))

        experiences.forEach((_, index) => {
            steps.push(
                AnimationController.createActionStep(() => {
                    setShowExperiences(prev => {
                        const updated = [...prev]
                        updated[index] = true
                        return updated
                    })
                }),
                AnimationController.createDelayStep(200)
            )
        })

        return steps
    }, [command, commandTyping, onTypingKeystroke, audio])

    useEffect(() => {
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) return
        if (animation.isCompleted || animation.isRunning) return

        const steps = buildAnimationSequence()
        animation.start(steps)
    }, [isInView, audio.isAudioReady, audio.hasAudioControl, animation.isCompleted, animation.isRunning, buildAnimationSequence, animation])

    useEffect(() => {
        if (!isInView || showExperiences.length === 0) return

        const cleanups: (() => void)[] = []
        roleRefs.current.forEach((ref, index) => {
            if (ref && showExperiences[index]) {
                cleanups.push(
                    startCharacterGlitch(ref, {
                        intensity: 'low',
                        singleCharInterval: 15000 + (index * 2000),
                        multiCharInterval: 20000 + (index * 3000),
                        glitchCharDisplayDuration: 2500,
                    })
                )
            }
        })

        return () => cleanups.forEach(cleanup => cleanup())
    }, [isInView, showExperiences])

    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            if (animation && typeof animation.cancel === 'function') {
                animation.cancel()
            }
        }
    }, [])

    const renderStaticContent = () => (
        <div className="experience-section-content">
            <div className="experience-section-command-line">
                <span className="experience-section-prompt">$ </span>
                <span>{command}</span>
                <span className="experience-section-cursor-blink">|</span>
            </div>

            <div className="experience-section-timeline-container">
                <div className="experience-section-timeline-line" />

                {experiences.map((exp, index) => (
                    <div key={exp.id} className="experience-section-item">
                        <div className="experience-section-timeline-dot" />

                        <div className="experience-section-period-badge">
                            {exp.period}
                        </div>

                        <div className="experience-section-role-header">
                            <h3
                                ref={el => { roleRefs.current[index] = el }}
                                className="experience-section-role-title"
                            >
                                {exp.role}
                            </h3>
                            <div className="experience-section-company-name">
                                {exp.company}
                            </div>
                        </div>

                        <p className="experience-section-description">
                            {exp.description}
                        </p>

                        <div className="experience-section-achievements">
                            {exp.achievements.map((achievement, idx) => (
                                <div key={idx} className="experience-section-achievement-item">
                                    <span className="experience-section-achievement-bullet">&gt;</span>
                                    {achievement}
                                </div>
                            ))}
                        </div>

                        <div className="experience-section-tech-list">
                            {exp.technologies.map((tech) => (
                                <span key={tech} className="experience-section-tech-tag">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderAnimatingContent = () => (
        <div className="experience-section-content">
            {showCommand && (
                <div className="experience-section-command-line">
                    <span className="experience-section-prompt">$ </span>
                    <span>{commandTyping.text}</span>
                    {commandTyping.text.length < command.length && (
                        <span className="experience-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showExperiences.length > 0 && (
                <div className="experience-section-timeline-container">
                    <div className="experience-section-timeline-line" />

                    {experiences.map((exp, index) => (
                        showExperiences[index] && (
                            <div key={exp.id} className="experience-section-item">
                                <div className="experience-section-timeline-dot" />

                                <div className="experience-section-period-badge">
                                    {exp.period}
                                </div>

                                <div className="experience-section-role-header">
                                    <h3
                                        ref={el => { roleRefs.current[index] = el }}
                                        className="experience-section-role-title"
                                    >
                                        {exp.role}
                                    </h3>
                                    <div className="experience-section-company-name">
                                        {exp.company}
                                    </div>
                                </div>

                                <p className="experience-section-description">
                                    {exp.description}
                                </p>

                                <div className="experience-section-achievements">
                                    {exp.achievements.map((achievement, idx) => (
                                        <div key={idx} className="experience-section-achievement-item">
                                            <span className="experience-section-achievement-bullet">&gt;</span>
                                            {achievement}
                                        </div>
                                    ))}
                                </div>

                                <div className="experience-section-tech-list">
                                    {exp.technologies.map((tech) => (
                                        <span key={tech} className="experience-section-tech-tag">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <>
            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <TerminalContainer title="developer@portfolio:~/experience$">
                    {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}
                </TerminalContainer>
            </div>

            <style>{`
                .experience-section-content {
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                }

                .experience-section-command-line {
                    font-size: var(--font-size-md);
                    margin-bottom: var(--spacing-lg);
                    line-height: var(--line-height-normal);
                }

                .experience-section-prompt {
                    color: var(--color-primary-dim);
                }

                .experience-section-cursor-blink {
                    display: inline-block;
                    margin-left: 2px;
                    animation: experience-section-blink 0.7s infinite;
                }

                @keyframes experience-section-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                .experience-section-timeline-container {
                    position: relative;
                    padding-left: 20px;
                }

                .experience-section-timeline-line {
                    position: absolute;
                    left: 0;
                    top: 10px;
                    bottom: 10px;
                    width: 2px;
                    background: var(--color-primary-dimmer);
                }

                .experience-section-item {
                    position: relative;
                    margin-bottom: var(--spacing-2xl);
                    animation: experience-section-fadeInUp 0.6s ease forwards;
                }

                .experience-section-item:last-child {
                    margin-bottom: 0;
                }

                @keyframes experience-section-fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .experience-section-timeline-dot {
                    position: absolute;
                    left: -25px;
                    top: 8px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    border: 2px solid var(--color-primary);
                    background: var(--color-bg-dark);
                    box-shadow: 0 0 10px var(--color-primary-dimmest);
                    transition: all var(--transition-fast);
                }

                .experience-section-item:hover .experience-section-timeline-dot {
                    background: var(--color-primary);
                    box-shadow: 0 0 20px var(--color-primary-dim), 0 0 30px var(--color-primary-dimmer);
                }

                .experience-section-period-badge {
                    display: inline-block;
                    padding: 4px var(--spacing-sm);
                    border: 1px solid var(--color-primary-dimmer);
                    font-size: 10px;
                    margin-bottom: var(--spacing-xs);
                    color: var(--color-primary-dim);
                    line-height: var(--line-height-tight);
                }

                .experience-section-role-header {
                    margin-bottom: var(--spacing-sm);
                }

                .experience-section-role-title {
                    font-size: var(--font-size-lg);
                    font-weight: bold;
                    margin: 0 0 4px 0;
                    color: var(--color-primary);
                    line-height: var(--line-height-tight);
                }

                .experience-section-company-name {
                    font-size: var(--font-size-sm);
                    color: var(--color-primary-dim);
                    line-height: var(--line-height-normal);
                }

                .experience-section-description {
                    font-size: var(--font-size-sm);
                    line-height: var(--line-height-relaxed);
                    color: var(--color-primary-dim);
                    margin: 0 0 var(--spacing-sm) 0;
                }

                .experience-section-achievements {
                    margin-bottom: var(--spacing-sm);
                }

                .experience-section-achievement-item {
                    font-size: var(--font-size-xs);
                    color: var(--color-primary-dim);
                    margin-bottom: 4px;
                    padding-left: var(--spacing-sm);
                    position: relative;
                    line-height: var(--line-height-normal);
                }

                .experience-section-achievement-bullet {
                    position: absolute;
                    left: 0;
                    color: var(--color-primary-dimmer);
                }

                .experience-section-tech-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .experience-section-tech-tag {
                    font-size: 10px;
                    padding: 3px 8px;
                    border: 1px solid var(--color-primary-dimmer);
                    color: var(--color-primary-dim);
                    line-height: var(--line-height-tight);
                    transition: all var(--transition-fast);
                }

                .experience-section-tech-tag:hover {
                    border-color: var(--color-primary);
                    background: rgba(0, 255, 65, 0.05);
                }

                @media (min-width: 768px) {
                    .experience-section-timeline-container {
                        padding-left: 30px;
                    }

                    .experience-section-timeline-dot {
                        left: -35px;
                        width: 12px;
                        height: 12px;
                    }

                    .experience-section-period-badge {
                        font-size: 11px;
                        padding: 3px 10px;
                    }

                    .experience-section-role-title {
                        font-size: var(--font-size-xl);
                    }

                    .experience-section-company-name {
                        font-size: var(--font-size-md);
                    }

                    .experience-section-description {
                        font-size: var(--font-size-md);
                    }

                    .experience-section-achievement-item {
                        font-size: var(--font-size-sm);
                    }

                    .experience-section-tech-tag {
                        font-size: 11px;
                    }
                }

                @media (max-width: 480px) {
                    .experience-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .experience-section-timeline-container {
                        padding-left: 18px;
                    }

                    .experience-section-timeline-dot {
                        left: -23px;
                        width: 8px;
                        height: 8px;
                    }

                    .experience-section-period-badge {
                        font-size: 9px;
                        padding: 3px 8px;
                    }

                    .experience-section-role-title {
                        font-size: var(--font-size-md);
                    }

                    .experience-section-company-name {
                        font-size: var(--font-size-xs);
                    }

                    .experience-section-description {
                        font-size: var(--font-size-xs);
                    }

                    .experience-section-achievement-item {
                        font-size: 10px;
                        padding-left: 10px;
                    }

                    .experience-section-tech-tag {
                        font-size: 9px;
                        padding: 2px 6px;
                    }

                    .experience-section-item {
                        margin-bottom: var(--spacing-xl);
                    }
                }
            `}</style>
        </>
    )
}