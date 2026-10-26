// terminal/format.ts
// The terminal's structured output: every section prints as boxed blocks,
//
//   ┌─ Title
//   │  a paragraph
//   │
//   │  # a sub-heading (a shell comment)
//   │  ▸ a bullet
//   │  Label   value
//   └──
//
// TerminalInput renders these lines with a continuous left bar, hanging
// indents for bullets and aligned label columns, so long text wraps under
// itself and stays readable. Built from src/content; used by `cd <section>`
// (terminal/sections) and the files `cat` prints (terminal/fs).

import { owner, contact, skillCategories, specializations, projects, experiences } from '@/src/content'
import type { Project } from '@/src/content/projects'

type Experience = (typeof experiences)[number]

/** A block: a titled box around its body lines ('' is a blank row). */
export function box(title: string, body: string[]): string[] {
    return [`┌─ ${title}`, ...body.map(l => (l ? `│  ${l}` : '│')), '└──']
}

/** Bullet rows; the renderer indents wrapped text under the bullet's text. */
export function bullets(items: readonly string[]): string[] {
    return items.map(i => `▸ ${i}`)
}

/** Label/value rows with the labels padded to one column. */
function fields(rows: ReadonlyArray<readonly [string, string | undefined]>): string[] {
    const shown = rows.filter((r): r is readonly [string, string] => !!r[1])
    const width = Math.max(...shown.map(([label]) => label.length))
    return shown.map(([label, value]) => `${label.padEnd(width)}  ${value}`)
}

/** Several blocks, a blank line between them. */
function blocks(...groups: string[][]): string[] {
    return groups.flatMap((g, i) => (i ? ['', ...g] : g))
}

const plainUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

export function homeBlock(): string[] {
    return box(owner.name, [owner.title, '', ...owner.description])
}

export function aboutBlocks(): string[] {
    return blocks(
        box('About', [owner.bio]),
        box('Tech stack', fields(skillCategories.map(c => [c.title, c.technologies.join(' · ')] as const))),
        box('Specializations', bullets(specializations)),
        box('Education', fields(owner.education.map(e => [e.period, `${e.degree}, ${e.school}${e.detail ? ` (${e.detail})` : ''}`] as const))),
        box('Honours', bullets(owner.honors)),
    )
}

function projectBlock(p: Project): string[] {
    const tags = [p.status && `[${p.status}]`, p.event && `[${p.event}]`].filter(Boolean).join(' ')
    return box(`${p.name}${tags ? ` ${tags}` : ''}`, [
        p.description,
        '',
        ...fields([
            ['Stack', p.technologies.join(', ')],
            ['Year', p.year ? String(p.year) : undefined],
            ['Code', p.githubUrl ? plainUrl(p.githubUrl) : 'private'],
            ['Website', p.liveUrl && plainUrl(p.liveUrl)],
            ...(p.downloads ?? []).map(d => ['Download', `${d.label}: ${plainUrl(d.url)}`] as const),
            ['Details', `/projects/${p.slug}`],
        ]),
    ])
}

export function experienceBlock(e: Experience): string[] {
    const company = e.company.replace(/^@\s*/, '')
    return box(`${e.role} @ ${company}`, [
        ...fields([['Period', e.period], ['Website', e.url && plainUrl(e.url)]]),
        '',
        e.description,
        '',
        '# Highlights',
        ...bullets(e.achievements),
        '',
        ...fields([['Stack', e.technologies.join(', ')]]),
    ])
}

export function contactBlock(): string[] {
    return box('Contact', [
        ...fields([
            ['Email', contact.email],
            ['GitHub', `${contact.githubHandle}  ${plainUrl(contact.githubUrl)}`],
            ['LinkedIn', `${contact.linkedinName}  ${plainUrl(contact.linkedinUrl)}`],
            ['X', `${contact.twitterHandle}  ${plainUrl(contact.twitterUrl)}`],
            ['Hugging Face', plainUrl(contact.huggingfaceUrl)],
            ['CV', 'type `cv` to download'],
        ]),
        '',
        'Email is the quickest way to reach me.',
    ])
}

export const projectsBlocks = () => blocks(...projects.map(projectBlock))
export const experienceBlocks = () => blocks(...experiences.map(experienceBlock))
