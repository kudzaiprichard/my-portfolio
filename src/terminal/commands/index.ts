// terminal/commands/index.ts
// Command dispatcher: turns a typed line into a CommandResponse for a section.

import { contact, owner } from '@/src/content'
import { generateSl, generateMakeSandwich, generateSudoSandwich, generateAscii } from './fun'
import { generateGitLog, generateGitBlame } from './git'
import { generateHelp } from './help'
import { generatePing, generateSsh, generateSudo, generateCurl } from './network'
import { findClosestCommand } from './suggest'
import { generateNeofetch, generateWhoami, generateHistory, generateHtop, generateCv, generateKill, generateMan, generateDate, generateEcho } from './system'
import { getLsOutput, handleTerminalCommand } from '../fs'
import { LOADING_SETS, NAV_SECTIONS } from '../sections'
import { isTourTrigger, isContactTrigger, matchOnboarding } from '../tour'
import type { TerminalSectionId, CommandResponse } from '../types'

/**
 * Decide whether plain-English input should be handled by the agent layer
 * (tour, scripted onboarding, explicit ask, or auto-detected question).
 * Shared by every section so the AI is reachable everywhere, not just the
 * dedicated terminal. Returns null when the input is better treated as a
 * typo'd command (the caller then offers "did you mean").
 */
function routeNaturalLanguage(command: string, sectionId: TerminalSectionId): CommandResponse | null {
    const trimmed = command.trim().toLowerCase()

    // Guided tour — explicit command or natural phrasing. Instant, no AI call.
    if (isTourTrigger(trimmed)) return { response: null, startTour: true }

    // Contact flow — explicit command or natural phrasing. Instant, no AI call,
    // so it works even when the AI is rate-limited.
    if (isContactTrigger(trimmed)) return { response: null, startContact: true }

    // Scripted onboarding for greetings / "what is this" — instant, no AI call.
    const onboardingReply = matchOnboarding(trimmed)
    if (onboardingReply) return { response: onboardingReply, onboarding: true }

    // Explicit AI invocation: `ask <question>` / `ai <question>` / `chat ...`.
    const cmd = trimmed.split(/\s+/)[0]
    if (cmd === 'ask' || cmd === 'ai' || cmd === 'chat') {
        const query = command.trim().slice(cmd.length).trim()
        if (!query) {
            return { response: "Ask me anything — e.g. `ask what do you specialize in?` or just type your question." }
        }
        return { response: null, askAI: query }
    }

    // Auto-detect natural language: route questions / multi-word phrases to the
    // agent; leave close single-token typos for the caller's "did you mean".
    const wordCount = trimmed.split(/\s+/).length
    const closest = findClosestCommand(command, sectionId)
    const looksLikeQuestion = /[?]/.test(command) || wordCount >= 2
    if (looksLikeQuestion || !closest) {
        return { response: null, askAI: command.trim() }
    }
    return null
}

/** Commands that start a game (and can be asked for from any section) */
const PLAYABLE = new Set(['snake', 'wpm', 'train', 'quiz', 'adventure', 'matrix'])

/* ============================================
   NON-TERMINAL COMMAND RESPONSES
   ============================================ */

