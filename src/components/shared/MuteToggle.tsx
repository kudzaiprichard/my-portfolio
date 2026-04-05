// components/shared/MuteToggle.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'

const MUTE_KEY = 'keystroke-audio-muted'

export default function MuteToggle() {
    const [isMuted, setIsMuted] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)

    // Sync muted state from localStorage after mount to avoid hydration mismatch
    useEffect(() => {
        setIsMuted(localStorage.getItem(MUTE_KEY) === 'true')
        setHasMounted(true)
    }, [])

    // Listen for mute changes from other components (useKeystrokeAudio)
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === MUTE_KEY) {
                setIsMuted(e.newValue === 'true')
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const toggle = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev
            localStorage.setItem(MUTE_KEY, String(next))
            // Dispatch a custom event so same-tab listeners can react
            window.dispatchEvent(new CustomEvent('audio-mute-change', { detail: { muted: next } }))
            return next
        })
    }, [])

    return (
        <>
            <button
                onClick={toggle}
                className="mute-toggle-btn"
                aria-label={hasMounted ? (isMuted ? 'Unmute audio' : 'Mute audio') : 'Mute audio'}
                title={hasMounted ? (isMuted ? 'Unmute audio' : 'Mute audio') : 'Mute audio'}
            >
                {isMuted ? (
                    // Muted icon — speaker with X
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                ) : (
                    // Unmuted icon — speaker with waves
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                )}
            </button>

            <style>{`
                .mute-toggle-btn {
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    z-index: 9999;
                    background: rgba(0, 10, 0, 0.8);
                    border: 1px solid var(--color-primary-dimmer);
                    color: var(--color-primary);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: var(--font-mono);
                    padding: 0;
                }

                .mute-toggle-btn:hover {
                    border-color: var(--color-primary);
                    background: rgba(0, 255, 65, 0.08);
                    box-shadow: 0 0 12px rgba(0, 255, 65, 0.15);
                }

                .mute-toggle-btn:active {
                    transform: scale(0.95);
                }

                .mute-toggle-btn svg {
                    opacity: 0.8;
                    transition: opacity 0.2s ease;
                }

                .mute-toggle-btn:hover svg {
                    opacity: 1;
                }

                @media (max-width: 480px) {
                    .mute-toggle-btn {
                        top: 10px;
                        right: 10px;
                        width: 36px;
                        height: 36px;
                    }

                    .mute-toggle-btn svg {
                        width: 16px;
                        height: 16px;
                    }
                }
            `}</style>
        </>
    )
}
