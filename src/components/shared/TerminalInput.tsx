// components/shared/TerminalInput.tsx
"use client"

import { useRef, useSyncExternalStore } from 'react'
import AgentOrb from '@/src/components/shared/AgentOrb'
import { getScreenReaderMode, subscribeScreenReaderMode } from '@/src/lib/screenReaderStore'
import { useVoiceContext } from '@/src/components/shared/VoiceProvider'
import type { TerminalView } from '@/src/hooks/useTerminalInput'
import { GAMES } from '@/src/terminal/commands/help'

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

/** Status tags inside output text get their theme role colour. */
const STATUS_TAG = /(\[(?:LIVE|WIP|BETA|HACKATHON)\])/
const TAG_CLASS: Record<string, string> = {
    '[LIVE]': 'terminal-tag-live',
    '[WIP]': 'terminal-tag-wip',
    '[BETA]': 'terminal-tag-beta',
    '[HACKATHON]': 'terminal-tag-wip',
}

function withTags(text: string) {
    if (!STATUS_TAG.test(text)) return text
    return text.split(STATUS_TAG).map((part, i) =>
        TAG_CLASS[part] ? <span key={i} className={TAG_CLASS[part]}>{part}</span> : part
    )
}

/*
 * Structured output (terminal/format): `┌─ title`, `│  body`, `└──`. A body
 * row is a paragraph, a `▸ bullet`, a `# sub-heading` or a `Label  value`
 * row. The bar is drawn as one continuous border and wrapped text hangs
 * under its own first character, so long lines stay readable.
 */
const BOX_TOP = /^┌─ (.*)$/
const BOX_END = /^└─+$/
const BOX_ROW = /^│(?: {2}(.*))?$/
/** A label of up to ~24 characters, two or more spaces, then the value */
const FIELD = /^(\S(?:.{0,22}?\S)?)( {2,})(\S.*)$/

function BoxBody({ body }: { body: string }) {
    if (!body) return <span className="terminal-blank" />
    if (body.startsWith('▸ ')) {
        return (
            <span className="terminal-bullet">
                <span className="terminal-bullet-mark" aria-hidden="true">▸ </span>{withTags(body.slice(2))}
            </span>
        )
    }
    if (body.startsWith('# ')) return <span className="terminal-comment">{body}</span>
    const field = FIELD.exec(body)
    if (field) {
        return (
            <span className="terminal-field">
                <span className="terminal-field-label">{field[1]}{field[2]}</span>
                <span className="terminal-field-value">{withTags(field[3])}</span>
            </span>
        )
    }
    return <span className="terminal-para">{withTags(body)}</span>
}

function OutputRow({ text }: { text: string }) {
    const top = BOX_TOP.exec(text)
    if (top) {
        return (
            <span className="terminal-box-top">
                <span className="terminal-box-glyph" aria-hidden="true">┌─ </span>
                <span className="terminal-box-title">{withTags(top[1])}</span>
            </span>
        )
    }
    if (BOX_END.test(text)) return <span className="terminal-box-end" aria-hidden="true">{text}</span>
    const row = BOX_ROW.exec(text)
    if (row) return <span className="terminal-box-row"><BoxBody body={row[1] ?? ''} /></span>
    if (!text) return <span className="terminal-blank" />
    return <>{withTags(text)}</>
}

/** One history entry; a multi-line entry (a flushed reply) renders row by row. */
function renderOutputText(text: string) {
    if (!text.includes('\n')) return <OutputRow text={text} />
    return text.split('\n').map((line, i) => <span key={i} className="terminal-output-row"><OutputRow text={line} /></span>)
}

/** A box row continues the bar: no gap between it and the next line. */
const isBoxLine = (text: string) => /^[┌│]/.test(text)

/** What a screen reader hears: the text without the box-drawing frame. */
const spoken = (text: string) => text
    .split('\n')
    .map(l => l.replace(/^(?:┌─ |│ {0,2}|└─+$)/, '').replace(/^▸ /, ''))
    .filter(Boolean)
    .join('\n')

const VOICE_PRIVACY = 'Voice input in Chrome sends your audio to Google for recognition.'

/** The agent says what it is, once, above its first reply. */
function AgentLabel() {
    return (
        <div className="terminal-interactive-agent-label">
            ◆ AI agent · answers from this site&apos;s content
        </div>
    )
}

