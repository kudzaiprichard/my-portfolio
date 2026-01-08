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
                // Smooth scroll to bottom
                terminalContentRef.current.scrollTo({
                    top: terminalContentRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }

        // Scroll to bottom on initial render and whenever children change
        scrollToBottom()
    }, [children])

    return (
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

            <style jsx>{`
                .terminal-container {
                    min-height: 300px; /* Minimum height for aesthetics */
                    max-height: 80vh; /* Maximum height before scrolling */
                    display: flex;
                    flex-direction: column;
                }

                .terminal-content {
                    flex: 1;
                    overflow-y: auto; /* Make the content scrollable */
                    padding: 20px;
                    padding-right: 10px; /* Add some padding to avoid content overlapping with scrollbar */
                }

                .terminal-content::-webkit-scrollbar {
                    width: 6px;
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
            `}</style>
        </div>
    )
}