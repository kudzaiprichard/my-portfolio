// terminal/games/wpm.ts
// `wpm`: a typing race against the clock. Type real commands from this site's
// world; words per minute and accuracy update live, and the best score is
// remembered. Pure logic, loaded on demand; the session feeds it input and time.

/** Lines to race through: the commands and shell habits behind the projects */
const LINES = [
    'git commit -m "ship the voice agent"',
    'python train.py --epochs 20 --lr 3e-4',
    'docker compose up --build -d',
    'cd projects && cat anvil/README.md',
    'aws s3 sync ./renditions s3://lessons --delete',
    'npm run build && npm run test:e2e',
    'curl -N localhost:8000/v1/agent/stream',
    'kubectl rollout status deploy/asr-gateway',
    'psql -c "select count(*) from enrollments"',
    'uvicorn app.main:app --reload --port 8000',
    'ffmpeg -i lesson.mov -vf scale=-2:720 out.mp4',
    'cargo tauri build --target x86_64-pc-windows-msvc',
]

export const WPM_SECONDS = 30
const BEST_KEY = 'portfolio-wpm-best'

export interface WpmView {
    target: string
    typed: string
    /** Seconds left on the clock */
    remaining: number
    started: boolean
    done: boolean
    wpm: number
    accuracy: number
    best: number
    newBest: boolean
}

function readBest(): number {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
}

/** Words per minute (a word is 5 characters) from correctly typed characters. */
export function wordsPerMinute(correctChars: number, ms: number): number {
    if (ms <= 0) return 0
    return Math.round((correctChars / 5) / (ms / 60000))
}

export class WpmRace {
    private target = ''
    private typed = ''
    private startedAt: number | null = null
    private endedAt: number | null = null
    /** Every key that added a character, and how many of those were right */
    private keys = 0
    private correctKeys = 0
    private best = readBest()
    private newBest = false

    /** A fresh race: three random lines joined into one passage. */
    start(random = Math.random): void {
        const pool = [...LINES]
        const pick: string[] = []
        while (pick.length < 3) pick.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
        this.target = pick.join('  ')
        this.typed = ''
        this.startedAt = null
        this.endedAt = null
        this.keys = 0
        this.correctKeys = 0
        this.newBest = false
    }

    /** The input field's new value. Returns true when this ended the race. */
    input(value: string, now: number): boolean {
        if (this.endedAt !== null) return false
        const next = value.slice(0, this.target.length)
        if (next.length > this.typed.length) {
            // Count each added character against the passage
            for (let i = this.typed.length; i < next.length; i++) {
                this.keys++
                if (next[i] === this.target[i]) this.correctKeys++
            }
        }
        if (this.startedAt === null && next.length > 0) this.startedAt = now
        this.typed = next
        if (this.typed === this.target) {
            this.finish(now)
            return true
        }
        return false
    }

    /** The clock ran out (or the passage is done). */
    tick(now: number): boolean {
        if (this.endedAt !== null || this.startedAt === null) return false
        if (now - this.startedAt >= WPM_SECONDS * 1000) {
            this.finish(this.startedAt + WPM_SECONDS * 1000)
            return true
        }
        return false
    }

    private correctChars(): number {
        let n = 0
        for (let i = 0; i < this.typed.length; i++) if (this.typed[i] === this.target[i]) n++
        return n
    }

    private finish(at: number): void {
        this.endedAt = at
        const wpm = this.stats(at).wpm
        if (wpm > this.best) {
            this.best = wpm
            this.newBest = true
            try { localStorage.setItem(BEST_KEY, String(wpm)) } catch { /* storage blocked */ }
        }
    }

    private stats(now: number): { wpm: number; accuracy: number } {
        const ms = this.startedAt === null ? 0 : (this.endedAt ?? now) - this.startedAt
        return {
            wpm: wordsPerMinute(this.correctChars(), ms),
            accuracy: this.keys ? Math.round((this.correctKeys / this.keys) * 100) : 100,
        }
    }

    view(now: number): WpmView {
        const elapsed = this.startedAt === null ? 0 : (this.endedAt ?? now) - this.startedAt
        return {
            target: this.target,
            typed: this.typed,
            remaining: Math.max(0, Math.ceil(WPM_SECONDS - elapsed / 1000)),
            started: this.startedAt !== null,
            done: this.endedAt !== null,
            ...this.stats(now),
            best: this.best,
            newBest: this.newBest,
        }
    }
}