export function getCommandResponse(sectionId: TerminalSectionId, command: string, cwd: string): CommandResponse {
    const trimmed = command.trim().toLowerCase()

    // Theme switching works in every terminal (the session lists/applies it)
    if (trimmed === 'theme' || trimmed.startsWith('theme ')) {
        return { response: null, theme: command.trim().slice(5).trim() }
    }

    // Achievements and the games menu: handled by the session (reads localStorage) — every terminal
    if (trimmed === 'achievements' || trimmed === 'games') return { response: null }

    // A game asked for in another section's mini-shell: play it in the terminal
    const game = trimmed.split(/\s+/)[0]
    if (sectionId !== 'terminal' && PLAYABLE.has(game)) {
        return { response: 'The games live in the terminal at the bottom of the page. Taking you there…', runInTerminal: game }
    }

    // Plain mode: the recruiter's fast lane — also every terminal
    if (trimmed === '--no-tty' || trimmed === 'plain' || trimmed === 'no-tty') return { response: null, plain: true }
    if (trimmed === 'tty') return { response: null, plain: false }

    // CRT look (scanlines, flicker, tube shader) — also every terminal
    if (trimmed === 'crt' || trimmed.startsWith('crt ')) {
        return { response: null, crt: command.trim().slice(3).trim() }
    }

    // Screen-reader mode: mirror output into a live region — every terminal
    if (trimmed === 'screenreader' || trimmed.startsWith('screenreader ') || trimmed === 'sr' || trimmed.startsWith('sr ')) {
        return { response: null, screenReader: command.trim().replace(/^(screenreader|sr)\b/i, '').trim() }
    }

    // Terminal section — full command set
    if (sectionId === 'terminal') {
        if (trimmed === '' || trimmed === 'clear') return { response: null }

        const parts = trimmed.split(/\s+/)
        const cmd = parts[0]
        const rawParts = command.trim().split(/\s+/)

        // Section navigation via cd — renders content inline
        if (cmd === 'cd') {
            const target = (parts[1] || '').replace(/^[/#]+/, '')
            if (NAV_SECTIONS[target]) {
                return {
                    response: null,
                    renderSection: NAV_SECTIONS[target],
                }
            }
        }

        // Filesystem commands
        if (cmd === 'cd' || cmd === 'ls' || cmd === 'pwd' || cmd === 'cat') {
            const result = handleTerminalCommand(command.trim(), cwd)
            return { response: result.output, newCwd: result.newCwd }
        }

        // System commands
        if (cmd === 'help') return { response: generateHelp() }
        if (cmd === 'whoami') return { response: generateWhoami() }
        if (cmd === 'neofetch') return { response: generateNeofetch(), loadingMessages: LOADING_SETS.neofetch }
        if (cmd === 'htop') return { response: generateHtop(), loadingMessages: LOADING_SETS.htop }
        if (cmd === 'date') return { response: generateDate() }
        if (cmd === 'history') return { response: generateHistory() }
        if (cmd === 'man') {
            const topic = rawParts.slice(1).join(' ') || 'kudzai'
            return { response: generateMan(topic) }
        }
        if (cmd === 'echo') {
            const text = command.trim().slice(5) // preserve original casing
            return { response: generateEcho(text) }
        }
        if (cmd === 'kill') {
            const args = command.trim().slice(4)
            return { response: generateKill(args) }
        }

        // Reach-out commands — turn the easter egg into a conversion path
        if (cmd === 'cv') {
            const url = contact.resumeUrl
            const isExternal = /^https?:\/\//.test(url)
            // Same-origin → use download attribute (forces save dialog).
            // Cross-origin → open in new tab; the `download` attr is ignored on
            // cross-origin URLs without proper Content-Disposition headers, and
            // would otherwise navigate the visitor away from the portfolio.
            return {
                response: generateCv(url),
                ...(isExternal ? { openUrl: url } : { downloadUrl: url }),
            }
        }
        if (cmd === 'email') {
            // Launch the in-terminal step-by-step contact flow (no mail client,
            // no AI needed). Falls through to startContact handling.
            return { response: null, startContact: true }
        }

        // Network commands
        if (cmd === 'ping') {
            const target = rawParts[1]
            if (!target) return { response: 'Usage: ping <host>' }
            return { response: generatePing(target) }
        }
        if (cmd === 'ssh') {
            const target = rawParts[1] || 'unknown'
            return { response: generateSsh(target), loadingMessages: LOADING_SETS.ssh }
        }
        if (cmd === 'curl') {
            const args = command.trim().slice(5)
            return { response: generateCurl(args), loadingMessages: LOADING_SETS.curl }
        }
        // xkcd #149 — must come BEFORE the generic sudo handler
        if (trimmed === 'sudo make me a sandwich') {
            return { response: generateSudoSandwich(), loadingMessages: LOADING_SETS.sudo }
        }
        if (trimmed === 'make me a sandwich') {
            return { response: generateMakeSandwich() }
        }
        if (cmd === 'sudo') {
            return { response: generateSudo(), loadingMessages: LOADING_SETS.sudo }
        }

        // Git commands
        if (cmd === 'git') {
            const sub = parts[1]
            if (sub === 'log' || sub === 'hist' || sub === 'history') return { response: generateGitLog(), loadingMessages: LOADING_SETS['git-log'] }
            if (sub === 'blame' || sub === 'annotate') return { response: generateGitBlame(), loadingMessages: LOADING_SETS['git-blame'] }
            return { response: `git: '${parts.slice(1).join(' ')}' is not a git command.\nTry 'git log' or 'git blame'.` }
        }

        // Fun commands
        if (cmd === 'vim' || cmd === 'vi' || cmd === 'nano') {
            // The file itself is loaded on demand by the session (terminal/games/vim)
            return { response: null, enterMode: 'vim' }
        }
        if (cmd === 'ascii') return { response: generateAscii() }
        if (cmd === 'sl') return { response: generateSl() }
        if (cmd === 'matrix') {
            return { response: null, enterMode: 'matrix' }
        }
        if (cmd === 'snake') return { response: null, enterMode: 'snake' }
        if (cmd === 'adventure') return { response: null, enterMode: 'adventure' }
        if (cmd === 'wpm') return { response: null, enterMode: 'wpm' }
        if (cmd === 'train') return { response: null, enterMode: 'train' }
        if (cmd === 'quiz') return { response: null, enterMode: 'quiz' }

        if (cmd === 'exit') {
            return { response: 'logout\nConnection to prichard.co.zw closed. Come back anytime.' }
        }

        // Agent layer: tour / onboarding / explicit ask / auto-detected question.
        const aiRoute = routeNaturalLanguage(command, 'terminal')
        if (aiRoute) return aiRoute

        // Single-token typo with a close command match — keep the classic hint.
        const closest = findClosestCommand(command, 'terminal')
        const didYouMean = closest ? `\nDid you mean: ${closest}?` : ''
        return { response: `bash: ${command.trim()}: command not found${didYouMean}\nType 'help' for available commands, or just ask me a question.` }
    }

    // Non-terminal sections — original behavior
    if (trimmed === 'help') {
        return {
            response: [
                'Available commands:',
                '  help               show this message',
                '  ls                 list directory contents',
                '  clear              clear command history',
                '  whoami             about the developer',
                '  cd <section>       navigate to section (home, about, projects, experience, contact)',
                '  sudo               elevate privileges',
                '  theme [name]       list or switch the phosphor theme',
                '  crt [on|off]       scanlines and CRT glow',
                '  --no-tty           plain mode: same content, no effects (tty to return)',
                '  games              play snake, a typing race, train a model… (in the terminal)',
                '  achievements       games and easter eggs found so far',
                '  screenreader [on|off]  read every output line aloud (alias: sr)',
                '  exit               close session',
            ].join('\n'),
        }
    }

    if (trimmed === 'clear') return { response: null }

    if (trimmed.startsWith('sudo')) {
        return { response: '[sudo] password for visitor: ********\nNice try. This portfolio runs on vibes, not root access.' }
    }

    if (trimmed === 'exit') {
        return { response: 'logout\nConnection to prichard.co.zw closed. Come back anytime.' }
    }

    if (trimmed === 'whoami') {
        return { response: `${owner.name} — ${owner.title}\nBuilding intelligent systems, one commit at a time.` }
    }

    // Section navigation via cd — scrolls to target section
    if (trimmed.startsWith('cd ')) {
        const target = trimmed.slice(3).trim().replace(/^[/#]+/, '')
        if (NAV_SECTIONS[target]) {
            return { response: null, navigateTo: NAV_SECTIONS[target] }
        }
    }

    if (trimmed === 'cd ..' || trimmed === 'cd ~' || trimmed === 'cd') {
        return { response: "Nice try, but you're already home.\nUse arrow keys or cd <section> to navigate." }
    }

    if (trimmed === 'ls' || trimmed === 'ls -la' || trimmed === 'ls -l' || trimmed === 'ls -al') {
        return { response: getLsOutput(sectionId) }
    }

    if (trimmed === '') return { response: null }

    // Agent layer is available on every section — route natural language to it.
    const aiRoute = routeNaturalLanguage(command, sectionId)
    if (aiRoute) return aiRoute

    const closest = findClosestCommand(command, sectionId)
    const didYouMean = closest ? `\nDid you mean: ${closest}?` : ''
    return { response: `bash: ${command.trim()}: command not found${didYouMean}\nType 'help' for available commands, or just ask me a question.` }
}

/* ============================================
   PROMPT HELPER
   ============================================ */

export function cwdToPrompt(cwd: string): string {
    if (cwd === '/') return 'visitor@kudzai:~$ '
    return `visitor@kudzai:~${cwd}$ `
}

/* ============================================
   HOOK
   ============================================ */
