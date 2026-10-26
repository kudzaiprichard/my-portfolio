// components/shared/MuteToggle.tsx
"use client"

import { useSyncExternalStore } from 'react'
import { ANALYTICS_EVENTS, trackEvent } from '@/src/lib/analytics'
import { setAudioMuted } from '@/src/lib/audioEngine'

const MUTE_KEY = 'keystroke-audio-muted'
const MUTE_EVENT = 'audio-mute-change'

// Mute state lives in localStorage. Other tabs report changes through the
// storage event; this tab's components through MUTE_EVENT.
function subscribe(onChange: () => void) {
    const onStorage = (e: StorageEvent) => { if (e.key === MUTE_KEY) onChange() }
    window.addEventListener('storage', onStorage)
    window.addEventListener(MUTE_EVENT, onChange)
    return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(MUTE_EVENT, onChange)
    }
}

const readMuted = () => localStorage.getItem(MUTE_KEY) === 'true'
const noopSubscribe = () => () => {}

export default function MuteToggle() {
    // Server render and hydration both see "not muted, not mounted", then the
    // client snapshot takes over — no hydration mismatch.
    const isMuted = useSyncExternalStore(subscribe, readMuted, () => false)
    const hasMounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

    const toggle = () => {
        const next = !readMuted()
        setAudioMuted(next)
        if (next) trackEvent(ANALYTICS_EVENTS.soundMuted)
    }

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
                    background: rgb(var(--surface-rgb) / 0.8);
                    border: 1px solid rgb(var(--glow) / 0.4);
                    color: var(--text);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all var(--dur-quick) var(--ease-out);
                    font-family: var(--font-mono);
                    padding: 0;
                }

                .mute-toggle-btn:hover {
                    border-color: var(--bright);
                    background: rgb(var(--glow) / 0.08);
                    box-shadow: 0 0 12px rgb(var(--glow) / 0.15);
                }

                .mute-toggle-btn:active {
                    transform: scale(0.95);
                }

                .mute-toggle-btn svg {
                    opacity: 0.8;
                    transition: opacity var(--dur-quick) var(--ease-out);
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
