// hooks/useSnakeGame.ts
"use client"

import { useState, useCallback, useRef } from 'react'

const GRID_W = 22
const GRID_H = 14
const TICK_MS = 140

type Direction = 'up' | 'down' | 'left' | 'right'
interface Point { x: number; y: number }

function spawnFood(snake: Point[]): Point {
    let pos: Point
    do {
        pos = { x: Math.floor(Math.random() * GRID_W), y: Math.floor(Math.random() * GRID_H) }
    } while (snake.some(s => s.x === pos.x && s.y === pos.y))
    return pos
}

function renderGrid(snake: Point[], food: Point, gameOver: boolean, score: number, highScore: number, started: boolean): string {
    const grid: string[][] = Array.from({ length: GRID_H }, () =>
        Array.from({ length: GRID_W }, () => ' ')
    )

    grid[food.y][food.x] = '◆'

    for (const p of snake) {
        if (p.x >= 0 && p.x < GRID_W && p.y >= 0 && p.y < GRID_H) {
            grid[p.y][p.x] = '█'
        }
    }

    const lines: string[] = []
    lines.push('┌' + '─'.repeat(GRID_W) + '┐')
    for (const row of grid) {
        lines.push('│' + row.join('') + '│')
    }
    lines.push('└' + '─'.repeat(GRID_W) + '┘')
    lines.push(` Score: ${score}   Best: ${highScore}`)

    if (!started) {
        lines.push(' Arrow keys to start, Q to quit')
    } else if (gameOver) {
        lines.push(' Game Over! R to retry, Q to quit')
    } else {
        lines.push(' Arrow keys to move, Q to quit')
    }

    return lines.join('\n')
}

export function useSnakeGame() {
    const [display, setDisplay] = useState('')

    const snakeRef = useRef<Point[]>([])
    const foodRef = useRef<Point>({ x: 0, y: 0 })
    const dirRef = useRef<Direction>('right')
    const nextDirRef = useRef<Direction>('right')
    const scoreRef = useRef(0)
    const highScoreRef = useRef(0)
    const gameOverRef = useRef(false)
    const startedRef = useRef(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const clearLoop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const updateDisplay = useCallback(() => {
        setDisplay(renderGrid(
            snakeRef.current, foodRef.current,
            gameOverRef.current, scoreRef.current,
            highScoreRef.current, startedRef.current,
        ))
    }, [])

    const initGame = useCallback(() => {
        clearLoop()
        const cx = Math.floor(GRID_W / 2)
        const cy = Math.floor(GRID_H / 2)
        snakeRef.current = [
            { x: cx - 2, y: cy },
            { x: cx - 1, y: cy },
            { x: cx, y: cy },
        ]
        foodRef.current = spawnFood(snakeRef.current)
        dirRef.current = 'right'
        nextDirRef.current = 'right'
        scoreRef.current = 0
        gameOverRef.current = false
        startedRef.current = false
        updateDisplay()
    }, [clearLoop, updateDisplay])

    const startLoop = useCallback(() => {
        clearLoop()
        intervalRef.current = setInterval(() => {
            if (gameOverRef.current || !startedRef.current) return

            dirRef.current = nextDirRef.current
            const snake = snakeRef.current
            const head = snake[snake.length - 1]

            const moves: Record<Direction, Point> = {
                up: { x: head.x, y: head.y - 1 },
                down: { x: head.x, y: head.y + 1 },
                left: { x: head.x - 1, y: head.y },
                right: { x: head.x + 1, y: head.y },
            }
            const nh = moves[dirRef.current]

            // Wall collision
            if (nh.x < 0 || nh.x >= GRID_W || nh.y < 0 || nh.y >= GRID_H) {
                gameOverRef.current = true
                if (scoreRef.current > highScoreRef.current) highScoreRef.current = scoreRef.current
                clearLoop()
                setDisplay(renderGrid(snake, foodRef.current, true, scoreRef.current, highScoreRef.current, true))
                return
            }

            // Self collision
            if (snake.some(s => s.x === nh.x && s.y === nh.y)) {
                gameOverRef.current = true
                if (scoreRef.current > highScoreRef.current) highScoreRef.current = scoreRef.current
                clearLoop()
                setDisplay(renderGrid(snake, foodRef.current, true, scoreRef.current, highScoreRef.current, true))
                return
            }

            snake.push(nh)

            if (nh.x === foodRef.current.x && nh.y === foodRef.current.y) {
                scoreRef.current++
                foodRef.current = spawnFood(snake)
            } else {
                snake.shift()
            }

            setDisplay(renderGrid(snake, foodRef.current, false, scoreRef.current, highScoreRef.current, true))
        }, TICK_MS)
    }, [clearLoop])

    const changeDirection = useCallback((dir: Direction) => {
        if (gameOverRef.current) return

        if (!startedRef.current) {
            startedRef.current = true
            nextDirRef.current = dir
            startLoop()
            return
        }

        const cur = dirRef.current
        if (
            (dir === 'up' && cur === 'down') ||
            (dir === 'down' && cur === 'up') ||
            (dir === 'left' && cur === 'right') ||
            (dir === 'right' && cur === 'left')
        ) return

        nextDirRef.current = dir
    }, [startLoop])

    /** Returns true if key was consumed, false if caller should handle (Q = exit) */
    const handleKeyDown = useCallback((e: KeyboardEvent): boolean => {
        if (gameOverRef.current) {
            if (e.key === 'r' || e.key === 'R') { initGame(); return true }
            if (e.key === 'q' || e.key === 'Q') return false
            return true
        }

        switch (e.key) {
            case 'ArrowUp': changeDirection('up'); return true
            case 'ArrowDown': changeDirection('down'); return true
            case 'ArrowLeft': changeDirection('left'); return true
            case 'ArrowRight': changeDirection('right'); return true
            case 'q': case 'Q': return false
            default: return true
        }
    }, [changeDirection, initGame])

    const start = useCallback(() => { initGame() }, [initGame])
    const stop = useCallback(() => { clearLoop(); setDisplay('') }, [clearLoop])

    return { display, handleKeyDown, changeDirection, start, stop }
}
