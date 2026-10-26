import { afterEach, describe, expect, it, vi } from 'vitest'
import { planDuration, planKeystrokes, typingDelay, type Keystroke } from '@/src/lib/typingDelay'
import { corrections, NEIGHBOUR_KEYS, typingFeel } from '@/src/constants/typingConfig'

// Math.random() at 0.5: no rollover, jitter exactly ×1.0, every random beat mid-range.
function withNeutralRandom() {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
}

const f = typingFeel
const mid = (a: number, b: number) => (a + b) / 2

describe('typingDelay', () => {
    afterEach(() => vi.restoreAllMocks())

    it('pauses at the start of each word', () => {
        withNeutralRandom()
        expect(typingDelay('cat role', 0)).toBeCloseTo(f.baseDelay * f.wordStartMultiplier, 5)
        expect(typingDelay('cat role', 4)).toBeCloseTo(f.baseDelay * f.wordStartMultiplier, 5)
    })

    it('rolls common letter pairs quickly', () => {
        withNeutralRandom()
        expect(typingDelay('xca', 2)).toBeCloseTo(f.baseDelay * f.bigramMultiplier, 5)
    })

    it('is slow when one finger has to move to another key', () => {
        withNeutralRandom()
        // e and d are both the left middle finger
        expect(typingDelay('xed', 2)).toBeCloseTo(f.baseDelay * f.sameFingerMultiplier, 5)
    })

    it('double-taps a repeated key', () => {
        withNeutralRandom()
        expect(typingDelay('xll', 2)).toBeCloseTo(f.baseDelay * f.doubleLetterMultiplier, 5)
    })

    it('is quicker when the next key is on the other hand', () => {
        withNeutralRandom()
        expect(typingDelay('xak', 2)).toBeCloseTo(f.baseDelay * f.otherHandMultiplier, 5)
    })

    it('waits for Shift on capitals and shifted symbols', () => {
        withNeutralRandom()
        expect(typingDelay('xaK', 2)).toBeCloseTo(f.baseDelay * f.otherHandMultiplier * f.shiftMultiplier, 5)
    })

    it('adds a thumb beat on space', () => {
        withNeutralRandom()
        expect(typingDelay('ab c', 2)).toBeCloseTo(f.baseDelay * f.spaceMultiplier + mid(f.spaceExtraMin, f.spaceExtraMax), 5)
    })

    it('slows on path characters', () => {
        withNeutralRandom()
        // b (left hand) → . (right hand), and . is deliberate
        expect(typingDelay('ab.c', 2)).toBeCloseTo(f.baseDelay * f.otherHandMultiplier * f.slowCharMultiplier, 5)
    })

    it('hesitates before a flag or a path', () => {
        withNeutralRandom()
        const expected = f.baseDelay * f.wordStartMultiplier * f.slowCharMultiplier + mid(f.tokenPauseMin, f.tokenPauseMax)
        expect(typingDelay('ls ./x', 3)).toBeCloseTo(expected, 5)
    })

    it('scales with the section speed', () => {
        withNeutralRandom()
        expect(typingDelay('abc', 1, 0.5)).toBeCloseTo(typingDelay('abc', 1) * 0.5, 5)
    })

    it('sometimes rolls over a pair across the hands', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0)
        expect(typingDelay('xak', 2)).toBeCloseTo(f.rolloverMin, 5)
        // Never on the same hand
        expect(typingDelay('xza', 2)).toBeGreaterThan(f.rolloverMax)
    })

    it('stays within the jitter bounds', () => {
        const d0 = f.baseDelay * f.sameFingerMultiplier
        for (let i = 0; i < 500; i++) {
            const d = typingDelay('xzq', 2)
            expect(d).toBeGreaterThanOrEqual(d0 * f.jitterMin - 1e-9)
            expect(d).toBeLessThanOrEqual(d0 * f.jitterMax + 1e-9)
        }
    })

    it('is right-skewed: mostly quick strokes, now and then a slow one', () => {
        const ds = Array.from({ length: 4000 }, () => typingDelay('xzq', 2)).sort((a, b) => a - b)
        const median = ds[ds.length / 2]
        const mean = ds.reduce((t, d) => t + d, 0) / ds.length
        expect(mean).toBeGreaterThan(median)
    })
})

