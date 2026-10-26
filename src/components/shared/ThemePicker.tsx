// components/shared/ThemePicker.tsx
"use client"

// Phosphor theme picker, beside the mute toggle. Same choice as the
// terminal's `theme` command; both go through lib/themeStore.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { DEFAULT_THEME, THEMES, type ThemeId } from '@/src/lib/themes'
import { getTheme, setTheme, subscribeTheme } from '@/src/lib/themeStore'

export default function ThemePicker() {
    const active = useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME)
    const [open, setOpen] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Focus the active option when the menu opens
    useEffect(() => {
        if (!open) return
        menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
    }, [open])

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node
            if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        return () => document.removeEventListener('pointerdown', onPointerDown)
    }, [open])

    const close = (refocus: boolean) => {
        setOpen(false)
        if (refocus) buttonRef.current?.focus()
    }

    const choose = (id: ThemeId) => {
        setTheme(id)
        close(true)
    }

    const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])
        const index = items.indexOf(document.activeElement as HTMLButtonElement)
        if (e.key === 'Escape') { e.preventDefault(); close(true); return }
        if (e.key === 'Tab') { close(false); return }
        const next =
            e.key === 'ArrowDown' ? (index + 1) % items.length
            : e.key === 'ArrowUp' ? (index - 1 + items.length) % items.length
            : e.key === 'Home' ? 0
            : e.key === 'End' ? items.length - 1
            : -1
        if (next >= 0) {
            e.preventDefault()
            items[next]?.focus()
        }
    }

    const current = THEMES.find(t => t.id === active) ?? THEMES.find(t => t.id === DEFAULT_THEME)!

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className="theme-picker-btn"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Theme: ${current.name}. Change theme`}
                title="Change theme"
                onClick={() => setOpen(o => !o)}
            >
                <span className="theme-picker-swatch" style={{ background: current.colors.bright, boxShadow: `inset 0 0 0 3px ${current.colors.bg}` }} />
            </button>

            {open && (
                <div ref={menuRef} className="theme-picker-menu" role="menu" aria-label="Themes" onKeyDown={onMenuKeyDown}>
                    {THEMES.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={t.id === active}
                            className="theme-picker-option"
                            onClick={() => choose(t.id)}
                        >
                            <span className="theme-picker-swatch" style={{ background: t.colors.bright, boxShadow: `inset 0 0 0 3px ${t.colors.bg}` }} />
                            <span className="theme-picker-name">{t.name}</span>
                        </button>
                    ))}
                </div>
            )}

            <style>{`
                .theme-picker-btn {
                    position: fixed;
                    top: 16px;
                    right: 64px;
                    z-index: 9999;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgb(var(--surface-rgb) / 0.8);
                    border: 1px solid rgb(var(--glow) / 0.4);
                    cursor: pointer;
                    transition: border-color var(--dur-quick) var(--ease-out), box-shadow var(--dur-quick) var(--ease-out);
                }

                .theme-picker-btn:hover,
                .theme-picker-btn[aria-expanded="true"] {
                    border-color: var(--bright);
                    box-shadow: 0 0 10px rgb(var(--glow) / 0.3);
                }

                .theme-picker-swatch {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 1px solid rgb(var(--glow) / 0.4);
                    flex: 0 0 auto;
                }

                .theme-picker-menu {
                    position: fixed;
                    top: 62px;
                    right: 16px;
                    z-index: 9999;
                    min-width: 220px;
                    padding: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    background: rgb(var(--surface-rgb) / 0.96);
                    border: 1px solid rgb(var(--glow) / 0.4);
                    font-family: var(--font-mono);
                }

                .theme-picker-option {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 8px 10px;
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--text);
                    font: inherit;
                    font-size: var(--font-size-sm);
                    text-align: left;
                    cursor: pointer;
                }

                .theme-picker-option:hover,
                .theme-picker-option:focus-visible {
                    border-color: rgb(var(--glow) / 0.4);
                    outline: none;
                    box-shadow: none;
                }

                .theme-picker-option[aria-checked="true"] {
                    color: var(--bright);
                }

                .theme-picker-option[aria-checked="true"]::after {
                    content: '●';
                    margin-left: auto;
                    color: var(--bright);
                }

                .theme-picker-name { flex: 1 1 auto; }

                @media (max-width: 768px) {
                    .theme-picker-btn {
                        top: 10px;
                        right: 56px;
                        width: 36px;
                        height: 36px;
                    }
                    .theme-picker-menu {
                        top: 52px;
                        right: 10px;
                    }
                }
            `}</style>
        </>
    )
}
