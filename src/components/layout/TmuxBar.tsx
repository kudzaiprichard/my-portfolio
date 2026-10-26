// components/layout/TmuxBar.tsx
"use client"

/**
 * The page indicator, as a tmux status bar: `[0:home] 1:about 2:projects …`
 * with the section on screen highlighted. Each window is a button; choosing
 * one changes channel to that section (lib/sectionNav). On the right, a live
 * `★ 3/11` achievements counter opens the list in the terminal. Shown after boot.
 */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { useBootContext } from '@/src/components/layout/context/BootContext'
import { goToSection, PAGE_SECTIONS, type PageSectionId } from '@/src/lib/sectionNav'
import { ACHIEVEMENTS, achievementCount, subscribeAchievements } from '@/src/lib/achievements'

export default function TmuxBar() {
    const { isBooted } = useBootContext()
    const [visible, setVisible] = useState<PageSectionId>('home')
    // Off the home page (a project page) no window is current
    const onHome = usePathname() === '/'
    const active = onHome ? visible : null
    const found = useSyncExternalStore(subscribeAchievements, achievementCount, () => 0)

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) setVisible(entry.target.id as PageSectionId)
            }
        }, { threshold: 0.5 })
        for (const s of PAGE_SECTIONS) {
            const el = document.getElementById(s.id)
            if (el) observer.observe(el)
        }
        return () => observer.disconnect()
    }, [])

    if (!isBooted) return null

    return (
        <>
            <nav className="tmux-bar" aria-label="Sections">
                <span className="tmux-bar-session" aria-hidden="true">[kudzai]</span>
                {PAGE_SECTIONS.map((s, i) => (
                    <button
                        key={s.id}
                        type="button"
                        className="tmux-bar-window"
                        aria-current={s.id === active ? 'true' : undefined}
                        onClick={() => goToSection(s.id)}
                    >
                        {i}:{s.label}{s.id === active ? '*' : ''}
                    </button>
                ))}
                <button
                    type="button"
                    className="tmux-bar-achievements"
                    // The terminal loads only when asked for, not with every page
                    onClick={() => onHome
                        ? void import('@/src/terminal/store').then(m => m.runInTerminal('achievements', goToSection))
                        : goToSection('terminal')}
                    aria-label={`Achievements: ${found} of ${ACHIEVEMENTS.length} found. Open the list in the terminal`}
                    title="Games and easter eggs found"
                >
                    ★ {found}/{ACHIEVEMENTS.length}
                </button>
                <span className="tmux-bar-host" aria-hidden="true">kudzai@portfolio</span>
            </nav>

            <style>{`
                .tmux-bar {
                    position: fixed;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 9998;
                    display: flex;
                    align-items: stretch;
                    font-family: var(--font-mono);
                    font-size: var(--font-size-sm);
                    background: rgb(var(--surface-rgb) / 0.94);
                    border-top: 1px solid rgb(var(--glow) / 0.25);
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                    overflow-x: auto;
                    scrollbar-width: none;
                    animation: lnin var(--dur-lnin) var(--ease-out) both;
                }

                .tmux-bar::-webkit-scrollbar { display: none; }

                .tmux-bar-session {
                    padding: 5px 10px;
                    background: var(--bright);
                    color: var(--bg);
                    font-weight: 600;
                    flex: 0 0 auto;
                }

                .tmux-bar-window {
                    flex: 0 0 auto;
                    background: transparent;
                    border: 0;
                    color: var(--dim);
                    font: inherit;
                    padding: 5px 10px;
                    min-height: 0;
                    min-width: 0;
                    cursor: pointer;
                }

                .tmux-bar-window:hover {
                    color: var(--text);
                }

                .tmux-bar-window[aria-current="true"] {
                    background: rgb(var(--glow) / 0.18);
                    color: var(--bright);
                    font-weight: 600;
                }

                .tmux-bar-window:focus-visible {
                    outline: 2px solid var(--bright);
                    outline-offset: -2px;
                    box-shadow: none;
                }

                .tmux-bar-achievements {
                    margin-left: auto;
                    flex: 0 0 auto;
                    background: transparent;
                    border: 0;
                    color: var(--warn);
                    font: inherit;
                    padding: 5px 10px;
                    min-height: 0;
                    min-width: 0;
                    cursor: pointer;
                }

                .tmux-bar-achievements:hover {
                    background: rgb(var(--glow) / 0.12);
                }

                .tmux-bar-achievements:focus-visible {
                    outline: 2px solid var(--bright);
                    outline-offset: -2px;
                    box-shadow: none;
                }

                .tmux-bar-host {
                    padding: 5px 10px;
                    color: var(--dim);
                    flex: 0 0 auto;
                }

                @media (max-width: 600px) {
                    .tmux-bar-host, .tmux-bar-session { display: none; }
                    .tmux-bar-window { padding: 8px 9px; }
                }

                @media print {
                    .tmux-bar { display: none; }
                }
            `}</style>
        </>
    )
}
