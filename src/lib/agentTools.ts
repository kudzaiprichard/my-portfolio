// lib/agentTools.ts
//
// Server-side execution for agent tools that need secrets or external fetches
// (send_message, get_repo_stats). Called during the function-calling round-trip
// in app/api/chat; the returned object is fed back to Gemini as the tool's
// result, so the model's final reply reflects what actually happened.
//
// Server-only — do NOT import from client code.

import { projects } from '@/src/content'
import { sendContactEmail } from '@/src/lib/sendContactEmail'

/** Result object handed back to the model. Shape is intentionally model-friendly. */
type ToolResult = Record<string, unknown>

/* ============================================
   send_message
   ============================================ */

async function runSendMessage(args: Record<string, unknown>): Promise<ToolResult> {
    const name = typeof args.name === 'string' ? args.name : ''
    const email = typeof args.email === 'string' ? args.email : ''
    const message = typeof args.message === 'string' ? args.message : ''

    const result = await sendContactEmail({ name, email, message })
    return result.success
        ? { status: 'sent', note: `Message delivered to Kudzai. A confirmation was emailed to ${email}.` }
        : { status: 'error', reason: result.error || 'Could not send the message.' }
}

/* ============================================
   get_repo_stats
   ============================================ */

// Resolve a project name (as the model says it) to a GitHub "owner/repo" slug,
// derived from the canonical githubUrl in content/projects.ts.
const repoIndex: Array<{ key: string; slug: string; name: string }> = projects
    .map(p => {
        const m = p.githubUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/i)
        return m ? { key: p.name.toLowerCase(), slug: m[1], name: p.name } : null
    })
    .filter((x): x is { key: string; slug: string; name: string } => x !== null)

function resolveRepo(project: string): { slug: string; name: string } | null {
    const q = project.trim().toLowerCase()
    if (!q) return null
    // Exact, then fuzzy contains (so "aura platform" still finds "AURA").
    return (
        repoIndex.find(r => r.key === q) ||
        repoIndex.find(r => q.includes(r.key) || r.key.includes(q)) ||
        null
    )
}

interface GitHubRepo {
    stargazers_count?: number
    forks_count?: number
    open_issues_count?: number
    language?: string | null
    pushed_at?: string
    html_url?: string
    description?: string | null
}

// Cache GitHub responses ~10 min — unauthenticated GitHub allows only 60 req/hr
// per IP. An optional GITHUB_TOKEN raises that ceiling to 5000/hr.
const repoCache = new Map<string, { at: number; data: ToolResult }>()
const REPO_TTL_MS = 10 * 60_000

function humanizeAge(pushedAt?: string): string {
    if (!pushedAt) return 'unknown'
    const days = Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86_400_000)
    if (days <= 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 14) return `${days} days ago`
    if (days < 60) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)}+ years ago`
}

async function runGetRepoStats(args: Record<string, unknown>): Promise<ToolResult> {
    const project = typeof args.project === 'string' ? args.project : ''
    const repo = resolveRepo(project)
    if (!repo) {
        return { status: 'not_found', reason: `No project matched "${project}".` }
    }

    const cached = repoCache.get(repo.slug)
    if (cached && Date.now() - cached.at < REPO_TTL_MS) {
        return cached.data
    }

    try {
        const headers: Record<string, string> = {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'kudzai-portfolio',
        }
        if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

        const res = await fetch(`https://api.github.com/repos/${repo.slug}`, {
            headers,
            // Next.js fetch cache: also dedupe at the platform layer for 10 min.
            next: { revalidate: 600 },
        })

        if (res.status === 404) {
            return { status: 'private_or_missing', project: repo.name, note: 'Repository is private or not found on GitHub.' }
        }
        if (!res.ok) {
            return { status: 'unavailable', project: repo.name, reason: `GitHub returned ${res.status}.` }
        }

        const json = (await res.json()) as GitHubRepo
        const data: ToolResult = {
            status: 'ok',
            project: repo.name,
            stars: json.stargazers_count ?? 0,
            forks: json.forks_count ?? 0,
            openIssues: json.open_issues_count ?? 0,
            primaryLanguage: json.language ?? 'n/a',
            lastUpdated: humanizeAge(json.pushed_at),
            url: json.html_url ?? `https://github.com/${repo.slug}`,
        }
        repoCache.set(repo.slug, { at: Date.now(), data })
        return data
    } catch (err) {
        console.error('[agentTools] get_repo_stats error:', err)
        return { status: 'unavailable', project: repo.name, reason: 'Could not reach GitHub just now.' }
    }
}

/* ============================================
   dispatch
   ============================================ */

/**
 * Execute a server-side tool by name. Returns a result object to feed back to
 * the model. Unknown tools return an error result rather than throwing.
 */
export async function executeServerTool(
    name: string,
    args: Record<string, unknown> | undefined,
): Promise<ToolResult> {
    const a = args ?? {}
    switch (name) {
        case 'send_message':
            return runSendMessage(a)
        case 'get_repo_stats':
            return runGetRepoStats(a)
        default:
            return { status: 'error', reason: `Unknown tool: ${name}` }
    }
}
