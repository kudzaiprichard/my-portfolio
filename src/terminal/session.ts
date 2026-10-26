// terminal/session.ts
/**
 * One terminal session per section: the shell state machine that used to
 * live inside the useTerminalInput hook, as a plain class.
 *
 * - State is published as immutable snapshots for useSyncExternalStore.
 * - Typing animations write into the live line's DOM node through the
 *   frame-driven typewriter, so a reply never re-renders React per character.
 * - All timers run on the shared FX loop and are cancellable as a group.
 * - Games (snake, wpm, train, quiz, adventure), Matrix and the vim file load
 *   on demand with import().
 *
 * Keyboard input arrives from the single page-level listener in store.ts.
 */

import { contact } from '@/src/content'
import type { AgentAction, ChatMessage } from '@/src/lib/aiAgent'
import { ANALYTICS_EVENTS, trackEvent } from '@/src/lib/analytics'
import { audioEngine } from '@/src/lib/audioEngine'
import { getSectionTyping, outputTimings } from '@/src/constants/typingConfig'
import { after, every } from '@/src/lib/fxScheduler'
import { playKeystrokes, typewrite } from '@/src/lib/typewriter'
import { planKeystrokes } from '@/src/lib/typingDelay'
import { getCommandResponse, cwdToPrompt } from './commands'
import { generateGames } from './commands/help'
import { keystrokeSounds } from '@/src/lib/keystrokeVoice'
import { audioConfig } from '@/src/constants/typingConfig'
import { resolveAlias } from './commands/aliases'
import { computeSuggestion, TERMINAL_COMMAND_LIST } from './commands/suggest'
import { getCompletions } from './fs'
import { themeCommand } from './commands/theme'
import { getTheme, setTheme } from '@/src/lib/themeStore'
import { crtCommand, getCrt, setCrt } from '@/src/lib/crtStore'
import { getScreenReaderMode, screenReaderCommand, setScreenReaderMode } from '@/src/lib/screenReaderStore'
import { runTransition } from '@/src/lib/viewTransition'
import { isPlainMode, setPlainMode } from '@/src/lib/plainMode'
import { ACHIEVEMENTS, achievementsText, unlockAchievement, unlockedAchievements, unlockLine, type AchievementId } from '@/src/lib/achievements'
import { onFrame } from '@/src/lib/fxScheduler'
import { newGuard } from '@/src/lib/spamGuard'
import { CD_STATUS_LINES, formatSectionLines, lineDelay } from './sections'
import {
    CONTACT_EMAIL_RE,
    ONBOARDING_SUGGESTIONS,
    POST_TOUR_SUGGESTIONS,
    TOUR_PROMPT,
    TOUR_STEPS,
} from './tour'
import { askAgent, downloadOrOpen, executeAgentAction, isDeferredAction, scrollToSection } from './agent'
import type { AgentState, NavigableSection, TerminalLine, TerminalMode, TerminalSectionId } from './types'
import type { SnakeGame, Direction } from './games/snake'
import type { AdventureGame } from './games/adventure'
import type { WpmRace, WpmView } from './games/wpm'
import type { TrainRun } from './games/train'
import type { Quiz } from './games/quiz'

/** One "first command" event per page load, across every section's terminal. */
let firstCommandTracked = false

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export interface TerminalSnapshot {
    inputText: string
    history: TerminalLine[]
    isTypingResponse: boolean
    /** Variant of the in-progress typing line ('agent' for AI replies). */
    responseVariant: 'agent' | undefined
    /** Ghost-completion suffix for the current input. */
    suggestion: string
    cwd: string
    mode: TerminalMode
    vimContent: string
    vimCommand: string
    snakeDisplay: string
    matrixText: string
    adventurePrompt: string
    /** The typing race, while `wpm` runs */
    wpm: WpmView | null
    /** The training plot, while `train` runs */
    trainDisplay: string
    trainDone: boolean
    displayedSection: NavigableSection | null
    /** True once the AI has answered — show the quick-action chips. */
    agentUsed: boolean
    /** Contextual follow-up questions suggested by the agent (chip labels). */
    agentSuggestions: readonly string[]
    /** Presence-orb state: thinking while awaiting the API, speaking while an agent reply types. */
    agentState: AgentState
}

export interface SessionCallbacks {
    /** Called with each agent reply as it starts (used to speak it aloud). */
    onAgentReply?: (text: string) => void
    /** Called when the visitor interrupts a reply (used to stop speech). */
    onAgentInterrupt?: () => void
}

/** Where a keydown came from, as decided by the page-level listener. */
export interface KeyContext {
    /** The event target is this session's own <input>. */
    fromInput: boolean
}

// Modes that replace the terminal's screen; switching to/from them changes channel
const FULL_SCREEN_MODES = new Set<TerminalMode>(['vim', 'matrix', 'snake', 'adventure', 'wpm', 'train'])

