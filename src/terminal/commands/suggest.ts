// terminal/commands/suggest.ts
// Command lists, typo distance, "did you mean" and ghost-completion suggestions.

import { getCompletions } from '../fs'
import type { TerminalSectionId } from '../types'

/* ============================================
   COMMAND LISTS, FUZZY MATCH, GHOST SUGGESTION
   ============================================ */

/** Canonical command names available in the dedicated terminal section. */
export const TERMINAL_COMMAND_LIST: readonly string[] = [
    'achievements', 'adventure', 'ai', 'ascii', 'ask', 'cat', 'cd', 'chat', 'clear', 'curl', 'cv', 'date',
    'crt', 'echo', 'email', 'exit', 'games', 'git', 'help', 'history',
    'htop', 'kill', 'ls', 'man', 'matrix', 'neofetch', 'ping',
    'plain', 'pwd', 'quiz', 'screenreader', 'sl', 'snake', 'ssh', 'sudo', 'theme', 'tour', 'train', 'tty', 'vim', 'whoami', 'wpm',
]

/** Limited command set available in the inline terminals on other sections. */
const NON_TERMINAL_COMMAND_LIST: readonly string[] = [
    'achievements', 'cd', 'clear', 'crt', 'exit', 'games', 'help', 'ls', 'screenreader', 'sudo', 'theme', 'whoami',
]

/** Standard Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
    const m = a.length
    const n = b.length
    if (m === 0) return n
    if (n === 0) return m

    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
        }
    }
    return dp[m][n]
}

/**
 * Find the closest matching command for a typo'd input.
 * Threshold scales with input length to avoid false positives on short inputs.
 * Returns null if nothing is close enough or the input already matches exactly.
 */
export function findClosestCommand(input: string, sectionId: TerminalSectionId): string | null {
    const cmd = input.trim().split(/\s+/)[0]?.toLowerCase()
    if (!cmd || cmd.length < 2) return null

    const threshold = cmd.length < 4 ? 1 : 2
    const list = sectionId === 'terminal' ? TERMINAL_COMMAND_LIST : NON_TERMINAL_COMMAND_LIST

    let closest: string | null = null
    let minDist = Infinity

    for (const c of list) {
        const dist = levenshtein(cmd, c)
        if (dist < minDist) {
            minDist = dist
            closest = c
        }
    }

    if (minDist > threshold) return null
    if (closest === cmd) return null
    return closest
}

/**
 * Compute the ghost-text suffix that would complete the current input.
 * Returns the portion to render in dim text after what the user typed.
 *
 * - For single-token input: matches command names, prefers alphabetical first.
 * - For path arguments to fs commands (cd/ls/cat in terminal section): matches filesystem entries.
 * - Returns '' when the input is empty, already a complete match, or unmatched.
 *
 * Ghost shows the FIRST alphabetical match (single suggestion, fish-style),
 * which intentionally differs from Tab's common-prefix behavior.
 */
export function computeSuggestion(
    input: string,
    cwd: string,
    sectionId: TerminalSectionId,
): string {
    if (!input) return ''

    const parts = input.split(/\s+/)
    const cmd = parts[0]?.toLowerCase()

    // Filesystem path completion (terminal section only — fs commands need at least one char of path)
    if (sectionId === 'terminal' && parts.length >= 2 && (cmd === 'cd' || cmd === 'ls' || cmd === 'cat')) {
        const lastPart = parts[parts.length - 1]
        if (!lastPart) return ''
        const completions = getCompletions(cwd, lastPart)
        if (completions.length === 0) return ''
        return completions[0].slice(lastPart.length)
    }

    // Command name completion — single token, must be a strict superset
    if (parts.length === 1) {
        const cmds = sectionId === 'terminal' ? TERMINAL_COMMAND_LIST : NON_TERMINAL_COMMAND_LIST
        const lower = input.toLowerCase()
        const match = cmds.find(c => c.startsWith(lower) && c !== lower)
        if (!match) return ''
        return match.slice(input.length)
    }

    return ''
}
