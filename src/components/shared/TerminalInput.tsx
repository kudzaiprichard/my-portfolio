// components/shared/TerminalInput.tsx
"use client"

import type { TerminalLine } from '@/src/hooks/useTerminalInput'

interface TerminalInputProps {
    history: TerminalLine[]
    inputText: string
    isTypingResponse: boolean
    responseText: string
    prompt?: string
}

export default function TerminalInput({
    history,
    inputText,
    isTypingResponse,
    responseText,
    prompt = '$ ',
}: TerminalInputProps) {
    return (
        <>
            <div className="terminal-interactive">
                {history.map((line) => (
                    <div key={line.id} className={`terminal-interactive-line terminal-interactive-${line.type}`}>
                        {line.type === 'input' && (
                            <span className="terminal-interactive-prompt">{line.prompt || prompt}</span>
                        )}
                        <span className="terminal-interactive-text">{line.text}</span>
                    </div>
                ))}

                {isTypingResponse && responseText && (
                    <div className="terminal-interactive-line terminal-interactive-output">
                        <span className="terminal-interactive-text">{responseText}</span>
                        <span className="terminal-interactive-cursor">|</span>
                    </div>
                )}

                {!isTypingResponse && (
                    <div className="terminal-interactive-line terminal-interactive-active">
                        <span className="terminal-interactive-prompt">{prompt}</span>
                        <span className="terminal-interactive-text">{inputText}</span>
                        <span className="terminal-interactive-cursor">|</span>
                    </div>
                )}
            </div>

            <style>{`
                .terminal-interactive {
                    margin-top: var(--spacing-lg);
                    padding-top: var(--spacing-md);
                    border-top: 1px solid var(--color-primary-dimmest);
                }

                .terminal-interactive-line {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    margin-bottom: 2px;
                    font-family: var(--font-mono);
                    color: var(--color-primary);
                }

                .terminal-interactive-output .terminal-interactive-text {
                    color: var(--color-primary-dim);
                }

                .terminal-interactive-prompt {
                    color: var(--color-primary-dim);
                }

                .terminal-interactive-text {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .terminal-interactive-cursor {
                    display: inline-block;
                    margin-left: 2px;
                    animation: terminal-interactive-blink 0.7s infinite;
                }

                @keyframes terminal-interactive-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                .terminal-interactive-active {
                    min-height: 1.5em;
                }

                @media (max-width: 480px) {
                    .terminal-interactive-line {
                        font-size: var(--font-size-sm);
                    }
                }
            `}</style>
        </>
    )
}
