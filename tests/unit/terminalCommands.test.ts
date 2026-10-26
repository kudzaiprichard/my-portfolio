import { describe, expect, it } from 'vitest'
import { getCommandResponse } from '@/src/terminal/commands'
import { resolveAlias } from '@/src/terminal/commands/aliases'
import { findClosestCommand, levenshtein } from '@/src/terminal/commands/suggest'

describe('levenshtein', () => {
    it('computes edit distance', () => {
        expect(levenshtein('ls', 'ls')).toBe(0)
        expect(levenshtein('kitten', 'sitting')).toBe(3)
        expect(levenshtein('', 'abc')).toBe(3)
    })
})

describe('resolveAlias', () => {
    it('maps Windows and Mac names to canonical commands', () => {
        expect(resolveAlias('dir')).toBe('ls')
        expect(resolveAlias('type about.txt')).toBe('cat about.txt')
        expect(resolveAlias('screenfetch')).toBe('neofetch')
        expect(resolveAlias('?')).toBe('help')
    })

    it('expands ll and la with flags and keeps argument casing', () => {
        expect(resolveAlias('ll')).toBe('ls -l')
        expect(resolveAlias('la Projects')).toBe('ls -la Projects')
        expect(resolveAlias('TYPE README.md')).toBe('cat README.md')
    })

    it('leaves unknown commands untouched', () => {
        expect(resolveAlias('whoami')).toBe('whoami')
        expect(resolveAlias('')).toBe('')
    })
})

describe('findClosestCommand', () => {
    it('suggests a close command for a typo', () => {
        expect(findClosestCommand('whoamj', 'terminal')).toBe('whoami')
        expect(findClosestCommand('hlep', 'terminal')).toBe('help')
    })

    it('returns null for exact matches, very short input, or far-off input', () => {
        expect(findClosestCommand('help', 'terminal')).toBeNull()
        expect(findClosestCommand('x', 'terminal')).toBeNull()
        expect(findClosestCommand('zzzzzzzzzz', 'terminal')).toBeNull()
    })
})

describe('getCommandResponse (terminal section)', () => {
    it('clears on empty input and clear', () => {
        expect(getCommandResponse('terminal', '', '/').response).toBeNull()
        expect(getCommandResponse('terminal', 'clear', '/').response).toBeNull()
    })

    it('renders a section inline for cd <section>', () => {
        expect(getCommandResponse('terminal', 'cd about', '/').renderSection).toBe('about')
    })

    it('enters game and fun modes', () => {
        expect(getCommandResponse('terminal', 'snake', '/').enterMode).toBe('snake')
        expect(getCommandResponse('terminal', 'adventure', '/').enterMode).toBe('adventure')
        expect(getCommandResponse('terminal', 'matrix', '/').enterMode).toBe('matrix')
        expect(getCommandResponse('terminal', 'vim', '/').enterMode).toBe('vim')
    })

    it('starts the tour without an AI call', () => {
        expect(getCommandResponse('terminal', 'tour', '/').startTour).toBe(true)
    })

    it('routes plain-English questions to the agent', () => {
        expect(getCommandResponse('terminal', 'what do you work on?', '/').askAI).toBe('what do you work on?')
    })

    it('has a help listing', () => {
        const help = getCommandResponse('terminal', 'help', '/').response ?? ''
        expect(help).toContain('games          everything you can play')
        expect(help).toContain('wpm            typing race')
        expect(help).not.toContain('hack')
    })
})

describe('getCommandResponse (mini shells)', () => {
    it('navigates instead of rendering inline', () => {
        expect(getCommandResponse('hero', 'cd about', '/').navigateTo).toBe('about')
    })

    it('answers whoami', () => {
        expect(getCommandResponse('hero', 'whoami', '/').response).toContain('kudzai')
    })

    it('reports unknown single-token commands with a suggestion', () => {
        const r = getCommandResponse('about', 'whoamj', '/')
        expect(r.response).toContain('command not found')
        expect(r.response).toContain('Did you mean: whoami?')
    })
})
