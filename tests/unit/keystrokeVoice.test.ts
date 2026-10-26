import { describe, expect, it } from 'vitest'
import { baseKey, fingerOf, handOf, keyX, needsShift } from '@/src/lib/keyboard'
import { keyPan, keystrokeSounds, velocityGain } from '@/src/lib/keystrokeVoice'
import { KEY_CLIPS } from '@/src/lib/audioEngine'
import { keySound } from '@/src/constants/typingConfig'

describe('keyboard', () => {
    it('knows which finger and hand press a key', () => {
        expect(fingerOf('f')).toBe(3)
        expect(fingerOf('j')).toBe(6)
        expect(fingerOf('e')).toBe(fingerOf('d'))
        expect(handOf('a')).toBe('left')
        expect(handOf('p')).toBe('right')
        expect(handOf(' ')).toBeNull()
    })

    it('maps capitals and shifted symbols to their key, and knows they need Shift', () => {
        expect(baseKey('?')).toBe('/')
        expect(baseKey('K')).toBe('k')
        expect(needsShift('K')).toBe(true)
        expect(needsShift('_')).toBe(true)
        expect(needsShift('a')).toBe(false)
        expect(needsShift('1')).toBe(false)
    })

    it('places keys left to right', () => {
        expect(keyX('q')).toBeLessThan(keyX('t'))
        expect(keyX('t')).toBeLessThan(keyX('p'))
        expect(keyX('a')).toBeLessThan(keyX('l'))
    })
})

describe('keystroke sound', () => {
    it('plays the key going down, then coming up a human gap later', () => {
        const plays = keystrokeSounds('regular', 'a', 0.4, 150)
        expect(plays.map(p => p.part)).toEqual(['press', 'release'])
        expect(plays[0].delayMs).toBe(0)
        expect(plays[1].delayMs).toBeGreaterThanOrEqual(keySound.releaseMinMs)
        expect(plays[1].delayMs).toBeLessThanOrEqual(keySound.releaseMaxMs)
        expect(plays[1].gain).toBeLessThan(plays[0].gain)
    })

    it('gives each key its own voice that stays the same', () => {
        const a1 = keystrokeSounds('regular', 'k', 0.4, 150)[0]
        const a2 = keystrokeSounds('regular', 'K', 0.4, 150)[0]
        expect(a2.clip).toBe(a1.clip)
        expect(a2.lowpass).toBe(a1.lowpass)
        expect(Math.abs(a2.detune - a1.detune)).toBeLessThanOrEqual(2 * keySound.variationCents)
        expect(Math.abs(a1.detune)).toBeLessThanOrEqual(keySound.fingerprintCents + keySound.variationCents)
        // Across the alphabet, keys use more than one recording
        const clips = new Set([...'abcdefghijklmnopqrstuvwxyz'].map(c => keystrokeSounds('regular', c, 0.4, 150)[0].clip))
        expect(clips.size).toBeGreaterThan(1)
    })

    it('gives the space bar a deep sound with a stabiliser rattle, and Enter a firm one', () => {
        const space = keystrokeSounds('space', ' ', 0.4, 150)
        expect(space).toHaveLength(3)
        expect(space[0].clip).toBe(KEY_CLIPS[keySound.space.clip])
        expect(space[0].detune).toBeLessThan(-200)
        expect(space[1].delayMs).toBeLessThan(space[2].delayMs)
        const enter = keystrokeSounds('enter', '\n', 0.4, 150)
        expect(enter[0].clip).toBe(KEY_CLIPS[keySound.enter.clip])
        expect(enter[0].lowpass).toBe(keySound.enter.lowpass)
    })

    it('places keys in stereo by where they sit on the keyboard', () => {
        expect(keyPan('q')).toBeLessThan(0)
        expect(keyPan('p')).toBeGreaterThan(0)
        expect(Math.abs(keyPan(' '))).toBeLessThan(0.1)
        expect(Math.abs(keyPan('q'))).toBeLessThanOrEqual(keySound.panWidth / 2)
    })

    it('lands lighter in a fast burst and harder after a pause', () => {
        expect(velocityGain(30)).toBe(keySound.fastGain)
        expect(velocityGain(keySound.steadyMs)).toBeCloseTo(1, 5)
        expect(velocityGain(5000)).toBe(keySound.pauseGain)
        expect(velocityGain(100)).toBeGreaterThan(velocityGain(60))
        expect(velocityGain(500)).toBeGreaterThan(velocityGain(250))
    })
})
