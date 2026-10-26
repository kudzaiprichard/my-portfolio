// components/sections/terminal/TerminalShell.tsx
"use client"

/**
 * The full interactive terminal, mounted by SectionReveal once the boot lines
 * have typed out. Renders the shell or a full-screen mode (vim, matrix,
 * snake, wpm, train), and tells the section which mode is active
 * (data-term-mode) so the boot lines can step aside.
 */

import { useEffect, useRef } from 'react'
import TerminalInput from '@/src/components/shared/TerminalInput'
import { useVoiceContext } from '@/src/components/shared/VoiceProvider'
import { useSectionReveal } from '@/src/components/shared/reveal/SectionReveal'
import { useTerminalInput, type TerminalView } from '@/src/hooks/useTerminalInput'
import { setFxPaused } from '@/src/lib/fxState'
import { cwdToPrompt } from '@/src/terminal/commands'
import type { Direction } from '@/src/terminal/games/snake'

/** A swipe of at least this many pixels steers the snake */
const SWIPE_PX = 24

/**
 * A text board drawn cell by cell. The site font only carries Latin glyphs, so
 * box-drawing and block characters fall back to another font with other
 * widths; a fixed 1ch slot per cell keeps every column straight anyway.
 */
function Board({ text, className }: { text: string; className: string }) {
    return (
        <pre className={className}>
            {text.split('\n').map((line, r) => /^ ?[┌│└]/.test(line)
                ? <span key={r} className="terminal-board-row">{[...line].map((ch, c) => <span key={c} className="terminal-board-cell">{ch}</span>)}</span>
                : <span key={r} className="terminal-board-row">{line}</span>)}
        </pre>
    )
}

function GameButtons({ terminal, retry, pause }: { terminal: TerminalView; retry?: string; pause?: boolean }) {
    const press = (action: 'retry' | 'quit' | 'pause') => (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur()
        terminal.gameAction(action)
    }
    return (
        <div className="terminal-game-buttons">
            {retry && <button type="button" className="terminal-game-button" onClick={press('retry')}>▸ {retry}</button>}
            {pause && <button type="button" className="terminal-game-button" onClick={press('pause')}>▸ pause</button>}
            <button type="button" className="terminal-game-button" onClick={press('quit')}>▸ back to the shell</button>
        </div>
    )
}

function WpmScreen({ terminal }: { terminal: TerminalView }) {
    const view = terminal.wpm
    const fieldRef = useRef<HTMLInputElement | null>(null)
    if (!view) return <div className="terminal-section-content terminal-game-screen">Loading the race…</div>

    const chars = [...view.target].map((ch, i) => {
        const typed = view.typed[i]
        const state = typed === undefined ? (i === view.typed.length ? ' is-cursor' : '') : typed === ch ? ' is-right' : ' is-wrong'
        return <span key={i} className={`terminal-wpm-char${state}`}>{ch}</span>
    })

    return (
        <div className="terminal-section-content terminal-game-screen" onClick={() => fieldRef.current?.focus()}>
            <div className="terminal-game-title">
                <span>┌─ wpm · typing race</span>
                <span className={`terminal-wpm-clock${view.remaining <= 5 && view.started && !view.done ? ' is-low' : ''}`}>{view.remaining}s</span>
            </div>
            <p className="terminal-wpm-target" aria-hidden="true">{chars}</p>
            <p className="sr-only">Type this: {view.target}</p>
            <input
                ref={el => { fieldRef.current = el; terminal.attachInput(el) }}
                data-terminal-input="terminal"
                className="terminal-wpm-field"
                value={view.typed}
                onChange={e => terminal.wpmInput(e.target.value)}
                onPaste={e => e.preventDefault()}
                onDrop={e => e.preventDefault()}
                disabled={view.done}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Type the passage"
            />
            <div className="terminal-wpm-stats" aria-live="polite">
                <span>{view.wpm} wpm</span>
                <span>{view.accuracy}% accuracy</span>
                <span>best {view.best} wpm</span>
            </div>
            {view.done ? (
                <>
                    <p className="terminal-game-result">
                        {view.newBest ? '★ New best! ' : ''}{view.wpm} words per minute at {view.accuracy}% accuracy.
                        {view.wpm >= 60 ? ' Faster than most developers.' : ' The terminal types at about 70 wpm. Again?'}
                    </p>
                    <GameButtons terminal={terminal} retry="race again (R)" />
                </>
            ) : (
                <p className="terminal-game-hint">{view.started ? 'Keep going. Esc quits.' : 'Start typing: the clock starts on your first key. Esc quits.'}</p>
            )}
        </div>
    )
}

