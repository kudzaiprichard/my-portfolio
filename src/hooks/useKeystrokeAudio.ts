// hooks/useKeystrokeAudio.ts
"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { audioController } from '@/src/lib/audioController'
import { KeyType, KeystrokeAudioConfig } from '@/src/lib/animationTypes'
import { audioConfig as globalAudioConfig } from '@/src/constants/typingConfig'

type UseKeystrokeAudioOptions = Partial<KeystrokeAudioConfig> & {
    sectionId: string
}

interface UseKeystrokeAudioReturn {
    playKeystroke: (keyType?: KeyType) => void
    toggleMute: () => void
    setMuted: (muted: boolean) => void
    isMuted: boolean
    isLoaded: boolean
    isAudioReady: boolean
    hasAudioControl: boolean
    resetVolumeRamp: () => void
    requestAudioControl: () => void
    releaseAudioControl: () => void
    isReady: () => boolean
    canPlay: () => boolean
}

// ============================================
// Character-to-keyboard-region mapping
// ============================================
const LEFT_HAND_CHARS = new Set('qwertasdfgzxcvb12345`~!@#$%')
const RIGHT_HAND_CHARS = new Set('yuiophjklnm67890-=[]\\;\',./^&*()_+{}|:"<>?')

function getKeyboardRegion(char: string): 'left' | 'right' | 'thumb' {
    const lower = char.toLowerCase()
    if (lower === ' ') return 'thumb'
    if (LEFT_HAND_CHARS.has(lower)) return 'left'
    if (RIGHT_HAND_CHARS.has(lower)) return 'right'
    return Math.random() < 0.5 ? 'left' : 'right'
}

