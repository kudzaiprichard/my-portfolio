// components/sections/TerminalSection.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import TerminalContainer from '@/src/components/shared/TerminalContainer'
import { useInView } from '@/src/hooks/useInView'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/src/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/src/hooks/useAnimationController'
import { useTypingAnimation } from '@/src/hooks/useTypingAnimation'
import { AnimationController } from '@/src/lib/animationController'
import { startCharacterGlitch } from '@/src/lib/glitch'
import { useBootContext } from "@/src/components/layout/context/BootContext"
import { useReducedMotion } from '@/src/hooks/useReducedMotion'
import { useTerminalInput, cwdToPrompt } from '@/src/hooks/useTerminalInput'
import TerminalInput from '@/src/components/shared/TerminalInput'
import {
    getBaseSpeedForSection,
    getPatternForSection,
    audioConfig,
    sequenceTimings,
} from '@/src/constants/typingConfig'

const terminalPattern = getPatternForSection('terminal')
const terminalSpeed = getBaseSpeedForSection('terminal')

const bootLines = [
    'KudzaiOS [Build 2025.1] — All edge cases accounted for, including yours.',
    '(c) Kudzai Prichard. By order of the Council: this developer is not normal.',
]

export default function TerminalSection() {
    const { isBooted } = useBootContext()
    const prefersReducedMotion = useReducedMotion()
    const [showBoot1, setShowBoot1] = useState(false)
    const [showBoot2, setShowBoot2] = useState(false)

    const audio = useKeystrokeAudio({
        sectionId: 'terminal',
        enabled: true,
        volume: audioConfig.baseVolume,
        volumeRampEnabled: audioConfig.volumeRampEnabled,
    })

    const hasCompletedOnceRef = useRef(false)
    const { onTypingKeystroke } = useTypingAudioCallback(audio)
    const animation = useAnimationController({
        onComplete: () => {
            hasCompletedOnceRef.current = true
        },
        debug: false,
    })

    const boot1Typing = useTypingAnimation({ baseSpeed: terminalSpeed, humanPattern: terminalPattern })
    const boot2Typing = useTypingAnimation({ baseSpeed: terminalSpeed, humanPattern: terminalPattern })

    const resetAnimationState = useCallback(() => {
        boot1Typing.reset()
        boot2Typing.reset()
        setShowBoot1(false)
        setShowBoot2(false)
        animation.reset()
    }, [animation, boot1Typing, boot2Typing])

    const onInViewChangeRef = useRef<((inView: boolean) => void) | undefined>(undefined)

    useEffect(() => {
        onInViewChangeRef.current = (inView: boolean) => {
            if (inView) {
                audio.requestAudioControl()
            } else {
                audio.releaseAudioControl()
                if (animation.isRunning && !hasCompletedOnceRef.current) {
                    resetAnimationState()
                }
            }
        }
    }, [audio, animation.isRunning, resetAnimationState])

    const { ref, isInView } = useInView({
        threshold: 0.3,
        triggerOnce: false,
        onInViewChange: (inView: boolean) => {
            onInViewChangeRef.current?.(inView)
        }
    })

    const terminalInput = useTerminalInput({
        sectionId: 'terminal',
        isActive: animation.isCompleted && isInView,
    })

    const buildAnimationSequence = useCallback(() => {
        const steps = []

        // Boot line 1
        steps.push(AnimationController.createDelayStep(sequenceTimings.initialDelay))
        steps.push(AnimationController.createActionStep(() => audio.resetVolumeRamp()))
        steps.push(AnimationController.createActionStep(() => setShowBoot1(true)))
        steps.push(...boot1Typing.generateSteps(bootLines[0], { onKeystroke: onTypingKeystroke }))

        // Boot line 2
        steps.push(AnimationController.createDelayStep(400))
        steps.push(AnimationController.createActionStep(() => audio.resetVolumeRamp()))
        steps.push(AnimationController.createActionStep(() => setShowBoot2(true)))
        steps.push(...boot2Typing.generateSteps(bootLines[1], { onKeystroke: onTypingKeystroke }))

        return steps
    }, [boot1Typing, boot2Typing, onTypingKeystroke, audio])

    // Skip all animations when reduced motion is preferred
    useEffect(() => {
        if (prefersReducedMotion && isBooted && !animation.isCompleted) {
            setShowBoot1(true)
            setShowBoot2(true)
            boot1Typing.setText(bootLines[0])
            boot2Typing.setText(bootLines[1])
            animation.complete()
            hasCompletedOnceRef.current = true
        }
    }, [prefersReducedMotion, isBooted, animation, boot1Typing, boot2Typing])

    useEffect(() => {
        if (!isBooted) return
        if (prefersReducedMotion) return
        if (hasCompletedOnceRef.current) return
        if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) return
        if (animation.isCompleted || animation.isRunning) return

        const steps = buildAnimationSequence()
        animation.start(steps)
    }, [isBooted, isInView, audio.isAudioReady, audio.hasAudioControl, animation.isCompleted, animation.isRunning, buildAnimationSequence, animation, prefersReducedMotion])

    // Unmount-only cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        return () => {
            audio.releaseAudioControl()
            animation.cancel()
        }
    }, [])

    // ── Glitch effects ──
    const promptGlitchCleanupRef = useRef<(() => void) | null>(null)
    const contentGlitchCleanupsRef = useRef<Array<() => void>>([])
    const contentGlitchTimerRef = useRef<NodeJS.Timeout | null>(null)
    const prevIsTypingResponseRef = useRef(false)

    const cleanupAllGlitches = useCallback(() => {
        if (promptGlitchCleanupRef.current) {
            promptGlitchCleanupRef.current()
            promptGlitchCleanupRef.current = null
        }
        contentGlitchCleanupsRef.current.forEach(fn => fn())
        contentGlitchCleanupsRef.current = []
        if (contentGlitchTimerRef.current) {
            clearTimeout(contentGlitchTimerRef.current)
            contentGlitchTimerRef.current = null
        }
    }, [])

    // Effect: Prompt glitch on terminal title bar ("visitor@kudzai")
    useEffect(() => {
        if (!animation.isCompleted || prefersReducedMotion || !isInView) {
            if (promptGlitchCleanupRef.current) {
                promptGlitchCleanupRef.current()
                promptGlitchCleanupRef.current = null
            }
            return
        }

        if (promptGlitchCleanupRef.current) return

        const container = ref.current as HTMLElement | null
        if (!container) return

        const titleEl = container.querySelector('.terminal-title') as HTMLElement | null
        if (!titleEl) return

        if (!titleEl.querySelector('[data-glitch-target]')) {
            const fullText = titleEl.textContent || ''
            const glitchPart = 'visitor@kudzai'
            const idx = fullText.indexOf(glitchPart)
            if (idx === -1) return

            const before = fullText.slice(0, idx)
            const after = fullText.slice(idx + glitchPart.length)

            titleEl.textContent = ''
            if (before) titleEl.appendChild(document.createTextNode(before))

            const glitchSpan = document.createElement('span')
            glitchSpan.dataset.glitchTarget = 'true'
            glitchSpan.textContent = glitchPart
            titleEl.appendChild(glitchSpan)

            if (after) titleEl.appendChild(document.createTextNode(after))
        }

        const glitchTarget = titleEl.querySelector('[data-glitch-target]') as HTMLElement
        if (glitchTarget) {
            promptGlitchCleanupRef.current = startCharacterGlitch(glitchTarget, {
                intensity: 'low',
                singleCharInterval: 12000,
                multiCharInterval: 18000,
            })
        }
    }, [animation.isCompleted, prefersReducedMotion, isInView, ref])

    // Effect: Content glitch on section output lines after cd [section] finishes
    useEffect(() => {
        const wasTyping = prevIsTypingResponseRef.current
        prevIsTypingResponseRef.current = terminalInput.isTypingResponse

        if (!wasTyping || terminalInput.isTypingResponse) return
        if (!terminalInput.displayedSection) return
        if (prefersReducedMotion || !isInView) return

        contentGlitchCleanupsRef.current.forEach(fn => fn())
        contentGlitchCleanupsRef.current = []

        contentGlitchTimerRef.current = setTimeout(() => {
            contentGlitchTimerRef.current = null

            const container = ref.current as HTMLElement | null
            if (!container) return

            const outputLines = container.querySelectorAll(
                '.terminal-interactive-output .terminal-interactive-text'
            )

            const separatorPrefixes = ['─', '=', '┌', '└']
            const candidates: HTMLElement[] = []
            outputLines.forEach(el => {
                const text = (el.textContent || '').trim()
                if (!text) return
                if (separatorPrefixes.some(p => text.startsWith(p))) return
                candidates.push(el as HTMLElement)
            })

            if (candidates.length === 0) return

            const count = Math.min(Math.floor(Math.random() * 2) + 2, candidates.length)
            const shuffled = [...candidates].sort(() => Math.random() - 0.5)
            const selected = shuffled.slice(0, count)

            selected.forEach(el => {
                const cleanup = startCharacterGlitch(el, {
                    intensity: 'low',
                    singleCharInterval: 8000,
                    multiCharInterval: 14000,
                    glitchCharDisplayDuration: 2000,
                })
                contentGlitchCleanupsRef.current.push(cleanup)
            })
        }, 800)
    }, [terminalInput.isTypingResponse, terminalInput.displayedSection, prefersReducedMotion, isInView, ref])

    useEffect(() => {
        if (!isInView) cleanupAllGlitches()
    }, [isInView, cleanupAllGlitches])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        return () => { cleanupAllGlitches() }
    }, [])

    const renderBootLines = () => (
        <>
            {showBoot1 && boot1Typing.text && (
                <div className="terminal-section-boot-line terminal-section-fade-in">
                    <span>{boot1Typing.text}</span>
                    {boot1Typing.text.length < bootLines[0].length && (
                        <span className="section-cursor-blink terminal-section-cursor-blink">|</span>
                    )}
                </div>
            )}

            {showBoot2 && boot2Typing.text && (
                <div className="terminal-section-boot-line terminal-section-fade-in">
                    <span>{boot2Typing.text}</span>
                    {boot2Typing.text.length < bootLines[1].length && (
                        <span className="section-cursor-blink terminal-section-cursor-blink">|</span>
                    )}
                </div>
            )}
        </>
    )

    // ── Matrix animation state ──
    const MATRIX_COLS = 50
    const MATRIX_ROWS = 14
    const MATRIX_CHARS = '0123456789ABCDEFabcdef@#$%&*<>[]{}|/\\'
    const [matrixText, setMatrixText] = useState('')
    const matrixColumnsRef = useRef<Array<{ y: number; length: number; speed: number; tick: number }>>([])
    const matrixIntervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (terminalInput.mode !== 'matrix') {
            if (matrixIntervalRef.current) {
                clearInterval(matrixIntervalRef.current)
                matrixIntervalRef.current = null
            }
            setMatrixText('')
            return
        }

        matrixColumnsRef.current = Array.from({ length: MATRIX_COLS }, () => ({
            y: -Math.floor(Math.random() * MATRIX_ROWS),
            length: Math.floor(Math.random() * 8) + 4,
            speed: Math.floor(Math.random() * 3) + 1,
            tick: 0,
        }))

        const interval = setInterval(() => {
            const cols = matrixColumnsRef.current
            const grid: string[][] = Array.from({ length: MATRIX_ROWS }, () =>
                Array.from({ length: MATRIX_COLS }, () => ' ')
            )

            for (let c = 0; c < cols.length; c++) {
                const col = cols[c]
                col.tick++
                if (col.tick >= col.speed) {
                    col.tick = 0
                    col.y++
                    if (col.y - col.length > MATRIX_ROWS) {
                        col.y = -Math.floor(Math.random() * MATRIX_ROWS)
                        col.length = Math.floor(Math.random() * 8) + 4
                        col.speed = Math.floor(Math.random() * 3) + 1
                    }
                }
                for (let row = 0; row < MATRIX_ROWS; row++) {
                    if (row <= col.y && row > col.y - col.length) {
                        grid[row][c] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
                    }
                }
            }

            setMatrixText(grid.map(row => row.join('')).join('\n'))
        }, 75)

        matrixIntervalRef.current = interval

        return () => {
            clearInterval(interval)
            matrixIntervalRef.current = null
        }
    }, [terminalInput.mode])

    const renderVimContent = () => (
        <div className="terminal-section-content terminal-vim-screen">
            <div className="terminal-vim-header">~ TODO.md [readonly]</div>
            <pre className="terminal-vim-body">{terminalInput.vimContent}</pre>
            <div className="terminal-vim-tilde">{'~\n~\n~\n~'}</div>
            <div className="terminal-vim-footer">
                {terminalInput.vimCommand || '-- NORMAL -- press : to enter command, :q to exit'}
            </div>
        </div>
    )

    const renderMatrixContent = () => (
        <div className="terminal-section-content terminal-matrix-screen">
            <pre className="terminal-matrix-text">{matrixText}</pre>
            <div className="terminal-matrix-hint">Press any key to exit</div>
        </div>
    )

    const renderSnakeContent = () => (
        <div className="terminal-section-content terminal-snake-screen">
            <pre className="terminal-snake-grid">{terminalInput.snakeDisplay}</pre>
            <div className="terminal-snake-touch">
                <div className="terminal-snake-touch-row">
                    <button className="terminal-snake-btn" onClick={() => terminalInput.snakeChangeDirection('up')} aria-label="Up">▲</button>
                </div>
                <div className="terminal-snake-touch-row">
                    <button className="terminal-snake-btn" onClick={() => terminalInput.snakeChangeDirection('left')} aria-label="Left">◄</button>
                    <button className="terminal-snake-btn" onClick={() => terminalInput.snakeChangeDirection('down')} aria-label="Down">▼</button>
                    <button className="terminal-snake-btn" onClick={() => terminalInput.snakeChangeDirection('right')} aria-label="Right">►</button>
                </div>
            </div>
        </div>
    )

    const renderStaticContent = () => {
        if (terminalInput.mode === 'vim') return renderVimContent()
        if (terminalInput.mode === 'matrix') return renderMatrixContent()
        if (terminalInput.mode === 'snake') return renderSnakeContent()

        const isAdventure = terminalInput.mode === 'adventure'
        const ds = terminalInput.displayedSection
        const sectionPrompt = ds
            ? ds === 'home' ? 'visitor@kudzai:~$ ' : `visitor@kudzai:~/${ds}$ `
            : cwdToPrompt(terminalInput.cwd)
        const prompt = isAdventure ? terminalInput.adventurePrompt : sectionPrompt

        return (
            <div className="terminal-section-content">
                {!isAdventure && (
                    <>
                        <div className="terminal-section-boot-line">
                            <span>{bootLines[0]}</span>
                        </div>
                        <div className="terminal-section-boot-line">
                            <span>{bootLines[1]}</span>
                        </div>
                    </>
                )}

                <TerminalInput
                    history={terminalInput.history}
                    inputText={terminalInput.inputText}
                    isTypingResponse={terminalInput.isTypingResponse}
                    responseText={terminalInput.responseText}
                    prompt={prompt}
                />
            </div>
        )
    }

    const renderAnimatingContent = () => (
        <div className="terminal-section-content">
            {renderBootLines()}
        </div>
    )

    return (
        <>
            <div ref={ref} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} aria-hidden="true">
                <TerminalContainer title="visitor@kudzai:~$" ariaLabel="Hidden terminal — easter egg interactive shell">
                    {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}
                </TerminalContainer>
            </div>

            <style>{`
                .terminal-section-content {
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                }

                .terminal-section-boot-line {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    margin-bottom: 4px;
                    color: var(--color-primary-dim);
                }

                .section-cursor-blink terminal-section-cursor-blink {
                    margin-left: 2px;
                }

                .terminal-section-fade-in {
                    animation: terminal-section-fadeIn 0.3s ease forwards;
                }

                @keyframes terminal-section-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
                    color: var(--color-primary-dim);
                    margin-bottom: var(--spacing-sm);
                    font-family: var(--font-mono);
                }

                .terminal-vim-body {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    flex: 1;
                    margin: 0;
                }

                .terminal-vim-tilde {
                    font-size: var(--font-size-md);
                    line-height: var(--line-height-normal);
                    color: var(--color-primary-dimmest);
                    font-family: var(--font-mono);
                    white-space: pre;
                }

                .terminal-vim-footer {
                    font-size: var(--font-size-sm);
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                    margin-top: var(--spacing-sm);
                    padding-top: var(--spacing-xs);
                    border-top: 1px solid var(--color-primary-dimmest);
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
                    color: var(--color-primary);
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
                    border: 1px solid var(--color-primary-dim);
                    color: var(--color-primary);
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
                    background: var(--color-primary-dimmest);
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
                    color: var(--color-primary);
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
                    color: var(--color-primary-dim);
                    font-family: var(--font-mono);
                    opacity: 0.5;
                }
            `}</style>
        </>
    )
}