const QUIZ_PROMPT = '[quiz] a · b · c · d ▸ '
const TRAIN_FRAME_MS = 110
const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export class TerminalSession {
    readonly sectionId: TerminalSectionId
    private snap: TerminalSnapshot
    private listeners = new Set<() => void>()
    private callbacks: SessionCallbacks = {}
    private transitionQueue: Partial<TerminalSnapshot>[] | null = null
    // Honeypot + start time sent with chat and contact requests (lib/spamGuard)
    private guard = newGuard()
    // An agent reply is streaming in: keys are swallowed until it completes
    private streaming = false

    // ── live (typing) line, written directly into the DOM ──
    private liveEl: HTMLElement | null = null
    private liveText = ''
    private inputEl: HTMLInputElement | null = null

    // ── timers: every pending effect, cancellable as a group ──
    private pending: (() => void)[] = []
    private pendingResponse: { text: string; variant?: 'agent' } | null = null
    private pendingSectionLines: string[] | null = null
    private sectionLineIndex = 0
    private thinking = false
    private stopThinkingTimer: (() => void) | null = null

    // ── conversation & flows ──
    private lineId = 0
    private shouldSpeak = false
    private chatHistory: ChatMessage[] = []
    private tourStep = 0
    private contactStep: 'name' | 'email' | 'message' | 'retry' = 'name'
    private contactData = { name: '', email: '', message: '' }
    private commandHistory: string[] = []
    private historyIndex = -1
    private savedInput = ''

    // ── lazily loaded modes ──
    private snake: SnakeGame | null = null
    private adventure: AdventureGame | null = null
    private stopMatrix: (() => void) | null = null
    private matrixExitTimer: (() => void) | null = null
    private wpmRace: WpmRace | null = null
    private stopWpmClock: (() => void) | null = null
    private lastWpmKeyAt = 0
    private train: TrainRun | null = null
    private stopTrain: (() => void) | null = null
    private quiz: Quiz | null = null

    constructor(sectionId: TerminalSectionId) {
        this.sectionId = sectionId
        this.snap = {
            inputText: '',
            history: [],
            isTypingResponse: false,
            responseVariant: undefined,
            suggestion: '',
            cwd: '/',
            mode: 'normal',
            vimContent: '',
            vimCommand: '',
            snakeDisplay: '',
            matrixText: '',
            adventurePrompt: '',
            wpm: null,
            trainDisplay: '',
            trainDone: false,
            displayedSection: null,
            agentUsed: false,
            agentSuggestions: [],
            agentState: 'idle',
        }
    }

    // ============================================
    // Store plumbing
    // ============================================

    subscribe = (fn: () => void): (() => void) => {
        this.listeners.add(fn)
        return () => { this.listeners.delete(fn) }
    }

    getSnapshot = (): TerminalSnapshot => this.snap

    setCallbacks(callbacks: SessionCallbacks): void {
        this.callbacks = callbacks
    }

    /**
     * Update the snapshot. Entering or leaving a full-screen mode (vim,
     * matrix, snake, adventure) plays the CRT channel change: the patch, and
     * any that arrive before the transition captures the old frame, are
     * applied together inside the view transition.
     */
    private set(patch: Partial<TerminalSnapshot>): void {
        if (this.transitionQueue) {
            this.transitionQueue.push(patch)
            return
        }
        const switching = patch.mode !== undefined && patch.mode !== this.snap.mode
            && (FULL_SCREEN_MODES.has(patch.mode) || FULL_SCREEN_MODES.has(this.snap.mode))
        if (!switching) {
            this.apply(patch)
            return
        }
        this.transitionQueue = [patch]
        void runTransition('chan', () => {
            const queue = this.transitionQueue ?? []
            this.transitionQueue = null
            queue.forEach(p => this.apply(p))
        })
    }

    private apply(patch: Partial<TerminalSnapshot>): void {
        const next = { ...this.snap, ...patch }

        // Derived: ghost suggestion (normal mode, idle, non-empty input only)
        next.suggestion = next.mode === 'normal' && !next.isTypingResponse && next.inputText
            ? computeSuggestion(next.inputText, next.cwd, this.sectionId)
            : ''

        // Derived: orb state
        next.agentState = this.thinking
            ? 'thinking'
            : (next.isTypingResponse && next.responseVariant === 'agent' ? 'speaking' : 'idle')
        // Once activity settles back to idle, clear the speak flag so a later
        // TYPED reply is never accidentally read aloud.
        if (this.snap.agentState !== 'idle' && next.agentState === 'idle') this.shouldSpeak = false

        this.snap = next
        this.listeners.forEach(fn => fn())
    }

    private get mode(): TerminalMode {
        // A mode switch waiting inside a channel-change transition counts already
        const queued = this.transitionQueue?.findLast(p => p.mode !== undefined)?.mode
        return queued ?? this.snap.mode
    }
    private get isTyping(): boolean { return this.snap.isTypingResponse && !this.thinking }

    private pushLines(...lines: Omit<TerminalLine, 'id'>[]): void {
        this.set({ history: [...this.snap.history, ...lines.map(l => ({ ...l, id: ++this.lineId }))] })
    }

    // ============================================
    // DOM attachments (from TerminalInput)
    // ============================================

    /** The in-progress line's text node. Typing writes here, not through React. */
    attachLiveText = (el: HTMLElement | null): void => {
        this.liveEl = el
        if (el) el.textContent = this.liveText
    }

    attachInput = (el: HTMLInputElement | null): void => {
        this.inputEl = el
    }

    private setLive(text: string): void {
        this.liveText = text
        if (this.liveEl) this.liveEl.textContent = text
    }

    focusInput(): void {
        const el = this.inputEl
        if (!el) return
        el.focus({ preventScroll: true })
        const end = el.value.length
        el.setSelectionRange(end, end)
    }

    /** Native edits from the <input> (typing, IME, autocorrect, dictation). */
    setInputText = (value: string): void => {
        this.set({ inputText: value })
    }

    // ============================================
    // Response typing
    // ============================================

    private clearResponseTimers(): void {
        this.pending.forEach(cancel => cancel())
        this.pending = []
    }

    private later(ms: number, fn: () => void): void {
        this.pending.push(after(ms, fn))
    }

    // A data load (`cd <section>`, or a command with a loading spinner) is in
    // flight: it opened with the soft "load" swell and closes with "loaded"
    private loading = false

    private startLoad(): void {
        this.loading = true
        audioEngine.play('load')
    }

    private endLoad(): void {
        if (!this.loading) return
        this.loading = false
        audioEngine.play('loaded')
    }

    private completeResponseImmediately(): void {
        this.clearResponseTimers()
        // Interrupting a reply also stops it being spoken aloud.
        this.callbacks.onAgentInterrupt?.()

        const lines: Omit<TerminalLine, 'id'>[] = []
        // Flush remaining section content lines
        if (this.pendingSectionLines) {
            const remaining = this.pendingSectionLines.slice(this.sectionLineIndex)
            this.pendingSectionLines = null
            this.sectionLineIndex = 0
            lines.push(...remaining.map(text => ({ type: 'output' as const, text })))
        }
        if (this.pendingResponse) {
            lines.push({ type: 'output', text: this.pendingResponse.text, variant: this.pendingResponse.variant })
            this.pendingResponse = null
        }
        this.setLive('')
        this.set({
            history: [...this.snap.history, ...lines.map(l => ({ ...l, id: ++this.lineId }))],
            responseVariant: undefined,
            isTypingResponse: false,
        })
        // Skipped ahead: the data is all there now
        this.endLoad()
    }

    /** "command not found" and other shell errors get the error tone. */
    private soundFor(text: string): void {
        if (text.startsWith('bash:')) audioEngine.play('error')
    }

    private typeResponse(text: string, onComplete?: () => void, variant?: 'agent'): void {
        this.clearResponseTimers()
        this.soundFor(text)
        this.pendingResponse = { text, variant }
        this.setLive('')
        this.set({ isTypingResponse: true, responseVariant: variant })

        // Speak agent replies aloud ONLY when the question was asked by voice.
        if (variant === 'agent' && this.shouldSpeak) {
            this.callbacks.onAgentReply?.(text)
            this.shouldSpeak = false
        }

        // The machine prints command output line by line; agent replies type out
        if (variant !== 'agent') {
            this.streamLines(text, onComplete)
            return
        }
        const handle = typewrite(text, outputTimings.agentCharMs, s => this.setLive(s), () => {
            this.pendingResponse = null
            this.setLive('')
            this.pushLines({ type: 'output', text, variant })
            this.set({ responseVariant: undefined, isTypingResponse: false })
            onComplete?.()
        })
        this.pending.push(handle.cancel)
    }

    /** Print `text` one line every ~30 ms, each line with a phosphor flare. */
    private streamLines(text: string, onComplete?: () => void): void {
        const lines = text.split('\n')
        // Reuses the skip-ahead buffer: a keypress flushes the remaining lines
        this.pendingResponse = null
        this.pendingSectionLines = lines
        this.sectionLineIndex = 0
        let elapsed = 0
        lines.forEach((line, i) => {
            this.later(elapsed, () => {
                this.sectionLineIndex = i + 1
                this.pushLines({ type: 'output', text: line, fresh: true })
            })
            elapsed += lineDelay(line)
        })
        this.later(elapsed, () => {
            this.pendingSectionLines = null
            this.sectionLineIndex = 0
            this.set({ responseVariant: undefined, isTypingResponse: false })
            onComplete?.()
        })
    }

    private showLoadingThenResponse(text: string, messages: string[]): void {
        this.clearResponseTimers()
        this.soundFor(text)
        this.startLoad()
        this.pendingResponse = { text }
        this.set({ isTypingResponse: true, responseVariant: undefined })

        const FRAME_MS = 80
        const framesPerMsg = 5
        const totalFrames = framesPerMsg * messages.length
        let frame = 0
        const showFrame = () => {
            const msgIdx = Math.min(Math.floor(frame / framesPerMsg), messages.length - 1)
            this.setLive(`${SPINNER[frame % SPINNER.length]} ${messages[msgIdx]}`)
            frame++
        }
        showFrame()
        const stopSpinner = every(FRAME_MS, () => { if (frame < totalFrames) showFrame() })
        this.pending.push(stopSpinner)

        this.later(totalFrames * FRAME_MS, () => {
            stopSpinner()
            this.setLive('')
            this.streamLines(text, () => this.endLoad())
        })
    }

    private renderSectionContent(section: NavigableSection): void {
        this.clearResponseTimers()
        this.setLive('')
        this.set({ displayedSection: section, isTypingResponse: true, responseVariant: undefined })

        const statusLine = CD_STATUS_LINES[section]
        const contentLines = formatSectionLines(section)
        this.startLoad()

        // Store all lines for skip-ahead
        this.pendingSectionLines = [statusLine, ...contentLines]
        this.sectionLineIndex = 0

        // Phase 1: type the status line with human-feel timing
        const plan = planKeystrokes(statusLine, { speedScale: getSectionTyping('terminal').speedScale })
        const handle = playKeystrokes(plan, k => this.setLive(k.visible), () => {
            // Status line complete — move to history
            this.later(180, () => {
                this.sectionLineIndex = 1 // status line consumed
                this.setLive('')
                this.pushLines({ type: 'output', text: statusLine })

                // Phase 2: add content lines progressively with varied timing
                let elapsed = 120
                contentLines.forEach((line, i) => {
                    this.later(elapsed, () => {
                        this.sectionLineIndex = i + 2 // +1 status line, +1 this line
                        this.pushLines({ type: 'output', text: line, fresh: true })
                    })
                    elapsed += lineDelay(line)
                })

                // Phase 3: unlock input
                this.later(elapsed + 80, () => {
                    this.pendingSectionLines = null
                    this.sectionLineIndex = 0
                    this.pendingResponse = null
                    this.set({ isTypingResponse: false })
                    this.endLoad()
                })
            })
        })
        this.pending.push(handle.cancel)
    }

    // ============================================
    // AI agent
    // ============================================

    // Animated "thinking" spinner shown while we await the API. A keypress
    // can't "skip" a network round-trip — keys are swallowed instead.
    private startThinking(messages?: string[]): void {
        this.clearResponseTimers()
        this.thinking = true
        this.set({ isTypingResponse: true })
        audioEngine.startThinking()

        const msgs = messages ?? ['Thinking', 'Pulling that together', 'Almost there']
        let i = 0
        const tick = () => {
            const msg = msgs[Math.min(Math.floor(i / 28), msgs.length - 1)]
            const dots = '.'.repeat((Math.floor(i / 5) % 3) + 1)
            this.setLive(`${SPINNER[i % SPINNER.length]} ${msg}${dots}`)
            i++
        }
        tick()
        this.stopThinkingTimer = every(90, tick)
    }

    private stopThinking(): void {
        this.stopThinkingTimer?.()
        this.stopThinkingTimer = null
        audioEngine.stopThinking()
        this.thinking = false
        this.setLive('')
        this.set({})
    }

    private async runAgentQuery(query: string): Promise<void> {
        trackEvent(ANALYTICS_EVENTS.agentQuestion, { section: this.sectionId })
        // Record the user's turn; keep the client-side window bounded too.
        this.chatHistory.push({ role: 'user', content: query })
        if (this.chatHistory.length > 12) this.chatHistory = this.chatHistory.slice(-12)

        this.startThinking()

        // The reply types as it streams in: the first words replace the spinner
        const reveal = this.streamAgentReply()
        let data
        try {
            data = await askAgent(this.chatHistory, this.guard, delta => {
                if (this.thinking) this.stopThinking()
                reveal.push(delta)
            })
        } catch {
            reveal.cancel()
            this.stopThinking()
            this.typeResponse("Couldn't reach my AI side just now. Try again in a moment, or type `email` to contact me directly.", undefined, 'agent')
            return
        }

        if (this.thinking) this.stopThinking()

        const text = (typeof data.text === 'string' && data.text.trim())
            ? data.text.trim()
            : 'Ask me about my experience, projects, skills, or how to get in touch.'
        const actions: AgentAction[] = Array.isArray(data.actions) ? data.actions : []

        this.chatHistory.push({ role: 'model', content: text })
        this.set({ agentUsed: true, agentSuggestions: Array.isArray(data.suggestions) ? data.suggestions : [] })

        // Fire instant side-effects now; hold inline-render / tour actions until
        // the reply finishes typing. Only the first deferred action is honored to
        // avoid two animations fighting over the output area.
        const deferred = actions.find(isDeferredAction)
        for (const a of actions) {
            if (!isDeferredAction(a)) executeAgentAction(a)
        }

        const afterReply = deferred
            ? () => {
                if (deferred.type === 'showSection') this.renderSectionContent(deferred.section)
                else if (deferred.type === 'runCommand') this.processCommand(deferred.command)
                else if (deferred.type === 'startTour') this.startTour()
            }
            : undefined

        if (reveal.started) {
            // Speak the whole reply once we have it (voice questions only)
            if (this.shouldSpeak) {
                this.callbacks.onAgentReply?.(text)
                this.shouldSpeak = false
            }
            reveal.finish(text, afterReply)
        } else {
            reveal.cancel()
            this.typeResponse(text, afterReply, 'agent')
        }
    }

    /**
     * Type an agent reply while it streams in, at the agent typing rate. The
     * server's final text is authoritative: if it differs from what streamed
     * (the suggestion line, a tool confirmation), the line jumps to it.
     */
    private streamAgentReply() {
        let target = ''
        let shown = 0
        let carry = 0
        let final: { text: string; onDone?: () => void } | null = null
        let stop: (() => void) | null = null

        const done = () => {
            stop?.()
            stop = null
            this.streaming = false
            const text = final!.text
            this.pendingResponse = null
            this.setLive('')
            this.pushLines({ type: 'output', text, variant: 'agent' })
            this.set({ responseVariant: undefined, isTypingResponse: false })
            final!.onDone?.()
        }

        const start = () => {
            this.clearResponseTimers()
            this.streaming = true
            this.setLive('')
            this.set({ isTypingResponse: true, responseVariant: 'agent' })
            stop = onFrame((_, delta) => {
                carry += delta
                const n = Math.floor(carry / outputTimings.agentCharMs)
                if (n > 0) {
                    carry -= n * outputTimings.agentCharMs
                    if (shown < target.length) {
                        shown = Math.min(target.length, shown + n)
                        this.setLive(target.slice(0, shown))
                    }
                }
                if (shown >= target.length) carry = 0
                if (final && shown >= target.length) done()
            })
            this.pending.push(() => { stop?.(); stop = null; this.streaming = false })
        }

        return {
            get started() { return stop !== null },
            push: (delta: string) => {
                if (!stop) start()
                target += delta
                this.pendingResponse = { text: target, variant: 'agent' }
            },
            finish: (text: string, onDone?: () => void) => {
                if (!text.startsWith(target.slice(0, shown))) {
                    shown = text.length
                    this.setLive(text)
                }
                target = text
                this.pendingResponse = { text, variant: 'agent' }
                final = { text, onDone }
            },
            cancel: () => {
                stop?.()
                stop = null
                this.streaming = false
            },
        }
    }

    // ============================================
    // Guided tour
    // ============================================

    private finishTour(silent?: boolean): void {
        this.tourStep = 0
        this.set(silent ? { mode: 'normal' } : { mode: 'normal', agentUsed: true, agentSuggestions: POST_TOUR_SUGGESTIONS })
    }

    // Run one tour stop: type the narration, then render that section inline.
    private runTourStep(step: number): void {
        if (step >= TOUR_STEPS.length) {
            this.finishTour()
            this.typeResponse("That's the whirlwind tour. Ask me anything, or pick a suggestion below.", undefined, 'agent')
            return
        }
        this.tourStep = step
        const { section, narration } = TOUR_STEPS[step]
        this.typeResponse(narration, () => this.renderSectionContent(section), 'agent')
    }

    private startTour(): void {
        this.clearResponseTimers()
        this.unlock('tour')
        this.tourStep = 0
        this.set({ mode: 'tour', agentUsed: true, agentSuggestions: [] })
        this.typeResponse(
            "Happy to show you around. I'll walk you through the highlights — press Enter to move to the next stop, or ask me anything at any time to jump out.",
            () => this.runTourStep(0),
            'agent',
        )
    }

    // ============================================
    // Contact flow (no AI — works even when the agent is rate-limited)
    // ============================================

    private sendContact(): void {
        this.startThinking(['Sending your message', 'Almost there'])
        fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...this.contactData, guard: this.guard }),
        })
            .then(async res => ({ ok: res.ok, body: await res.json().catch(() => ({})) }))
            .then(({ ok, body }) => {
                this.stopThinking()
                if (ok && body?.success) {
                    audioEngine.play('success')
                    this.set({ mode: 'normal' })
                    const email = this.contactData.email
                    this.typeResponse(
                        `Sent ✓ — your message is in Kudzai's inbox, and a copy went to ${email}. He'll be in touch. Anything else I can help with?`,
                        undefined, 'agent',
                    )
                    this.set({ agentUsed: true, agentSuggestions: ['See his projects', 'Download his CV', 'What does he do?'] })
                } else {
                    this.contactStep = 'retry'
                    const reason = typeof body?.error === 'string' ? body.error : 'something went wrong on our end'
                    this.typeResponse(`Hmm — it didn't send: ${reason}. Want me to try again? (yes / no)`, undefined, 'agent')
                }
            })
            .catch(() => {
                this.stopThinking()
                this.contactStep = 'retry'
                this.typeResponse("Hmm — I couldn't reach the server (looks like a network hiccup). Want me to try again? (yes / no)", undefined, 'agent')
            })
    }

    private submitContactStep(raw: string): void {
        const value = raw.trim()
        const low = value.toLowerCase()
        const step = this.contactStep

        // Let the visitor bail out (except mid-message, where the text is theirs).
        if (step !== 'message' && ['exit', 'cancel', 'quit', 'stop'].includes(low)) {
            this.set({ mode: 'normal' })
            this.typeResponse('No problem — cancelled. Ask me anything else.', undefined, 'agent')
            return
        }

        if (step === 'name') {
            if (!value) { this.typeResponse("I'll need a name to go on — what should I call you?", undefined, 'agent'); return }
            this.contactData = { name: value, email: '', message: '' }
            this.contactStep = 'email'
            this.typeResponse(`Thanks, ${value}. What's the best email to reach you on?`, undefined, 'agent')
            return
        }
        if (step === 'email') {
            if (!CONTACT_EMAIL_RE.test(value)) {
                this.typeResponse("That doesn't look like a valid email — mind typing it again?", undefined, 'agent')
                return
            }
            this.contactData.email = value
            this.contactStep = 'message'
            this.typeResponse('Got it. And what would you like to say?', undefined, 'agent')
            return
        }
        if (step === 'message') {
            if (!value) { this.typeResponse("Add a short message and I'll send it along.", undefined, 'agent'); return }
            this.contactData.message = value
            this.sendContact()
            return
        }
        if (step === 'retry') {
            if (['yes', 'y', 'retry', 'ok', 'sure', 'yeah', 'yep'].includes(low)) {
                // Resend the details already given — no need to re-type them.
                this.sendContact()
            } else {
                this.set({ mode: 'normal' })
                this.typeResponse(`No worries. You can also reach me directly at ${contact.email}.`, undefined, 'agent')
            }
        }
    }

    private startContact(): void {
        this.clearResponseTimers()
        this.contactStep = 'name'
        this.contactData = { name: '', email: '', message: '' }
        this.set({ mode: 'contact', agentUsed: true, agentSuggestions: [] })
        this.typeResponse(
            "Happy to pass a message to Kudzai. First — what's your name? (type 'cancel' anytime to stop)",
            undefined, 'agent',
        )
    }

    // ============================================
    // Modes (lazy-loaded)
    // ============================================

    private enterVim(): void {
        this.set({ mode: 'vim', vimContent: '' })
        import('./games/vim').then(({ VIM_FILE_CONTENT }) => {
            if (this.mode === 'vim') this.set({ vimContent: VIM_FILE_CONTENT })
        })
    }

    private exitVim(): void {
        this.set({ mode: 'normal', vimContent: '', vimCommand: '' })
        // Getting out of vim is the achievement
        this.unlock('vim')
    }

    private enterMatrix(): void {
        this.set({ mode: 'matrix', matrixText: '' })
        this.unlock('matrix')
        import('./games/matrix').then(({ startMatrixRain }) => {
            if (this.mode !== 'matrix') return
            this.stopMatrix = startMatrixRain(text => this.set({ matrixText: text }))
        })
        this.matrixExitTimer = after(5000, () => this.exitMatrix())
    }

    private exitMatrix(): void {
        this.matrixExitTimer?.()
        this.matrixExitTimer = null
        this.stopMatrix?.()
        this.stopMatrix = null
        this.set({ mode: 'normal', matrixText: '' })
        this.pushLines({
            type: 'output',
            text: 'Wake up, Neo... The Matrix has you.\nFollow the white rabbit. Or just type another command.',
        })
    }

    private enterSnake(): void {
        this.unlock('snake')
        this.set({ mode: 'snake', snakeDisplay: '' })
        const start = (game: SnakeGame) => { if (this.mode === 'snake') game.start() }
        if (this.snake) {
            start(this.snake)
            return
        }
        import('./games/snake').then(({ SnakeGame }) => {
            this.snake = new SnakeGame(
                display => this.set({ snakeDisplay: display }),
                e => audioEngine.play(e === 'eat' ? 'blip' : e === 'best' ? 'success' : 'gameover'),
            )
            start(this.snake)
        })
    }

    private exitSnake(): void {
        this.snake?.stop()
        this.set({ mode: 'normal' })
        this.pushLines({ type: 'output', text: 'Game exited. Back to the grind.' })
    }

    snakeChangeDirection = (dir: Direction): void => {
        this.snake?.changeDirection(dir)
    }

    private enterAdventure(): void {
        this.set({ mode: 'adventure' })
        const start = (game: AdventureGame) => {
            if (this.mode !== 'adventure') return
            const intro = game.start()
            this.set({ adventurePrompt: game.getCurrentPrompt() })
            this.typeResponse(intro)
        }
        if (this.adventure) {
            start(this.adventure)
            return
        }
        import('./games/adventure').then(({ AdventureGame }) => {
            this.adventure = new AdventureGame()
            start(this.adventure)
        })
    }

    private exitAdventure(): void {
        this.adventure?.stop()
        this.set({ mode: 'normal', adventurePrompt: '' })
    }

    // ── wpm: a typing race ──

    private enterWpm(): void {
        this.set({ mode: 'wpm', wpm: null })
        import('./games/wpm').then(({ WpmRace }) => {
            if (this.mode !== 'wpm') return
            this.wpmRace ??= new WpmRace()
            this.startWpm()
        })
    }

    private startWpm(): void {
        const race = this.wpmRace
        if (!race) return
        race.start()
        this.stopWpmClock?.()
        // The clock: a light tick that only updates the countdown
        this.stopWpmClock = every(200, () => {
            const now = performance.now()
            if (race.tick(now)) this.endWpm()
            else this.set({ wpm: race.view(now) })
        })
        this.set({ wpm: race.view(performance.now()), inputText: '' })
    }

    /** The race's input field changed (native typing, IME, mobile keyboards). */
    wpmInput = (value: string): void => {
        const race = this.wpmRace
        if (this.mode !== 'wpm' || !race || this.snap.wpm?.done) return
        const now = performance.now()
        const before = this.snap.wpm?.typed ?? ''
        // The visitor's own keys click like the site's typing
        if (value.length !== before.length) {
            const key = value.length < before.length ? '\b' : value[value.length - 1]
            const keyType = key === '\b' ? 'backspace' : key === ' ' ? 'space' : 'regular'
            const interval = this.lastWpmKeyAt ? now - this.lastWpmKeyAt : Infinity
            this.lastWpmKeyAt = now
            for (const { clip, ...play } of keystrokeSounds(keyType, key, audioConfig.baseVolume * 0.8, interval)) audioEngine.playClip(clip, play)
        }
        if (race.input(value, now)) this.endWpm()
        else this.set({ wpm: race.view(now) })
    }

    private endWpm(): void {
        this.stopWpmClock?.()
        this.stopWpmClock = null
        const race = this.wpmRace
        if (!race) return
        const view = race.view(performance.now())
        this.set({ wpm: view })
        audioEngine.play(view.newBest ? 'success' : 'loaded')
        this.unlock('wpm')
    }

    private exitWpm(): void {
        this.stopWpmClock?.()
        this.stopWpmClock = null
        const last = this.snap.wpm
        this.set({ mode: 'normal', wpm: null, inputText: '' })
        if (last?.done) {
            this.pushLines({ type: 'output', text: `Typing race: ${last.wpm} wpm at ${last.accuracy}% accuracy. Best: ${last.best} wpm. Type wpm to race again.` })
        }
    }

    // ── train: a neural network learning live ──

    private enterTrain(): void {
        this.set({ mode: 'train', trainDisplay: '', trainDone: false })
        import('./games/train').then(({ TrainRun }) => {
            if (this.mode !== 'train') return
            this.runTraining(new TrainRun())
        })
    }

    private runTraining(run: TrainRun): void {
        this.stopTrain?.()
        this.train = run
        audioEngine.play('load')
        // Reduced motion: no animation, just the trained result
        if (reducedMotion()) {
            while (!run.done) run.advance(1000)
            this.finishTraining()
            return
        }
        this.set({ trainDisplay: run.frame(), trainDone: false })
        this.stopTrain = every(TRAIN_FRAME_MS, () => {
            run.advance()
            this.set({ trainDisplay: run.frame() })
            if (run.done) this.finishTraining()
        })
    }

    private finishTraining(): void {
        this.stopTrain?.()
        this.stopTrain = null
        const run = this.train
        if (!run) return
        this.set({ trainDisplay: run.frame(), trainDone: true })
        audioEngine.play('loaded')
        this.unlock('train')
    }

    private retrain(): void {
        import('./games/train').then(({ TrainRun }) => {
            if (this.mode === 'train') this.runTraining(new TrainRun())
        })
    }

    private exitTrain(): void {
        this.stopTrain?.()
        this.stopTrain = null
        const run = this.train
        this.set({ mode: 'normal', trainDisplay: '', trainDone: false })
        if (run?.done) {
            this.pushLines({ type: 'output', text: `Trained a 2-16-1 neural network from scratch: ${Math.round(run.accuracy * 100)}% accuracy on the two moons. Type train to run it again.` })
        }
    }

    // ── quiz: which pattern solves it? ──

    private enterQuiz(): void {
        this.set({ mode: 'quiz', agentUsed: true, agentSuggestions: [] })
        import('./games/quiz').then(({ Quiz }) => {
            if (this.mode !== 'quiz') return
            this.quiz ??= new Quiz()
            const step = this.quiz.start()
            this.typeResponse(step.output)
            this.set({ agentSuggestions: step.options })
        })
    }

    private answerQuiz(raw: string): void {
        const low = raw.trim().toLowerCase()
        this.pushLines({ type: 'input', text: raw, prompt: QUIZ_PROMPT })
        if (['q', 'quit', 'exit', 'stop'].includes(low) || !this.quiz) {
            this.exitQuiz()
            this.typeResponse('Quiz closed. Type games for more to play.')
            return
        }
        const step = this.quiz.answer(raw)
        this.set({ agentSuggestions: step.options })
        if (!step.done) {
            this.typeResponse(step.output)
            return
        }
        this.exitQuiz()
        // Unlocked now (not after the typing), so skipping ahead never loses it
        audioEngine.play('loaded')
        this.unlock('quiz')
        this.typeResponse(step.output)
    }

    private exitQuiz(): void {
        this.set({ mode: 'normal', agentSuggestions: [] })
    }

    // ============================================
    // Command dispatch
    // ============================================

    /** Prompt reflecting the displayed section or the filesystem cwd. */
    currentPrompt(): string {
        const s = this.snap.displayedSection
        if (s) return s === 'home' ? 'visitor@kudzai:~$ ' : `visitor@kudzai:~/${s}$ `
        return cwdToPrompt(this.snap.cwd)
    }

    /** Unlock an achievement: the chime and one line, the first time only. */
    private unlock(id: AchievementId): void {
        const a = unlockAchievement(id)
        if (!a) return
        audioEngine.play('achievement')
        this.pushLines({ type: 'output', text: unlockLine(a, unlockedAchievements().size), fresh: true })
    }

    private processCommand(command: string): void {
        // Track non-empty commands in session history (original input)
        if (command.trim()) {
            const hist = this.commandHistory
            if (hist.length === 0 || hist[hist.length - 1] !== command.trim()) hist.push(command.trim())
        }
        this.historyIndex = -1
        this.savedInput = ''

        // Echo the original command; each new command supersedes the previous chips.
        this.pushLines({ type: 'input', text: command, prompt: this.currentPrompt() })
        this.set({ agentSuggestions: [] })

        // Resolve aliases for processing (original stays in display/history)
        const resolved = resolveAlias(command)
        const trimmed = resolved.trim().toLowerCase()

        if (trimmed === 'clear') {
            this.set({ history: [], displayedSection: null, agentUsed: false })
            return
        }

        if (trimmed === '') return

        if (!firstCommandTracked) {
            firstCommandTracked = true
            trackEvent(ANALYTICS_EVENTS.firstCommand, { section: this.sectionId })
        }

        const result = getCommandResponse(this.sectionId, resolved, this.snap.cwd)

        if (result.newCwd !== undefined) this.set({ cwd: result.newCwd })

        // Easter-egg achievements
        if (trimmed === 'sl') this.unlock('sl')
        if (/^cat\s/.test(trimmed) && result.response && !result.response.startsWith('cat:')
            && /(^|\/)\./.test(`${this.snap.cwd}/${trimmed.slice(4).trim()}`)) this.unlock('secret')

        if (trimmed === 'achievements') {
            this.typeResponse(achievementsText(unlockedAchievements()))
            return
        }
        if (trimmed === 'games') {
            this.typeResponse(generateGames(unlockedAchievements().size, ACHIEVEMENTS.length))
            return
        }

        // A game asked for in another section: say so, then play it in the terminal
        if (result.runInTerminal) {
            const command = result.runInTerminal
            if (result.response) this.typeResponse(result.response)
            void Promise.all([import('./store'), import('@/src/lib/sectionNav')])
                .then(([store, nav]) => store.runInTerminal(command, nav.goToSection))
            return
        }

        // `theme [name]`: list or switch the phosphor theme
        if (result.theme !== undefined) {
            const { text, apply } = themeCommand(result.theme, getTheme())
            if (apply) {
                setTheme(apply)
                this.unlock('theme')
            }
            this.typeResponse(text)
            return
        }

        // `crt [on|off]`: the opt-in scanlines / tube look
        if (result.crt !== undefined) {
            const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
            const { text, apply } = crtCommand(result.crt, getCrt(), reduced)
            if (apply !== undefined) setCrt(apply)
            this.typeResponse(text)
            return
        }

        // `--no-tty` / `tty`: plain mode
        if (result.plain !== undefined) {
            const already = result.plain === isPlainMode()
            this.typeResponse(result.plain
                ? (already ? 'Already in plain mode. `tty` brings the terminal back.' : 'Plain mode: same content, no boot, typing, sound or effects. Type `tty` (or use the switch, top right) to come back.')
                : (already ? 'Already in the terminal experience.' : 'Back on the tube.'))
            if (!already) setPlainMode(result.plain)
            return
        }

        // `screenreader [on|off]`: mirror output into a live region
        if (result.screenReader !== undefined) {
            const { text, apply } = screenReaderCommand(result.screenReader, getScreenReaderMode())
            if (apply !== undefined) setScreenReaderMode(apply)
            this.typeResponse(text)
            return
        }

        // Section content rendering (terminal section only)
        if (result.renderSection) { this.renderSectionContent(result.renderSection); return }
        // Guided tour (from the `tour` command or a tour phrase)
        if (result.startTour) { this.startTour(); return }
        // Step-by-step contact flow (from `email`/`contact`)
        if (result.startContact) { this.startContact(); return }

        // Mode transitions
        if (result.enterMode === 'vim') { this.enterVim(); return }
        if (result.enterMode === 'matrix') { this.enterMatrix(); return }
        if (result.enterMode === 'snake') { this.enterSnake(); return }
        if (result.enterMode === 'adventure') { this.enterAdventure(); return }
        if (result.enterMode === 'wpm') { this.enterWpm(); return }
        if (result.enterMode === 'train') { this.enterTrain(); return }
        if (result.enterMode === 'quiz') { this.enterQuiz(); return }

        if (result.navigateTo) scrollToSection(result.navigateTo)

        // Side-effect: trigger a download (cv/resume). The browser handles 404s
        // if the file isn't present yet — the response still types out.
        if (trimmed === 'cv' || trimmed.startsWith('cv ')) {
            trackEvent(ANALYTICS_EVENTS.cvDownloaded, { source: 'command' })
        }
        if (result.downloadUrl) downloadOrOpen(result.downloadUrl)

        // Side-effect: open a URL in a new tab (mailto, external profiles).
        if (result.openUrl) window.open(result.openUrl, '_blank', 'noopener,noreferrer')

        // Route plain-English input to the AI agent.
        if (result.askAI) { void this.runAgentQuery(result.askAI); return }

        // Scripted onboarding reply — typed in the agent's voice, with onboarding chips.
        if (result.onboarding && result.response) {
            this.set({ agentUsed: true, agentSuggestions: ONBOARDING_SUGGESTIONS })
            this.typeResponse(result.response, undefined, 'agent')
            return
        }

        if (result.response) {
            if (result.loadingMessages) this.showLoadingThenResponse(result.response, result.loadingMessages)
            else this.typeResponse(result.response)
        }
    }

    // Run a command as if typed — used by the quick-action chips. Ignored
    // while the terminal is busy typing or awaiting the agent.
    submitCommand = (command: string): void => {
        // A quiz option chip answers the question (and may skip its typing)
        if (this.mode === 'quiz') {
            if (this.isTyping) this.completeResponseImmediately()
            this.answerQuiz(command)
            return
        }
        if (this.thinking || this.snap.isTypingResponse) return
        if (this.mode !== 'normal') return
        this.processCommand(command)
    }

    /** The game screens' buttons (retry, quit, pause) */
    gameAction = (action: 'retry' | 'quit' | 'pause'): void => {
        const mode = this.mode
        if (mode === 'wpm') { if (action === 'quit') this.exitWpm(); else this.startWpm() }
        else if (mode === 'train') { if (action === 'quit') this.exitTrain(); else this.retrain() }
        else if (mode === 'snake') {
            if (action === 'quit') this.exitSnake()
            else if (action === 'pause') this.snake?.togglePause()
            else this.snake?.start()
        }
    }

    // Submit a spoken transcript: the reply will be read aloud.
    submitVoiceCommand = (command: string): void => {
        if (this.thinking || this.snap.isTypingResponse) return
        if (this.mode !== 'normal') return
        this.shouldSpeak = true
        this.processCommand(command)
    }

    // ============================================
    // Keyboard
    // ============================================

    /** Take the current input line and clear it. */
    private takeInput(): string {
        const raw = this.snap.inputText
        this.set({ inputText: '' })
        return raw
    }

    /**
     * Printable keys and Backspace. When the visitor is typing in the real
     * <input>, the browser edits it natively (IME, autocorrect, caret moves);
     * otherwise the key is applied here and focus moves into the input.
     */
    private editInput(e: KeyboardEvent, ctx: KeyContext): boolean {
        if (e.key === 'Backspace') {
            if (ctx.fromInput) return true
            e.preventDefault()
            this.set({ inputText: this.snap.inputText.slice(0, -1) })
            this.focusInput()
            return true
        }
        if (e.key.length === 1) {
            if (ctx.fromInput) return true
            e.preventDefault()
            this.set({ inputText: this.snap.inputText + e.key })
            this.focusInput()
            return true
        }
        return false
    }

    handleKeyDown(e: KeyboardEvent, ctx: KeyContext): void {
        // Modifier combos are never captured
        if (e.ctrlKey || e.metaKey || e.altKey) return

        // While the agent is thinking (awaiting the network), swallow all
        // keys — a round-trip can't be skipped the way typing can.
        if (this.thinking || this.streaming) {
            // Waiting on the agent: the visitor may type ahead in the field
            // (native editing), but Enter waits until the reply is done
            if (e.key === 'Enter' || !ctx.fromInput) e.preventDefault()
            return
        }

        const mode = this.mode

        // Ghost-completion accept: ArrowRight or End fills in the suggestion when
        // one exists and the caret is at the end of the line. Otherwise the key
        // falls through (caret movement, page-level section nav, etc.).
        if ((e.key === 'ArrowRight' || e.key === 'End') && mode === 'normal' && !this.isTyping) {
            const sugg = this.snap.suggestion
            const el = this.inputEl
            const caretAtEnd = !ctx.fromInput || !el || el.selectionStart === el.value.length
            if (sugg && caretAtEnd) {
                e.preventDefault()
                this.set({ inputText: this.snap.inputText + sugg })
                return
            }
        }

        // ── TOUR MODE ── (available on every section)
        if (mode === 'tour') {
            if (this.isTyping) {
                e.preventDefault()
                this.completeResponseImmediately()
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                const raw = this.takeInput()
                const low = raw.trim().toLowerCase()
                const advance = ['', 'next', 'n', 'continue', 'yes', 'y', 'ok', 'go'].includes(low)
                const quit = ['exit', 'quit', 'stop', 'q', 'done', 'skip'].includes(low)
                if (advance) {
                    this.pushLines({ type: 'input', text: raw, prompt: TOUR_PROMPT })
                    this.runTourStep(this.tourStep + 1)
                } else if (quit) {
                    this.pushLines({ type: 'input', text: raw, prompt: TOUR_PROMPT })
                    this.finishTour()
                    this.typeResponse('Tour ended. Ask me anything, or explore on your own.', undefined, 'agent')
                } else {
                    // A real question — leave the tour and answer it.
                    // processCommand echoes the input itself, so don't echo here.
                    this.finishTour(true)
                    this.processCommand(raw)
                }
                return
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return }
            this.editInput(e, ctx)
            return
        }

        // ── CONTACT MODE ── (available on every section)
        if (mode === 'contact') {
            // While the agent's question is typing, a key skips ahead.
            if (this.isTyping) {
                e.preventDefault()
                this.completeResponseImmediately()
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                const raw = this.takeInput()
                this.pushLines({ type: 'input', text: raw, prompt: this.currentPrompt() })
                this.submitContactStep(raw)
                return
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return }
            this.editInput(e, ctx)
            return
        }

        // Terminal section: special modes and full shell keys
        if (this.sectionId === 'terminal') {
            // ── VIM MODE ──
            if (mode === 'vim') {
                e.preventDefault()
                const vimCommand = this.snap.vimCommand
                if (vimCommand.startsWith(':')) {
                    // Colon command mode
                    if (e.key === 'Enter') {
                        const cmd = vimCommand.slice(1).trim()
                        if (['q', 'wq', 'q!', 'x', 'wq!', 'qa', 'qa!', 'exit', 'quit', 'close'].includes(cmd)) {
                            this.exitVim()
                        } else if (cmd === '') {
                            this.set({ vimCommand: '' })
                        } else {
                            this.set({ vimCommand: `Not an editor command: ${cmd}` })
                            this.later(2000, () => this.set({ vimCommand: '' }))
                        }
                    } else if (e.key === 'Backspace') {
                        this.set({ vimCommand: vimCommand.length > 1 ? vimCommand.slice(0, -1) : '' })
                    } else if (e.key === 'Escape') {
                        this.set({ vimCommand: '' })
                    } else if (e.key.length === 1) {
                        this.set({ vimCommand: vimCommand + e.key })
                    }
                } else if (e.key === ':') {
                    this.set({ vimCommand: ':' })
                } else if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
                    // Direct quit: bare q/Q/Escape exits without needing :q
                    this.exitVim()
                }
                // All other keys in vim mode: no-op
                return
            }

            // ── MATRIX MODE ── any key exits
            if (mode === 'matrix') {
                e.preventDefault()
                this.exitMatrix()
                return
            }

            // ── SNAKE MODE ──
            if (mode === 'snake') {
                e.preventDefault()
                // Q exits (also before the game module has finished loading)
                const consumed = this.snake ? this.snake.handleKey(e.key) : !(e.key === 'q' || e.key === 'Q')
                if (!consumed) this.exitSnake()
                return
            }

            // ── WPM: the race's own input does the typing ──
            if (mode === 'wpm') {
                if (e.key === 'Escape') { e.preventDefault(); this.exitWpm(); return }
                if (this.snap.wpm?.done) {
                    e.preventDefault()
                    if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') this.startWpm()
                    else if (e.key === 'q' || e.key === 'Q') this.exitWpm()
                    return
                }
                // Keys from elsewhere on the page go into the race field
                if (!ctx.fromInput) {
                    e.preventDefault()
                    this.focusInput()
                    if (e.key.length === 1) this.wpmInput((this.snap.wpm?.typed ?? '') + e.key)
                    else if (e.key === 'Backspace') this.wpmInput((this.snap.wpm?.typed ?? '').slice(0, -1))
                }
                if (e.key === 'Enter') e.preventDefault()
                return
            }

            // ── TRAIN: R retrains, Q or Escape leaves ──
            if (mode === 'train') {
                e.preventDefault()
                if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') this.exitTrain()
                else if ((e.key === 'r' || e.key === 'R') && this.snap.trainDone) this.retrain()
                return
            }

            // ── QUIZ: answer with a letter, or q ──
            if (mode === 'quiz') {
                if (this.isTyping) {
                    e.preventDefault()
                    this.completeResponseImmediately()
                    if (e.key.length === 1 && /[a-dq]/i.test(e.key)) this.answerQuiz(e.key)
                    return
                }
                if (e.key === 'Enter') {
                    e.preventDefault()
                    const raw = this.takeInput()
                    if (raw.trim()) this.answerQuiz(raw)
                    return
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return }
                this.editInput(e, ctx)
                return
            }

            // ── ADVENTURE MODE ──
            if (mode === 'adventure') {
                if (this.isTyping) {
                    e.preventDefault()
                    this.completeResponseImmediately()
                    return
                }
                if (e.key === 'Enter') {
                    e.preventDefault()
                    const game = this.adventure
                    const cmd = this.takeInput()
                    this.pushLines({ type: 'input', text: cmd, prompt: game?.getCurrentPrompt() ?? '' })
                    if (!cmd.trim() || !game) return

                    const result = game.handleInput(cmd)
                    this.set({ adventurePrompt: result.prompt })
                    if (result.quit) this.exitAdventure()
                    if (result.output) this.typeResponse(result.output)
                    // Finishing the journey is the achievement
                    if (game.complete) this.unlock('adventure')
                    return
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return }
                this.editInput(e, ctx)
                return
            }

            // ── NORMAL MODE: history navigation ──
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                const hist = this.commandHistory
                if (hist.length === 0) return
                if (this.historyIndex === -1) {
                    this.savedInput = this.snap.inputText
                    this.historyIndex = hist.length - 1
                } else if (this.historyIndex > 0) {
                    this.historyIndex--
                }
                this.set({ inputText: hist[this.historyIndex] })
                return
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (this.historyIndex === -1) return
                const hist = this.commandHistory
                if (this.historyIndex < hist.length - 1) {
                    this.historyIndex++
                    this.set({ inputText: hist[this.historyIndex] })
                } else {
                    this.historyIndex = -1
                    this.set({ inputText: this.savedInput })
                }
                return
            }
            if (e.key === 'Tab') {
                e.preventDefault()
                this.autocomplete()
                return
            }
        }

        // Don't capture navigation keys for non-terminal sections
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape',
            'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        ].includes(e.key)) return

        // Any key during response typing completes it instantly — and still
        // does its job: Enter sends what was typed, other keys still type
        if (this.isTyping) {
            this.completeResponseImmediately()
            if (e.key === 'Enter') {
                e.preventDefault()
                if (this.snap.inputText.trim()) this.processCommand(this.takeInput())
                return
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault()
            this.processCommand(this.takeInput())
            return
        }

        this.editInput(e, ctx)
    }

    private autocomplete(): void {
        const input = this.snap.inputText
        const parts = input.split(/\s+/)
        const cmd = parts[0]?.toLowerCase()
        const commonPrefix = (items: string[]) => {
            let common = items[0]
            for (let i = 1; i < items.length; i++) {
                let j = 0
                while (j < common.length && j < items[i].length && common[j] === items[i][j]) j++
                common = common.slice(0, j)
            }
            return common
        }

        // Autocomplete filesystem paths for fs commands
        if (parts.length >= 2 && (cmd === 'cd' || cmd === 'ls' || cmd === 'cat')) {
            const partial = parts[parts.length - 1]
            const completions = getCompletions(this.snap.cwd, partial)
            if (completions.length === 1) {
                parts[parts.length - 1] = completions[0]
                this.set({ inputText: parts.join(' ') })
            } else if (completions.length > 1) {
                const common = commonPrefix(completions)
                if (common.length > partial.length) {
                    parts[parts.length - 1] = common
                    this.set({ inputText: parts.join(' ') })
                }
            }
        } else if (parts.length <= 1 && input.length > 0) {
            // Autocomplete command names
            const matches = TERMINAL_COMMAND_LIST.filter(c => c.startsWith(input.toLowerCase()))
            if (matches.length === 1) {
                this.set({ inputText: matches[0] + ' ' })
            } else if (matches.length > 1) {
                const common = commonPrefix(matches)
                if (common.length > input.length) this.set({ inputText: common })
            }
        }
    }
}
