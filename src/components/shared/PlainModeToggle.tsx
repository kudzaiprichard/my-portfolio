// components/shared/PlainModeToggle.tsx
"use client"

// The visible `--no-tty` switch, beside the theme picker. Same switch as the
// terminal's `--no-tty` / `tty` commands (lib/plainMode).

import { useEffect, useSyncExternalStore } from 'react'
import { applyPlainEffects, isPlainMode, setPlainMode, subscribePlainMode } from '@/src/lib/plainMode'

export default function PlainModeToggle() {
    const plain = useSyncExternalStore(subscribePlainMode, isPlainMode, () => false)

    // A stored choice was applied before paint; switch the effects off to match
    useEffect(() => {
        if (isPlainMode()) applyPlainEffects(true)
    }, [])

    return (
        <>
            <button
                type="button"
                className="plain-mode-toggle"
                aria-pressed={plain}
                onClick={() => setPlainMode(!plain)}
                title={plain ? 'Back to the terminal experience' : 'Plain mode: same content, no boot, typing, sound or effects'}
            >
                {plain ? 'tty' : '--no-tty'}
            </button>

            <style>{`
                .plain-mode-toggle {
                    position: fixed;
                    top: 16px;
                    right: 112px;
                    z-index: 9999;
                    height: 40px;
                    padding: 0 10px;
                    background: rgb(var(--surface-rgb) / 0.8);
                    border: 1px solid rgb(var(--glow) / 0.4);
                    color: var(--text);
                    font-family: var(--font-mono);
                    font-size: var(--font-size-sm);
                    cursor: pointer;
                }

                .plain-mode-toggle:hover {
                    border-color: var(--bright);
                }

                @media (max-width: 768px) {
                    .plain-mode-toggle {
                        top: 10px;
                        right: 100px;
                        height: 36px;
                        padding: 0 8px;
                    }
                }

                @media print {
                    .plain-mode-toggle { display: none; }
                }
            `}</style>
        </>
    )
}
