// terminal/games/snake.ts
// ASCII Snake. Loaded on demand the first time `snake` runs. It speeds up as
// it grows, pauses on P or Space, and remembers the best score.

import { every } from '@/src/lib/fxScheduler'

const GRID_W = 22
const GRID_H = 14
/** Step time at the start, and the fastest it gets (ms) */
const TICK_START_MS = 140
const TICK_MIN_MS = 70
/** Faster by this much per food eaten (ms) */
const TICK_STEP_MS = 4
const BEST_KEY = 'portfolio-snake-best'

/** Step time for a score: quicker as the snake grows. */
export function tickFor(score: number): number {
    return Math.max(TICK_MIN_MS, TICK_START_MS - score * TICK_STEP_MS)
}

export type SnakeEvent = 'eat' | 'over' | 'best'

export type Direction = 'up' | 'down' | 'left' | 'right'
interface Point { x: number; y: number }

function spawnFood(snake: Point[]): Point {
    let pos: Point
    do {
        pos = { x: Math.floor(Math.random() * GRID_W), y: Math.floor(Math.random() * GRID_H) }
    } while (snake.some(s => s.x === pos.x && s.y === pos.y))
    return pos
}

function renderGrid(snake: Point[], food: Point, gameOver: boolean, score: number, highScore: number, started: boolean, paused: boolean, newBest: boolean): string {
    // Each cell is two characters wide, so the board is square-ish on screen
    const grid: string[][] = Array.from({ length: GRID_H }, () =>
        Array.from({ length: GRID_W }, () => '  ')
    )

    grid[food.y][food.x] = '◆ '

    snake.forEach((p, i) => {
        if (p.x >= 0 && p.x < GRID_W && p.y >= 0 && p.y < GRID_H) {
            // The head is solid, the body a shade lighter
            grid[p.y][p.x] = i === snake.length - 1 ? '██' : '▓▓'
        }
    })

    const lines: string[] = []
    lines.push('┌' + '─'.repeat(GRID_W * 2) + '┐')
    for (const row of grid) {
        lines.push('│' + row.join('') + '│')
    }
    lines.push('└' + '─'.repeat(GRID_W * 2) + '┘')
    lines.push(` Score: ${score}   Best: ${highScore}   Speed: ${Math.round(TICK_START_MS / tickFor(score) * 10) / 10}x`)

    if (!started) {
        lines.push(' Arrow keys or swipe to start · Q quits')
    } else if (gameOver) {
        lines.push(newBest ? ' New best! R to retry · Q quits' : ' Game over. R to retry · Q quits')
    } else if (paused) {
        lines.push(' Paused. P or Space to carry on · Q quits')
    } else {
        lines.push(' Arrows or swipe to steer · P pauses · Q quits')
    }

    return lines.join('\n')
}

export class SnakeGame {
    private snake: Point[] = []
    private food: Point = { x: 0, y: 0 }
    private dir: Direction = 'right'
    private nextDir: Direction = 'right'
    private score = 0
    private highScore = 0
    private gameOver = false
    private started = false
    private paused = false
    private newBest = false
    private stopLoop: (() => void) | null = null

    /**
     * @param onDisplay receives the rendered board after every change
     * @param onEvent told when food is eaten and when the game ends (for sound)
     */
    constructor(private onDisplay: (display: string) => void, private onEvent: (e: SnakeEvent) => void = () => {}) {
        try { this.highScore = Number(localStorage.getItem(BEST_KEY)) || 0 } catch { /* storage blocked */ }
    }

    start(): void {
        this.clearLoop()
        const cx = Math.floor(GRID_W / 2)
        const cy = Math.floor(GRID_H / 2)
        this.snake = [
            { x: cx - 2, y: cy },
            { x: cx - 1, y: cy },
            { x: cx, y: cy },
        ]
        this.food = spawnFood(this.snake)
        this.dir = 'right'
        this.nextDir = 'right'
        this.score = 0
        this.gameOver = false
        this.started = false
        this.paused = false
        this.newBest = false
        this.render()
    }

    stop(): void {
        this.clearLoop()
        this.onDisplay('')
    }

    changeDirection(dir: Direction): void {
        if (this.gameOver) return
        if (this.paused) this.togglePause()

        if (!this.started) {
            this.started = true
            this.nextDir = dir
            this.startLoop()
            return
        }

        const cur = this.dir
        if (
            (dir === 'up' && cur === 'down') ||
            (dir === 'down' && cur === 'up') ||
            (dir === 'left' && cur === 'right') ||
            (dir === 'right' && cur === 'left')
        ) return

        this.nextDir = dir
    }

    /** Returns true if the key was consumed, false if the caller should handle it (Q = exit). */
    handleKey(key: string): boolean {
        if (this.gameOver) {
            if (key === 'r' || key === 'R') { this.start(); return true }
            if (key === 'q' || key === 'Q') return false
            return true
        }

        switch (key) {
            case 'p': case 'P': case ' ': this.togglePause(); return true
            case 'ArrowUp': this.changeDirection('up'); return true
            case 'ArrowDown': this.changeDirection('down'); return true
            case 'ArrowLeft': this.changeDirection('left'); return true
            case 'ArrowRight': this.changeDirection('right'); return true
            case 'q': case 'Q': return false
            default: return true
        }
    }

    /** Pause or carry on (only while a game is running). */
    togglePause(): void {
        if (!this.started || this.gameOver) return
        this.paused = !this.paused
        if (this.paused) this.clearLoop()
        else this.startLoop()
        this.render()
    }

    private render(): void {
        this.onDisplay(renderGrid(this.snake, this.food, this.gameOver, this.score, this.highScore, this.started, this.paused, this.newBest))
    }

    private clearLoop(): void {
        this.stopLoop?.()
        this.stopLoop = null
    }

    private endGame(): void {
        this.gameOver = true
        const best = this.score > this.highScore
        this.newBest = best
        if (best) {
            this.highScore = this.score
            try { localStorage.setItem(BEST_KEY, String(this.score)) } catch { /* storage blocked */ }
        }
        this.clearLoop()
        this.onEvent(best ? 'best' : 'over')
        this.render()
    }

    private startLoop(): void {
        this.clearLoop()
        const tick = tickFor(this.score)
        this.stopLoop = every(tick, () => {
            if (this.gameOver || !this.started || this.paused) return

            this.dir = this.nextDir
            const snake = this.snake
            const head = snake[snake.length - 1]

            const moves: Record<Direction, Point> = {
                up: { x: head.x, y: head.y - 1 },
                down: { x: head.x, y: head.y + 1 },
                left: { x: head.x - 1, y: head.y },
                right: { x: head.x + 1, y: head.y },
            }
            const nh = moves[this.dir]

            // Wall or self collision
            if (nh.x < 0 || nh.x >= GRID_W || nh.y < 0 || nh.y >= GRID_H ||
                snake.some(s => s.x === nh.x && s.y === nh.y)) {
                this.endGame()
                return
            }

            snake.push(nh)

            if (nh.x === this.food.x && nh.y === this.food.y) {
                this.score++
                this.food = spawnFood(snake)
                this.onEvent('eat')
                // Speed up: restart the loop at the new pace
                if (tickFor(this.score) !== tick) {
                    this.render()
                    this.startLoop()
                    return
                }
            } else {
                snake.shift()
            }

            this.render()
        })
    }
}