export function useKeystrokeAudio(options: UseKeystrokeAudioOptions): UseKeystrokeAudioReturn {
    const {
        sectionId,
        enabled = true,
        volume = globalAudioConfig.baseVolume,
        volumeRampEnabled = globalAudioConfig.volumeRampEnabled,
        soundFiles = {
            regular: [
                '/sounds/keystroke_1.mp3',
                '/sounds/keystroke_2.mp3',
                '/sounds/keystroke_3.mp3',
                '/sounds/keystroke_4.mp3',
            ],
            space: '/sounds/keystroke_1.mp3',
            enter: '/sounds/keystroke_2.mp3',
        },
    } = options

    if (!sectionId) {
        throw new Error('[useKeystrokeAudio] sectionId is required')
    }

    // ============================================
    // State Management
    // ============================================

    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('keystroke-audio-muted')
            if (saved !== null) return saved === 'true'
        }
        return !enabled
    })

    const [isLoaded, setIsLoaded] = useState(true)
    const [isAudioReady, setIsAudioReady] = useState(false)
    const [hasAudioControl, setHasAudioControl] = useState(false)

    const mountedRef = useRef(false)
    const soundFilesRef = useRef(soundFiles)
    const sectionIdRef = useRef(sectionId)
    const enabledRef = useRef(enabled)

    // Volume ramping state
    const keystrokeCountRef = useRef(0)
    const volumeRampTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Track last sound index per region
    const lastSoundIndexRef = useRef<Record<string, number>>({
        left: -1,
        right: -1,
        thumb: -1,
    })

    useEffect(() => { sectionIdRef.current = sectionId }, [sectionId])
    useEffect(() => { soundFilesRef.current = soundFiles }, [soundFiles])
    useEffect(() => { enabledRef.current = enabled }, [enabled])

    // ============================================
    // Audio Control Setup
    // ============================================

    useEffect(() => {
        mountedRef.current = true

        const handleAudioControlChange = () => {
            if (mountedRef.current) {
                setHasAudioControl(audioController.hasControl(sectionId))
            }
        }

        audioController.subscribe(sectionId, handleAudioControlChange)

        const initialControl = audioController.hasControl(sectionId)
        if (initialControl !== hasAudioControl) {
            setHasAudioControl(initialControl)
        }

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

    const requestAudioControl = useCallback(() => {
        audioController.setActiveSection(sectionId)
    }, [sectionId])

    const releaseAudioControl = useCallback(() => {
        audioController.clearActiveSection(sectionId)
    }, [sectionId])

    const resetVolumeRamp = useCallback(() => {
        keystrokeCountRef.current = 0
        if (volumeRampTimerRef.current) {
            clearTimeout(volumeRampTimerRef.current)
            volumeRampTimerRef.current = null
        }
    }, [])

    // ============================================
    // Sound Selection — region-aware
    // ============================================

    const selectSoundFile = useCallback((
        char: string,
        keyType: KeyType
    ): string => {
        const files = soundFilesRef.current

        if (keyType === 'space') {
            return files.space || files.regular[0]
        }
        if (keyType === 'enter') {
            return files.enter || files.regular[1]
        }

        const regular = files.regular
        if (regular.length <= 1) return regular[0]

        const region = getKeyboardRegion(char)
        const lastIdx = lastSoundIndexRef.current[region]
        let idx: number

        if (region === 'left') {
            const half = Math.ceil(regular.length / 2)
            idx = Math.floor(Math.random() * half)
        } else if (region === 'right') {
            const half = Math.floor(regular.length / 2)
            idx = half + Math.floor(Math.random() * (regular.length - half))
        } else {
            idx = Math.floor(Math.random() * regular.length)
        }

        if (idx === lastIdx && regular.length > 1) {
            idx = (idx + 1) % regular.length
        }

        lastSoundIndexRef.current[region] = idx
        return regular[idx]
    }, [])

    // ============================================
    // Volume Calculation — uses typingConfig values
    // ============================================

    const calculateVolume = useCallback((
        char: string,
        keyType: KeyType,
        baseVol: number
    ): number => {
        let vol = baseVol

        // Character-aware velocity
        if (keyType === 'space') {
            vol *= 0.75 + Math.random() * 0.15
        } else if (keyType === 'enter') {
            vol *= 1.1 + Math.random() * 0.15
        } else {
            const upper = char === char.toUpperCase() && char !== char.toLowerCase()
            const punct = /[^a-zA-Z0-9\s]/.test(char)

            if (upper || punct) {
                vol *= 1.05 + Math.random() * 0.1
            } else {
                vol *= 0.92 + Math.random() * 0.16
            }
        }

        // Volume ramping — values from typingConfig
        if (volumeRampEnabled) {
            keystrokeCountRef.current++

            const rampProgress = Math.min(
                keystrokeCountRef.current / globalAudioConfig.volumeRampKeystrokes,
                1
            )
            const minFraction = globalAudioConfig.volumeRampMinFraction
            vol *= minFraction + (1 - minFraction) * rampProgress

            // Gradual decay after inactivity
            if (volumeRampTimerRef.current) {
                clearTimeout(volumeRampTimerRef.current)
            }
            volumeRampTimerRef.current = setTimeout(() => {
                keystrokeCountRef.current = Math.max(
                    Math.floor(keystrokeCountRef.current * globalAudioConfig.volumeDecayFactor),
                    0
                )
            }, globalAudioConfig.volumeDecayDelayMs)
        }

        return Math.max(0, Math.min(1, vol))
    }, [volumeRampEnabled])

    // ============================================
    // Playback
    // ============================================

    const playKeystroke = useCallback((keyType: KeyType = 'regular') => {
        if (isMuted || !enabledRef.current) return
        if (!audioController.hasControl(sectionId)) return

        try {
            const char = keyType === 'space' ? ' ' : keyType === 'enter' ? '\n' : 'e'

            const soundFile = selectSoundFile(char, keyType)
            const audio = new Audio(soundFile)
            audio.volume = calculateVolume(char, keyType, volume)

            audio.play().catch((err) => {
                if (err.name !== 'NotAllowedError') {
                    console.warn('[useKeystrokeAudio] Playback failed:', err)
                }
            })
        } catch (err) {
            console.warn('[useKeystrokeAudio] Error playing sound:', err)
        }
    }, [isMuted, volume, sectionId, selectSoundFile, calculateVolume])

    // ============================================
    // Mute Control
    // ============================================

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev
            if (typeof window !== 'undefined') {
                localStorage.setItem('keystroke-audio-muted', String(next))
            }
            return next
        })
    }, [])

    const setMutedState = useCallback((muted: boolean) => {
        setIsMuted(muted)
        if (typeof window !== 'undefined') {
            localStorage.setItem('keystroke-audio-muted', String(muted))
        }
    }, [])

    // ============================================
    // Readiness Checks
    // ============================================

    const isReady = useCallback((): boolean => {
        return isAudioReady && mountedRef.current
    }, [isAudioReady])

    const canPlay = useCallback((): boolean => {
        return (
            isAudioReady &&
            !isMuted &&
            enabledRef.current &&
            hasAudioControl &&
            mountedRef.current
        )
    }, [isAudioReady, isMuted, hasAudioControl])

    return {
        playKeystroke,
        toggleMute,
        setMuted: setMutedState,
        isMuted,
        isLoaded,
        isAudioReady,
        hasAudioControl,
        resetVolumeRamp,
        requestAudioControl,
        releaseAudioControl,
        isReady,
        canPlay,
    }
}

/**
 * Hook for creating audio callback for typing animations
 */
export function useTypingAudioCallback(audio: UseKeystrokeAudioReturn) {
    const onTypingKeystroke = useCallback((
        char: string,
        index: number,
        isLast: boolean
    ) => {
        if (!audio.canPlay()) return

        const keyType: KeyType = isLast ? 'enter' : char === ' ' ? 'space' : 'regular'
        audio.playKeystroke(keyType)
    }, [audio])

    return {
        onTypingKeystroke,
        canPlay: audio.canPlay,
        isReady: audio.isReady,
    }
}