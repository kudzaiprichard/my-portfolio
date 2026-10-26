import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { THEMES, THEME_IDS, DEFAULT_THEME } from '@/src/lib/themes'
import { resolveTheme, themeCommand } from '@/src/terminal/commands/theme'

// WCAG 2.x relative luminance and contrast ratio
function luminance(hex: string): number {
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}

// Normalise CRLF (Windows checkouts with core.autocrlf) so selectors match
const css = readFileSync('app/globals.css', 'utf8').replace(/\r\n/g, '\n')

/** Token values for one theme, read from its block in globals.css. */
function cssTokens(id: string): Record<string, string> {
    const selector = id === DEFAULT_THEME ? `:root,\n:root[data-theme="${id}"]` : `:root[data-theme="${id}"]`
    const start = css.indexOf(selector + ' {')
    expect(start, `theme block for ${id}`).toBeGreaterThan(-1)
    const block = css.slice(start, css.indexOf('}', start))
    return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))
}

describe('theme palettes', () => {
    it('defines all five themes, p1 first and default', () => {
        expect(THEME_IDS).toEqual(['p1', 'p3', 'p4', 'night', 'paper'])
        expect(DEFAULT_THEME).toBe('night')
    })

    for (const theme of THEMES) {
        describe(theme.name, () => {
            const tokens = cssTokens(theme.id)

            it('globals.css matches lib/themes.ts', () => {
                for (const [key, value] of Object.entries(theme.colors)) {
                    expect(tokens[key]?.toUpperCase(), `--${key}`).toBe(value.toUpperCase())
                }
            })

            it('--glow is --bright as an RGB triplet', () => {
                const hex = theme.colors.bright
                const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ')
                expect(tokens.glow).toBe(rgb)
            })

            for (const role of ['text', 'dim', 'warn', 'error', 'agent', 'bright'] as const) {
                it(`--${role} has ≥ 4.5:1 contrast on --bg`, () => {
                    expect(contrast(theme.colors[role], theme.colors.bg)).toBeGreaterThanOrEqual(4.5)
                })
            }
        })
    }
})

describe('theme command', () => {
    it('resolves ids and aliases', () => {
        expect(resolveTheme('p3')).toBe('p3')
        expect(resolveTheme('AMBER')).toBe('p3')
        expect(resolveTheme('light')).toBe('paper')
        expect(resolveTheme('nope')).toBeNull()
    })

    it('lists themes and marks the active one', () => {
        const { text, apply } = themeCommand('', 'p4')
        expect(apply).toBeUndefined()
        expect(text).toContain('* Ice White')
        for (const t of THEMES) expect(text).toContain(t.name)
        // Friendly names only: no P-codes on screen
        expect(text).not.toMatch(/p[134]/)
    })

    it('accepts the display names and the short words', () => {
        expect(themeCommand('ice white', 'p1').apply).toBe('p4')
        expect(themeCommand('Night Shift', 'p1').apply).toBe('night')
        expect(themeCommand('daylight paper', 'p1').apply).toBe('paper')
        expect(themeCommand('phosphor', 'night').apply).toBe('p1')
        expect(themeCommand('ice', 'p1').apply).toBe('p4')
    })

    it('switches, refuses unknown names, and notices no-ops', () => {
        expect(themeCommand('amber', 'p1').apply).toBe('p3')
        expect(themeCommand('purple', 'p1')).toEqual({ text: expect.stringContaining("unknown theme 'purple'") })
        expect(themeCommand('p1', 'p1').apply).toBeUndefined()
    })
})
