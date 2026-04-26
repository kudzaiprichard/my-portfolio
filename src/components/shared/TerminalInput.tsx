// components/shared/TerminalInput.tsx
"use client"

import type { TerminalLine } from '@/src/hooks/useTerminalInput'

interface TerminalInputProps {
    history: TerminalLine[]
    inputText: string
    isTypingResponse: boolean
    responseText: string
    prompt?: string
    /** Ghost-completion suffix rendered in dim text after inputText. Press → or End to accept. */
    suggestion?: string
    /** When true, renders a faint discoverability hint line below the active input. Hidden once history is non-empty. */
    showHint?: boolean
}

export default function TerminalInput({
    history,
    inputText,
    isTypingResponse,
    responseText,
    prompt = '$ ',
    suggestion = '',
    showHint = false,
}: TerminalInputProps) {
    const hintVisible = showHint && history.length === 0 && !isTypingResponse && !inputText

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
                        {suggestion && (
                            <span className="terminal-interactive-suggestion" aria-hidden="true">{suggestion}</span>
                        )}
                        <span className="terminal-interactive-cursor">|</span>
                    </div>
                )}

                {hintVisible && (
                    <div className="terminal-interactive-hint" aria-hidden="true">
                        type &apos;help&apos; · Tab to complete · → to accept · ↑↓ for history
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

                /* Ghost completion suffix — fish/zsh-autosuggestions style.
                   Sits between the typed text and the cursor, in dim color so
                   it reads as "preview" rather than committed input. */
                .terminal-interactive-suggestion {
                    color: var(--color-primary-dimmer);
                    white-space: pre-wrap;
                    user-select: none;
                    pointer-events: none;
                }

                /* Discoverability hint — only shown on a fresh prompt (empty history,
                   no input, no typing). Disappears after the first command runs. */
                .terminal-interactive-hint {
                    margin-top: var(--spacing-sm);
                    font-size: var(--font-size-xs);
                    color: var(--color-primary-dimmest);
                    font-family: var(--font-mono);
                    line-height: var(--line-height-normal);
                    animation: terminal-interactive-hint-fadein 1.2s ease 0.5s both;
                    user-select: none;
                }

                @keyframes terminal-interactive-hint-fadein {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .terminal-interactive-hint {
                        animation: none;
                        opacity: 1;
                    }
                }

                @media (max-width: 480px) {
                    .terminal-interactive-line {
                        font-size: var(--font-size-sm);
                    }
                    .terminal-interactive-hint {
                        font-size: 10px;
                    }
                }
            `}</style>
        </>
    )
}
