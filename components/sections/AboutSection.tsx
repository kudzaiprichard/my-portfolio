// components/sections/AboutSection.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import { useInView } from '@/hooks/useInView'
import { startCharacterGlitch } from '@/lib/glitch'
import { delay } from '@/lib/utils'

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
    // Detect when section is in view
    const { ref, isInView } = useInView({
        threshold: 0.3,
        triggerOnce: true
    })

    const [commandStage, setCommandStage] = useState(0)
    const [typingCommand1, setTypingCommand1] = useState('')
    const [typingCommand2, setTypingCommand2] = useState('')
    const [typingCommand3, setTypingCommand3] = useState('')
    const [showOutput1, setShowOutput1] = useState(false)
    const [showOutput2, setShowOutput2] = useState(false)
    const [showOutput3, setShowOutput3] = useState(false)

    const animationStartedRef = useRef(false)

    // Refs for glitch effects on specific words
    const word1Ref = useRef<HTMLSpanElement>(null) // artificial intelligence
    const word2Ref = useRef<HTMLSpanElement>(null) // cutting-edge
    const word3Ref = useRef<HTMLSpanElement>(null) // innovative
    const word4Ref = useRef<HTMLSpanElement>(null) // emerging technologies

    const command1 = 'cat about.txt'
    const command2 = 'ls -la ./tech_stack/'
    const command3 = './list_specializations.sh'

    // Define typeText function BEFORE it's used in useEffect
    const typeText = useCallback(async (
        text: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        speed: number
    ) => {
        for (let i = 0; i <= text.length; i++) {
            setter(text.slice(0, i))
            await delay(speed)
        }
    }, [])

    // Apply character glitch to specific words when bio is visible
    useEffect(() => {
        if (!showOutput1 || !isInView) return

        const cleanups: (() => void)[] = []

        // Glitch "artificial intelligence" - every 30 seconds
        if (word1Ref.current) {
            cleanups.push(
                startCharacterGlitch(word1Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 10000,    // Wait 10 seconds between single char glitches
                    multiCharInterval: 15000,     // Wait 15 seconds between multi char glitches
                })
            )
        }

        // Glitch "cutting-edge" - every 35 seconds (staggered timing)
        if (word2Ref.current) {
            cleanups.push(
                startCharacterGlitch(word2Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 15000,
                    multiCharInterval: 10000,
                })
            )
        }

        // Glitch "innovative" - every 40 seconds (staggered timing)
        if (word3Ref.current) {
            cleanups.push(
                startCharacterGlitch(word3Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 5000,
                    multiCharInterval: 10000,
                })
            )
        }

        // Glitch "emerging technologies" - every 45 seconds (staggered timing)
        if (word4Ref.current) {
            cleanups.push(
                startCharacterGlitch(word4Ref.current, {
                    intensity: 'low',
                    singleCharInterval: 18000,
                    multiCharInterval: 15000,
                })
            )
        }

        return () => {
            cleanups.forEach(cleanup => cleanup())
        }
    }, [showOutput1, isInView])

    useEffect(() => {
        // Only start animation when in view and hasn't started yet
        if (!isInView || animationStartedRef.current) return

        animationStartedRef.current = true

        const runAnimation = async () => {
            // Stage 1: Type first command
            await delay(500)
            setCommandStage(1)
            await typeText(command1, setTypingCommand1, 50)
            await delay(300)
            setShowOutput1(true)

            // Stage 2: Type second command
            await delay(800)
            setCommandStage(2)
            await typeText(command2, setTypingCommand2, 50)
            await delay(300)
            setShowOutput2(true)

            // Stage 3: Type third command
            await delay(800)
            setCommandStage(3)
            await typeText(command3, setTypingCommand3, 50)
            await delay(300)
            setShowOutput3(true)
        }

        runAnimation()
    }, [isInView, typeText, command1, command2, command3])

    return (
        <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TerminalContainer title="developer@portfolio:~/skills$">
                <div className="skills-content">
                    {/* Command 1: cat about.txt */}
                    {commandStage >= 1 && (
                        <div className="skills-command-wrapper">
                            <span className="prompt">$</span>{' '}
                            <span className="typed-command">
                                {typingCommand1}
                                {commandStage === 1 && typingCommand1.length < command1.length && (
                                    <span className="typing-cursor">|</span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Output 1: Bio with glitched words */}
                    {showOutput1 && (
                        <div className="skills-output" style={{
                            animation: 'fadeInUp 0.8s ease forwards',
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

                    {/* Command 2: ls -la ./tech_stack/ */}
                    {commandStage >= 2 && (
                        <div className="skills-command-wrapper" style={{ marginTop: '20px' }}>
                            <span className="prompt">$</span>{' '}
                            <span className="typed-command">
                                {typingCommand2}
                                {commandStage === 2 && typingCommand2.length < command2.length && (
                                    <span className="typing-cursor">|</span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Output 2: Skills Grid */}
                    {showOutput2 && (
                        <div className="skills-output" style={{
                            animation: 'fadeInUp 0.8s ease forwards',
                            opacity: 0
                        }}>
                            <div className="skills-grid">
                                {skillCategories.map((category, index) => (
                                    <div
                                        key={category.title}
                                        className="skill-category"
                                        style={{
                                            animation: `fadeInUp 0.6s ease forwards`,
                                            animationDelay: `${0.2 + index * 0.1}s`,
                                            opacity: 0,
                                        }}
                                    >
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

                    {/* Command 3: ./list_specializations.sh with permanent cursor */}
                    {commandStage >= 3 && (
                        <div className="specializations">
                            <div className="skills-command-wrapper">
                                <span className="prompt">$</span>{' '}
                                <span className="typed-command">
                                    {typingCommand3}
                                    {/* Always show cursor after command is fully typed */}
                                    {typingCommand3.length === command3.length && (
                                        <span className="typing-cursor">|</span>
                                    )}
                                    {/* Show cursor while typing */}
                                    {commandStage === 3 && typingCommand3.length < command3.length && (
                                        <span className="typing-cursor">|</span>
                                    )}
                                </span>
                            </div>

                            {/* Output 3: Specializations */}
                            {showOutput3 && (
                                <div className="skills-output" style={{
                                    animation: 'fadeInUp 1s ease forwards',
                                    opacity: 0
                                }}>
                                    <div className="spec-list">
                                        {specializations.map((spec, index) => (
                                            <div
                                                key={spec}
                                                className="spec-item"
                                                style={{
                                                    animation: `fadeInUp 0.5s ease forwards`,
                                                    animationDelay: `${0.3 + index * 0.1}s`,
                                                    opacity: 0,
                                                }}
                                            >
                                                {spec}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .skills-content {
                        color: #00ff41;
                    }

                    .skills-command-wrapper {
                        margin-bottom: 12px;
                        display: flex;
                        align-items: baseline;
                    }

                    .typed-command {
                        display: inline;
                        color: #00ff41;
                        font-size: 16px;
                    }

                    .typing-cursor {
                        display: inline-block;
                        margin-left: 4px;
                        animation: blink 0.7s infinite;
                    }

                    .skills-output {
                        display: block;
                        margin-bottom: 20px;
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

                    @keyframes blink {
                        0%,
                        50% {
                            opacity: 1;
                        }
                        51%,
                        100% {
                            opacity: 0;
                        }
                    }

                    @media (max-width: 768px) {
                        .typed-command {
                            font-size: 14px;
                        }

                        .bio-text {
                            font-size: 14px;
                        }
                    }
                `}</style>
            </TerminalContainer>
        </div>
    )
}