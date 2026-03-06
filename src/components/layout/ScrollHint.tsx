// components/layout/ScrollHint.tsx
"use client"

import { useEffect, useState } from 'react'

export default function ScrollHint() {
    const [homeVisible, setHomeVisible] = useState(true)
    const [contactVisible, setContactVisible] = useState(false)

    useEffect(() => {
        const homeEl = document.getElementById('home')
        const contactEl = document.getElementById('contact')

        if (!homeEl || !contactEl) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.target.id === 'home') {
                        setHomeVisible(entry.isIntersecting)
                    } else if (entry.target.id === 'contact') {
                        setContactVisible(entry.isIntersecting)
                    }
                })
            },
            { threshold: 0.3 }
        )

        observer.observe(homeEl)
        observer.observe(contactEl)

        return () => observer.disconnect()
    }, [])

    const showTop = !homeVisible
    const showBottom = !contactVisible

    return (
        <>
            <div className={`scroll-hint scroll-hint-top ${showTop ? 'visible' : 'hidden'}`}>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="scroll-hint-chevron scroll-hint-chevron-up"
                >
                    <path
                        d="M15 12.5L10 7.5L5 12.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <div className={`scroll-hint scroll-hint-bottom ${showBottom ? 'visible' : 'hidden'}`}>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="scroll-hint-chevron scroll-hint-chevron-down"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <style>{`
                .scroll-hint {
                    position: fixed;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 50;
                    transition: opacity 0.5s ease, visibility 0.5s ease;
                    opacity: 1;
                    visibility: visible;
                    pointer-events: none;
                }

                .scroll-hint.hidden {
                    opacity: 0;
                    visibility: hidden;
                }

                .scroll-hint-top {
                    top: 30px;
                }

                .scroll-hint-bottom {
                    bottom: 30px;
                }

                .scroll-hint-chevron {
                    color: rgba(0, 255, 65, 0.7);
                    filter: drop-shadow(0 0 8px rgba(0, 255, 65, 0.6));
                }

                .scroll-hint-chevron-down {
                    animation: scroll-hint-bounce-down 2s ease-in-out infinite;
                }

                .scroll-hint-chevron-up {
                    animation: scroll-hint-bounce-up 2s ease-in-out infinite;
                }

                @keyframes scroll-hint-bounce-down {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translateY(12px);
                        opacity: 1;
                    }
                }

                @keyframes scroll-hint-bounce-up {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translateY(-12px);
                        opacity: 1;
                    }
                }

                @media (max-width: 768px) {
                    .scroll-hint-top { top: 25px; }
                    .scroll-hint-bottom { bottom: 25px; }

                    .scroll-hint-chevron {
                        width: 18px;
                        height: 18px;
                    }
                }

                @media (max-width: 480px) {
                    .scroll-hint-top { top: 20px; }
                    .scroll-hint-bottom { bottom: 20px; }

                    .scroll-hint-chevron {
                        width: 16px;
                        height: 16px;
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