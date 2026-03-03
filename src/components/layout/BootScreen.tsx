// components/layout/BootScreen.tsx
"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import {useBootContext} from "@/src/components/layout/context/BootContext";

interface BootLine {
    text: string
    delay: number
    type: 'system' | 'success' | 'info' | 'warning' | 'ready'
}

const bootSequence: BootLine[] = [
    { text: 'BIOS v3.2.1 — System Check', delay: 0, type: 'system' },
    { text: 'Memory Test .......... 16384 MB OK', delay: 400, type: 'info' },
    { text: 'Loading kernel modules .......... done', delay: 700, type: 'info' },
    { text: 'Mounting /dev/portfolio .......... done', delay: 500, type: 'info' },
    { text: 'Initializing neural-engine v2.4 .......... done', delay: 600, type: 'info' },
    { text: 'Loading AI subsystems .......... done', delay: 500, type: 'info' },
    { text: 'Compiling project modules .......... done', delay: 400, type: 'info' },
    { text: 'Establishing network interfaces .......... done', delay: 500, type: 'info' },
    { text: 'All systems nominal.', delay: 600, type: 'success' },
    { text: '', delay: 300, type: 'system' },
    { text: 'Ready.', delay: 400, type: 'ready' },
]

type ExitPhase = 'idle' | 'scrolling' | 'clearing' | 'scanline' | 'flash' | 'done'

