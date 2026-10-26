// lib/sectionNav.ts
// Moving between page sections: one helper for the tmux bar, the arrow
// keys, the agent and the superuser shortcut. With View Transitions it is a
// CRT channel change (the jump happens between the two frames); otherwise a
// smooth scroll.

import { canTransition, runTransition } from '@/src/lib/viewTransition'

export const PAGE_SECTIONS = [
    { id: 'home', label: 'home' },
    { id: 'about', label: 'about' },
    { id: 'projects', label: 'projects' },
    { id: 'experience', label: 'exp' },
    { id: 'contact', label: 'contact' },
    { id: 'terminal', label: 'term' },
] as const

export type PageSectionId = typeof PAGE_SECTIONS[number]['id']

/** Go to a section and move focus there. */
export function goToSection(id: string): void {
    const el = document.getElementById(id)
    if (!el) {
        // Not on the home page (e.g. a project page): go there
        window.location.assign(`/#${id}`)
        return
    }
    const jump = (behavior: ScrollBehavior) => {
        el.scrollIntoView({ behavior })
        el.focus({ preventScroll: true })
        if (window.location.hash !== `#${id}`) window.history.replaceState(null, '', `#${id}`)
    }
    if (canTransition()) void runTransition('chan', () => jump('instant'))
    else jump('smooth')
}