function TrainScreen({ terminal }: { terminal: TerminalView }) {
    return (
        <div className="terminal-section-content terminal-game-screen">
            <div className="terminal-game-title"><span>┌─ train · a neural network learning, live</span></div>
            <div aria-hidden="true"><Board className="terminal-train-plot" text={terminal.trainDisplay || 'Initialising weights…'} /></div>
            <p className="sr-only" aria-live="polite">{terminal.trainDone ? terminal.trainDisplay.split('\n')[0] : ''}</p>
            {terminal.trainDone ? (
                <>
                    <p className="terminal-game-result">
                        A 2-16-1 network (tanh, then sigmoid), trained from scratch with gradient descent on noisy two moons: no library, no server, all in your browser.
                    </p>
                    <GameButtons terminal={terminal} retry="retrain on new data (R)" />
                </>
            ) : (
                <p className="terminal-game-hint">Training… each frame is 25 gradient steps. Q stops.</p>
            )}
        </div>
    )
}

function SnakeScreen({ terminal }: { terminal: TerminalView }) {
    const start = useRef<{ x: number; y: number } | null>(null)
    const steer = (dir: Direction) => () => terminal.snakeChangeDirection(dir)

    return (
        <div className="terminal-section-content terminal-snake-screen">
            <div
                className="terminal-snake-board"
                onPointerDown={e => { start.current = { x: e.clientX, y: e.clientY } }}
                onPointerUp={e => {
                    const s = start.current
                    start.current = null
                    if (!s) return
                    const dx = e.clientX - s.x
                    const dy = e.clientY - s.y
                    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return
                    terminal.snakeChangeDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
                }}
            >
                <Board className="terminal-snake-grid" text={terminal.snakeDisplay} />
            </div>
            <div className="terminal-snake-touch">
                <div className="terminal-snake-touch-row">
                    <button className="terminal-snake-btn" onClick={steer('up')} aria-label="Up">▲</button>
                </div>
                <div className="terminal-snake-touch-row">
                    <button className="terminal-snake-btn" onClick={steer('left')} aria-label="Left">◄</button>
                    <button className="terminal-snake-btn" onClick={steer('down')} aria-label="Down">▼</button>
                    <button className="terminal-snake-btn" onClick={steer('right')} aria-label="Right">►</button>
                </div>
                <GameButtons terminal={terminal} retry="new game" pause />
            </div>
        </div>
    )
}

