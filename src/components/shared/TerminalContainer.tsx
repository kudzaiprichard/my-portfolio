// components/shared/TerminalContainer.tsx
"use client"

import { useRef, useEffect } from 'react'
import type { TerminalContainerProps } from '@/src/types'
import GlitchText from '@/src/components/shared/GlitchText'

export default function TerminalContainer({
                                              title = 'developer@portfolio:~$',
                                              titleContent,
                                              children,
                                              className = '',
                                              ariaLabel,
                                          }: TerminalContainerProps & { ariaLabel?: string }) {
    const terminalContentRef = useRef<HTMLDivElement>(null)
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Keep the newest output in view. Watches the DOM rather than React
    // children, because typing is written straight into text nodes. Debounced
    // to at most one scroll per 150 ms. Ignored: section intros
    // ([data-reveal]), which SectionReveal scrolls itself.
    useEffect(() => {
        const content = terminalContentRef.current
        if (!content) return

        const scrollToBottom = () => {
            if (scrollTimerRef.current) return
            scrollTimerRef.current = setTimeout(() => {
                scrollTimerRef.current = null
                content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' })
            }, 150)
        }

        const observer = new MutationObserver(records => {
            // Only follow output the visitor caused: nothing until the shell
            // has history, so mounting the shell (or the skip hint going away)
            // never scrolls the intro's first lines out of view
            if (!content.querySelector('.terminal-interactive-input, .terminal-interactive-output')) return
            const meaningful = records.some(r => {
                const node = r.target.nodeType === Node.ELEMENT_NODE ? r.target as Element : r.target.parentElement
                return !node?.closest('[data-reveal]')
            })
            if (meaningful) scrollToBottom()
        })
        observer.observe(content, { childList: true, subtree: true, characterData: true })

        return () => {
            observer.disconnect()
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
        }
    }, [])

    return (
        <>
            <div className={`terminal-container ${className}`} role="region" aria-label={ariaLabel || title}>
                <div className="terminal-header">
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                    <span className="terminal-title">{titleContent ?? <GlitchText text={title} />}</span>
                </div>

                <div ref={terminalContentRef} className="terminal-content">
                    {children}
                </div>
            </div>

            <style>{`
                .terminal-container {
                    min-height: clamp(250px, 40vh, 300px);
                    max-height: clamp(70vh, 85vh, 90vh);
                    max-height: clamp(70dvh, 85dvh, 90dvh);
                    display: flex;
                    flex-direction: column;
                }

                .terminal-content {
                    flex: 1;
                    /* Lets the content shrink to the box and scroll inside it */
                    min-height: 0;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: clamp(12px, 3vw, 20px);
                    padding-right: clamp(8px, 2vw, 10px);
                }

                .terminal-content::-webkit-scrollbar {
                    width: clamp(4px, 1vw, 6px);
                }

                .terminal-content::-webkit-scrollbar-track {
                    background: rgb(var(--glow) / 0.05);
                }

                .terminal-content::-webkit-scrollbar-thumb {
                    background: rgb(var(--glow) / 0.2);
                    border-radius: 3px;
                }

                .terminal-content::-webkit-scrollbar-thumb:hover {
                    background: var(--bright);
                }

                /* Standard properties for Firefox only: Chrome/Edge ignore the custom
                   ::-webkit-scrollbar styles above whenever these are set, and draw
                   their wide native scrollbar (with arrow buttons) instead */
                @supports not selector(::-webkit-scrollbar) {
                    .terminal-content {
                        scrollbar-width: thin;
                        scrollbar-color: rgb(var(--glow) / 0.2) rgb(var(--glow) / 0.05);
                    }
                }

                @media (max-width: 480px) {
                    .terminal-container {
                        min-height: 200px;
                        max-height: 75vh;
                    }

                    .terminal-content {
                        padding: 12px;
                        padding-right: 8px;
                    }

                    .terminal-content::-webkit-scrollbar {
                        width: 3px;
                    }
                }

                @media (min-width: 481px) and (max-width: 768px) {
                    .terminal-container {
                        min-height: 280px;
                        max-height: 80vh;
                    }

                    .terminal-content {
                        padding: 16px;
                        padding-right: 10px;
                    }
                }

                @media (min-width: 1024px) {
                    .terminal-container {
                        min-height: 300px;
                        max-height: 85vh;
                        max-height: 85dvh;
                    }

                    .terminal-content {
                        padding: 20px;
                        padding-right: 12px;
                    }
                }

                @media (hover: none) and (pointer: coarse) {
                    .terminal-content {
                        padding-right: 12px;
                        -webkit-overflow-scrolling: touch;
                    }

                    .terminal-content::-webkit-scrollbar {
                        width: 0;
                        display: none;
                    }

                    @supports not selector(::-webkit-scrollbar) {
                        .terminal-content {
                            scrollbar-width: none;
                        }
                    }
                }
            `}</style>
        </>
    )
}
