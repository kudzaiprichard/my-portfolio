// hooks/useKeystrokeAudio.ts
"use client"

/**
 * Hook for managing keystroke audio with global audio control
 * Updated to work seamlessly with new animation system
 *
 * Key improvements:
 * - Better readiness checks (isReady, canPlay)
 * - Simplified audio control logic
 * - Better error handling
 * - Integration with KeystrokeAudioConfig type
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { audioController } from '@/lib/audioController'
import { KeyType, KeystrokeAudioConfig } from '@/lib/animationTypes'

type UseKeystrokeAudioOptions = Partial<KeystrokeAudioConfig> & {
    sectionId: string
}

interface UseKeystrokeAudioReturn {
    // Playback
    playKeystroke: (keyType?: KeyType) => void

    // Mute control
    toggleMute: () => void
    setMuted: (muted: boolean) => void
    isMuted: boolean

    // State
    isLoaded: boolean
    isAudioReady: boolean
    hasAudioControl: boolean

    // Volume ramp
    resetVolumeRamp: () => void

    // Audio control
    requestAudioControl: () => void
    releaseAudioControl: () => void

    // New: Readiness checks
    isReady: () => boolean
    canPlay: () => boolean
}

export function useKeystrokeAudio(options: UseKeystrokeAudioOptions): UseKeystrokeAudioReturn {
    const {
        sectionId,
        enabled = true,
        volume = 0.4,
        volumeRampEnabled = true,
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

    // Validate required sectionId
    if (!sectionId) {
        throw new Error('[useKeystrokeAudio] sectionId is required')
    }

    // ============================================
    // State Management
    // ============================================

    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedMuteState = localStorage.getItem('keystroke-audio-muted')
            if (savedMuteState !== null) {
                return savedMuteState === 'true'
            }
        }
        return !enabled
    })

    const [isLoaded, setIsLoaded] = useState(true)
    const [isAudioReady, setIsAudioReady] = useState(false)
    const [hasAudioControl, setHasAudioControl] = useState(false)

    // Refs for stable access
    const mountedRef = useRef(false)
    const soundFilesRef = useRef(soundFiles)
    const sectionIdRef = useRef(sectionId)
    const enabledRef = useRef(enabled)

    // Volume ramping state
    const keystrokeCountRef = useRef(0)
    const volumeRampTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Update refs when props change
    useEffect(() => {
        sectionIdRef.current = sectionId
    }, [sectionId])

    useEffect(() => {
        soundFilesRef.current = soundFiles
    }, [soundFiles])

    useEffect(() => {
        enabledRef.current = enabled
    }, [enabled])

    // ============================================
    // Audio Control Setup
    // ============================================

    useEffect(() => {
        mountedRef.current = true

        // Subscribe to audio control changes
        const handleAudioControlChange = () => {
            if (mountedRef.current) {
                const hasControl = audioController.hasControl(sectionId)
                setHasAudioControl(hasControl)
            }
        }

        audioController.subscribe(sectionId, handleAudioControlChange)

        // Check initial state
        const initialControl = audioController.hasControl(sectionId)
        if (initialControl !== hasAudioControl) {
            setHasAudioControl(initialControl)
        }

        // Mark audio system as ready after short delay
        const readyTimer = setTimeout(() => {
            if (mountedRef.current) {
                setIsAudioReady(true)
            }
        }, 100)

        return () => {
            mountedRef.current = false
            clearTimeout(readyTimer)
            audioController.unsubscribe(sectionId, handleAudioControlChange)
            if (volumeRampTimerRef.current) {
                clearTimeout(volumeRampTimerRef.current)
            }
        }
    }, [sectionId]) // Only depend on sectionId, not hasAudioControl

    // ============================================
    // Audio Control Methods
    // ============================================

    /**
     * Request audio control for this section
     */
    const requestAudioControl = useCallback(() => {
        audioController.setActiveSection(sectionId)
    }, [sectionId])

    /**
     * Release audio control from this section
     */
    const releaseAudioControl = useCallback(() => {
        audioController.clearActiveSection(sectionId)
    }, [sectionId])

    /**
     * Reset volume ramp counter
     */
    const resetVolumeRamp = useCallback(() => {
        keystrokeCountRef.current = 0

        // Clear any pending reset timer
        if (volumeRampTimerRef.current) {
            clearTimeout(volumeRampTimerRef.current)
            volumeRampTimerRef.current = null
        }
    }, [])

    // ============================================
    // Playback Methods
    // ============================================

    /**
     * Play keystroke sound
     */
    const playKeystroke = useCallback((keyType: KeyType = 'regular') => {
        // Check if we can play
        if (isMuted || !enabledRef.current) {
            return
        }

        if (!audioController.hasControl(sectionId)) {
            return
        }

        try {
            let soundFile: string
            let baseVolume = volume

            // Select sound based on key type
            if (keyType === 'space') {
                soundFile = soundFilesRef.current.space || soundFilesRef.current.regular[0]
                baseVolume = volume * 0.8
            } else if (keyType === 'enter') {
                soundFile = soundFilesRef.current.enter || soundFilesRef.current.regular[1]
                baseVolume = volume * 1.2
            } else {
                const regularSounds = soundFilesRef.current.regular
                soundFile = regularSounds[Math.floor(Math.random() * regularSounds.length)]
                baseVolume = volume
            }

            // Create and configure audio
            const audio = new Audio(soundFile)

            // Apply volume ramping if enabled
            if (volumeRampEnabled) {
                keystrokeCountRef.current++

                // Ramp from 50% to 100% over 10 keystrokes
                const rampProgress = Math.min(keystrokeCountRef.current / 10, 1)
                audio.volume = baseVolume * (0.5 + (0.5 * rampProgress))

                // Reset counter after 2 seconds of inactivity
                if (volumeRampTimerRef.current) {
                    clearTimeout(volumeRampTimerRef.current)
                }
                volumeRampTimerRef.current = setTimeout(() => {
                    keystrokeCountRef.current = 0
                }, 2000)
            } else {
                audio.volume = baseVolume
            }

            // Play with error handling
            audio.play().catch((error) => {
                // Silently handle autoplay restrictions
                if (error.name === 'NotAllowedError') {
                    // User hasn't interacted with page yet
                    return
                }
                console.warn('[useKeystrokeAudio] Playback failed:', error)
            })

        } catch (error) {
            console.warn('[useKeystrokeAudio] Error playing sound:', error)
        }
    }, [isMuted, volume, volumeRampEnabled, sectionId])

    // ============================================
    // Mute Control
    // ============================================

    /**
     * Toggle mute state
     */
    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newMutedState = !prev
            if (typeof window !== 'undefined') {
                localStorage.setItem('keystroke-audio-muted', String(newMutedState))
            }
            return newMutedState
        })
    }, [])

    /**
     * Set mute state directly
     */
    const setMutedState = useCallback((muted: boolean) => {
        setIsMuted(muted)
        if (typeof window !== 'undefined') {
            localStorage.setItem('keystroke-audio-muted', String(muted))
        }
    }, [])

    // ============================================
    // NEW: Readiness Checks
    // ============================================

    /**
     * Check if audio system is ready
     * Useful for waiting before starting animations
     */
    const isReady = useCallback((): boolean => {
        return isAudioReady && mountedRef.current
    }, [isAudioReady])

    /**
     * Check if audio can currently play
     * Combines all necessary conditions
     */
    const canPlay = useCallback((): boolean => {
        return (
            isAudioReady &&
            !isMuted &&
            enabledRef.current &&
            hasAudioControl &&
            mountedRef.current
        )
    }, [isAudioReady, isMuted, hasAudioControl])

    // ============================================
    // Return Interface
    // ============================================

    return {
        // Playback
        playKeystroke,

        // Mute control
        toggleMute,
        setMuted: setMutedState,
        isMuted,

        // State
        isLoaded,
        isAudioReady,
        hasAudioControl,

        // Volume ramp
        resetVolumeRamp,

        // Audio control
        requestAudioControl,
        releaseAudioControl,

        // NEW: Readiness checks
        isReady,
        canPlay,
    }
}

/**
 * Hook for creating audio callback for typing animations
 * Simplifies integration with useTypingAnimation
 *
 * @example
 * const audio = useKeystrokeAudio({ sectionId: 'hero' })
 * const typing = useTypingAnimation()
 * const { onTypingKeystroke } = useTypingAudioCallback(audio)
 *
 * const steps = typing.generateSteps('Hello World', {
 *   onKeystroke: onTypingKeystroke
 * })
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