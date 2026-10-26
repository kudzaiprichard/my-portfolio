// components/shared/WebMcpTools.tsx
"use client"

/**
 * WebMCP: lets a visitor's own browser agent use this site's tools without
 * scraping it. The same four tools the terminal agent has, declared once in
 * TOOL_DECLARATIONS (lib/aiAgent): download_resume, navigate_to_section,
 * get_repo_stats, send_message.
 *
 * The API is a W3C Community Group draft and still moving: Chrome's current
 * docs expose `document.modelContext.registerTool(tool, { signal })`, earlier
 * drafts and the first origin trial `navigator.modelContext`. Both are
 * feature-detected; nothing happens where neither exists.
 */

import { useEffect } from 'react'
import { contact } from '@/src/content'
import { TOOL_DECLARATIONS } from '@/src/lib/aiAgent'
import { ANALYTICS_EVENTS, trackEvent } from '@/src/lib/analytics'
import { goToSection } from '@/src/lib/sectionNav'
import { newGuard } from '@/src/lib/spamGuard'
import { downloadOrOpen } from '@/src/terminal/agent'

const WEBMCP_TOOLS = ['download_resume', 'navigate_to_section', 'get_repo_stats', 'send_message'] as const

interface ModelContextTool {
    name: string
    description: string
    inputSchema: object
    annotations?: { readOnlyHint?: boolean; consequentialHint?: boolean }
    execute: (input: Record<string, unknown>) => Promise<string>
}

interface ModelContext {
    registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => unknown
}

function findModelContext(): ModelContext | null {
    const fromDocument = (document as unknown as { modelContext?: ModelContext }).modelContext
    const fromNavigator = (navigator as unknown as { modelContext?: ModelContext }).modelContext
    const mc = fromDocument ?? fromNavigator
    return mc && typeof mc.registerTool === 'function' ? mc : null
}

async function serverTool(name: string, args: Record<string, unknown>, guard: object): Promise<string> {
    const res = await fetch('/api/agent-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, args, guard }),
    })
    return JSON.stringify(await res.json())
}

export default function WebMcpTools() {
    useEffect(() => {
        const mc = findModelContext()
        if (!mc) return
        const controller = new AbortController()
        const guard = newGuard()

        const run: Record<typeof WEBMCP_TOOLS[number], ModelContextTool['execute']> = {
            download_resume: async () => {
                trackEvent(ANALYTICS_EVENTS.cvDownloaded, { source: 'webmcp' })
                downloadOrOpen(contact.resumeUrl)
                return JSON.stringify({ status: 'ok', url: new URL(contact.resumeUrl, location.href).toString() })
            },
            navigate_to_section: async ({ section }) => {
                goToSection(String(section))
                return JSON.stringify({ status: 'ok', section })
            },
            get_repo_stats: args => serverTool('get_repo_stats', args, guard),
            send_message: args => serverTool('send_message', args, guard),
        }

        const unregister: Array<() => void> = []
        for (const decl of TOOL_DECLARATIONS) {
            const name = decl.name as typeof WEBMCP_TOOLS[number]
            if (!WEBMCP_TOOLS.includes(name)) continue
            try {
                const handle = mc.registerTool({
                    name,
                    description: decl.description,
                    inputSchema: decl.parameters ?? { type: 'object', properties: {} },
                    annotations: name === 'send_message'
                        ? { consequentialHint: true }
                        : { readOnlyHint: name !== 'download_resume' },
                    execute: run[name],
                }, { signal: controller.signal })
                // Older drafts returned a handle with unregister()
                const h = handle as { unregister?: () => void } | undefined
                if (h && typeof h.unregister === 'function') unregister.push(() => h.unregister!())
            } catch (err) {
                console.warn('[webmcp] could not register', name, err)
            }
        }
        return () => {
            controller.abort()
            unregister.forEach(fn => fn())
        }
    }, [])

    return null
}
