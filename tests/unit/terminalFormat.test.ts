import { describe, expect, it } from 'vitest'
import { box, bullets, contactBlock, experienceBlocks, projectsBlocks, aboutBlocks, homeBlock } from '@/src/terminal/format'
import { formatSectionLines } from '@/src/terminal/sections'
import { experiences, projects } from '@/src/content'

/** Every line is part of a box (top, body row, end) or a blank line between boxes. */
const STRUCTURED = /^(?:┌─ .+|│(?: {2}.+)?|└──|)$/

describe('terminal output format', () => {
    it('wraps a body in a titled box, with bare bars for blank rows', () => {
        expect(box('Title', ['one', '', 'two'])).toEqual(['┌─ Title', '│  one', '│', '│  two', '└──'])
        expect(bullets(['a', 'b'])).toEqual(['▸ a', '▸ b'])
    })

    it('prints every section as boxed blocks', () => {
        for (const lines of [homeBlock(), aboutBlocks(), projectsBlocks(), experienceBlocks(), contactBlock()]) {
            for (const line of lines) expect(line).toMatch(STRUCTURED)
            expect(lines[0]).toMatch(/^┌─ /)
            expect(lines.at(-1)).toBe('└──')
        }
    })

    it('gives each job a box with its period, highlights as bullets, and its stack', () => {
        const lines = experienceBlocks()
        expect(lines.filter(l => l.startsWith('┌─ '))).toHaveLength(experiences.length)
        const first = experiences[0]
        expect(lines).toContain(`┌─ ${first.role} @ ${first.company.replace(/^@\s*/, '')}`)
        expect(lines.some(l => /^│ {2}Period {2,}/.test(l))).toBe(true)
        expect(lines).toContain(`│  ▸ ${first.achievements[0]}`)
        expect(lines.filter(l => /^│ {2}Stack {2,}/.test(l))).toHaveLength(experiences.length)
    })

    it('aligns label columns inside a box', () => {
        const rows = contactBlock().filter(l => /^│ {2}\S.* {2,}/.test(l))
        const valueStart = rows.map(l => l.search(/(?<=\S) {2,}\S/) + l.slice(l.search(/(?<=\S) {2,}\S/)).search(/\S/))
        expect(new Set(valueStart).size).toBe(1)
    })

    it('gives each project a box, and cd uses the same blocks', () => {
        expect(projectsBlocks().filter(l => l.startsWith('┌─ '))).toHaveLength(projects.length)
        expect(formatSectionLines('experience')).toEqual(experienceBlocks())
        expect(formatSectionLines('contact')).toEqual(contactBlock())
    })
})
