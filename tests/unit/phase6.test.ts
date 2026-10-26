import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACHIEVEMENTS, achievementsText, unlockAchievement, unlockedAchievements } from '@/src/lib/achievements'
import { getCommandResponse } from '@/src/terminal/commands'
import { handleTerminalCommand } from '@/src/terminal/fs'
import { projects, experiences } from '@/src/content'
import { projectReadme } from '@/src/lib/projectDocs'
import { screenReaderCommand } from '@/src/lib/screenReaderStore'

function stubStorage() {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v) },
        removeItem: (k: string) => { store.delete(k) },
    })
}

describe('achievements', () => {
    beforeEach(stubStorage)
    afterEach(() => vi.unstubAllGlobals())

    it('has eleven, all locked at first', () => {
        expect(ACHIEVEMENTS).toHaveLength(11)
        expect(unlockedAchievements().size).toBe(0)
        expect(achievementsText(unlockedAchievements())).toContain('found 0 of 11')
    })

    it('unlocks each once and remembers it', () => {
        expect(unlockAchievement('sl')?.name).toBe('Choo choo')
        expect(unlockAchievement('sl')).toBeNull()
        expect(unlockAchievement('vim')).not.toBeNull()
        const got = unlockedAchievements()
        expect([...got].sort()).toEqual(['sl', 'vim'])
        const text = achievementsText(got)
        expect(text).toContain('found 2 of 11')
        expect(text).toContain('[x] Choo choo')
        expect(text).toContain('hint:')
    })
})

describe('Phase 6 commands', () => {
    it('routes the toggles in every terminal', () => {
        for (const section of ['terminal', 'hero', 'about'] as const) {
            expect(getCommandResponse(section, '--no-tty', '/').plain).toBe(true)
            expect(getCommandResponse(section, 'tty', '/').plain).toBe(false)
            expect(getCommandResponse(section, 'screenreader on', '/').screenReader).toBe('on')
            expect(getCommandResponse(section, 'sr off', '/').screenReader).toBe('off')
            expect(getCommandResponse(section, 'crt on', '/').crt).toBe('on')
        }
    })

    it('explains screen-reader mode', () => {
        expect(screenReaderCommand('', false).text).toContain('off')
        expect(screenReaderCommand('on', false).apply).toBe(true)
        expect(screenReaderCommand('loud', false).apply).toBeUndefined()
    })
})

describe('terminal filesystem from content', () => {
    it('has one folder per project whose README matches the project page source', () => {
        const ls = handleTerminalCommand('ls projects', '/').output ?? ''
        for (const p of projects) {
            expect(ls).toContain(`${p.slug}/`)
            expect(handleTerminalCommand(`cat projects/${p.slug}/README.md`, '/').output).toBe(projectReadme(p))
        }
        // The old hand-written copies are gone
        expect(ls).not.toContain('ai-chatbot-platform')
    })

    it('lists the real experience', () => {
        const ls = handleTerminalCommand('ls experience', '/').output ?? ''
        for (const e of experiences) expect(ls.toLowerCase()).toContain(e.role.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        expect(ls).not.toContain('senior-ai-engineer')
    })

    it('has the ~/.secret file', () => {
        expect(handleTerminalCommand('cat .secret', '/').output).toContain('deeper secrets')
    })
})

describe('hints and ghost suggestions stay readable', () => {
    const css = readFileSync('src/components/shared/TerminalInput.tsx', 'utf8')
    // --dim passes 4.5:1 in every theme (themes.test.ts); these must use it at full strength
    for (const cls of ['terminal-interactive-suggestion', 'terminal-interactive-hint', 'terminal-interactive-agent-label', 'terminal-voice-privacy']) {
        it(`.${cls} uses --dim with no transparency`, () => {
            const rule = css.match(new RegExp(`\\.${cls} \\{([^}]*)\\}`))?.[1] ?? ''
            expect(rule).toMatch(/color:\s*var\(--dim\)/)
            expect(rule).not.toMatch(/opacity:\s*0?\.\d/)
        })
    }
})
