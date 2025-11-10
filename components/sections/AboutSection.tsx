// components/sections/AboutSection.tsx
"use client"

import { useState, useEffect } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
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
    const [commandStage, setCommandStage] = useState(0)
    const [typingCommand1, setTypingCommand1] = useState('')
    const [typingCommand2, setTypingCommand2] = useState('')
    const [typingCommand3, setTypingCommand3] = useState('')
    const [showOutput1, setShowOutput1] = useState(false)
    const [showOutput2, setShowOutput2] = useState(false)
    const [showOutput3, setShowOutput3] = useState(false)

    const command1 = 'cat about.txt'
    const command2 = 'ls -la ./tech_stack/'
    const command3 = './list_specializations.sh'

    useEffect(() => {
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
    }, [])

    const typeText = async (
        text: string,
        setter: React.Dispatch<React.SetStateAction<string>>,
        speed: number
    ) => {
        for (let i = 0; i <= text.length; i++) {
            setter(text.slice(0, i))
            await delay(speed)
        }
    }

    return (
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

                {/* Output 1: Bio */}
                {showOutput1 && (
                    <div className="skills-output visible">
                        <p className="bio-text">
                            Passionate developer with expertise in artificial intelligence and full-stack
                            development. I combine cutting-edge AI technologies with robust backend systems to
                            create innovative solutions. Committed to writing clean, efficient code and staying
                            current with emerging technologies.
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
                    <div className="skills-output visible">
                        <div className="skills-grid">
                            {skillCategories.map((category, index) => (
                                <div
                                    key={category.title}
                                    className="skill-category"
                                    style={{
                                        animation: `fadeInUp 0.4s ease forwards`,
                                        animationDelay: `${index * 0.1}s`,
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

                {/* Command 3: ./list_specializations.sh */}
                {commandStage >= 3 && (
                    <div className="specializations">
                        <div className="skills-command-wrapper">
                            <span className="prompt">$</span>{' '}
                            <span className="typed-command">
                {typingCommand3}
                                {commandStage === 3 && typingCommand3.length < command3.length && (
                                    <span className="typing-cursor">|</span>
                                )}
              </span>
                        </div>

                        {/* Output 3: Specializations */}
                        {showOutput3 && (
                            <div className="skills-output visible">
                                <div className="spec-list">
                                    {specializations.map((spec, index) => (
                                        <div
                                            key={spec}
                                            className="spec-item"
                                            style={{
                                                animation: `fadeInUp 0.3s ease forwards`,
                                                animationDelay: `${index * 0.08}s`,
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
          opacity: 0;
          display: none;
          margin-bottom: 20px;
        }

        .skills-output.visible {
          display: block;
          animation: fadeInUp 0.4s ease forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
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
    )
}