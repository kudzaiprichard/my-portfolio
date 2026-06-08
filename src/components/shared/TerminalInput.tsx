// components/shared/TerminalInput.tsx
"use client"

import { useRef } from 'react'
import AgentOrb from '@/src/components/shared/AgentOrb'
import { useVoiceContext } from '@/src/components/shared/VoiceProvider'
import type { TerminalLine } from '@/src/hooks/useTerminalInput'

/** Recruiter-focused next steps shown after the AI has answered. Each maps to a real command. */
const QUICK_ACTIONS: ReadonlyArray<{ label: string; command: string }> = [
    { label: 'download CV', command: 'cv' },
    { label: 'view projects', command: 'cd projects' },
    { label: 'experience', command: 'cd experience' },
    { label: 'get in touch', command: 'cd contact' },
]

function MicIcon() {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="2.5" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="21.5" />
            <line x1="8.5" y1="21.5" x2="15.5" y2="21.5" />
        </svg>
    )
}

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
    /** Variant of the in-progress typing line ('agent' styles it as an AI reply). */
    responseVariant?: 'agent'
    /** When true, render the quick-action / suggestion chips. */
    showChips?: boolean
    /** Contextual follow-up questions from the agent. When present, they replace the defaults. */
    suggestions?: readonly string[]
    /** Run a command (or ask a question) when a chip is clicked. */
    onChip?: (command: string) => void
    /** Submit a spoken transcript (reply will be read aloud). */
    onVoiceSubmit?: (command: string) => void
}

