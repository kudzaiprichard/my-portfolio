// terminal/commands/theme.ts
// `theme` — list the phosphor themes, or switch: `theme amber`, `theme ice white`.

import { THEMES, type ThemeId } from '@/src/lib/themes'

/** Find a theme by id or alias (case-insensitive). */
export function resolveTheme(input: string): ThemeId | null {
    const key = input.trim().toLowerCase()
    if (!key) return null
    const squashed = key.replace(/[\s-]+/g, '')
    const match = THEMES.find(t => t.id === key || t.command === key || t.aliases.includes(key)
        || t.name.toLowerCase() === key || t.name.toLowerCase().replace(/\s+/g, '') === squashed)
    return match ? match.id : null
}

/**
 * Pure response for `theme [name]`. The session applies `apply` (if any)
 * and prints `text`.
 */
export function themeCommand(arg: string, active: ThemeId): { text: string; apply?: ThemeId } {
    const name = arg.trim()

    if (!name) {
        const rows = THEMES.map(t => {
            const mark = t.id === active ? '*' : ' '
            return `  ${mark} ${t.name.padEnd(15)} theme ${t.command}`
        })
        return {
            text: ['Phosphor themes (* = active):', '', ...rows, '', 'Switch with: theme <name>   e.g. theme amber'].join('\n'),
        }
    }

    const id = resolveTheme(name)
    if (!id) {
        return { text: `theme: unknown theme '${name}'. Try one of: ${THEMES.map(t => t.command).join(', ')}` }
    }
    const theme = THEMES.find(t => t.id === id)!
    if (id === active) return { text: `Already on ${theme.name}.` }
    return { text: `Phosphor swapped. Now running ${theme.name}.`, apply: id }
}
