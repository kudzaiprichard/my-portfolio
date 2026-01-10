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

    const renderStaticContent = () => (
        <div className="contact-section-content">
            <div className="contact-section-command-line">
                <span className="contact-section-prompt">$ </span>
                <span>{command}</span>
                <span className="contact-section-cursor-blink">|</span>
            </div>

            <div className="contact-section-grid">
                {/* Left Column - Get In Touch */}
                <div className="contact-section-column">
                    <h2 className="contact-section-heading">
                        &gt; Get In Touch
                    </h2>

                    {/* Contact Links */}
                    <div className="contact-section-links">
                        {/* Email */}
                        <a href="mailto:kudzai@example.com" className="contact-section-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M2 7l10 7 10-7"/>
                            </svg>
                            <div className="contact-section-info">
                                <div className="contact-section-label">EMAIL</div>
                                <div className="contact-section-value">kudzai@example.com</div>
                            </div>
                        </a>

                        {/* GitHub */}
                        <a href="https://github.com/kudzaiprichard" target="_blank" rel="noopener noreferrer" className="contact-section-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <div className="contact-section-info">
                                <div className="contact-section-label">GITHUB</div>
                                <div className="contact-section-value">@kudzaiprichard</div>
                            </div>
                        </a>

                        {/* LinkedIn */}
                        <a href="https://linkedin.com/in/kudzaiprichard" target="_blank" rel="noopener noreferrer" className="contact-section-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <div className="contact-section-info">
                                <div className="contact-section-label">LINKEDIN</div>
                                <div className="contact-section-value">Kudzai Prichard</div>
                            </div>
                        </a>

                        {/* Twitter */}
                        <a href="https://twitter.com/kudzaiprichard" target="_blank" rel="noopener noreferrer" className="contact-section-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            <div className="contact-section-info">
                                <div className="contact-section-label">TWITTER</div>
                                <div className="contact-section-value">@kudzaiprichard</div>
                            </div>
                        </a>
                    </div>

                    {/* Social Icons */}
                    <div className="contact-section-social-icons">
                        <a href="#" className="contact-section-social-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                        </a>
                        <a href="#" className="contact-section-social-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                            </svg>
                        </a>
                        <a href="#" className="contact-section-social-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Right Column - Send Message Form */}
                <div className="contact-section-column">
                    <h2 className="contact-section-heading">
                        &gt; Send Message
                    </h2>

                    <div className="contact-section-form">
                        {/* Name */}
                        <div className="contact-section-form-group">
                            <label className="contact-section-form-label">
                                &gt; Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="contact-section-form-input"
                            />
                        </div>

                        {/* Email */}
                        <div className="contact-section-form-group">
                            <label className="contact-section-form-label">
                                &gt; Email
                            </label>
                            <input
                                type="email"
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="contact-section-form-input"
                            />
                        </div>

                        {/* Message */}
                        <div className="contact-section-form-group">
                            <label className="contact-section-form-label">
                                &gt; Message
                            </label>
                            <textarea
                                placeholder="Type your message here..."
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                rows={6}
                                className="contact-section-form-textarea"
                            />
                        </div>

                        {/* Submit Button */}
                        <button onClick={handleSubmit} className="contact-section-submit-button">
                            ./send_message.sh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderAnimatingContent = () => (
        <div className="contact-section-content">
            {showCommand && (
                <div className="contact-section-command-line">
                    <span className="contact-section-prompt">$ </span>
                    <span>{commandTyping.text}</span>
                    {commandTyping.text.length < command.length && (
                        <span className="contact-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showContent && (
                <div className="contact-section-grid">
                    {/* Left Column - Get In Touch */}
                    <div className="contact-section-column">
                        <h2 className="contact-section-heading">
                            &gt; Get In Touch
                        </h2>

                        {/* Contact Links */}
                        <div className="contact-section-links">
                            {/* Email */}
                            <a href="mailto:kudzai@example.com" className="contact-section-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                    <path d="M2 7l10 7 10-7"/>
                                </svg>
                                <div className="contact-section-info">
                                    <div className="contact-section-label">EMAIL</div>
                                    <div className="contact-section-value">kudzai@example.com</div>
                                </div>
                            </a>

                            {/* GitHub */}
                            <a href="https://github.com/kudzaiprichard" target="_blank" rel="noopener noreferrer" className="contact-section-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                <div className="contact-section-info">
                                    <div className="contact-section-label">GITHUB</div>
                                    <div className="contact-section-value">@kudzaiprichard</div>
                                </div>
                            </a>

                            {/* LinkedIn */}
                            <a href="https://linkedin.com/in/kudzaiprichard" target="_blank" rel="noopener noreferrer" className="contact-section-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                <div className="contact-section-info">
                                    <div className="contact-section-label">LINKEDIN</div>
                                    <div className="contact-section-value">Kudzai Prichard</div>
                                </div>
                            </a>

                            {/* Twitter */}
                            <a href="https://twitter.com/kudzaiprichard" target="_blank" rel="noopener noreferrer" className="contact-section-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                                <div className="contact-section-info">
                                    <div className="contact-section-label">TWITTER</div>
                                    <div className="contact-section-value">@kudzaiprichard</div>
                                </div>
                            </a>
                        </div>

                        {/* Social Icons */}
                        <div className="contact-section-social-icons">
                            <a href="#" className="contact-section-social-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </svg>
                            </a>
                            <a href="#" className="contact-section-social-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                                </svg>
                            </a>
                            <a href="#" className="contact-section-social-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Right Column - Send Message Form */}
                    <div className="contact-section-column">
                        <h2 className="contact-section-heading">
                            &gt; Send Message
                        </h2>

                        <div className="contact-section-form">
                            {/* Name */}
                            <div className="contact-section-form-group">
                                <label className="contact-section-form-label">
                                    &gt; Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="contact-section-form-input"
                                />
                            </div>

                            {/* Email */}
                            <div className="contact-section-form-group">
                                <label className="contact-section-form-label">
                                    &gt; Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="contact-section-form-input"
                                />
                            </div>

                            {/* Message */}
                            <div className="contact-section-form-group">
                                <label className="contact-section-form-label">
                                    &gt; Message
                                </label>
                                <textarea
                                    placeholder="Type your message here..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    rows={6}
                                    className="contact-section-form-textarea"
                                />
                            </div>

                            {/* Submit Button */}
                            <button onClick={handleSubmit} className="contact-section-submit-button">
                                ./send_message.sh
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <>
            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <TerminalContainer title="developer@portfolio:~/contact$">
                    {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}
                </TerminalContainer>
            </div>

            <style>{`
                .contact-section-content {
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                }

                .contact-section-command-line {
                    font-size: var(--font-size-md);
                    margin-bottom: var(--spacing-lg);
                    line-height: var(--line-height-normal);
                }

                .contact-section-prompt {
                    color: var(--color-primary-dim);
                }

                .contact-section-cursor-blink {
                    display: inline-block;
                    margin-left: 2px;
                    animation: contact-section-blink 0.7s infinite;
                }

                @keyframes contact-section-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                .contact-section-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-2xl);
                    animation: contact-section-fadeIn 0.6s ease forwards;
                }

                @keyframes contact-section-fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .contact-section-column {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .contact-section-heading {
                    font-size: var(--font-size-md);
                    margin-bottom: var(--spacing-sm);
                    color: var(--color-primary);
                    font-weight: normal;
                    line-height: var(--line-height-normal);
                }

                .contact-section-links {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-sm);
                }

                .contact-section-link {
                    border: 1px solid var(--color-primary-dimmer);
                    padding: var(--spacing-sm);
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    transition: all var(--transition-fast);
                    cursor: pointer;
                    text-decoration: none;
                    color: var(--color-primary);
                    min-height: var(--min-touch-target);
                }

                .contact-section-link:hover,
                .contact-section-link:focus {
                    border-color: var(--color-primary);
                    background: rgba(0, 255, 65, 0.05);
                }

                .contact-section-link svg {
                    flex-shrink: 0;
                    width: 20px;
                    height: 20px;
                }

                .contact-section-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .contact-section-label {
                    font-size: 10px;
                    color: var(--color-primary-dim);
                    letter-spacing: 0.5px;
                }

                .contact-section-value {
                    font-size: var(--font-size-sm);
                    color: var(--color-primary);
                }

                .contact-section-social-icons {
                    display: flex;
                    gap: var(--spacing-sm);
                    margin-top: var(--spacing-sm);
                }

                .contact-section-social-icon {
                    border: 1px solid var(--color-primary-dimmer);
                    padding: var(--spacing-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all var(--transition-fast);
                    text-decoration: none;
                    color: var(--color-primary);
                    min-width: 44px;
                    min-height: 44px;
                }

                .contact-section-social-icon:hover,
                .contact-section-social-icon:focus {
                    border-color: var(--color-primary);
                    background: rgba(0, 255, 65, 0.1);
                }

                .contact-section-social-icon svg {
                    width: 16px;
                    height: 16px;
                }

                .contact-section-form {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md);
                }

                .contact-section-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .contact-section-form-label {
                    font-size: var(--font-size-xs);
                    color: var(--color-primary-dim);
                    display: block;
                }

                .contact-section-form-input,
                .contact-section-form-textarea {
                    width: 100%;
                    padding: var(--spacing-sm);
                    background: transparent;
                    border: 1px solid var(--color-primary-dimmer);
                    color: var(--color-primary);
                    font-size: var(--font-size-sm);
                    font-family: var(--font-mono);
                    outline: none;
                    transition: border-color var(--transition-fast);
                    min-height: var(--min-touch-target);
                }

                .contact-section-form-input:focus,
                .contact-section-form-textarea:focus {
                    border-color: var(--color-primary);
                }

                .contact-section-form-input::placeholder,
                .contact-section-form-textarea::placeholder {
                    color: rgba(0, 255, 65, 0.3);
                }

                .contact-section-form-textarea {
                    resize: vertical;
                    min-height: 120px;
                    line-height: var(--line-height-normal);
                }

                .contact-section-submit-button {
                    padding: var(--spacing-sm) var(--spacing-lg);
                    background: transparent;
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary);
                    font-size: var(--font-size-sm);
                    font-family: var(--font-mono);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    min-height: var(--min-touch-target);
                    align-self: flex-start;
                }

                .contact-section-submit-button:hover,
                .contact-section-submit-button:focus {
                    background: rgba(0, 255, 65, 0.1);
                    box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
                }

                @media (min-width: 768px) {
                    .contact-section-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .contact-section-heading {
                        font-size: var(--font-size-md);
                    }

                    .contact-section-value {
                        font-size: var(--font-size-sm);
                    }
                }

                @media (max-width: 480px) {
                    .contact-section-command-line {
                        font-size: var(--font-size-sm);
                    }

                    .contact-section-heading {
                        font-size: var(--font-size-sm);
                    }

                    .contact-section-link {
                        padding: 10px;
                    }

                    .contact-section-link svg {
                        width: 18px;
                        height: 18px;
                    }

                    .contact-section-label {
                        font-size: 9px;
                    }

                    .contact-section-value {
                        font-size: 11px;
                    }

                    .contact-section-social-icon {
                        min-width: 40px;
                        min-height: 40px;
                        padding: 10px;
                    }

                    .contact-section-social-icon svg {
                        width: 14px;
                        height: 14px;
                    }

                    .contact-section-form-input,
                    .contact-section-form-textarea {
                        font-size: 12px;
                    }

                    .contact-section-submit-button {
                        width: 100%;
                    }
                }
            `}</style>
        </>
    )
}