// components/layout/SectionKeyNav.tsx
"use client"

// Page-level navigation: default the URL hash to #home, and page between
// sections with the arrow keys or the mouse wheel once booted (a CRT
// channel change).
//
// Why the wheel needs help: with `scroll-snap-type: y mandatory`, current
// Chrome treats a small wheel step as "not far enough" and springs back to
// the nearest section, so ordinary wheel scrolling never leaves the current
// one. A wheel flick therefore pages one section, like the arrow keys —
// except inside a terminal box that still has content to scroll, which
// scrolls natively first.

import { useEffect } from 'react'
import { useBootContext } from '@/src/components/layout/context/BootContext'
import { goToSection, PAGE_SECTIONS } from '@/src/lib/sectionNav'

const SECTION_IDS: string[] = PAGE_SECTIONS.map(s => s.id)

// Wheel paging: how much delta is one deliberate flick, and how long to
// ignore the rest of a gesture (trackpads keep firing inertia events)
const WHEEL_THRESHOLD = 40
const WHEEL_COOLDOWN_MS = 650
const WHEEL_QUIET_MS = 180

/** The section that is currently snapped in (closest top to the viewport's). */
function currentSectionIndex(): number {
    let best = 0
    let bestDist = Infinity
    SECTION_IDS.forEach((id, i) => {
        const el = document.getElementById(id)
        if (!el) return
        const dist = Math.abs(el.getBoundingClientRect().top)
        if (dist < bestDist) {
            bestDist = dist
            best = i
        }
    })
    return best
}

/** An element between the target and the page that can still scroll this way. */
function innerScrollerCanTake(target: EventTarget | null, deltaY: number): boolean {
    let el = target instanceof Element ? target : null
    while (el && el !== document.body && el !== document.documentElement) {
        const cs = getComputedStyle(el)
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
            const atTop = el.scrollTop <= 0
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
            if ((deltaY > 0 && !atBottom) || (deltaY < 0 && !atTop)) return true
        }
        el = el.parentElement
    }
    return false
}

/** Wheel paging applies only where sections snap (desktop widths, not plain mode). */
function pagingActive(): boolean {
    if (document.documentElement.dataset.mode === 'plain') return false
    return getComputedStyle(document.body).scrollSnapType.includes('mandatory')
}

export default function SectionKeyNav() {
    const { isBooted } = useBootContext()

    // Handle initial page load - set hash to #home if no hash exists
    useEffect(() => {
        if (!window.location.hash) {
            window.history.replaceState(null, '', '#home')
        }
    }, [])

    // Keyboard navigation with arrow keys - only when booted
    useEffect(() => {
        if (!isBooted) return

        const sections = ['home', 'about', 'projects', 'experience', 'contact']

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't interfere if another handler already consumed this event,
            // or while the visitor is editing text (arrow keys move the caret)
            if (e.defaultPrevented) return
            const target = e.target as HTMLElement | null
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

            const currentHash = window.location.hash.replace('#', '') || 'home'
            const currentIndex = sections.indexOf(currentHash)

            if (currentIndex === -1) return

            let targetIndex = currentIndex

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault()
                targetIndex = Math.min(currentIndex + 1, sections.length - 1)
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault()
                targetIndex = Math.max(currentIndex - 1, 0)
            }

            if (targetIndex !== currentIndex) goToSection(sections[targetIndex])
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isBooted])

    // Mouse wheel / trackpad: one flick pages one section
    useEffect(() => {
        if (!isBooted) return

        let accumulated = 0
        let lockedUntil = 0
        let lastWheel = 0
        // Set after paging: the rest of that gesture is ignored until a pause
        let gestureUsed = false

        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return  // pinch-zoom, sideways
            if (!pagingActive()) return
            if (innerScrollerCanTake(e.target, e.deltaY)) {
                accumulated = 0
                return  // a terminal box with more to show scrolls natively
            }
            // The page itself must not creep and spring back
            e.preventDefault()

            const now = performance.now()
            const quiet = now - lastWheel > WHEEL_QUIET_MS
            lastWheel = now
            // Ignore the tail of a gesture that already paged (trackpad inertia,
            // a fast-spun wheel): one gesture moves one section
            if (quiet) {
                accumulated = 0
                gestureUsed = false
            }
            if (gestureUsed || now < lockedUntil) return

            accumulated += e.deltaY
            if (Math.abs(accumulated) < WHEEL_THRESHOLD) return

            const from = currentSectionIndex()
            const to = Math.max(0, Math.min(SECTION_IDS.length - 1, from + Math.sign(accumulated)))
            accumulated = 0
            gestureUsed = true
            lockedUntil = now + WHEEL_COOLDOWN_MS
            if (to !== from) goToSection(SECTION_IDS[to])
        }

        window.addEventListener('wheel', onWheel, { passive: false })
        return () => window.removeEventListener('wheel', onWheel)
    }, [isBooted])

    return null
}
