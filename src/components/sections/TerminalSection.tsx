// components/sections/TerminalSection.tsx
// Server component: the boot banner ships in the HTML and types out first;
// then the interactive shell (terminal/TerminalShell) takes over.

import SectionReveal from '@/src/components/shared/reveal/SectionReveal'
import TypedLine from '@/src/components/shared/reveal/TypedLine'
import TerminalShell from '@/src/components/sections/terminal/TerminalShell'

const bootLines = [
    'KudzaiOS [Build 2026.10] — All edge cases accounted for, including yours.',
    '(c) Kudzai Prichard Matizirofa. By order of the Council: this developer is not normal.',
    'Try: games · snake · wpm · train · quiz — or just ask me a question.',
]

export default async function TerminalSection() {
    'use cache'
    return (
        <>
            {/* How to use the terminal, for assistive tech. Visually hidden, so the
                easter-egg discovery flow for sighted users is preserved. */}
            <div className="sr-only">
                <h2>Interactive Terminal</h2>
                <p>
                    A fully interactive shell session. Type a command and press Enter to run it,
                    or simply ask a question in plain English and the built-in AI assistant
                    (Kudzai&apos;s terminal agent) will answer and can navigate the site for you.
                    Available commands include: ask, help, games, whoami, neofetch, htop, history, date,
                    echo, man, ls, cd, cat, pwd, ping, ssh, curl, sudo, git log, git blame,
                    vim, ascii, matrix, snake, wpm (a typing race), train (watch a neural
                    network learn), quiz, adventure, clear, exit.
                    Press Tab to autocomplete. Use the Up and Down arrow keys to recall
                    previous commands.
                </p>
            </div>

            <SectionReveal
                sectionId="terminal"
                title="visitor@kudzai:~$"
                ariaLabel="Interactive terminal session"
                afterComplete={<TerminalShell />}
            >
                <div className="terminal-section-content terminal-section-intro">
                    <TypedLine text={bootLines[0]} className="terminal-section-boot-line terminal-section-fade-in" />
                    <TypedLine text={bootLines[1]} className="terminal-section-boot-line terminal-section-fade-in" delay="postCommandDelay" />
                    <TypedLine text={bootLines[2]} className="terminal-section-boot-line terminal-section-boot-try terminal-section-fade-in" delay="postCommandDelay" />
                </div>
            </SectionReveal>

            <style>{`

                .terminal-section-boot-line {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    margin-bottom: 4px;
                    color: var(--dim);
                }

                .terminal-section-boot-try {
                    color: var(--bright);
                }

                /* Full-screen modes replace the boot banner; adventure hides it too */
                .section-reveal[data-term-mode="vim"] .terminal-section-intro,
                .section-reveal[data-term-mode="matrix"] .terminal-section-intro,
                .section-reveal[data-term-mode="snake"] .terminal-section-intro,
                .section-reveal[data-term-mode="wpm"] .terminal-section-intro,
                .section-reveal[data-term-mode="train"] .terminal-section-intro,
                .section-reveal[data-term-mode="adventure"] .terminal-section-intro {
                    display: none;
                }

                .terminal-section-fade-in {
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                @media (max-width: 480px) {
                    .terminal-section-boot-line {
                        font-size: var(--font-size-sm);
                    }
                }

                /* ── Vim Mode ── */
                .terminal-vim-screen {
                    display: flex;
                    flex-direction: column;
                    min-height: 280px;
                }

                .terminal-vim-header {
                    font-size: var(--font-size-sm);
                    color: var(--dim);
                    margin-bottom: var(--spacing-sm);
                    font-family: var(--font-mono);
                }

                .terminal-vim-body {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    color: var(--text);
                    font-family: var(--font-mono);
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    flex: 1;
                    margin: 0;
                }

                .terminal-vim-tilde {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    color: var(--dim);
                    font-family: var(--font-mono);
                    white-space: pre;
                }

                .terminal-vim-footer {
                    font-size: var(--font-size-sm);
                    color: var(--text);
                    font-family: var(--font-mono);
                    margin-top: var(--spacing-sm);
                    padding-top: var(--spacing-xs);
                    border-top: 1px solid rgb(var(--glow) / 0.2);
                }

                /* ── Snake Mode ── */
                .terminal-snake-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-height: 280px;
                }

                .terminal-snake-grid {
                    font-size: var(--font-size-md);
                    line-height: 1.15;
                    color: var(--text);
                    font-family: var(--font-mono);
                    white-space: pre;
                    margin: 0;
                    letter-spacing: 1px;
                }

                .terminal-snake-touch {
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    margin-top: var(--spacing-md);
                }

                .terminal-snake-touch-row {
                    display: flex;
                    gap: 4px;
                }

                .terminal-snake-btn {
                    width: 48px;
                    height: 48px;
                    background: transparent;
                    border: 1px solid rgb(var(--glow) / 0.7);
                    color: var(--text);
                    font-size: var(--font-size-lg);
                    font-family: var(--font-mono);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                    touch-action: manipulation;
                }

                .terminal-snake-btn:active {
                    background: rgb(var(--glow) / 0.2);
                }

                @media (max-width: 768px) {
                    .terminal-snake-touch {
                        display: flex;
                    }
                }

                @media (max-width: 480px) {
                    .terminal-snake-grid {
                        font-size: var(--font-size-xs);
                    }
                }

                /* ── Matrix Mode ── */
                .terminal-matrix-screen {
                    position: relative;
                    min-height: 280px;
                    overflow: hidden;
                }

                .terminal-matrix-text {
                    font-size: var(--font-size-sm);
                    line-height: 1.15;
                    color: var(--text);
                    font-family: var(--font-mono);
                    white-space: pre;
                    margin: 0;
                    opacity: 0.85;
                    letter-spacing: 0.5px;
                }

                .terminal-matrix-hint {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    font-size: var(--font-size-xs);
                    color: var(--dim);
                    font-family: var(--font-mono);
                    opacity: 0.5;
                }
            `}</style>
        </>
    )
}