export default function BootScreen() {
    const { completeBoot } = useBootContext()
    const [visibleLines, setVisibleLines] = useState<number>(0)
    const [bootComplete, setBootComplete] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [exitPhase, setExitPhase] = useState<ExitPhase>('idle')
    const [exitLines, setExitLines] = useState<string[]>([])
    const timeoutsRef = useRef<NodeJS.Timeout[]>([])
    const hasBootedRef = useRef(false)

    const shutdownLines = [
        '> Initializing portfolio environment...',
        '> Loading components [████████████████] 100%',
        '> Establishing connections...',
        '> All services online.',
        '> Launching interface...',
    ]

    // Check sessionStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasBooted = sessionStorage.getItem('portfolio-booted')
            if (hasBooted === 'true') {
                setDismissed(true)
                hasBootedRef.current = true
                completeBoot()
            }
        }
    }, [completeBoot])

    // Run boot sequence
    useEffect(() => {
        if (dismissed || hasBootedRef.current) return

        document.body.style.overflow = 'hidden'

        let cumulativeDelay = 500

        bootSequence.forEach((line, index) => {
            cumulativeDelay += line.delay

            const timeout = setTimeout(() => {
                setVisibleLines(index + 1)

                if (index === bootSequence.length - 1) {
                    setTimeout(() => setBootComplete(true), 400)
                }
            }, cumulativeDelay)

            timeoutsRef.current.push(timeout)
        })

        return () => {
            timeoutsRef.current.forEach(clearTimeout)
            timeoutsRef.current = []
        }
    }, [dismissed])

    const runExitSequence = useCallback(() => {
        // Phase 1: Scroll up — existing boot text scrolls away
        setExitPhase('scrolling')

        setTimeout(() => {
            // Phase 2: Clear screen — show shutdown/launch lines one by one
            setExitPhase('clearing')
            setExitLines([])

            let delay = 200
            shutdownLines.forEach((line, index) => {
                const t = setTimeout(() => {
                    setExitLines(prev => [...prev, line])
                }, delay)
                timeoutsRef.current.push(t)
                delay += 300
            })

            // Phase 3: Scanline wipe after all lines shown
            const scanlineTimer = setTimeout(() => {
                setExitPhase('scanline')
            }, delay + 200)
            timeoutsRef.current.push(scanlineTimer)

            // Phase 4: CRT power-off — starts after scanline reaches center
            const flashTimer = setTimeout(() => {
                setExitPhase('flash')
            }, delay + 1300)
            timeoutsRef.current.push(flashTimer)

            // Phase 5: Done — remove from DOM, signal boot complete
            const doneTimer = setTimeout(() => {
                setExitPhase('done')
                document.body.style.overflow = ''
                sessionStorage.setItem('portfolio-booted', 'true')
                completeBoot()
                setTimeout(() => setDismissed(true), 100)
            }, delay + 2000)
            timeoutsRef.current.push(doneTimer)

        }, 600) // Wait for scroll-up to finish

    }, [completeBoot, shutdownLines])

    const handleStart = useCallback(() => {
        if (!bootComplete || exitPhase !== 'idle') return
        runExitSequence()
    }, [bootComplete, exitPhase, runExitSequence])

    if (dismissed) return null

    return (
        <>
            <div
                className={`boot-screen boot-screen-phase-${exitPhase}`}
                aria-modal="true"
                role="dialog"
                aria-label="Portfolio boot sequence"
            >
                {/* Scanline overlay — persists through scanline and flash phases */}
                {(exitPhase === 'scanline' || exitPhase === 'flash') && (
                    <div className={`boot-screen-scanline ${exitPhase === 'flash' ? 'boot-screen-scanline-shrink' : ''}`} />
                )}

                {/* CRT power-off overlay */}
                {exitPhase === 'done' && (
                    <div className="boot-screen-crt-off" />
                )}

                <div className="boot-screen-container">
                    {/* Boot log — visible during idle phase */}
                    {(exitPhase === 'idle' || exitPhase === 'scrolling') && (
                        <div className={`boot-screen-log ${exitPhase === 'scrolling' ? 'boot-screen-log-scrolling' : ''}`}>
                            {bootSequence.slice(0, visibleLines).map((line, index) => (
                                <div
                                    key={index}
                                    className={`boot-screen-line boot-screen-line-${line.type}`}
                                >
                                    {line.type !== 'ready' && line.text && (
                                        <span className="boot-screen-prefix">[{line.type.toUpperCase()}]</span>
                                    )}
                                    {line.text}
                                </div>
                            ))}

                            {/* Start button */}
                            {bootComplete && exitPhase === 'idle' && (
                                <div className="boot-screen-prompt">
                                    <button
                                        onClick={handleStart}
                                        className="boot-screen-start-btn"
                                        autoFocus
                                    >
                                        <span className="boot-screen-prompt-symbol">&gt;</span>
                                        ./start_portfolio.sh
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Exit sequence lines — visible during clearing phase */}
                    {(exitPhase === 'clearing' || exitPhase === 'scanline' || exitPhase === 'flash' || exitPhase === 'done') && (
                        <div className="boot-screen-exit-log">
                            {exitLines.map((line, index) => (
                                <div key={index} className="boot-screen-exit-line">
                                    {line}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .boot-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 99999;
                    background: var(--color-bg-dark);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-mono);
                    color: var(--color-primary);
                    overflow: hidden;
                }

                /* Phase: CRT power-off — compress then fade */
                .boot-screen-phase-flash {
                    animation: boot-screen-crt-compress 0.6s cubic-bezier(0.4, 0, 1, 1) forwards;
                }

                .boot-screen-phase-done {
                    animation: boot-screen-crt-compress 0.6s cubic-bezier(0.4, 0, 1, 1) forwards;
                    opacity: 0;
                    visibility: hidden;
                }

                @keyframes boot-screen-crt-compress {
                    0% {
                        transform: scaleY(1) scaleX(1);
                        filter: brightness(1);
                    }
                    40% {
                        transform: scaleY(0.01) scaleX(1.02);
                        filter: brightness(1.5);
                    }
                    70% {
                        transform: scaleY(0.01) scaleX(0.3);
                        filter: brightness(2);
                    }
                    100% {
                        transform: scaleY(0) scaleX(0);
                        filter: brightness(0);
                        opacity: 0;
                        visibility: hidden;
                    }
                }

                .boot-screen-container {
                    max-width: 700px;
                    width: 90%;
                    padding: var(--spacing-lg);
                    position: relative;
                }

                /* ==================
                   BOOT LOG
                   ================== */

                .boot-screen-log {
                    margin-bottom: var(--spacing-xl);
                    min-height: 200px;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                                opacity 0.4s ease;
                }

                .boot-screen-log-scrolling {
                    transform: translateY(-120%);
                    opacity: 0;
                }

                .boot-screen-line {
                    font-size: var(--font-size-sm);
                    line-height: var(--line-height-relaxed);
                    opacity: 0;
                    animation: boot-screen-line-appear 0.3s ease forwards;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                @keyframes boot-screen-line-appear {
                    from {
                        opacity: 0;
                        transform: translateY(4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .boot-screen-prefix {
                    color: var(--color-primary-dim);
                    margin-right: 8px;
                    font-size: var(--font-size-xs);
                }

                .boot-screen-line-system { color: var(--color-primary-dim); }
                .boot-screen-line-info { color: var(--color-primary-dim); }
                .boot-screen-line-success { color: var(--color-primary); }
                .boot-screen-line-warning { color: #ffa500; }

                .boot-screen-line-ready {
                    color: var(--color-primary);
                    font-weight: bold;
                    font-size: var(--font-size-md);
                    margin-top: var(--spacing-sm);
                }

                /* ==================
                   START BUTTON
                   ================== */

                .boot-screen-prompt {
                    display: flex;
                    align-items: center;
                    margin-top: var(--spacing-md);
                    opacity: 0;
                    animation: boot-screen-prompt-appear 0.6s ease 0.2s forwards;
                }

                @keyframes boot-screen-prompt-appear {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .boot-screen-start-btn {
                    background: transparent;
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                    font-size: var(--font-size-md);
                    padding: var(--spacing-sm) var(--spacing-lg);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    min-height: var(--min-touch-target);
                }

                .boot-screen-start-btn:hover,
                .boot-screen-start-btn:focus {
                    background: rgba(0, 255, 65, 0.1);
                    box-shadow: 0 0 15px rgba(0, 255, 65, 0.3), 0 0 30px rgba(0, 255, 65, 0.1);
                    transform: translateY(-2px);
                }

                .boot-screen-start-btn:focus-visible {
                    outline: 3px solid var(--color-primary);
                    outline-offset: 3px;
                }

                .boot-screen-start-btn:active {
                    transform: translateY(0);
                }

                .boot-screen-prompt-symbol {
                    color: var(--color-primary-dim);
                }

                /* ==================
                   EXIT SEQUENCE LINES
                   ================== */

                .boot-screen-exit-log {
                    min-height: 200px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .boot-screen-exit-line {
                    font-size: var(--font-size-sm);
                    line-height: var(--line-height-relaxed);
                    color: var(--color-primary);
                    opacity: 0;
                    animation: boot-screen-exit-line-appear 0.25s ease forwards;
                }

                @keyframes boot-screen-exit-line-appear {
                    from {
                        opacity: 0;
                        transform: translateX(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                /* ==================
                   SCANLINE WIPE
                   ================== */

                .boot-screen-scanline {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(
                        180deg,
                        transparent 0%,
                        rgba(0, 255, 65, 0.8) 50%,
                        transparent 100%
                    );
                    box-shadow: 0 0 30px rgba(0, 255, 65, 0.6),
                               0 0 60px rgba(0, 255, 65, 0.3);
                    z-index: 10;
                    animation: boot-screen-scanline-sweep 1s ease-in-out forwards;
                }

                @keyframes boot-screen-scanline-sweep {
                    0% {
                        top: 0;
                        opacity: 1;
                    }
                    45% {
                        top: 100%;
                        opacity: 0.8;
                    }
                    55% {
                        top: 100%;
                        opacity: 0.8;
                    }
                    100% {
                        top: 50%;
                        opacity: 1;
                    }
                }

                .boot-screen-scanline-shrink {
                    top: 50% !important;
                    animation: boot-screen-line-shrink 0.6s ease 0.1s forwards !important;
                }

                @keyframes boot-screen-line-shrink {
                    0% {
                        width: 100%;
                        left: 0;
                        opacity: 1;
                        height: 4px;
                    }
                    40% {
                        width: 50%;
                        left: 25%;
                        opacity: 0.9;
                        height: 3px;
                    }
                    80% {
                        width: 10%;
                        left: 45%;
                        opacity: 0.6;
                        height: 2px;
                    }
                    100% {
                        width: 0%;
                        left: 50%;
                        opacity: 0;
                        height: 1px;
                    }
                }

                /* ==================
                   CRT POWER-OFF LINE (fallback)
                   ================== */

                .boot-screen-crt-off {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: rgba(0, 255, 65, 0.8);
                    box-shadow: 0 0 15px rgba(0, 255, 65, 0.6),
                               0 0 40px rgba(0, 255, 65, 0.3);
                    z-index: 11;
                    transform: translateY(-50%);
                    animation: boot-screen-crt-line-fade 0.5s ease 0.4s forwards;
                    opacity: 1;
                }

                @keyframes boot-screen-crt-line-fade {
                    0% {
                        opacity: 1;
                        width: 100%;
                    }
                    60% {
                        opacity: 0.8;
                        width: 40%;
                        margin-left: 30%;
                    }
                    100% {
                        opacity: 0;
                        width: 0%;
                        margin-left: 50%;
                    }
                }

                /* ==================
                   RESPONSIVE
                   ================== */

                @media (max-width: 480px) {
                    .boot-screen-container {
                        width: 95%;
                        padding: var(--spacing-md);
                    }

                    .boot-screen-line,
                    .boot-screen-exit-line {
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
                    .boot-screen-line,
                    .boot-screen-exit-line {
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
                    .boot-screen-exit-line {
                        animation: none;
                        opacity: 1;
                    }

                    .boot-screen-prompt {
                        animation: none;
                        opacity: 1;
                    }

                    .boot-screen-log-scrolling {
                        transition-duration: 0.01ms;
                    }

                    .boot-screen-scanline {
                        animation-duration: 0.01ms;
                    }

                    .boot-screen-flash {
                        animation-duration: 0.01ms;
                    }

                    .boot-screen-phase-flash,
                    .boot-screen-phase-done {
                        animation-duration: 0.01ms;
                    }

                    .boot-screen-crt-off {
                        animation-duration: 0.01ms;
                    }
                }
            `}</style>
        </>
    )
}