export default function TerminalShell() {
    const { completed, isInView } = useSectionReveal()
    const voice = useVoiceContext()
    const terminalInput = useTerminalInput({
        sectionId: 'terminal',
        isActive: completed && isInView,
        onAgentReply: voice.speak,
        onAgentInterrupt: voice.cancelSpeak,
    })
    const shellRef = useRef<HTMLDivElement>(null)
    const { mode } = terminalInput

    // Let the section hide its boot lines while a mode takes over the screen
    useEffect(() => {
        const root = shellRef.current?.closest('.section-reveal') as HTMLElement | null
        if (!root) return
        root.dataset.termMode = mode
        return () => { delete root.dataset.termMode }
    }, [mode])

    // Games and Matrix mode take over the screen: pause the particle field meanwhile
    useEffect(() => {
        const takeover = ['snake', 'adventure', 'matrix', 'wpm', 'train', 'quiz'].includes(mode)
        setFxPaused('game', takeover)
        return () => setFxPaused('game', false)
    }, [mode])

    const renderMode = () => {
        if (mode === 'vim') {
            return (
                <div className="terminal-section-content terminal-vim-screen">
                    <div className="terminal-vim-header">~ TODO.md [readonly]</div>
                    <pre className="terminal-vim-body">{terminalInput.vimContent}</pre>
                    <div className="terminal-vim-tilde">{'~\n~\n~\n~'}</div>
                    <div className="terminal-vim-footer">
                        {terminalInput.vimCommand || '-- NORMAL -- press : to enter command, :q to exit'}
                    </div>
                </div>
            )
        }

        if (mode === 'matrix') {
            return (
                <div className="terminal-section-content terminal-matrix-screen">
                    <pre className="terminal-matrix-text">{terminalInput.matrixText}</pre>
                    <div className="terminal-matrix-hint">Press any key to exit</div>
                </div>
            )
        }

        if (mode === 'snake') return <SnakeScreen terminal={terminalInput} />
        if (mode === 'wpm') return <WpmScreen terminal={terminalInput} />
        if (mode === 'train') return <TrainScreen terminal={terminalInput} />

        const ds = terminalInput.displayedSection
        const sectionPrompt = ds
            ? ds === 'home' ? 'visitor@kudzai:~$ ' : `visitor@kudzai:~/${ds}$ `
            : cwdToPrompt(terminalInput.cwd)
        const prompt = mode === 'adventure'
            ? terminalInput.adventurePrompt
            : mode === 'tour'
                ? '[tour] enter ▸ next · or ask anything · '
                : mode === 'quiz'
                    ? '[quiz] a · b · c · d ▸ '
                    : sectionPrompt

        return (
            <div className="terminal-section-content">
                <TerminalInput
                    terminal={terminalInput}
                    showHint={true}
                    prompt={prompt}
                    showChips={mode === 'normal' || mode === 'quiz'}
                    showGames={mode === 'normal'}
                />
            </div>
        )
    }

    return (
        <div ref={shellRef}>
            {renderMode()}
            <style>{`
                /* ── Game screens (wpm, train) ── */
                .terminal-game-screen {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-sm);
                    min-height: 280px;
                    font-family: var(--font-mono);
                }

                .terminal-game-title {
                    display: flex;
                    justify-content: space-between;
                    color: var(--bright);
                    font-weight: 600;
                    font-size: var(--font-size-md);
                }

                .terminal-game-hint {
                    margin: 0;
                    color: var(--dim);
                    font-size: var(--font-size-sm);
                }

                .terminal-game-result {
                    margin: 0;
                    color: var(--text);
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                }

                .terminal-game-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-xs);
                }

                .terminal-game-button {
                    background: transparent;
                    border: 1px solid rgb(var(--glow) / 0.35);
                    color: var(--bright);
                    font: inherit;
                    font-size: var(--font-size-sm);
                    padding: 6px 10px;
                    cursor: pointer;
                    transition: background var(--dur-quick) var(--ease-out);
                }

                .terminal-game-button:hover,
                .terminal-game-button:focus-visible {
                    background: rgb(var(--glow) / 0.12);
                }

                .terminal-wpm-clock {
                    color: var(--text);
                    font-variant-numeric: tabular-nums;
                }

                .terminal-wpm-clock.is-low {
                    color: var(--warn);
                }

                .terminal-wpm-target {
                    margin: 0;
                    font-size: var(--font-size-lg);
                    line-height: 1.7;
                    white-space: pre-wrap;
                    word-break: break-word;
                    color: var(--dim);
                }

                .terminal-wpm-char.is-right {
                    color: var(--bright);
                }

                .terminal-wpm-char.is-wrong {
                    color: var(--error);
                    text-decoration: underline;
                }

                .terminal-wpm-char.is-cursor {
                    color: var(--text);
                    box-shadow: inset 0 -2px 0 var(--bright);
                }

                .terminal-wpm-field {
                    width: 100%;
                    background: transparent;
                    border: 1px solid rgb(var(--glow) / 0.3);
                    color: var(--text);
                    font: inherit;
                    font-size: var(--font-size-md);
                    padding: 8px 10px;
                    caret-color: var(--bright);
                }

                .terminal-wpm-field:focus-visible {
                    outline: 1px solid var(--bright);
                    outline-offset: 0;
                }

                .terminal-wpm-stats {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-md);
                    color: var(--text);
                    font-variant-numeric: tabular-nums;
                }

                .terminal-train-plot {
                    margin: 0;
                    color: var(--text);
                    font-size: var(--font-size-md);
                    line-height: 1.15;
                    white-space: pre;
                    overflow-x: auto;
                }

                .terminal-snake-board {
                    touch-action: none;
                }

                .terminal-board-row {
                    display: block;
                    white-space: pre;
                }

                .terminal-board-cell {
                    display: inline-block;
                    width: 1ch;
                    text-align: center;
                    overflow: visible;
                }

                /* Cells set the spacing, so no extra letter-spacing on the board */
                .terminal-snake-grid {
                    letter-spacing: 0 !important;
                }

                @media (max-width: 480px) {
                    .terminal-wpm-target { font-size: var(--font-size-md); }
                    .terminal-train-plot { font-size: var(--font-size-xs); line-height: 1.2; }
                }
            `}</style>
        </div>
    )
}
