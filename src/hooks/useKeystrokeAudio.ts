// hooks/useKeystrokeAudio.ts
"use client"

import { useState, useEffect, useRef } from 'react'
import { audioController } from '@/src/lib/audioController'
import { audioEngine } from '@/src/lib/audioEngine'
import { KeyType, KeystrokeAudioConfig } from '@/src/lib/animationTypes'
import { audioConfig as globalAudioConfig } from '@/src/constants/typingConfig'
import { keystrokeSounds } from '@/src/lib/keystrokeVoice'

type UseKeystrokeAudioOptions = Partial<KeystrokeAudioConfig> & {
    sectionId: string
}

interface UseKeystrokeAudioReturn {
    playKeystroke: (keyType?: KeyType, char?: string) => void
    isAudioReady: boolean
    hasAudioControl: boolean
    resetVolumeRamp: () => void
    requestAudioControl: () => void
    releaseAudioControl: () => void
    canPlay: () => boolean
}

export function useKeystrokeAudio(options: UseKeystrokeAudioOptions): UseKeystrokeAudioReturn {
    const {
        sectionId,
        enabled = true,
        volume = globalAudioConfig.baseVolume,
        volumeRampEnabled = globalAudioConfig.volumeRampEnabled,
    } = options

    if (!sectionId) {
        throw new Error('[useKeystrokeAudio] sectionId is required')
    }

    // ============================================
    // State Management
    // ============================================

    const [isAudioReady, setIsAudioReady] = useState(false)
    const [hasAudioControl, setHasAudioControl] = useState(() => audioController.hasControl(sectionId))

    const mountedRef = useRef(false)
    const enabledRef = useRef(enabled)

    // Volume ramping state
    const keystrokeCountRef = useRef(0)
    const volumeRampTimerRef = useRef<NodeJS.Timeout | null>(null)

    // When the previous key went down, for force-follows-speed
    const lastKeyAtRef = useRef(0)

    useEffect(() => { enabledRef.current = enabled }, [enabled])

    // ============================================
    // Audio Control Setup
    // ============================================

    useEffect(() => {
        mountedRef.current = true
        // Mute, unlock and clip decoding live in the shared engine
        audioEngine.install()

        const handleAudioControlChange = () => {
            if (mountedRef.current) {
                setHasAudioControl(audioController.hasControl(sectionId))
            }
        }

        audioController.subscribe(sectionId, handleAudioControlChange)

        const readyTimer = setTimeout(() => {
            if (mountedRef.current) setIsAudioReady(true)
        }, 100)

        return () => {
            mountedRef.current = false
            clearTimeout(readyTimer)
            audioController.unsubscribe(sectionId, handleAudioControlChange)
            if (volumeRampTimerRef.current) clearTimeout(volumeRampTimerRef.current)
        }
    }, [sectionId])

    // ============================================
    // Audio Control Methods
    // ============================================

    const requestAudioControl = () => {
        audioController.setActiveSection(sectionId)
    }

    const releaseAudioControl = () => {
        audioController.clearActiveSection(sectionId)
        // Clean up volume ramp decay timer on release
        if (volumeRampTimerRef.current) {
            clearTimeout(volumeRampTimerRef.current)
            volumeRampTimerRef.current = null
        }
    }

    const resetVolumeRamp = () => {
        keystrokeCountRef.current = 0
        if (volumeRampTimerRef.current) {
            clearTimeout(volumeRampTimerRef.current)
            volumeRampTimerRef.current = null
        }
    }

    // ============================================
    // Volume ramp — a burst starts softer and settles (typingConfig values)
    // ============================================

    const rampedVolume = (): number => {
        if (!volumeRampEnabled) return volume
        keystrokeCountRef.current++
        const rampProgress = Math.min(keystrokeCountRef.current / globalAudioConfig.volumeRampKeystrokes, 1)
        const minFraction = globalAudioConfig.volumeRampMinFraction

        if (volumeRampTimerRef.current) clearTimeout(volumeRampTimerRef.current)
        volumeRampTimerRef.current = setTimeout(() => {
            keystrokeCountRef.current = Math.max(
                Math.floor(keystrokeCountRef.current * globalAudioConfig.volumeDecayFactor),
                0
            )
        }, globalAudioConfig.volumeDecayDelayMs)

        return volume * (minFraction + (1 - minFraction) * rampProgress)
    }

    // ============================================
    // Playback — key-down and key-up, each key with its own voice
    // (lib/keystrokeVoice)
    // ============================================

    const playKeystroke = (keyType: KeyType = 'regular', char?: string) => {
        if (!enabledRef.current || !audioEngine.ready) return
        if (!audioController.hasControl(sectionId)) return

        const now = performance.now()
        const interval = lastKeyAtRef.current ? now - lastKeyAtRef.current : Infinity
        lastKeyAtRef.current = now

        const gain = Math.max(0, Math.min(1, rampedVolume()))
        for (const { clip, ...play } of keystrokeSounds(keyType, char ?? 'e', gain, interval)) {
            audioEngine.playClip(clip, play)
        }
    }

    // ============================================
    // Readiness Checks
    // ============================================

    const canPlay = (): boolean => {
        return (
            isAudioReady &&
            audioEngine.ready &&
            enabledRef.current &&
            hasAudioControl &&
            mountedRef.current
        )
    }

    return {
        playKeystroke,
        isAudioReady,
        hasAudioControl,
        resetVolumeRamp,
        requestAudioControl,
        releaseAudioControl,
        canPlay,
    }
}

/**
 * Hook for creating audio callback for typing animations.
 * Passes the actual typed key through to playKeystroke ('\n' is Enter,
 * '\b' Backspace), so each key gets its own sound and stereo position.
 */
export function useTypingAudioCallback(audio: UseKeystrokeAudioReturn) {
    const onTypingKeystroke = (char: string) => {
        if (!audio.canPlay()) return

        const keyType: KeyType = char === '\n' ? 'enter' : char === '\b' ? 'backspace' : char === ' ' ? 'space' : 'regular'
        audio.playKeystroke(keyType, char)
    }

    return { onTypingKeystroke }
}
