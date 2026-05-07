// components/layout/ScrollHint.tsx
"use client"

import { useEffect, useState } from 'react'

const IDLE_DELAY_MS = 3000

function Chevron({ direction }: { direction: 'up' | 'down' }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            className={`scroll-hint-chevron scroll-hint-chevron-${direction}`}
        >
            {direction === 'up' ? (
                <path
                    d="M15 12.5L10 7.5L5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : (
                <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </svg>
    )
}

export default function ScrollHint() {
    const [homeVisible, setHomeVisible] = useState(true)
    const [contactVisible, setContactVisible] = useState(false)
    const [terminalVisible, setTerminalVisible] = useState(false)
    const [isIdle, setIsIdle] = useState(false)

    useEffect(() => {
        const homeEl = document.getElementById('home')
        const contactEl = document.getElementById('contact')
        const terminalEl = document.getElementById('terminal')

        if (!homeEl || !contactEl) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.target.id === 'home') {
                        setHomeVisible(entry.isIntersecting)
                    } else if (entry.target.id === 'contact') {
                        setContactVisible(entry.isIntersecting)
                    } else if (entry.target.id === 'terminal') {
                        setTerminalVisible(entry.isIntersecting)
                    }
                })
            },
            { threshold: 0.3 }
        )

        observer.observe(homeEl)
        observer.observe(contactEl)
        if (terminalEl) observer.observe(terminalEl)

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>

        const scheduleIdle = () => {
            setIsIdle(false)
            clearTimeout(timer)
            timer = setTimeout(() => setIsIdle(true), IDLE_DELAY_MS)
        }

        scheduleIdle()
        window.addEventListener('scroll', scheduleIdle, { passive: true })
        window.addEventListener('wheel', scheduleIdle, { passive: true })
        window.addEventListener('touchmove', scheduleIdle, { passive: true })
        window.addEventListener('keydown', scheduleIdle)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('scroll', scheduleIdle)
            window.removeEventListener('wheel', scheduleIdle)
            window.removeEventListener('touchmove', scheduleIdle)
            window.removeEventListener('keydown', scheduleIdle)
        }
    }, [])

    const showTop = !homeVisible && isIdle
    const showBottom = !contactVisible && !terminalVisible && isIdle

    return (
        <>
            <div className={`scroll-hint scroll-hint-top ${showTop ? 'visible' : 'hidden'}`}>
                <Chevron direction="up" />
            </div>

            <div className={`scroll-hint scroll-hint-bottom ${showBottom ? 'visible' : 'hidden'}`}>
                <Chevron direction="down" />
            </div>

            <style>{`
                .scroll-hint {
                    position: fixed;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 50;
                    transition: opacity 0.6s ease, visibility 0.6s ease;
                    opacity: 1;
                    visibility: visible;
                    pointer-events: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .scroll-hint.hidden {
                    opacity: 0;
                    visibility: hidden;
                }

                .scroll-hint-top {
                    top: 12px;
                }

                .scroll-hint-bottom {
                    bottom: 12px;
                }

                .scroll-hint-chevron {
                    color: rgb(0, 255, 65);
                    filter: drop-shadow(0 0 4px rgba(0, 255, 65, 0.35));
                }

                .scroll-hint-chevron-down {
                    animation: scroll-hint-hover-down 2.4s ease-in-out infinite;
                }

                .scroll-hint-chevron-up {
                    animation: scroll-hint-hover-up 2.4s ease-in-out infinite;
                }

                @keyframes scroll-hint-hover-down {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 0.35;
                    }
                    50% {
                        transform: translateY(4px);
                        opacity: 0.85;
                    }
                }

                @keyframes scroll-hint-hover-up {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 0.35;
                    }
                    50% {
                        transform: translateY(-4px);
                        opacity: 0.85;
                    }
                }

                @media (max-width: 480px) {
                    .scroll-hint-top { top: 8px; }
                    .scroll-hint-bottom { bottom: 8px; }

                    .scroll-hint-chevron {
                        width: 16px;
                        height: 16px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .scroll-hint-chevron-down,
                    .scroll-hint-chevron-up {
                        animation: none;
                        opacity: 0.6;
                    }
                }

                @media print {
                    .scroll-hint {
                        display: none;
                    }
                }
            `}</style>
        </>
    )
}
