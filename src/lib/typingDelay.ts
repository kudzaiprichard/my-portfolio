// lib/typingDelay.ts
// Human typing: per-character delays and the keystroke plan (with the odd
// correction). Tuned only through constants/typingConfig.ts; the keyboard
// geometry (fingers, hands, Shift) comes from lib/keyboard.

import { corrections, NEIGHBOUR_KEYS, typingFeel, type TypoKind } from '@/src/constants/typingConfig'
import { baseKey, fingerOf, handOf, needsShift } from '@/src/lib/keyboard'

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))

/**
 * A standard-normal sample from one uniform draw (the logistic approximation
 * of the probit, scaled to unit variance). A draw of 0.5 gives exactly 0.
 */
function normal(): number {
    const u = Math.min(0.999, Math.max(0.001, Math.random()))
    return 0.5513 * Math.log(u / (1 - u))
}

/**
 * Delay (ms) before character `i` of `text` lands: word bursts, fast common
 * pairs, hand and finger travel, Shift, a thumb beat on space, deliberate
 * punctuation, a beat before a flag or path, log-normal jitter, and now and
 * then a rollover.
 */
export function typingDelay(text: string, i: number, speedScale = 1): number {
    const ch = text[i]
    const prev = i > 0 ? text[i - 1] : ''
    const f = typingFeel
    const prevHand = prev ? handOf(prev) : null
    const hand = handOf(ch)

    // Rollover: a fast pair across the two hands lands almost together
    if (prevHand && hand && prevHand !== hand && Math.random() < f.rolloverChance) {
        return rand(f.rolloverMin, f.rolloverMax) * speedScale
    }

    let d: number = f.baseDelay
    const wordStart = i === 0 || prev === ' '
    if (wordStart) d *= f.wordStartMultiplier
    if (prev && prev !== ' ' && ch !== ' ') {
        if (f.bigrams.has((prev + ch).toLowerCase())) d *= f.bigramMultiplier
        else if (baseKey(prev) === baseKey(ch)) d *= f.doubleLetterMultiplier
        else if (fingerOf(prev) >= 0 && fingerOf(prev) === fingerOf(ch)) d *= f.sameFingerMultiplier
        else if (prevHand && hand && prevHand !== hand) d *= f.otherHandMultiplier
    }
    if (ch === ' ') d = d * f.spaceMultiplier + rand(f.spaceExtraMin, f.spaceExtraMax)
    if (f.slowChars.includes(ch)) d *= f.slowCharMultiplier
    if (needsShift(ch)) d *= f.shiftMultiplier
    d *= Math.min(f.jitterMax, Math.max(f.jitterMin, Math.exp(f.jitterSigma * normal())))
    if (wordStart && f.tokenPauseChars.includes(ch)) d += rand(f.tokenPauseMin, f.tokenPauseMax)
    return d * speedScale
}

/** True inside a capitalised word (a name): no typos there. */
function inName(text: string, i: number): boolean {
    const start = text.lastIndexOf(' ', i) + 1
    const end = text.indexOf(' ', i)
    return /[A-Z]/.test(text.slice(start, end < 0 ? undefined : end))
}

const isLowerLetter = (ch: string | undefined) => !!ch && ch >= 'a' && ch <= 'z'

/** One step of a typed line: what is on screen after it, and when it happens. */
export interface Keystroke {
    /** ms after the previous keystroke */
    delay: number
    /** Text on screen after this keystroke */
    visible: string
    /** The key pressed: a character, '\b' for backspace or '\n' for Enter */
    key: string
}

function pickKind(): TypoKind {
    const entries = Object.entries(corrections.kinds) as [TypoKind, number][]
    let r = Math.random() * entries.reduce((t, [, w]) => t + w, 0)
    for (const [kind, w] of entries) {
        if ((r -= w) < 0) return kind
    }
    return 'neighbour'
}

interface PlanOptions {
    speedScale?: number
    /** Allow at most `corrections.maxPerLine` rare typos (never in names or the first keys) */
    allowCorrections?: boolean
    /** End with an Enter keystroke after a beat to read the line (typed commands) */
    pressEnter?: boolean
}

/**
 * Plan every keystroke of `text`. With `allowCorrections`, now and then a
 * typo — a neighbouring key, one noticed a few keys later, two letters
 * swapped, or a letter doubled — then a beat, backspace(s) and the right
 * keys. With `pressEnter`, the line ends with Enter.
 */
export function planKeystrokes(text: string, { speedScale = 1, allowCorrections = false, pressEnter = false }: PlanOptions = {}): Keystroke[] {
    const plan: Keystroke[] = []
    let screen = ''
    const press = (key: string, delay: number) => {
        screen = key === '\b' ? screen.slice(0, -1) : screen + key
        plan.push({ delay, visible: screen, key })
    }
    const notice = () => rand(corrections.noticeMin, corrections.noticeMax)
    /** Delete `n` keys: the first after `firstDelay`, the rest in a quick burst */
    const backspace = (n: number, firstDelay: number) => {
        for (let k = 0; k < n; k++) press('\b', k === 0 ? firstDelay : corrections.backspaceRepeat * speedScale)
    }
    /** Keys left in this word after position i */
    const wordRest = (i: number) => {
        let j = i + 1
        while (j < text.length && text[j] !== ' ') j++
        return j - i - 1
    }

    let made = 0
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        const delay = () => typingDelay(text, i, speedScale)

        const typo = allowCorrections && made < corrections.maxPerLine && i >= corrections.minIndex
            && isLowerLetter(ch) && !inName(text, i) && Math.random() < corrections.probability
        if (!typo) {
            press(ch, delay())
            continue
        }
        made++
        let kind = pickKind()
        if (kind === 'swap' && !(isLowerLetter(text[i + 1]) && text[i + 1] !== ch)) kind = 'neighbour'
        if (kind === 'late' && wordRest(i) < corrections.lateMin) kind = 'neighbour'

        if (kind === 'double') {
            // The letter twice, then one backspace
            press(ch, delay())
            press(ch, typingDelay(ch + ch, 1, speedScale))
            backspace(1, notice())
        } else if (kind === 'swap') {
            // "teh": the next letter first, then this one; delete both, retype
            const next = text[i + 1]
            press(next, delay())
            press(ch, typingDelay(text, i + 1, speedScale))
            backspace(2, notice())
            press(ch, corrections.afterBackspace * speedScale)
            press(next, typingDelay(text, i + 1, speedScale))
            i += 1
        } else if (kind === 'late') {
            // A neighbour key, noticed only after a few more keys
            const n = Math.min(wordRest(i), randInt(corrections.lateMin, corrections.lateMax))
            press(NEIGHBOUR_KEYS[ch], delay())
            for (let k = 1; k <= n; k++) press(text[i + k], typingDelay(text, i + k, speedScale))
            backspace(n + 1, typingDelay(text, i + n, speedScale) + notice())
            press(ch, corrections.afterBackspace * speedScale)
            for (let k = 1; k <= n; k++) press(text[i + k], typingDelay(text, i + k, speedScale))
            i += n
        } else {
            // The key next to the right one
            press(NEIGHBOUR_KEYS[ch], delay())
            backspace(1, delay() + notice())
            press(ch, corrections.afterBackspace * speedScale)
        }
    }
    if (pressEnter) {
        plan.push({ delay: rand(typingFeel.enterPauseMin, typingFeel.enterPauseMax) * speedScale, visible: text, key: '\n' })
    }
    return plan
}

/** Total time a plan takes (ms). */
export function planDuration(plan: Keystroke[]): number {
    return plan.reduce((t, k) => t + k.delay, 0)
}
