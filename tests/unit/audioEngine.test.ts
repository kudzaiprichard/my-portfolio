import { describe, expect, it } from 'vitest'
import { audioEngine, KEY_CLIPS } from '@/src/lib/audioEngine'

// Runs in Node: no window, no AudioContext. Everything must stay silent and
// never throw until a browser gesture unlocks the engine.
describe('audioEngine before unlock', () => {
    it('is not ready', () => {
        expect(audioEngine.ready).toBe(false)
    })

    it('ignores every sound request', () => {
        expect(() => {
            audioEngine.install()
            audioEngine.unlock()
            audioEngine.playClip(KEY_CLIPS[0], { gain: 0.4, detune: 30, pan: -0.25 })
            for (const s of ['success', 'error', 'boot', 'achievement'] as const) audioEngine.play(s)
            audioEngine.startThinking()
            audioEngine.stopThinking()
            audioEngine.setMuted(true)
            audioEngine.setMuted(false)
        }).not.toThrow()
    })

    it('reports no mic level without a meter', () => {
        expect(audioEngine.getMicLevel()).toBeNull()
    })

    it('decodes the four keystroke clips', () => {
        expect(KEY_CLIPS).toHaveLength(4)
    })
})
