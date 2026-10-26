// lib/projectDocs.ts
// One source for a project's write-up: the /projects/[slug] page renders the
// same fields, and the terminal's `cat projects/<slug>/README.md` prints this
// text. Both come from src/content/projects.ts, so they can't drift.

import { projects } from '@/src/content'
import type { Project } from '@/src/content/projects'

export function projectBySlug(slug: string): Project | undefined {
    return projects.find(p => p.slug === slug)
}

export function projectPath(p: Project): string {
    return `/projects/${p.slug}`
}

/** The project as a terminal README.md. */
export function projectReadme(p: Project): string {
    return [
        `# ${p.name}`,
        `Status: ${p.status ?? 'DONE'}${p.event ? `   ${p.event}` : ''}${p.year ? `   Year: ${p.year}` : ''}`,
        '',
        p.description,
        '',
        '## The problem',
        p.problem,
        '',
        '## What was built',
        ...p.built.map(b => `  - ${b}`),
        ...(p.result ? ['', '## Result', p.result.text, ...(p.result.source ? [`(${p.result.source})`] : [])] : []),
        '',
        `Stack: ${p.technologies.join(', ')}`,
        p.githubUrl ? `Code:  ${p.githubUrl}` : 'Code:  private',
        ...(p.liveUrl ? [`Live:  ${p.liveUrl}`] : []),
        ...(p.downloads ?? []).map(d => `Get:   ${d.url}  (${d.label})`),
        `Page:  ${projectPath(p)}`,
    ].join('\n')
}
