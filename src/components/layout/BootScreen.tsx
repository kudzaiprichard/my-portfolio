// components/layout/BootScreen.tsx
"use client"

/**
 * The boot: the BIOS log streams in, then the site powers on like a CRT
 * (dot → line → picture, --dur-crt). Settings in constants/bootConfig.ts:
 *
 * - it waits for [ start ] / [ start silent ] or any key / click — the
 *   gesture that unlocks Web Audio, so the first section's typing is heard
 *   (bootBehaviour.autoContinue can make it start on its own instead)
 * - once per tab (bootBehaviour.oncePerTab): the first visit and every new
 *   tab boot; a refresh goes straight to the sections typing out
 *   (sessionStorage, applied before paint as html.booted by the <head> script)
 * - deep links (project pages) and plain mode never boot
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { useBootContext } from '@/src/components/layout/context/BootContext'
import { ANALYTICS_EVENTS, trackEvent } from '@/src/lib/analytics'
import { audioEngine, setAudioMuted } from '@/src/lib/audioEngine'
import { runTransition, canTransition } from '@/src/lib/viewTransition'
import { BOOTED_KEY, TAB_BOOTED_KEY, bootBehaviour, bootTimings } from '@/src/constants/bootConfig'

// Read once per page load: finishing this boot sets the key, and must not
// turn the current visit into a "returning" one halfway through.
let bootedAtLoad: boolean | null = null
const readBooted = () => {
    if (bootedAtLoad === null) {
        // Plain mode never boots, and nor do deep links (a project page)
        try {
            bootedAtLoad = (bootBehaviour.skipForReturningVisitors && localStorage.getItem(BOOTED_KEY) === '1')
                || (bootBehaviour.oncePerTab && sessionStorage.getItem(TAB_BOOTED_KEY) === '1')
                || document.documentElement.dataset.mode === 'plain'
                || window.location.pathname !== '/'
        } catch { bootedAtLoad = false }
    }
    return bootedAtLoad
}
const noopSubscribe = () => () => {}

interface BootLine {
    text: string
    type: 'system' | 'success' | 'info' | 'ready'
}

const bootSequence: BootLine[] = [
    { text: 'BIOS v3.2.1 — System Check', type: 'system' },
    { text: 'Memory Test .......... 16384 MB OK', type: 'info' },
    { text: 'Loading kernel modules .......... done', type: 'info' },
    { text: 'Mounting /dev/portfolio .......... done', type: 'info' },
    { text: 'Initializing neural-engine v2.4 .......... done', type: 'info' },
    { text: 'Loading AI subsystems .......... done', type: 'info' },
    { text: 'Compiling project modules .......... done', type: 'info' },
    { text: 'Establishing network interfaces .......... done', type: 'info' },
    { text: 'All systems nominal.', type: 'success' },
    { text: 'Ready.', type: 'ready' },
]

// Keys that never count as "any key"
const NOT_A_SKIP = new Set(['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'])

type Exit = 'auto' | 'skip' | 'sound' | 'silent'

export default function BootScreen() {
    const { completeBoot } = useBootContext()
    const [visibleLines, setVisibleLines] = useState(0)
    const [dismissed, setDismissed] = useState(false)
    const exitedRef = useRef(false)
    const countdownRef = useRef<HTMLSpanElement>(null)

    // Returning visitor? Server render and hydration assume not; the <head>
    // script has already hidden the overlay with CSS if so.
    const returning = useSyncExternalStore(noopSubscribe, readBooted, () => false)

    useEffect(() => {
        if (returning) completeBoot({ returning: true })
    }, [returning, completeBoot])

    const powerOn = (how: Exit) => {
        if (exitedRef.current) return
        exitedRef.current = true
        try {
            localStorage.setItem(BOOTED_KEY, '1')
            sessionStorage.setItem(TAB_BOOTED_KEY, '1')
        } catch { /* storage blocked */ }

        if (how === 'sound' || how === 'silent') setAudioMuted(how === 'silent')
        // A key or click is a gesture too: unlock the audio (the stored mute
        // choice still applies) so the first section's typing is heard
        if (how !== 'silent' && how !== 'auto') {
            audioEngine.unlock()
            audioEngine.play('boot')
        }
        trackEvent(how === 'skip' ? ANALYTICS_EVENTS.bootSkipped : ANALYTICS_EVENTS.bootCompleted)

        const finish = () => {
            document.body.style.overflow = ''
            setDismissed(true)
            completeBoot()
        }
        if (canTransition()) {
            // The whole screen (particles included) powers on from a dot
            void runTransition('crton', () => flushSync(finish))
        } else {
            finish()
            // No View Transitions: play the power-on on the page itself
            const root = document.documentElement
            root.classList.add('crt-power-on')
            setTimeout(() => root.classList.remove('crt-power-on'), bootTimings.powerOnMs)
        }
    }

    // Stream the log; then wait for the visitor (or, with autoContinue, go on)
    useEffect(() => {
        if (returning || dismissed) return
        document.body.style.overflow = 'hidden'
        // The 1.6 s is counted from landing, not from when this script ran
        const remaining = Math.max(bootTimings.minVisibleMs, bootTimings.autoContinueMs - performance.now())
        const lineMs = bootBehaviour.autoContinue ? Math.min(bootTimings.lineMs, remaining / bootSequence.length) : bootTimings.lineMs
        if (countdownRef.current) countdownRef.current.style.animationDuration = `${remaining}ms`
        const timers = bootSequence.map((_, i) =>
            setTimeout(() => setVisibleLines(i + 1), i * lineMs))
        if (bootBehaviour.autoContinue) timers.push(setTimeout(() => powerOn('auto'), remaining))

        // Any key starts it (buttons handle their own Enter/Space as clicks)
        const onKey = (e: KeyboardEvent) => {
            if (NOT_A_SKIP.has(e.key)) return
            const onButton = (e.target as HTMLElement | null)?.closest?.('.boot-screen-start-btn')
            if (onButton && (e.key === 'Enter' || e.key === ' ')) return
            powerOn('skip')
        }
        window.addEventListener('keydown', onKey)
        return () => {
            timers.forEach(clearTimeout)
            window.removeEventListener('keydown', onKey)
        }
        // powerOn is guarded by exitedRef; this runs once per boot
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [returning, dismissed])

    if (dismissed || returning) return null

    return (
        <>
            <div
                className="boot-screen"
                onClick={() => powerOn('skip')}
                aria-modal="true"
                role="dialog"
                aria-label="Portfolio boot sequence"
            >
                <div className="boot-screen-container">
                    <div className="boot-screen-log">
                        {bootSequence.slice(0, visibleLines).map((line, index) => (
                            <div key={index} className={`boot-screen-line boot-screen-line-${line.type}`}>
                                {line.type !== 'ready' && (
                                    <span className="boot-screen-prefix">[{line.type.toUpperCase()}]</span>
                                )}
                                {line.text}
                            </div>
                        ))}
                    </div>

                    {/* Sound consent: either button starts the site now */}
                    <div className="boot-screen-prompt" role="group" aria-label="Start the portfolio">
                        <button
                            onClick={(e) => { e.stopPropagation(); powerOn('sound') }}
                            className="boot-screen-start-btn"
                            autoFocus
                        >
                            <span className="boot-screen-prompt-symbol">&gt;</span>
                            [ start ]
                            {bootBehaviour.autoContinue && <span ref={countdownRef} className="boot-screen-countdown" aria-hidden="true" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); powerOn('silent') }}
                            className="boot-screen-start-btn boot-screen-start-silent"
                            aria-label="Start silent (sound off)"
                        >
                            [ start silent ]
                        </button>
                    </div>
                    <div className="boot-screen-hint">{bootBehaviour.autoContinue ? 'press any key to skip' : 'press any key to start'}</div>
                </div>
            </div>

            <style>{`
                .boot-screen {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    background: var(--bg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-mono);
                    color: var(--text);
                    overflow: hidden;
                    cursor: pointer;
                }

                /* Returning visitors: hidden from first paint (html.booted, set in <head>) */
                html.booted .boot-screen {
                    display: none;
                }

                .boot-screen-container {
                    max-width: 700px;
                    width: 90%;
                    padding: var(--spacing-lg);
                    position: relative;
                }

                .boot-screen-log {
                    min-height: 200px;
                    margin-bottom: var(--spacing-lg);
                }

                /* The banner line (BIOS header) uses the pixel CRT face */
                .boot-screen-log .boot-screen-line:first-child {
                    font-family: var(--font-display);
                    font-size: calc(var(--font-size-sm) * 1.8);
                    color: var(--bright);
                }

                .boot-screen-line {
                    font-size: var(--font-size-sm);
                    line-height: var(--line-height-relaxed);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .boot-screen-prefix {
                    color: var(--dim);
                    margin-right: 8px;
                    font-size: var(--font-size-xs);
                }

                .boot-screen-line-system { color: var(--dim); }
                .boot-screen-line-info { color: var(--dim); }
                .boot-screen-line-success { color: var(--text); }

                .boot-screen-line-ready {
                    color: var(--text);
                    font-weight: bold;
                    font-size: var(--font-size-md);
                    margin-top: var(--spacing-sm);
                }

                .boot-screen-prompt {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: var(--spacing-sm);
                }

                .boot-screen-start-btn {
                    position: relative;
                    overflow: hidden;
                    background: transparent;
                    border: 1px solid var(--bright);
                    color: var(--text);
                    font-family: var(--font-mono);
                    font-size: var(--font-size-md);
                    padding: var(--spacing-sm) var(--spacing-lg);
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    min-height: var(--min-touch-target);
                    transition: background var(--dur-quick) var(--ease-out), box-shadow var(--dur-quick) var(--ease-out);
                }

                .boot-screen-start-btn:hover,
                .boot-screen-start-btn:focus {
                    background: rgb(var(--glow) / 0.1);
                    box-shadow: 0 0 15px rgb(var(--glow) / 0.3), 0 0 30px rgb(var(--glow) / 0.1);
                }

                .boot-screen-start-btn:focus-visible {
                    outline: 3px solid var(--bright);
                    outline-offset: 3px;
                }

                .boot-screen-prompt-symbol {
                    color: var(--dim);
                }

                .boot-screen-start-silent {
                    border-color: rgb(var(--glow) / 0.4);
                    color: var(--dim);
                }

                /* Fills while the boot waits, then the site starts on its own */
                .boot-screen-countdown {
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    height: 2px;
                    width: 100%;
                    background: var(--bright);
                    transform-origin: left;
                    animation: boot-screen-countdown ${bootTimings.autoContinueMs}ms linear both;
                }

                @keyframes boot-screen-countdown {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }

                .boot-screen-hint {
                    margin-top: var(--spacing-md);
                    color: var(--dim);
                    font-size: var(--font-size-xs);
                }

                @media (max-width: 480px) {
                    .boot-screen-container {
                        width: 95%;
                        padding: var(--spacing-md);
                    }

                    .boot-screen-line {
                        font-size: 10px;
                    }

                    .boot-screen-prefix {
                        font-size: 9px;
                    }

                    .boot-screen-line-ready {
                        font-size: var(--font-size-sm);
                    }

                    .boot-screen-start-btn {
                        font-size: var(--font-size-sm);
                        padding: var(--spacing-sm) var(--spacing-md);
                        width: 100%;
                        justify-content: center;
                    }
                }

                @media (min-width: 768px) {
                    .boot-screen-line {
                        font-size: var(--font-size-md);
                    }

                    .boot-screen-prefix {
                        font-size: var(--font-size-sm);
                    }

                    .boot-screen-line-ready {
                        font-size: var(--font-size-lg);
                    }

                    .boot-screen-start-btn {
                        font-size: var(--font-size-lg);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .boot-screen-line,
                    .boot-screen-countdown {
                        animation: none;
                    }
                }
            `}</style>
        </>
    )
}
