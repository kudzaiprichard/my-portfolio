// components/layout/ScrollHint.tsx
"use client"

import { useEffect, useState } from 'react'

export default function ScrollHint() {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY

            // Hide after user scrolls down
            if (scrollPosition > 100) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    return (
        <>
            <div className={`scroll-hint ${isVisible ? 'visible' : 'hidden'}`}>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="scroll-hint-chevron"
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
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 50;
                    transition: opacity 0.5s ease, visibility 0.5s ease;
                    opacity: 1;
                    visibility: visible;
                }

                .scroll-hint.hidden {
                    opacity: 0;
                    visibility: hidden;
                }

                .scroll-hint-chevron {
                    color: rgba(0, 255, 65, 0.7);
                    filter: drop-shadow(0 0 8px rgba(0, 255, 65, 0.6));
                    animation: scroll-hint-bounce 2s ease-in-out infinite;
                }

                @keyframes scroll-hint-bounce {
                    0%, 100% {
                        transform: translateY(0);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translateY(12px);
                        opacity: 1;
                    }
                }

                @media (max-width: 768px) {
                    .scroll-hint {
                        bottom: 25px;
                    }
                    
                    .scroll-hint-chevron {
                        width: 18px;
                        height: 18px;
                    }
                }

                @media (max-width: 480px) {
                    .scroll-hint {
                        bottom: 20px;
                    }
                    
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