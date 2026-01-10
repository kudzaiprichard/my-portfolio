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

    const renderStaticContent = () => (
        <div className="projects-section-content">
            <div className="projects-section-command-line">
                <span className="projects-section-prompt">$ </span>
                <span>{command}</span>
            </div>

            <div className="projects-section-container">
                <div className="projects-section-featured-row">
                    {projects.slice(0, 2).map((project, idx) => (
                        <div key={project.id} className="projects-section-card projects-section-card-featured">
                            <div className="projects-section-header">
                                <span ref={el => { projectNameRefs.current[idx] = el }} className="projects-section-name">
                                    {project.name}
                                </span>
                                {project.status && (
                                    <span className="projects-section-status-badge" style={{ borderColor: getStatusColor(project.status), color: getStatusColor(project.status) }}>
                                        {project.status}
                                    </span>
                                )}
                            </div>
                            <p className="projects-section-description">{project.description}</p>
                            <div className="projects-section-tech-tags">
                                {project.technologies.map((tech) => (
                                    <span key={tech} className="projects-section-tech-tag">{tech}</span>
                                ))}
                            </div>
                            <div className="projects-section-links">
                                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link">
                                    → GitHub
                                </a>
                                {project.liveUrl && (
                                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link">
                                        → Demo
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="projects-section-other-row">
                    {projects.slice(2, 5).map((project, idx) => (
                        <div key={project.id} className="projects-section-card">
                            <div className="projects-section-header">
                                <span ref={el => { projectNameRefs.current[idx + 2] = el }} className="projects-section-name projects-section-name-small">
                                    {project.name}
                                </span>
                                {project.status && (
                                    <span className="projects-section-status-badge" style={{ borderColor: getStatusColor(project.status), color: getStatusColor(project.status) }}>
                                        {project.status}
                                    </span>
                                )}
                            </div>
                            <p className="projects-section-description projects-section-description-small">{project.description}</p>
                            <div className="projects-section-tech-tags">
                                {project.technologies.map((tech) => (
                                    <span key={tech} className="projects-section-tech-tag projects-section-tech-tag-small">{tech}</span>
                                ))}
                            </div>
                            <div className="projects-section-links">
                                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link projects-section-link-small">
                                    → GitHub
                                </a>
                                {project.liveUrl && (
                                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link projects-section-link-small">
                                        → Demo
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="projects-section-footer">
                <div className="projects-section-command-line">
                    <span className="projects-section-prompt">$ </span>
                    <span>{footerCommand}</span>
                    <span className="projects-section-cursor-blink">|</span>
                </div>

                <div className="projects-section-footer-content">
                    → View all projects on{' '}
                    <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="projects-section-footer-link">
                        GitHub
                    </a>
                </div>
            </div>
        </div>
    )

    const renderAnimatingContent = () => (
        <div className="projects-section-content">
            {showCommand && (
                <div className="projects-section-command-line">
                    <span className="projects-section-prompt">$ </span>
                    <span>{commandTyping.text}</span>
                    {commandTyping.text.length < command.length && (
                        <span className="projects-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showProjects && (
                <div className="projects-section-container">
                    <div className="projects-section-featured-row">
                        {projects.slice(0, 2).map((project, idx) => (
                            <div key={project.id} className="projects-section-card projects-section-card-featured">
                                <div className="projects-section-header">
                                    <span ref={el => { projectNameRefs.current[idx] = el }} className="projects-section-name">
                                        {project.name}
                                    </span>
                                    {project.status && (
                                        <span className="projects-section-status-badge" style={{ borderColor: getStatusColor(project.status), color: getStatusColor(project.status) }}>
                                            {project.status}
                                        </span>
                                    )}
                                </div>
                                <p className="projects-section-description">{project.description}</p>
                                <div className="projects-section-tech-tags">
                                    {project.technologies.map((tech) => (
                                        <span key={tech} className="projects-section-tech-tag">{tech}</span>
                                    ))}
                                </div>
                                <div className="projects-section-links">
                                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link">
                                        → GitHub
                                    </a>
                                    {project.liveUrl && (
                                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link">
                                            → Demo
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="projects-section-other-row">
                        {projects.slice(2, 5).map((project, idx) => (
                            <div key={project.id} className="projects-section-card">
                                <div className="projects-section-header">
                                    <span ref={el => { projectNameRefs.current[idx + 2] = el }} className="projects-section-name projects-section-name-small">
                                        {project.name}
                                    </span>
                                    {project.status && (
                                        <span className="projects-section-status-badge" style={{ borderColor: getStatusColor(project.status), color: getStatusColor(project.status) }}>
                                            {project.status}
                                        </span>
                                    )}
                                </div>
                                <p className="projects-section-description projects-section-description-small">{project.description}</p>
                                <div className="projects-section-tech-tags">
                                    {project.technologies.map((tech) => (
                                        <span key={tech} className="projects-section-tech-tag projects-section-tech-tag-small">{tech}</span>
                                    ))}
                                </div>
                                <div className="projects-section-links">
                                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link projects-section-link-small">
                                        → GitHub
                                    </a>
                                    {project.liveUrl && (
                                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="projects-section-link projects-section-link-small">
                                            → Demo
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showFooterCommand && (
                <div className="projects-section-footer">
                    <div className="projects-section-command-line">
                        <span className="projects-section-prompt">$ </span>
                        <span>{footerCommandTyping.text}</span>
                        {footerCommandTyping.text.length < footerCommand.length && (
                            <span className="projects-section-cursor-blink">|</span>
                        )}
                    </div>

                    {showFooterContent && (
                        <div className="projects-section-footer-content">
                            → View all projects on{' '}
                            <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="projects-section-footer-link">
                                GitHub
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    return (
        <>
            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <TerminalContainer title="developer@portfolio:~/projects$">
                    {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}
                </TerminalContainer>
            </div>

            <style>{`
                .projects-section-content {
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                }

                .projects-section-command-line {
                    font-size: var(--font-size-md);
                    margin-bottom: var(--spacing-lg);
                    line-height: var(--line-height-normal);
                }

                .projects-section-prompt {
                    color: var(--color-primary-dim);
                }

                .projects-section-cursor-blink {
                    display: inline-block;
                    margin-left: 2px;
                    animation: projects-section-blink 0.7s infinite;
                }

                @keyframes projects-section-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                .projects-section-container {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .projects-section-featured-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-md);
                }

                .projects-section-other-row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-md);
                }

                .projects-section-card {
                    border: 1px solid var(--color-primary-dimmer);
                    padding: var(--spacing-md);
                    background: rgba(0, 20, 0, 0.2);
                    transition: all var(--transition-fast);
                    display: flex;
                    flex-direction: column;
                    min-height: 180px;
                }

                .projects-section-card-featured {
                    min-height: 200px;
                }

                .projects-section-card:hover {
                    border-color: var(--color-primary);
                    background: rgba(0, 30, 0, 0.3);
                }

                .projects-section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: var(--spacing-sm);
                    gap: var(--spacing-xs);
                }

                .projects-section-name {
                    font-size: var(--font-size-md);
                    font-weight: bold;
                    color: var(--color-primary);
                    line-height: var(--line-height-tight);
                }

                .projects-section-name-small {
                    font-size: var(--font-size-sm);
                }

                .projects-section-status-badge {
                    font-size: 9px;
                    padding: 3px 7px;
                    border: 1px solid;
                    flex-shrink: 0;
                    line-height: 1;
                }

                .projects-section-description {
                    font-size: var(--font-size-sm);
                    line-height: var(--line-height-relaxed);
                    color: var(--color-primary-dim);
                    margin: 0 0 var(--spacing-sm) 0;
                    flex-grow: 1;
                }

                .projects-section-description-small {
                    font-size: var(--font-size-xs);
                }

                .projects-section-tech-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: var(--spacing-sm);
                }

                .projects-section-tech-tag {
                    font-size: 10px;
                    padding: 3px 8px;
                    border: 1px solid var(--color-primary-dimmer);
                    color: var(--color-primary-dim);
                    line-height: 1;
                }

                .projects-section-tech-tag-small {
                    font-size: 9px;
                    padding: 2px 6px;
                }

                .projects-section-links {
                    display: flex;
                    gap: var(--spacing-sm);
                    padding-top: var(--spacing-xs);
                    border-top: 1px solid var(--color-primary-dimmest);
                }

                .projects-section-link {
                    font-size: var(--font-size-xs);
                    color: var(--color-primary);
                    text-decoration: none;
                    transition: color var(--transition-fast);
                }

                .projects-section-link:hover {
                    color: var(--color-primary-dim);
                }

                .projects-section-link-small {
                    font-size: 10px;
                }

                .projects-section-footer {
                    margin-top: var(--spacing-lg);
                }

                .projects-section-footer-content {
                    font-size: var(--font-size-sm);
                    color: var(--color-primary-dim);
                    animation: projects-section-fadeIn 0.5s ease forwards;
                    padding-left: 4px;
                }

                @keyframes projects-section-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .projects-section-footer-link {
                    color: var(--color-primary);
                    text-decoration: none;
                    border-bottom: 1px solid var(--color-primary-dimmer);
                }

                .projects-section-footer-link:hover {
                    border-bottom-color: var(--color-primary);
                }

                @media (min-width: 768px) {
                    .projects-section-featured-row {
                        grid-template-columns: 1.5fr 1fr;
                    }

                    .projects-section-other-row {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .projects-section-card {
                        min-height: 200px;
                    }

                    .projects-section-card-featured {
                        min-height: 220px;
                    }

                    .projects-section-name {
                        font-size: var(--font-size-lg);
                    }

                    .projects-section-name-small {
                        font-size: var(--font-size-md);
                    }

                    .projects-section-description {
                        font-size: var(--font-size-md);
                    }

                    .projects-section-description-small {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-tech-tag {
                        font-size: 11px;
                    }

                    .projects-section-tech-tag-small {
                        font-size: 10px;
                    }

                    .projects-section-link {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-link-small {
                        font-size: var(--font-size-xs);
                    }
                }

                @media (min-width: 1024px) {
                    .projects-section-other-row {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (max-width: 480px) {
                    .projects-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-card {
                        padding: var(--spacing-sm);
                        min-height: 160px;
                    }

                    .projects-section-card-featured {
                        min-height: 180px;
                    }

                    .projects-section-name {
                        font-size: var(--font-size-sm);
                    }

                    .projects-section-name-small {
                        font-size: var(--font-size-xs);
                    }

                    .projects-section-status-badge {
                        font-size: 8px;
                        padding: 2px 5px;
                    }

                    .projects-section-description {
                        font-size: var(--font-size-xs);
                    }

                    .projects-section-description-small {
                        font-size: 10px;
                    }

                    .projects-section-tech-tag {
                        font-size: 9px;
                        padding: 2px 6px;
                    }

                    .projects-section-tech-tag-small {
                        font-size: 8px;
                        padding: 2px 5px;
                    }

                    .projects-section-footer-content {
                        font-size: var(--font-size-xs);
                    }
                }
            `}</style>
        </>
    )
}