/** Shell errors ("bash: foo: command not found") read in the error colour. */
const isErrorLine = (text: string) => text.startsWith('bash: ')

interface TerminalInputProps {
    /** The section's terminal session view (from useTerminalInput). */
    terminal: TerminalView
    prompt?: string
    /** When true, renders a faint discoverability hint line below the active input. Hidden once history is non-empty. */
    showHint?: boolean
    /** When true, render the quick-action / suggestion chips. */
    showChips?: boolean
    /** When true, render the "play" row: one chip per game (the main terminal) */
    showGames?: boolean
    /** The faint hint under the input (defaults to the terminal's) */
    hintText?: string
}

const DEFAULT_HINT = "ask me anything — type, or tap the mic to speak · 'tour' for a walkthrough · 'games' to play"

export default function TerminalInput({
    terminal,
    prompt = '$ ',
    showHint = false,
    showChips = false,
    showGames = false,
    hintText = DEFAULT_HINT,
}: TerminalInputProps) {
    const voice = useVoiceContext()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const {
        sectionId, history, inputText, isTypingResponse, responseVariant, suggestion, agentSuggestions,
        attachInput: attachSessionInput, attachLiveText, setInputText, submitCommand, submitVoiceCommand,
    } = terminal

    // A real, visible text field: screen readers, autocorrect, dictation, IME and
    // mobile soft keyboards all work natively. Tapping anywhere in the terminal
    // focuses it (inside the tap gesture, so mobile raises the keyboard). Taps on
    // the mic / chips / cancel buttons are left alone.
    const focusInput = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return
        inputRef.current?.focus()
    }

    const attachInput = (el: HTMLInputElement | null) => {
        inputRef.current = el
        attachSessionInput(el)
    }

    // Send = Enter, through the page-level key handler (so every mode —
    // tour, contact flow, games — behaves exactly as with the key). The
    // handler routes by focus, so the input must have it first.
    const sendEnter = () => {
        const el = inputRef.current
        if (!el) return
        el.focus({ preventScroll: true })
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }

    // Soft keyboards that don't emit an Enter keydown still submit the form
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sendEnter()
    }

    // The input line morphs into the listening orb while the mic is capturing.
    // Thinking/replying are shown by the conversation itself, so the orb is
    // intentionally listening-only.
    const voiceUI = voice.canListen && voice.listening

    const hintVisible = showHint && history.length === 0 && !isTypingResponse && !inputText && !voiceUI
    const chipsVisible = showChips && !isTypingResponse && !voiceUI
    // Contextual suggestions from the agent take priority; otherwise the default CTAs.
    const chipItems = agentSuggestions.length > 0
        ? agentSuggestions.map(s => ({ label: s, command: s }))
        : QUICK_ACTIONS

    // ── Announcements (aria-live="polite") ──
    // Lines after the visitor's last command: agent replies are announced once
    // they finish (they only enter history whole); in screen-reader mode every
    // output line is mirrored as it prints. Each line is its own node, so a
    // screen reader reads only what was just added.
    const srMode = useSyncExternalStore(subscribeScreenReaderMode, getScreenReaderMode, () => false)
    const lastInput = history.findLastIndex(l => l.type === 'input')
    const announced = history.slice(lastInput + 1).filter(l => l.type === 'output' && (srMode || l.variant === 'agent') && spoken(l.text).trim())

    // The agent is labelled plainly, once, above its first reply
    const firstAgentId = history.find(l => l.variant === 'agent')?.id

    const cancelVoice = () => {
        if (voice.listening) voice.stopListening()
        else voice.cancelSpeak()
    }

    return (
        <>
            <div className="terminal-interactive" onClick={focusInput}>
                {history.map((line) => (<div key={line.id} style={{ display: 'contents' }}>
                    {line.id === firstAgentId && <AgentLabel />}
                    <div
                        className={
                            `terminal-interactive-line terminal-interactive-${line.type}` +
                            (line.variant === 'agent' ? ' terminal-interactive-agent' : '') +
                            (line.type === 'output' && isErrorLine(line.text) ? ' terminal-interactive-error' : '') +
                            (line.type === 'output' && isBoxLine(line.text) ? ' terminal-interactive-boxline' : '') +
                            (line.fresh ? ' ln-in' : '')
                        }
                    >
                        {line.type === 'input' && (
                            <span className="terminal-interactive-prompt">{line.prompt || prompt}</span>
                        )}
                        {line.variant === 'agent' && (
                            <span className="terminal-interactive-agent-marker" aria-hidden="true">◆ </span>
                        )}
                        <span className="terminal-interactive-text">
                            {line.type === 'output' ? renderOutputText(line.text) : line.text}
                        </span>
                    </div>
                </div>))}

                {/* The in-progress reply. Its text is written by the session's
                    typewriter straight into the span, not through React. */}
                {isTypingResponse && responseVariant === 'agent' && firstAgentId === undefined && <AgentLabel />}
                {isTypingResponse && (
                    <div className={
                        'terminal-interactive-line terminal-interactive-output terminal-interactive-live' +
                        (responseVariant === 'agent' ? ' terminal-interactive-agent' : '')
                    }>
                        {responseVariant === 'agent' && (
                            <span className="terminal-interactive-agent-marker" aria-hidden="true">◆ </span>
                        )}
                        <span ref={attachLiveText} className="terminal-interactive-text" />
                        <span className="terminal-interactive-cursor" aria-hidden="true">|</span>
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
                        <span className="terminal-voice-privacy">{VOICE_PRIVACY}</span>
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
                        {voice.canListen && (
                            <button
                                type="button"
                                className="terminal-mic-btn"
                                onClick={(e) => { e.currentTarget.blur(); voice.startListening(submitVoiceCommand) }}
                                aria-label="Speak to the assistant"
                                aria-describedby={`${sectionId}-voice-privacy`}
                                data-tip="Tap to speak"
                            >
                                <MicIcon />
                            </button>
                        )}
                        <span className="terminal-interactive-prompt" aria-hidden="true">{prompt}</span>
                        <form className="terminal-interactive-form" onSubmit={handleSubmit}>
                            <input
                                ref={attachInput}
                                data-terminal-input={sectionId}
                                className="terminal-interactive-field"
                                type="text"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                style={{ '--input-chars': inputText.length } as React.CSSProperties}
                                aria-label={`Terminal command (${prompt.trim()})`}
                                inputMode="text"
                                enterKeyHint="send"
                                autoCapitalize="off"
                                autoCorrect="off"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </form>
                        {suggestion && (
                            <span className="terminal-interactive-suggestion" aria-hidden="true">{suggestion}</span>
                        )}
                        <button
                            type="button"
                            className="terminal-interactive-send"
                            onClick={sendEnter}
                            aria-label="Send command"
                            title="Send (Enter)"
                            disabled={!inputText.trim()}
                        >
                            ↵
                        </button>
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
                                    e.currentTarget.blur()
                                    submitCommand(command)
                                }}
                            >
                                ▸ {label}
                            </button>
                        ))}
                    </div>
                )}

                {showGames && chipsVisible && (
                    <div className="terminal-interactive-chips terminal-interactive-games" role="group" aria-label="Games">
                        <span className="terminal-interactive-games-label" aria-hidden="true">play</span>
                        {GAMES.map(({ label, command }) => (
                            <button
                                key={command}
                                type="button"
                                className="terminal-interactive-chip terminal-interactive-game"
                                onClick={(e) => {
                                    e.currentTarget.blur()
                                    submitCommand(command)
                                }}
                            >
                                ▸ {label}
                            </button>
                        ))}
                    </div>
                )}

                {hintVisible && (
                    <div className="terminal-interactive-hint" aria-hidden="true">{hintText}</div>
                )}

                {/* One line next to the mic: where voice goes */}
                {voice.canListen && !voiceUI && (
                    <div id={`${sectionId}-voice-privacy`} className="terminal-voice-privacy terminal-voice-privacy-line">
                        🎤 {VOICE_PRIVACY}
                    </div>
                )}

                <div className="sr-only" aria-live="polite">
                    {announced.map(l => <div key={l.id}>{l.variant === 'agent' ? `AI agent: ${l.text}` : spoken(l.text)}</div>)}
                </div>
                <p className="sr-only">Using a screen reader? Type screenreader on to have every line of output read as it prints.</p>
            </div>

            <style>{`
                .terminal-interactive {
                    position: relative;
                    margin-top: var(--spacing-lg);
                    padding-top: var(--spacing-md);
                    border-top: 1px solid rgb(var(--glow) / 0.2);
                }

                /* The prompt's real text field. Styled as plain terminal text;
                   it grows with its content (monospace, so 1ch per character). */
                .terminal-interactive-form {
                    display: contents;
                }
                .terminal-interactive-field {
                    font: inherit;
                    color: inherit;
                    background: transparent;
                    border: 0;
                    outline: none;
                    padding: 0;
                    margin: 0;
                    min-width: 1ch;
                    width: calc(var(--input-chars, 0) * 1ch + 1ch);
                    max-width: 100%;
                    caret-color: var(--bright);
                }
                /* Send: sits after the text, pushed to the end of the line */
                .terminal-interactive-send {
                    margin-left: auto;
                    flex: 0 0 auto;
                    background: transparent;
                    border: 1px solid rgb(var(--glow) / 0.35);
                    color: var(--bright);
                    font: inherit;
                    line-height: 1;
                    padding: 2px 9px;
                    border-radius: 2px;
                    cursor: pointer;
                }

                .terminal-interactive-send:hover:not(:disabled),
                .terminal-interactive-send:focus-visible {
                    border-color: var(--bright);
                    background: rgb(var(--glow) / 0.12);
                }

                .terminal-interactive-send:disabled {
                    color: var(--dim);
                    border-color: rgb(var(--glow) / 0.15);
                    cursor: default;
                }

                .terminal-interactive-field:focus-visible {
                    outline: none;
                    box-shadow: none;
                }
                /* iOS zooms into inputs under 16px on focus */
                @media (pointer: coarse) {
                    .terminal-interactive-field {
                        font-size: 16px;
                    }
                }

                /* The live line is written directly by the session; hide it while empty */
                .terminal-interactive-live:has(.terminal-interactive-text:empty) {
                    display: none;
                }

                .terminal-interactive-line {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    margin-bottom: 2px;
                    font-family: var(--font-mono);
                    color: var(--text);
                }

                .terminal-interactive-output .terminal-interactive-text {
                    color: var(--dim);
                }

                .terminal-interactive-error .terminal-interactive-text {
                    color: var(--error);
                }

                /* ── Structured output: boxed blocks (terminal/format) ── */
                .terminal-interactive-boxline {
                    margin-bottom: 0;
                }

                .terminal-blank {
                    display: block;
                    min-height: 1.5em;
                    min-height: 1lh;
                }

                .terminal-box-top,
                .terminal-box-end,
                .terminal-output-row {
                    display: block;
                }

                .terminal-box-glyph,
                .terminal-box-end {
                    color: var(--dim);
                }

                .terminal-box-title {
                    color: var(--bright);
                    font-weight: 600;
                }

                /* The bar sits under the centre of the ┌ / └ glyphs, and body
                   text lines up with the title (3ch in) */
                .terminal-box-row {
                    display: block;
                    margin-left: 0.5ch;
                    border-left: 1px solid var(--dim);
                    padding-left: calc(2.5ch - 1px);
                    padding-bottom: 2px;
                }

                .terminal-para,
                .terminal-field-value,
                .terminal-bullet {
                    color: var(--text);
                }

                .terminal-bullet {
                    display: block;
                    padding-left: 2ch;
                    text-indent: -2ch;
                }

                .terminal-bullet-mark {
                    color: var(--bright);
                }

                .terminal-comment {
                    color: var(--dim);
                }

                .terminal-field {
                    display: flex;
                }

                .terminal-field-label {
                    flex: none;
                    white-space: pre;
                    color: var(--dim);
                }

                .terminal-field-value {
                    flex: 1;
                    min-width: 0;
                }

                /* Narrow screens: the label sits above its value, so long
                   labels never squeeze the values into a thin column */
                @media (max-width: 560px) {
                    .terminal-field {
                        flex-direction: column;
                    }

                    .terminal-field-label {
                        white-space: normal;
                    }

                    .terminal-field-value {
                        padding-left: 2ch;
                        margin-bottom: 2px;
                    }
                }

                .terminal-tag-live { color: var(--bright); }
                .terminal-tag-wip { color: var(--warn); }
                .terminal-tag-beta { color: var(--agent); }

                /* ── AI agent reply — reads as "spoken" by Kudzai, not raw output ── */
                .terminal-interactive-agent {
                    padding-left: var(--spacing-sm);
                    border-left: 2px solid var(--agent);
                }

                .terminal-interactive-agent .terminal-interactive-text {
                    color: var(--agent);
                }

                .terminal-interactive-agent-label {
                    font-size: var(--font-size-xs);
                    color: var(--dim);
                    margin: var(--spacing-xs) 0 2px;
                    letter-spacing: 0.02em;
                }

                .terminal-voice-privacy {
                    font-size: var(--font-size-xs);
                    color: var(--dim);
                }

                .terminal-voice-privacy-line {
                    margin-top: var(--spacing-xs);
                }

                .terminal-interactive-agent-marker {
                    color: var(--agent);
                    user-select: none;
                }

                /* ── The play row: one chip per game ── */
                .terminal-interactive-games {
                    align-items: center;
                }

                .terminal-interactive-games-label {
                    color: var(--dim);
                    font-family: var(--font-mono);
                    font-size: var(--font-size-xs);
                    margin-right: 2px;
                }

                .terminal-interactive-game {
                    border-style: dashed;
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
                    color: var(--dim);
                    background: transparent;
                    border: 1px solid rgb(var(--glow) / 0.2);
                    border-radius: 2px;
                    padding: 4px 10px;
                    cursor: pointer;
                    transition: color var(--dur-quick) var(--ease-out), border-color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
                    -webkit-tap-highlight-color: transparent;
                    white-space: nowrap;
                }

                .terminal-interactive-chip:hover,
                .terminal-interactive-chip:focus-visible {
                    color: var(--text);
                    border-color: rgb(var(--glow) / 0.7);
                    background: rgb(var(--glow) / 0.2);
                    outline: none;
                }

                .terminal-interactive-prompt {
                    color: var(--bright);
                }

                .terminal-interactive-text {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .terminal-interactive-cursor {
                    display: inline-block;
                    margin-left: 2px;
                    animation: terminal-interactive-blink 0.7s infinite;
                    color: var(--bright);
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
                    color: var(--dim);
                    background: transparent;
                    border: 1px solid rgb(var(--glow) / 0.2);
                    border-radius: 5px;
                    cursor: pointer;
                    transition: color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out), border-color var(--dur-quick) var(--ease-out);
                    -webkit-tap-highlight-color: transparent;
                }
                .terminal-mic-btn:hover,
                .terminal-mic-btn:focus-visible {
                    color: var(--text);
                    background: rgb(var(--glow) / 0.2);
                    border-color: rgb(var(--glow) / 0.7);
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
                    border: 1px solid var(--bright);
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
                    color: var(--dim);
                    letter-spacing: 0.03em;
                }
                .terminal-voice-status.is-transcript {
                    color: var(--text);
                }
                .terminal-voice-cancel {
                    position: relative;
                    margin-left: auto;
                    width: 22px;
                    height: 22px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--dim);
                    background: transparent;
                    border: 1px solid rgb(var(--glow) / 0.2);
                    border-radius: 5px;
                    font-size: var(--font-size-xs);
                    cursor: pointer;
                    transition: color var(--dur-quick) var(--ease-out), border-color var(--dur-quick) var(--ease-out);
                    -webkit-tap-highlight-color: transparent;
                }
                .terminal-voice-cancel:hover,
                .terminal-voice-cancel:focus-visible {
                    color: var(--text);
                    border-color: rgb(var(--glow) / 0.7);
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
                    color: var(--text);
                    background: var(--bg);
                    border: 1px solid rgb(var(--glow) / 0.2);
                    padding: 2px 7px;
                    border-radius: 4px;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(2px);
                    transition: opacity var(--dur-quick) var(--ease-out), transform var(--dur-quick) var(--ease-out);
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
                    color: var(--dim);
                    white-space: pre-wrap;
                    user-select: none;
                    pointer-events: none;
                }

                /* Discoverability hint — only shown on a fresh prompt (empty history,
                   no input, no typing). Disappears after the first command runs. */
                .terminal-interactive-hint {
                    margin-top: var(--spacing-sm);
                    font-size: var(--font-size-xs);
                    color: var(--dim);
                    font-family: var(--font-mono);
                    line-height: var(--line-height-normal);
                    animation: terminal-interactive-hint-fadein var(--dur-crt) var(--ease-out) 0.5s both;
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
