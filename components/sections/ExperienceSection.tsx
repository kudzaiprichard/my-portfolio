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

        // Show experiences one by one
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

    return (
        <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TerminalContainer title="developer@portfolio:~/experience$">
                <div style={{ color: '#00ff41', fontFamily: 'Courier New, monospace' }}>
                    {/* Command Line */}
                    {showCommand && (
                        <div style={{ fontSize: '16px', marginBottom: '25px' }}>
                            <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                            <span>{commandTyping.text}</span>
                            {commandTyping.text.length < command.length && (
                                <span style={{ marginLeft: '2px', animation: 'blink 0.7s infinite' }}>|</span>
                            )}
                        </div>
                    )}

                    {/* Timeline */}
                    {showExperiences.length > 0 && (
                        <div style={{ position: 'relative', paddingLeft: '30px' }}>
                            {/* Vertical Line */}
                            <div style={{
                                position: 'absolute',
                                left: '0',
                                top: '10px',
                                bottom: '10px',
                                width: '2px',
                                background: 'rgba(0, 255, 65, 0.3)',
                            }} />

                            {/* Experience Items */}
                            {experiences.map((exp, index) => (
                                showExperiences[index] && (
                                    <div
                                        key={exp.id}
                                        className="experience-item"
                                        style={{
                                            position: 'relative',
                                            marginBottom: index < experiences.length - 1 ? '35px' : '0',
                                            animation: 'fadeInUp 0.6s ease forwards',
                                        }}
                                    >
                                        {/* Timeline Dot */}
                                        <div
                                            className="timeline-dot"
                                            style={{
                                                position: 'absolute',
                                                left: '-35px',
                                                top: '8px',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                border: '2px solid #00ff41',
                                                background: 'rgba(0, 20, 0, 0.8)',
                                                boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />

                                        {/* Period Badge */}
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '3px 10px',
                                            border: '1px solid rgba(0, 255, 65, 0.4)',
                                            fontSize: '11px',
                                            marginBottom: '8px',
                                            color: 'rgba(0, 255, 65, 0.7)',
                                        }}>
                                            {exp.period}
                                        </div>

                                        {/* Role & Company */}
                                        <div style={{ marginBottom: '10px' }}>
                                            <h3
                                                ref={el => { roleRefs.current[index] = el }}
                                                style={{
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    margin: '0 0 4px 0',
                                                    color: '#00ff41',
                                                }}
                                            >
                                                {exp.role}
                                            </h3>
                                            <div style={{
                                                fontSize: '14px',
                                                color: 'rgba(0, 255, 65, 0.6)',
                                            }}>
                                                {exp.company}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p style={{
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            color: 'rgba(0, 255, 65, 0.75)',
                                            margin: '0 0 12px 0',
                                        }}>
                                            {exp.description}
                                        </p>

                                        {/* Achievements */}
                                        <div style={{ marginBottom: '12px' }}>
                                            {exp.achievements.map((achievement, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        fontSize: '12px',
                                                        color: 'rgba(0, 255, 65, 0.7)',
                                                        marginBottom: '4px',
                                                        paddingLeft: '12px',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: '0',
                                                        color: 'rgba(0, 255, 65, 0.5)',
                                                    }}>
                                                        &gt;
                                                    </span>
                                                    {achievement}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Technologies */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {exp.technologies.map((tech) => (
                                                <span
                                                    key={tech}
                                                    style={{
                                                        fontSize: '11px',
                                                        padding: '3px 8px',
                                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                                        color: 'rgba(0, 255, 65, 0.7)',
                                                    }}
                                                >
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

                <style jsx>{`
                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }

                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(15px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .experience-item:hover .timeline-dot {
                        background: #00ff41 !important;
                        box-shadow: 0 0 20px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.4) !important;
                    }

                    @media (max-width: 768px) {
                        div[style*="paddingLeft: '30px'"] {
                            padding-left: 25px !important;
                        }
                    }
                `}</style>
            </TerminalContainer>
        </div>
    )
}