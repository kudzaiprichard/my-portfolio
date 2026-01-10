// components/shared/TerminalContainer.tsx
"use client"

import { useRef, useEffect } from 'react'
import type { TerminalContainerProps } from '@/types'

export default function TerminalContainer({
                                              title = 'developer@portfolio:~$',
                                              children,
                                              className = '',
                                          }: TerminalContainerProps) {
    const terminalContentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const scrollToBottom = () => {
            if (terminalContentRef.current) {
                terminalContentRef.current.scrollTo({
                    top: terminalContentRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }

        scrollToBottom()
    }, [children])

    return (
        <>
            <div className={`terminal-container ${className}`}>
                <div className="terminal-header">
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                    <span className="terminal-title">{title}</span>
                </div>

                <div ref={terminalContentRef} className="terminal-content">
                    {children}
                </div>
            </div>

            <style>{`
                .terminal-container {
                    min-height: clamp(250px, 40vh, 300px);
                    max-height: clamp(70vh, 85vh, 90vh);
                    display: flex;
                    flex-direction: column;
                }

                .terminal-content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: clamp(12px, 3vw, 20px);
                    padding-right: clamp(8px, 2vw, 10px);
                }

                .terminal-content::-webkit-scrollbar {
                    width: clamp(4px, 1vw, 6px);
                }

                .terminal-content::-webkit-scrollbar-track {
                    background: rgba(0, 255, 65, 0.05);
                }

                .terminal-content::-webkit-scrollbar-thumb {
                    background: var(--color-primary-dimmest);
                    border-radius: 3px;
                }

                .terminal-content::-webkit-scrollbar-thumb:hover {
                    background: var(--color-primary);
                }

                .terminal-content {
                    scrollbar-width: thin;
                    scrollbar-color: var(--color-primary-dimmest) rgba(0, 255, 65, 0.05);
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

                    .terminal-content {
                        scrollbar-width: none;
                    }
                }
            `}</style>
        </>
    )
}