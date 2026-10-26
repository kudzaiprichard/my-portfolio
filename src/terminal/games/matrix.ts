// terminal/games/matrix.ts
// The `matrix` digital-rain mode. Loaded on demand the first time it runs.

import { every } from '@/src/lib/fxScheduler'

const MATRIX_COLS = 50
const MATRIX_ROWS = 14
const MATRIX_CHARS = '0123456789ABCDEFabcdef@#$%&*<>[]{}|/\\'
const FRAME_MS = 75

interface Column { y: number; length: number; speed: number; tick: number }

/** Start the rain. `onFrame` receives each rendered frame; returns a stop function. */
export function startMatrixRain(onFrame: (text: string) => void): () => void {
    const cols: Column[] = Array.from({ length: MATRIX_COLS }, () => ({
        y: -Math.floor(Math.random() * MATRIX_ROWS),
        length: Math.floor(Math.random() * 8) + 4,
        speed: Math.floor(Math.random() * 3) + 1,
        tick: 0,
    }))

    return every(FRAME_MS, () => {
        const grid: string[][] = Array.from({ length: MATRIX_ROWS }, () =>
            Array.from({ length: MATRIX_COLS }, () => ' ')
        )

        for (let c = 0; c < cols.length; c++) {
            const col = cols[c]
            col.tick++
            if (col.tick >= col.speed) {
                col.tick = 0
                col.y++
                if (col.y - col.length > MATRIX_ROWS) {
                    col.y = -Math.floor(Math.random() * MATRIX_ROWS)
                    col.length = Math.floor(Math.random() * 8) + 4
                    col.speed = Math.floor(Math.random() * 3) + 1
                }
            }
            for (let row = 0; row < MATRIX_ROWS; row++) {
                if (row <= col.y && row > col.y - col.length) {
                    grid[row][c] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
                }
            }
        }

        onFrame(grid.map(row => row.join('')).join('\n'))
    })
}
