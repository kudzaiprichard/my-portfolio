// lib/keystrokeVoice.ts
// How one keystroke sounds: which recording, at what pitch, tone, level and
// stereo position, and when its key-up follows. Pure (bar Math.random), so
// it is unit-tested; useKeystrokeAudio plays what it returns. Tuned only
// through keySound in constants/typingConfig.ts.

import { keySound } from '@/src/constants/typingConfig'
import { KEY_CLIPS } from '@/src/lib/audioEngine'
import { baseKey, keyX } from '@/src/lib/keyboard'
import type { KeyType } from '@/src/lib/animationTypes'

/** One clip to play for a keystroke. */
export interface ClipPlay {
    clip: string
    part: 'press' | 'release'
    /** After the key goes down (ms) */
    delayMs: number
    gain: number
    detune: number
    pan: number
    lowpass: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const spread = (amount: number) => (Math.random() * 2 - 1) * amount
const fromDb = (db: number) => 10 ** (db / 20)

interface KeyVoice { clip: string; detune: number; lowpass: number }

/** Every key's own voice, chosen once per visit, so a key always sounds like itself. */
const voices = new Map<string, KeyVoice>()

function voiceFor(key: string): KeyVoice {
    let v = voices.get(key)
    if (!v) {
        v = {
            clip: KEY_CLIPS[Math.floor(Math.random() * KEY_CLIPS.length)],
            detune: spread(keySound.fingerprintCents),
            lowpass: rand(keySound.toneMinHz, keySound.toneMaxHz),
        }
        voices.set(key, v)
    }
    return v
}

/**
 * Force follows speed: a key in a fast burst lands lighter, the first key
 * after a pause harder. `intervalMs` is the time since the previous key.
 */
export function velocityGain(intervalMs: number): number {
    const s = keySound
    if (intervalMs <= s.fastMs) return s.fastGain
    if (intervalMs <= s.steadyMs) return s.fastGain + (1 - s.fastGain) * (intervalMs - s.fastMs) / (s.steadyMs - s.fastMs)
    if (intervalMs >= s.pauseMs) return s.pauseGain
    return 1 + (s.pauseGain - 1) * (intervalMs - s.steadyMs) / (s.pauseMs - s.steadyMs)
}

/** Stereo position of a key: where it sits on the keyboard, left to right. */
export function keyPan(key: string): number {
    return (keyX(key) - 0.5) * keySound.panWidth
}

/**
 * The clips for one keystroke: the key going down and, a human-length gap
 * later, coming back up. The space bar adds a short stabiliser rattle.
 * `gain` is the stroke's level before velocity and variation.
 */
export function keystrokeSounds(keyType: KeyType, char: string, gain: number, intervalMs: number): ClipPlay[] {
    const s = keySound
    const key = keyType === 'space' ? ' ' : keyType === 'enter' ? '\n' : keyType === 'backspace' ? '\b' : baseKey(char)
    const pan = keyPan(key)
    const level = gain * velocityGain(intervalMs) * fromDb(spread(s.variationDb))

    let clip: string, detune: number, lowpass: number, weight: number
    let releaseMin: number = s.releaseMinMs
    let releaseMax: number = s.releaseMaxMs
    if (keyType === 'space' || keyType === 'enter') {
        const big = s[keyType]
        clip = KEY_CLIPS[big.clip]
        detune = big.detune + spread(s.variationCents)
        lowpass = big.lowpass
        weight = big.gain
        releaseMin = big.releaseMinMs
        releaseMax = big.releaseMaxMs
    } else {
        const v = voiceFor(key)
        clip = v.clip
        detune = v.detune + spread(s.variationCents)
        lowpass = v.lowpass
        weight = 1
        if (keyType === 'backspace') {
            detune = s.backspace.detune + spread(s.variationCents)
            lowpass = s.backspace.lowpass
            weight = s.backspace.gain
        }
    }

    const press: ClipPlay = { clip, part: 'press', delayMs: 0, gain: level * weight, detune, pan, lowpass }
    const plays = [press]
    if (keyType === 'space') {
        plays.push({ ...press, part: 'release', delayMs: rand(s.space.rattleMinMs, s.space.rattleMaxMs), gain: press.gain * s.space.rattleGain, detune: detune + 200 })
    }
    plays.push({ ...press, part: 'release', delayMs: rand(releaseMin, releaseMax), gain: press.gain * s.releaseGain, detune: detune + spread(s.variationCents) })
    return plays
}