/** Replays a plan: every step's screen follows from the previous one and its key. */
function replays(plan: Keystroke[]): boolean {
    let screen = ''
    for (const k of plan) {
        if (k.key === '\b') screen = screen.slice(0, -1)
        else if (k.key !== '\n') screen += k.key
        if (k.visible !== screen) return false
    }
    return true
}

describe('planKeystrokes', () => {
    afterEach(() => vi.restoreAllMocks())

    it('types the text exactly, one key per character, without corrections', () => {
        const text = 'cat description.txt'
        const plan = planKeystrokes(text)
        expect(plan).toHaveLength(text.length)
        expect(plan.at(-1)!.visible).toBe(text)
        expect(plan.map(k => k.key).join('')).toBe(text)
    })

    it('ends a command with Enter after a beat to read it', () => {
        const text = 'whoami'
        const plan = planKeystrokes(text, { pressEnter: true })
        expect(plan).toHaveLength(text.length + 1)
        const enter = plan.at(-1)!
        expect(enter.key).toBe('\n')
        expect(enter.visible).toBe(text)
        expect(enter.delay).toBeGreaterThanOrEqual(f.enterPauseMin)
        expect(enter.delay).toBeLessThanOrEqual(f.enterPauseMax)
    })

    it('makes a neighbouring-key correction as wrong key, backspace, right key', () => {
        // Random always low: the first eligible letter gets a typo of the first kind
        vi.spyOn(Math, 'random').mockReturnValue(0)
        const text = 'cat description.txt'
        const plan = planKeystrokes(text, { allowCorrections: true })
        expect(plan).toHaveLength(text.length + 2)
        const i = plan.findIndex(k => k.key === '\b')
        expect(i).toBeGreaterThan(0)
        const typoAt = plan[i - 1].visible.length - 1
        expect(typoAt).toBeGreaterThanOrEqual(corrections.minIndex)
        expect(plan[i - 1].key).toBe(NEIGHBOUR_KEYS[text[typoAt]])
        expect(plan[i].visible).toBe(text.slice(0, typoAt))
        expect(plan[i + 1].visible).toBe(text.slice(0, typoAt + 1))
        // The beat before noticing is at least noticeMin
        expect(plan[i].delay).toBeGreaterThanOrEqual(corrections.noticeMin)
        expect(plan.at(-1)!.visible).toBe(text)
    })

    it('makes every kind of typo, always ends on the right text, and never more than one per line', () => {
        const text = 'cat experience/timeline.log'
        const backspaceRuns = new Set<number>()
        let doubles = 0
        let swaps = 0
        for (let n = 0; n < 4000; n++) {
            const plan = planKeystrokes(text, { allowCorrections: true })
            expect(replays(plan)).toBe(true)
            expect(plan.at(-1)!.visible).toBe(text)
            const bs = plan.filter(k => k.key === '\b').length
            if (!bs) continue
            backspaceRuns.add(bs)
            const first = plan.findIndex(k => k.key === '\b')
            const [a, b] = [plan[first - 2], plan[first - 1]]
            if (bs === 1 && a.key === b.key) doubles++
            // A swap types the next letter first: the screen before the backspaces has two letters reversed
            if (bs === 2) {
                const at = b.visible.length - 2
                if (b.visible.slice(at) === text[at + 1] + text[at]) swaps++
            }
            // One typo per line: all backspaces are one run
            const last = plan.map(k => k.key).lastIndexOf('\b')
            expect(last - first + 1).toBe(bs)
        }
        expect(backspaceRuns.has(1)).toBe(true)
        expect(backspaceRuns.has(2)).toBe(true)
        // A late typo deletes the wrong key plus up to three more
        expect([...backspaceRuns].some(n => n >= 3)).toBe(true)
        expect(Math.max(...backspaceRuns)).toBeLessThanOrEqual(corrections.lateMax + 1)
        expect(doubles).toBeGreaterThan(0)
        expect(swaps).toBeGreaterThan(0)
    })

    it('never corrects the first characters or a name', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0)
        expect(planKeystrokes('abc', { allowCorrections: true }).some(k => k.key === '\b')).toBe(false)
        expect(planKeystrokes('say Matizirofa', { allowCorrections: true }).filter(k => k.key === '\b')).toHaveLength(0)
    })

    it('reports its total duration', () => {
        const plan = planKeystrokes('whoami')
        expect(planDuration(plan)).toBeCloseTo(plan.reduce((t, k) => t + k.delay, 0), 5)
    })
})
