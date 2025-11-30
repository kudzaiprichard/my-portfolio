// components/sections/ContactSection.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import TerminalContainer from '@/components/shared/TerminalContainer'
import { useInView } from '@/hooks/useInView'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/hooks/useAnimationController'
import { useTypingAnimation } from '@/hooks/useTypingAnimation'
import { AnimationController } from '@/lib/animationController'

export default function ContactSection() {
    const [showCommand, setShowCommand] = useState(false)
    const [showContent, setShowContent] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', message: '' })

    const audio = useKeystrokeAudio({
        sectionId: 'contact',
        enabled: true,
        volume: 0.4,
        volumeRampEnabled: true,
    })

    const { onTypingKeystroke } = useTypingAudioCallback(audio)
    const animation = useAnimationController({ debug: false })
    const commandTyping = useTypingAnimation({ baseSpeed: 70 })
    const command = 'curl -X GET /contact/info'

    const resetAnimationState = useCallback(() => {
        commandTyping.reset()
        setShowCommand(false)
        setShowContent(false)
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
        steps.push(AnimationController.createActionStep(() => setShowContent(true)))

        return steps
    }, [command, commandTyping, onTypingKeystroke, audio])

    useEffect(() => {
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) return
        if (animation.isCompleted || animation.isRunning) return

        const steps = buildAnimationSequence()
        animation.start(steps)
    }, [isInView, audio.isAudioReady, audio.hasAudioControl, animation.isCompleted, animation.isRunning, buildAnimationSequence, animation])

    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            if (animation && typeof animation.cancel === 'function') {
                animation.cancel()
            }
        }
    }, [])

    const handleSubmit = () => {
        console.log('Form submitted:', formData)
        // Add your form submission logic here
    }

    return (
        <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TerminalContainer title="developer@portfolio:~/contact$">
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

                    {/* Content */}
                    {showContent && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '30px',
                            animation: 'fadeIn 0.6s ease forwards'
                        }}>
                            {/* Left Column - Get In Touch */}
                            <div>
                                <h2 style={{
                                    fontSize: '16px',
                                    marginBottom: '20px',
                                    color: '#00ff41',
                                    fontWeight: 'normal'
                                }}>
                                    &gt; Get In Touch
                                </h2>

                                {/* Email */}
                                <a href="mailto:kudzai@example.com" style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '14px',
                                        marginBottom: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.borderColor = '#00ff41'
                                             e.currentTarget.style.background = 'rgba(0, 255, 65, 0.05)'
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                             e.currentTarget.style.background = 'transparent'
                                         }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2">
                                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                                            <path d="M2 7l10 7 10-7"/>
                                        </svg>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'rgba(0, 255, 65, 0.6)' }}>EMAIL</div>
                                            <div style={{ fontSize: '13px', color: '#00ff41' }}>kudzai@example.com</div>
                                        </div>
                                    </div>
                                </a>

                                {/* GitHub */}
                                <a href="https://github.com/kudzaiprichard" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '14px',
                                        marginBottom: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.borderColor = '#00ff41'
                                             e.currentTarget.style.background = 'rgba(0, 255, 65, 0.05)'
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                             e.currentTarget.style.background = 'transparent'
                                         }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#00ff41">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'rgba(0, 255, 65, 0.6)' }}>GITHUB</div>
                                            <div style={{ fontSize: '13px', color: '#00ff41' }}>@kudzaiprichard</div>
                                        </div>
                                    </div>
                                </a>

                                {/* LinkedIn */}
                                <a href="https://linkedin.com/in/kudzaiprichard" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '14px',
                                        marginBottom: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.borderColor = '#00ff41'
                                             e.currentTarget.style.background = 'rgba(0, 255, 65, 0.05)'
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                             e.currentTarget.style.background = 'transparent'
                                         }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#00ff41">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'rgba(0, 255, 65, 0.6)' }}>LINKEDIN</div>
                                            <div style={{ fontSize: '13px', color: '#00ff41' }}>Kudzai Prichard</div>
                                        </div>
                                    </div>
                                </a>

                                {/* Twitter */}
                                <a href="https://twitter.com/kudzaiprichard" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '14px',
                                        marginBottom: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.borderColor = '#00ff41'
                                             e.currentTarget.style.background = 'rgba(0, 255, 65, 0.05)'
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                             e.currentTarget.style.background = 'transparent'
                                         }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#00ff41">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                        </svg>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'rgba(0, 255, 65, 0.6)' }}>TWITTER</div>
                                            <div style={{ fontSize: '13px', color: '#00ff41' }}>@kudzaiprichard</div>
                                        </div>
                                    </div>
                                </a>

                                {/* Social Icons */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <a href="#" style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none'
                                    }}
                                       onMouseEnter={(e) => {
                                           e.currentTarget.style.borderColor = '#00ff41'
                                           e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
                                       }}
                                       onMouseLeave={(e) => {
                                           e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                           e.currentTarget.style.background = 'transparent'
                                       }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                                        </svg>
                                    </a>
                                    <a href="#" style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none'
                                    }}
                                       onMouseEnter={(e) => {
                                           e.currentTarget.style.borderColor = '#00ff41'
                                           e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
                                       }}
                                       onMouseLeave={(e) => {
                                           e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                           e.currentTarget.style.background = 'transparent'
                                       }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2">
                                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                                        </svg>
                                    </a>
                                    <a href="#" style={{
                                        border: '1px solid rgba(0, 255, 65, 0.4)',
                                        padding: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none'
                                    }}
                                       onMouseEnter={(e) => {
                                           e.currentTarget.style.borderColor = '#00ff41'
                                           e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
                                       }}
                                       onMouseLeave={(e) => {
                                           e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'
                                           e.currentTarget.style.background = 'transparent'
                                       }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* Right Column - Send Message Form */}
                            <div>
                                <h2 style={{
                                    fontSize: '16px',
                                    marginBottom: '20px',
                                    color: '#00ff41',
                                    fontWeight: 'normal'
                                }}>
                                    &gt; Send Message
                                </h2>

                                <div>
                                    {/* Name */}
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={{
                                            fontSize: '12px',
                                            color: 'rgba(0, 255, 65, 0.7)',
                                            marginBottom: '6px',
                                            display: 'block'
                                        }}>
                                            &gt; Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                background: 'transparent',
                                                border: '1px solid rgba(0, 255, 65, 0.4)',
                                                color: '#00ff41',
                                                fontSize: '13px',
                                                fontFamily: 'Courier New, monospace',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = '#00ff41'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={{
                                            fontSize: '12px',
                                            color: 'rgba(0, 255, 65, 0.7)',
                                            marginBottom: '6px',
                                            display: 'block'
                                        }}>
                                            &gt; Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                background: 'transparent',
                                                border: '1px solid rgba(0, 255, 65, 0.4)',
                                                color: '#00ff41',
                                                fontSize: '13px',
                                                fontFamily: 'Courier New, monospace',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = '#00ff41'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'}
                                        />
                                    </div>

                                    {/* Message */}
                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{
                                            fontSize: '12px',
                                            color: 'rgba(0, 255, 65, 0.7)',
                                            marginBottom: '6px',
                                            display: 'block'
                                        }}>
                                            &gt; Message
                                        </label>
                                        <textarea
                                            placeholder="Type your message here..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            rows={6}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                background: 'transparent',
                                                border: '1px solid rgba(0, 255, 65, 0.4)',
                                                color: '#00ff41',
                                                fontSize: '13px',
                                                fontFamily: 'Courier New, monospace',
                                                outline: 'none',
                                                resize: 'vertical'
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = '#00ff41'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.4)'}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        style={{
                                            padding: '12px 24px',
                                            background: 'transparent',
                                            border: '1px solid #00ff41',
                                            color: '#00ff41',
                                            fontSize: '13px',
                                            fontFamily: 'Courier New, monospace',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'
                                            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.3)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent'
                                            e.currentTarget.style.boxShadow = 'none'
                                        }}
                                    >
                                        ./send_message.sh
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    input::placeholder,
                    textarea::placeholder {
                        color: rgba(0, 255, 65, 0.3);
                    }

                    @media (max-width: 900px) {
                        div[style*="gridTemplateColumns: '1fr 1fr'"] {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </TerminalContainer>
        </div>
    )
}