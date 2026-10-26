// terminal/types.ts
// Shared terminal types.

export type TerminalSectionId = 'hero' | 'about' | 'projects' | 'experience' | 'terminal'

export type NavigableSection = 'home' | 'about' | 'projects' | 'experience' | 'contact'

export interface TerminalLine {
    id: number
    type: 'input' | 'output'
    text: string
    prompt?: string
    /** 'agent' marks a spoken reply from the AI, styled distinctly from raw output. */
    variant?: 'agent'
    /** Printed by the machine just now: plays the line flare once on mount. */
    fresh?: boolean
}

export type TerminalMode = 'normal' | 'vim' | 'matrix' | 'snake' | 'adventure' | 'wpm' | 'train' | 'quiz' | 'tour' | 'contact'

/** Games and full-screen modes a command can start */
type GameMode = 'vim' | 'matrix' | 'snake' | 'adventure' | 'wpm' | 'train' | 'quiz'

/** Visual state of the agent presence orb, derived from terminal activity. */
export type AgentState = 'idle' | 'thinking' | 'speaking'

export interface CommandResponse {
    response: string | null
    newCwd?: string
    enterMode?: GameMode
    /** Asked for in another section's mini-shell: run this in the main terminal instead */
    runInTerminal?: string
    navigateTo?: string
    loadingMessages?: string[]
    renderSection?: NavigableSection
    /** Trigger a file download from this URL (relative to /public). */
    downloadUrl?: string
    /** Open this URL in a new tab (mailto:, https://, etc). */
    openUrl?: string
    /**
     * Route this plain-English input to the AI agent (/api/chat) instead of
     * returning a static response. Set when an unknown command reads like a
     * natural-language question rather than a typo'd command.
     */
    askAI?: string
    /** Launch the scripted guided tour (from the `tour` command or a tour phrase). */
    startTour?: boolean
    /** Launch the step-by-step contact flow (from `email`/`contact` — no AI needed). */
    startContact?: boolean
    /**
     * Marks a scripted onboarding/greeting reply — typed as the agent's voice
     * and followed by onboarding chips, without an AI round-trip.
     */
    onboarding?: boolean
    /** `theme [name]` — the session lists or switches themes (argument as typed). */
    theme?: string
    /** `crt [on|off]` — the session reports or toggles the CRT look. */
    crt?: string
    /** `screenreader [on|off]` — mirror output into a live region. */
    screenReader?: string
    /** `--no-tty` (true) / `tty` (false): switch plain mode. */
    plain?: boolean
}
