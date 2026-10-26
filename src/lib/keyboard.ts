// lib/keyboard.ts
// A US QWERTY keyboard as data: which finger presses each key, which hand,
// whether Shift is needed, and where the key sits left to right. Shared by
// the typing rhythm (lib/typingDelay) and the keystroke sound
// (hooks/useKeystrokeAudio). Geometry only; the feel lives in typingConfig.

const ROWS: { keys: string; offset: number }[] = [
    { keys: '`1234567890-=', offset: 0 },
    { keys: 'qwertyuiop[]\\', offset: 1.5 },
    { keys: 'asdfghjkl;\'', offset: 1.8 },
    { keys: 'zxcvbnm,./', offset: 2.3 },
]
/** Keyboard width in key units (the number row plus Backspace) */
const WIDTH = 15

/** Shifted characters → the key that types them */
const SHIFTED: Record<string, string> = {
    '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
    '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/',
}

/** Touch-typing finger per column of the letter rows: 0–3 left (pinky → index), 6–9 right (index → pinky) */
const COLUMN_FINGER = [0, 1, 2, 3, 3, 6, 6, 7, 8, 9, 9, 9, 9]

interface KeyInfo { finger: number; x: number }

const KEYS = new Map<string, KeyInfo>()
ROWS.forEach(({ keys, offset }, row) => {
    ;[...keys].forEach((k, col) => {
        // The number row starts one column early: ` and 1 are both the left pinky
        const finger = row === 0 ? COLUMN_FINGER[Math.max(0, col - 1)] : COLUMN_FINGER[col]
        KEYS.set(k, { finger, x: (col + offset + 0.5) / WIDTH })
    })
})

/** The physical key behind a character (lowercase letter or unshifted symbol). */
export function baseKey(ch: string): string {
    const lower = ch.toLowerCase()
    return SHIFTED[ch] ?? lower
}

/** Capitals and shifted symbols take a Shift press. */
export function needsShift(ch: string): boolean {
    return ch in SHIFTED || (ch !== ch.toLowerCase())
}

/** Finger 0–9 (thumbs 4/5 for space), or -1 for keys off the map. */
export function fingerOf(ch: string): number {
    if (ch === ' ') return 4
    return KEYS.get(baseKey(ch))?.finger ?? -1
}

/** 'left' | 'right' hand, or null for space and unknown keys. */
export function handOf(ch: string): 'left' | 'right' | null {
    const f = fingerOf(ch)
    if (f < 0 || f === 4 || f === 5) return null
    return f < 5 ? 'left' : 'right'
}

/** Horizontal position 0 (left edge) … 1 (right edge). Space and Enter included. */
export function keyX(ch: string): number {
    if (ch === ' ') return 0.45
    if (ch === '\n') return 0.9
    if (ch === '\b') return 0.95
    return KEYS.get(baseKey(ch))?.x ?? 0.5
}
