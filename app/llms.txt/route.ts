// app/llms.txt/route.ts
// A plain-text summary of the work, projects and contact for AI agents and
// LLM crawlers (the llmstxt.org format). Built from src/content at build time.

import { owner, contact, projects, experiences, skillCategories } from '@/src/content'
import { SITE_URL } from '@/src/lib/site'

const baseUrl = SITE_URL

function llmsTxt(): string {
    return [
        `# ${owner.fullName}`,
        '',
        `> ${owner.title}. ${owner.bio}`,
        '',
        'This site is a terminal-style portfolio. Everything below is also on the page; a plain, no-animation view is available with the `--no-tty` switch. AI agents in browsers that support WebMCP can use the tools this page registers (download_resume, navigate_to_section, get_repo_stats, send_message).',
        '',
        '## Projects',
        '',
        ...projects.map(p => `- [${p.name}](${baseUrl}/projects/${p.slug}): ${p.problem} Stack: ${p.technologies.join(', ')}.${p.githubUrl ? ` Code: ${p.githubUrl}` : ''}${p.liveUrl ? ` Website: ${p.liveUrl}` : ''}${(p.downloads ?? []).map(d => ` Download (${d.label}): ${d.url}`).join('')}${p.result ? ` Result: ${p.result.text}` : ''}`),
        '',
        '## Experience',
        '',
        ...experiences.map(e => `- ${e.role} ${e.company} (${e.period}): ${e.description}`),
        '',
        '## Skills',
        '',
        ...skillCategories.map(c => `- ${c.title}: ${c.technologies.join(', ')}`),
        '',
        '## Contact',
        '',
        `- Email: ${contact.email}`,
        `- GitHub: ${contact.githubUrl}`,
        `- LinkedIn: ${contact.linkedinUrl}`,
        `- CV: ${new URL(contact.resumeUrl, baseUrl).toString()}`,
        '',
        '## Optional',
        '',
        `- [Home](${baseUrl}/): the interactive terminal portfolio`,
        `- [Sitemap](${baseUrl}/sitemap.xml)`,
        '',
    ].join('\n')
}

export function GET() {
    return new Response(llmsTxt(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
