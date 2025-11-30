// components/sections/ProjectsSection.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import { useInView } from '@/hooks/useInView'
import { startCharacterGlitch } from '@/lib/glitch'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/hooks/useAnimationController'
import { useTypingAnimation } from '@/hooks/useTypingAnimation'
import { AnimationController } from '@/lib/animationController'

interface Project {
    id: string
    name: string
    status?: 'LIVE' | 'BETA' | 'WIP'
    description: string
    technologies: string[]
    githubUrl: string
    liveUrl?: string
}

const projects: Project[] = [
    {
        id: '1',
        name: 'AI ChatBot Platform',
        status: 'LIVE',
        description: 'Enterprise conversational AI platform powered by GPT-4. Features context-aware responses, multi-language support, and custom training capabilities for enterprise clients. Handles complex queries with natural language processing.',
        technologies: ['Python', 'FastAPI', 'OpenAI', 'PostgreSQL'],
        githubUrl: 'https://github.com/yourusername/ai-chatbot',
        liveUrl: 'https://demo.com',
    },
    {
        id: '2',
        name: 'ML Image Classifier',
        status: 'LIVE',
        description: 'Deep learning model for image classification with 96% accuracy. Built with transfer learning using ResNet50 and deployed with real-time inference API. Processes thousands of images per minute with high precision.',
        technologies: ['TensorFlow', 'Flask', 'Docker', 'AWS'],
        githubUrl: 'https://github.com/yourusername/ml-classifier',
        liveUrl: 'https://demo.com',
    },
    {
        id: '3',
        name: 'E-Commerce Dashboard',
        status: 'LIVE',
        description: 'Full-stack admin dashboard for e-commerce platforms. Features real-time analytics, inventory management, and automated reporting with beautiful data visualizations. Supports multiple stores and currencies.',
        technologies: ['Next.js', 'Node.js', 'MongoDB'],
        githubUrl: 'https://github.com/yourusername/dashboard',
        liveUrl: 'https://demo.com',
    },
    {
        id: '4',
        name: 'Real-Time Chat App',
        status: 'BETA',
        description: 'WebSocket-based real-time messaging application with end-to-end encryption. Supports group chats, file sharing, and message history with Redis caching for optimal performance.',
        technologies: ['React', 'Socket.io', 'Redis'],
        githubUrl: 'https://github.com/yourusername/chat',
    },
    {
        id: '5',
        name: 'Task Automation Bot',
        status: 'LIVE',
        description: 'Python automation bot for repetitive tasks. Integrates with Slack, Email, and Calendar APIs. Saves average of 10+ hours per week through intelligent scheduling and notifications.',
        technologies: ['Python', 'Celery', 'RabbitMQ'],
        githubUrl: 'https://github.com/yourusername/bot',
    },
]

