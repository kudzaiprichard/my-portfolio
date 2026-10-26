// components/shared/KeycapFeedback.tsx
"use client"

/**
 * Keycap buttons, site-wide: every button, CTA and button-like link presses
 * down 1 px with a short flash (CSS :active in globals.css) and plays the
 * Enter keystroke, so a click sounds like the typing. Keyboard presses
 * (Enter / Space on a focused control) get the same flash and sound.
 */

import { useEffect } from 'react'
import { audioEngine } from '@/src/lib/audioEngine'

const KEYCAP_SELECTOR = 'button, [role="button"], [role="menuitemradio"], .keycap, a.projects-section-link, a.projects-section-footer-link, a.contact-section-link'
const PRESSED = 'is-keycap-pressed'
const FLASH_MS = 120

export default function KeycapFeedback() {
    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            const el = (e.target as Element | null)?.closest?.(KEYCAP_SELECTOR)
            if (el && !(el as HTMLButtonElement).disabled) audioEngine.keycap()
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return
            const el = (e.target as Element | null)?.closest?.(KEYCAP_SELECTOR) as HTMLElement | null
            if (!el || (el as HTMLButtonElement).disabled) return
            audioEngine.keycap()
            el.classList.add(PRESSED)
            setTimeout(() => el.classList.remove(PRESSED), FLASH_MS)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [])

    return null
}