export default function TerminalInput({
    history,
    inputText,
    isTypingResponse,
    responseText,
    prompt = '$ ',
    suggestion = '',
    showHint = false,
    responseVariant,
    showChips = false,
    suggestions = [],
    onChip,
    onVoiceSubmit,
}: TerminalInputProps) {
    const voice = useVoiceContext()

    // ── Mobile keyboard support ──
    // The terminal has no real text field — input is captured by a document-level
    // keydown listener (see useTerminalInput). That works for hardware keyboards
    // but mobile browsers only raise the soft keyboard when a focusable form
    // element is focused. This hidden <input> ("keyboard proxy") exists purely to
    // be focused on tap so the on-screen keyboard appears; its keystrokes flow to
    // the same document handler (which is exempted for data-terminal-proxy).
    const proxyRef = useRef<HTMLInputElement>(null)

    // Focus the proxy when the visitor taps the terminal — must run inside the
    // tap gesture for mobile to open the keyboard. Ignore taps on the mic / chips
    // / cancel buttons so those keep working and don't pop the keyboard.
    const focusKeyboard = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return
        proxyRef.current?.focus()
    }

    // Bridge for soft keyboards (notably Android/Gboard) that emit unreliable
    // keydown events: translate each inserted character into the synthetic
    // keydown the document handler already knows how to process, then clear the
    // field. Keeping it empty also makes Backspace fire a real keydown on Android.
    const handleProxyInput = (e: React.FormEvent<HTMLInputElement>) => {
        const el = e.currentTarget
        for (const ch of el.value) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }))
        }
        el.value = ''
    }

    // The input line morphs into the listening orb while the mic is capturing.
    // Thinking/replying are shown by the conversation itself, so the orb is
    // intentionally listening-only.
    const voiceUI = voice.canListen && voice.listening

    const hintVisible = showHint && history.length === 0 && !isTypingResponse && !inputText && !voiceUI
    const chipsVisible = showChips && !isTypingResponse && !voiceUI
    // Contextual suggestions from the agent take priority; otherwise the default CTAs.
    const chipItems = suggestions.length > 0
        ? suggestions.map(s => ({ label: s, command: s }))
        : QUICK_ACTIONS

    const cancelVoice = () => {
        if (voice.listening) voice.stopListening()
        else voice.cancelSpeak()
    }

    return (
        <>
            <div className="terminal-interactive" onClick={focusKeyboard}>
                {/* Hidden field that raises the mobile soft keyboard on tap. */}
                <input
                    ref={proxyRef}
                    data-terminal-proxy="true"
                    className="terminal-kbd-proxy"
                    type="text"
                    inputMode="text"
                    enterKeyHint="send"
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    tabIndex={-1}
                    aria-hidden="true"
                    onInput={handleProxyInput}
                />

                {history.map((line) => (
                    <div
                        key={line.id}
                        className={
                            `terminal-interactive-line terminal-interactive-${line.type}` +
                            (line.variant === 'agent' ? ' terminal-interactive-agent' : '')
                        }
                    >
                        {line.type === 'input' && (
                            <span className="terminal-interactive-prompt">{line.prompt || prompt}</span>
                        )}
                        {line.variant === 'agent' && (
                            <span className="terminal-interactive-agent-marker" aria-hidden="true">◆ </span>
                        )}
                        <span className="terminal-interactive-text">{line.text}</span>
                    </div>
                ))}

                {isTypingResponse && responseText && (
                    <div className={
                        'terminal-interactive-line terminal-interactive-output' +
                        (responseVariant === 'agent' ? ' terminal-interactive-agent' : '')
                    }>
                        {responseVariant === 'agent' && (
                            <span className="terminal-interactive-agent-marker" aria-hidden="true">◆ </span>
                        )}
                        <span className="terminal-interactive-text">{responseText}</span>
                        <span className="terminal-interactive-cursor">|</span>
                    </div>
                )}

                {/* Voice mode: while listening, the input line becomes the orb
                    plus the live transcript. */}
                {voiceUI && (
                    <div className="terminal-voice-row">
                        <AgentOrb state="listening" />
                        <span className={`terminal-voice-status${voice.interim ? ' is-transcript' : ''}`}>
                            {voice.interim || 'Listening… (pause when you\'re done)'}
                        </span>
                        <button
                            type="button"
                            className="terminal-voice-cancel"
                            onClick={(e) => { e.currentTarget.blur(); cancelVoice() }}
                            aria-label="Stop and send"
                            data-tip="Stop & send"
                        >
                            ■
                        </button>
                    </div>
                )}

                {/* Text mode: prompt with an inline mic button on the left. */}
                {!voiceUI && !isTypingResponse && (
                    <div className="terminal-interactive-line terminal-interactive-active">
                        {voice.canListen && onVoiceSubmit && (
                            <button
                                type="button"
                                className="terminal-mic-btn"
                                onClick={(e) => { e.currentTarget.blur(); voice.startListening(onVoiceSubmit) }}
                                aria-label="Speak to the assistant"
                                data-tip="Tap to speak"
                            >
                                <MicIcon />
                            </button>
                        )}
                        <span className="terminal-interactive-prompt">{prompt}</span>
                        <span className="terminal-interactive-text">{inputText}</span>
                        {suggestion && (
                            <span className="terminal-interactive-suggestion" aria-hidden="true">{suggestion}</span>
                        )}
                        <span className="terminal-interactive-cursor">|</span>
                    </div>
                )}

                {chipsVisible && (
                    <div className="terminal-interactive-chips" role="group" aria-label="Suggestions">
                        {chipItems.map(({ label, command }) => (
                            <button
                                key={command}
                                type="button"
                                className="terminal-interactive-chip"
                                onClick={(e) => {
                                    // Blur so the document-level keydown handler isn't
                                    // suppressed (it ignores events while a button is focused).
                                    e.currentTarget.blur()
                                    onChip?.(command)
                                }}
                            >
                                ▸ {label}
                            </button>
                        ))}
                    </div>
                )}

                {hintVisible && (
                    <div className="terminal-interactive-hint" aria-hidden="true">
                        ask me anything — type, or tap the mic to speak · &apos;tour&apos; for a walkthrough
                    </div>
                )}
            </div>

            <style>{`
                .terminal-interactive {
                    position: relative;
                    margin-top: var(--spacing-lg);
                    padding-top: var(--spacing-md);
                    border-top: 1px solid var(--color-primary-dimmest);
                }

                /* Hidden keyboard proxy — focusable so mobile raises the soft
                   keyboard, but invisible. font-size:16px prevents iOS from
                   auto-zooming on focus; pointer-events:none because focus is
                   driven programmatically from the terminal tap handler. */
                .terminal-kbd-proxy {
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: 0;
                    border: 0;
                    opacity: 0;
                    font-size: 16px;
                    background: transparent;
                    color: transparent;
                    caret-color: transparent;
                    pointer-events: none;
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

                /* ── AI agent reply — reads as "spoken" by Kudzai, not raw output ── */
                .terminal-interactive-agent {
                    padding-left: var(--spacing-sm);
                    border-left: 2px solid var(--color-primary-dim);
                }

                .terminal-interactive-agent .terminal-interactive-text {
                    color: var(--color-primary);
                }

                .terminal-interactive-agent-marker {
                    color: var(--color-primary-dim);
                    user-select: none;
                }

                /* ── Quick-action chips — recruiter conversion path after an AI reply ── */
                .terminal-interactive-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-sm);
                    margin-top: var(--spacing-md);
                }

                .terminal-interactive-chip {
                    font-family: var(--font-mono);
                    font-size: var(--font-size-sm);
                    color: var(--color-primary-dim);
                    background: transparent;
                    border: 1px solid var(--color-primary-dimmest);
                    border-radius: 2px;
                    padding: 4px 10px;
                    cursor: pointer;
                    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
                    -webkit-tap-highlight-color: transparent;
                    white-space: nowrap;
                }

                .terminal-interactive-chip:hover,
                .terminal-interactive-chip:focus-visible {
                    color: var(--color-primary);
                    border-color: var(--color-primary-dim);
                    background: var(--color-primary-dimmest);
                    outline: none;
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
                    display: flex;
                    align-items: center;
                    cursor: text;
                }

                /* ── Inline mic button (left of the prompt) ── */
                .terminal-mic-btn {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 22px;
                    margin-right: 8px;
                    padding: 0;
                    flex: 0 0 auto;
                    color: var(--color-primary-dim);
                    background: transparent;
                    border: 1px solid var(--color-primary-dimmest);
                    border-radius: 5px;
                    cursor: pointer;
                    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
                    -webkit-tap-highlight-color: transparent;
                }
                .terminal-mic-btn:hover,
                .terminal-mic-btn:focus-visible {
                    color: var(--color-primary);
                    background: var(--color-primary-dimmest);
                    border-color: var(--color-primary-dim);
                    outline: none;
                }
                /* Gentle attention pulse: the icon breathes and a green ring
                   expands + fades, so visitors notice they can speak. */
                .terminal-mic-btn svg {
                    animation: terminal-mic-breathe 2.4s ease-in-out infinite;
                }
                .terminal-mic-btn::before {
                    content: '';
                    position: absolute;
                    inset: -1px;
                    border-radius: 6px;
                    border: 1px solid var(--color-primary);
                    opacity: 0;
                    pointer-events: none;
                    animation: terminal-mic-impulse 2.4s ease-out infinite;
                }
                .terminal-mic-btn:hover svg,
                .terminal-mic-btn:hover::before,
                .terminal-mic-btn:focus-visible svg,
                .terminal-mic-btn:focus-visible::before {
                    animation-play-state: paused;
                }
                @keyframes terminal-mic-breathe {
                    0%, 100% { transform: scale(1); }
                    50%      { transform: scale(1.14); }
                }
                @keyframes terminal-mic-impulse {
                    0%       { opacity: 0.5; transform: scale(1); }
                    70%, 100% { opacity: 0; transform: scale(1.55); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .terminal-mic-btn svg,
                    .terminal-mic-btn::before { animation: none; }
                    .terminal-mic-btn::before { display: none; }
                }

                /* ── Voice mode row (replaces the input line) ── */
                .terminal-voice-row {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    min-height: 1.5em;
                    padding: 2px 0;
                }
                .terminal-voice-status {
                    flex: 1 1 auto;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-family: var(--font-mono);
                    font-size: var(--font-size-sm);
                    color: var(--color-primary-dim);
                    letter-spacing: 0.03em;
                }
                .terminal-voice-status.is-transcript {
                    color: var(--color-primary);
                }
                .terminal-voice-cancel {
                    position: relative;
                    margin-left: auto;
                    width: 22px;
                    height: 22px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-primary-dim);
                    background: transparent;
                    border: 1px solid var(--color-primary-dimmest);
                    border-radius: 5px;
                    font-size: var(--font-size-xs);
                    cursor: pointer;
                    transition: color 0.15s ease, border-color 0.15s ease;
                    -webkit-tap-highlight-color: transparent;
                }
                .terminal-voice-cancel:hover,
                .terminal-voice-cancel:focus-visible {
                    color: var(--color-primary);
                    border-color: var(--color-primary-dim);
                    outline: none;
                }

                /* ── Tooltip for mic / cancel (data-tip) ── */
                .terminal-mic-btn::after,
                .terminal-voice-cancel::after {
                    content: attr(data-tip);
                    position: absolute;
                    bottom: calc(100% + 6px);
                    white-space: nowrap;
                    font-family: var(--font-mono);
                    font-size: var(--font-size-xs);
                    color: var(--color-primary);
                    background: var(--color-bg-dark, #0a0f0a);
                    border: 1px solid var(--color-primary-dimmest);
                    padding: 2px 7px;
                    border-radius: 4px;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(2px);
                    transition: opacity 0.15s ease, transform 0.15s ease;
                    z-index: 5;
                }
                /* Mic is at the far left → anchor tooltip to the left edge so it
                   never clips off-screen. Cancel is at the right → anchor right. */
                .terminal-mic-btn::after { left: 0; }
                .terminal-voice-cancel::after { right: 0; }

                .terminal-mic-btn:hover::after,
                .terminal-mic-btn:focus-visible::after,
                .terminal-voice-cancel:hover::after,
                .terminal-voice-cancel:focus-visible::after {
                    opacity: 1;
                    transform: translateY(0);
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