export default function ProjectsSection() {
    const [showCommand, setShowCommand] = useState(false)
    const [showProjects, setShowProjects] = useState(false)
    const [showFooterCommand, setShowFooterCommand] = useState(false)
    const [showFooterContent, setShowFooterContent] = useState(false)

    const audio = useKeystrokeAudio({
        sectionId: 'projects',
        enabled: true,
        volume: 0.4,
        volumeRampEnabled: true,
    })

    const { onTypingKeystroke } = useTypingAudioCallback(audio)
    const animation = useAnimationController({ debug: false })
    const commandTyping = useTypingAnimation({ baseSpeed: 70 })
    const footerCommandTyping = useTypingAnimation({ baseSpeed: 60 })
    const projectNameRefs = useRef<(HTMLSpanElement | null)[]>([])
    const command = 'ls -la ./repositories/'
    const footerCommand = 'cat more_projects.txt'

    const resetAnimationState = useCallback(() => {
        commandTyping.reset()
        footerCommandTyping.reset()
        setShowCommand(false)
        setShowProjects(false)
        setShowFooterCommand(false)
        setShowFooterContent(false)
        animation.reset()
    }, [animation, commandTyping, footerCommandTyping])

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
        steps.push(AnimationController.createActionStep(() => setShowProjects(true)))
        steps.push(AnimationController.createDelayStep(600))

        // Footer command typing
        steps.push(AnimationController.createActionStep(() => {
            audio.resetVolumeRamp()
            setShowFooterCommand(true)
        }))
        steps.push(...footerCommandTyping.generateSteps(footerCommand, { onKeystroke: onTypingKeystroke }))
        steps.push(AnimationController.createDelayStep(300))
        steps.push(AnimationController.createActionStep(() => setShowFooterContent(true)))

        return steps
    }, [command, footerCommand, commandTyping, footerCommandTyping, onTypingKeystroke, audio])

    useEffect(() => {
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) return
        if (animation.isCompleted || animation.isRunning) return

        const steps = buildAnimationSequence()
        animation.start(steps)
    }, [isInView, audio.isAudioReady, audio.hasAudioControl, animation.isCompleted, animation.isRunning, buildAnimationSequence, animation])

    useEffect(() => {
        if (!isInView || !showProjects) return

        const cleanups: (() => void)[] = []
        projectNameRefs.current.forEach((ref, index) => {
            if (ref) {
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
    }, [isInView, showProjects])

    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            if (animation && typeof animation.cancel === 'function') {
                animation.cancel()
            }
        }
    }, [])

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'LIVE': return '#00ff41'
            case 'BETA': return '#00d4ff'
            case 'WIP': return '#ffa500'
            default: return '#00ff41'
        }
    }

    return (
        <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TerminalContainer title="developer@portfolio:~/projects$">
                <div style={{ color: '#00ff41', fontFamily: 'Courier New, monospace' }}>
                    {/* Command Line */}
                    {showCommand && (
                        <div style={{ fontSize: '16px', marginBottom: '20px' }}>
                            <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                            <span>{commandTyping.text}</span>
                            {commandTyping.text.length < command.length && (
                                <span style={{ marginLeft: '2px', animation: 'blink 0.7s infinite' }}>|</span>
                            )}
                        </div>
                    )}

                    {/* Projects Grid - Asymmetric Layout */}
                    {showProjects && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Row 1: 2 cards (60/40 split) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
                                {/* Featured Project */}
                                <div
                                    style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '18px',
                                        background: 'rgba(0, 20, 0, 0.2)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: '220px',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#00ff41'
                                        e.currentTarget.style.background = 'rgba(0, 30, 0, 0.3)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                        e.currentTarget.style.background = 'rgba(0, 20, 0, 0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span ref={el => { projectNameRefs.current[0] = el }} style={{ fontSize: '17px', fontWeight: 'bold' }}>
                                            {projects[0].name}
                                        </span>
                                        <span style={{
                                            fontSize: '9px',
                                            padding: '3px 7px',
                                            border: `1px solid ${getStatusColor(projects[0].status)}`,
                                            color: getStatusColor(projects[0].status),
                                        }}>
                                            {projects[0].status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(0, 255, 65, 0.8)', margin: '0 0 14px 0', flexGrow: 1 }}>
                                        {projects[0].description}
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                        {projects[0].technologies.map((tech) => (
                                            <span key={tech} style={{ fontSize: '11px', padding: '3px 8px', border: '1px solid rgba(0, 255, 65, 0.4)', color: 'rgba(0, 255, 65, 0.7)' }}>
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 65, 0.2)' }}>
                                        <a href={projects[0].githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#00ff41', textDecoration: 'none' }}>
                                            → GitHub
                                        </a>
                                        {projects[0].liveUrl && (
                                            <a href={projects[0].liveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#00ff41', textDecoration: 'none' }}>
                                                → Demo
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Second Project */}
                                <div
                                    style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '18px',
                                        background: 'rgba(0, 20, 0, 0.2)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: '220px',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#00ff41'
                                        e.currentTarget.style.background = 'rgba(0, 30, 0, 0.3)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                        e.currentTarget.style.background = 'rgba(0, 20, 0, 0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span ref={el => { projectNameRefs.current[1] = el }} style={{ fontSize: '17px', fontWeight: 'bold' }}>
                                            {projects[1].name}
                                        </span>
                                        <span style={{
                                            fontSize: '9px',
                                            padding: '3px 7px',
                                            border: `1px solid ${getStatusColor(projects[1].status)}`,
                                            color: getStatusColor(projects[1].status),
                                        }}>
                                            {projects[1].status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(0, 255, 65, 0.8)', margin: '0 0 14px 0', flexGrow: 1 }}>
                                        {projects[1].description}
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                        {projects[1].technologies.map((tech) => (
                                            <span key={tech} style={{ fontSize: '11px', padding: '3px 8px', border: '1px solid rgba(0, 255, 65, 0.4)', color: 'rgba(0, 255, 65, 0.7)' }}>
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0, 255, 65, 0.2)' }}>
                                        <a href={projects[1].githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#00ff41', textDecoration: 'none' }}>
                                            → GitHub
                                        </a>
                                        {projects[1].liveUrl && (
                                            <a href={projects[1].liveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#00ff41', textDecoration: 'none' }}>
                                                → Demo
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: 3 equal cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                {projects.slice(2, 5).map((project, idx) => (
                                    <div
                                        key={project.id}
                                        style={{
                                            border: '1px solid rgba(0, 255, 65, 0.4)',
                                            padding: '16px',
                                            background: 'rgba(0, 20, 0, 0.2)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: '200px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#00ff41'
                                            e.currentTarget.style.background = 'rgba(0, 30, 0, 0.3)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                            e.currentTarget.style.background = 'rgba(0, 20, 0, 0.2)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span ref={el => { projectNameRefs.current[idx + 2] = el }} style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                {project.name}
                                            </span>
                                            {project.status && (
                                                <span style={{
                                                    fontSize: '9px',
                                                    padding: '3px 7px',
                                                    border: `1px solid ${getStatusColor(project.status)}`,
                                                    color: getStatusColor(project.status),
                                                }}>
                                                    {project.status}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'rgba(0, 255, 65, 0.8)', margin: '0 0 12px 0', flexGrow: 1 }}>
                                            {project.description}
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                                            {project.technologies.map((tech) => (
                                                <span key={tech} style={{ fontSize: '10px', padding: '3px 7px', border: '1px solid rgba(0, 255, 65, 0.4)', color: 'rgba(0, 255, 65, 0.7)' }}>
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0, 255, 65, 0.2)' }}>
                                            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#00ff41', textDecoration: 'none' }}>
                                                → GitHub
                                            </a>
                                            {project.liveUrl && (
                                                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#00ff41', textDecoration: 'none' }}>
                                                    → Demo
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer - View More */}
                    {showFooterCommand && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                                <span style={{ color: 'rgba(0, 255, 65, 0.7)' }}>$ </span>
                                <span>{footerCommandTyping.text}</span>
                                {footerCommandTyping.text.length < footerCommand.length && (
                                    <span style={{ marginLeft: '2px', animation: 'blink 0.7s infinite' }}>|</span>
                                )}
                            </div>

                            {showFooterContent && (
                                <div style={{
                                    fontSize: '13px',
                                    color: 'rgba(0, 255, 65, 0.75)',
                                    animation: 'fadeIn 0.5s ease forwards',
                                    paddingLeft: '4px'
                                }}>
                                    → View all projects on{' '}
                                    <a
                                        href="https://github.com/yourusername"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#00ff41', textDecoration: 'none', borderBottom: '1px solid rgba(0, 255, 65, 0.4)' }}
                                    >
                                        GitHub
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    @media (max-width: 900px) {
                        div[style*="gridTemplateColumns: '1.5fr 1fr'"] {
                            grid-template-columns: 1fr !important;
                        }
                        div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </TerminalContainer>
        </div>
    )
}