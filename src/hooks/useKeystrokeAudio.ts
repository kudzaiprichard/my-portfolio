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
    playKeystroke: (keyType?: KeyType, char?: string) => void
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

/**
 * Pick a random index from an array, avoiding the last used index.
 */
function pickAvoidingRepeat(arr: string[], lastIdx: number): number {
    if (arr.length <= 1) return 0
    let idx = Math.floor(Math.random() * arr.length)
    if (idx === lastIdx) {
        idx = (idx + 1) % arr.length
    }
    return idx
}

// ============================================
// Audio Object Pool
// Pre-creates Audio elements per sound file,
// reuses them via currentTime reset.
// ============================================

const POOL_SIZE_PER_FILE = 3

class AudioPool {
    private pools: Map<string, HTMLAudioElement[]> = new Map()
    private indices: Map<string, number> = new Map()

    preload(soundFiles: string[]): void {
        for (const file of soundFiles) {
            if (this.pools.has(file)) continue
            const elements: HTMLAudioElement[] = []
            for (let i = 0; i < POOL_SIZE_PER_FILE; i++) {
                const audio = new Audio(file)
                audio.preload = 'auto'
                elements.push(audio)
            }
            this.pools.set(file, elements)
            this.indices.set(file, 0)
        }
    }

    get(file: string): HTMLAudioElement | null {
        const pool = this.pools.get(file)
        if (!pool || pool.length === 0) return null

        const idx = this.indices.get(file) ?? 0
        const audio = pool[idx]
        this.indices.set(file, (idx + 1) % pool.length)

        audio.currentTime = 0
        return audio
    }

    dispose(): void {
        for (const [, elements] of this.pools) {
            for (const el of elements) {
                el.pause()
                el.src = ''
            }
        }
        this.pools.clear()
        this.indices.clear()
    }
}

// ============================================
// Autoplay unlock — one-time per page session
// ============================================

let audioUnlocked = false

function ensureAutoplayUnlock(): void {
    if (audioUnlocked) return

    const unlock = () => {
        if (audioUnlocked) return
        audioUnlocked = true

        // Play a silent buffer to unlock the audio context
        const silent = new Audio()
        silent.volume = 0
        silent.play().then(() => {
            silent.pause()
            silent.src = ''
        }).catch(() => {
            // Still mark as unlocked — the user interaction happened
        })

        window.removeEventListener('click', unlock, true)
        window.removeEventListener('keydown', unlock, true)
        window.removeEventListener('touchstart', unlock, true)
    }

    window.addEventListener('click', unlock, true)
    window.addEventListener('keydown', unlock, true)
    window.addEventListener('touchstart', unlock, true)
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
            space: [
                '/sounds/keystroke_1.mp3',
            ],
            enter: [
                '/sounds/keystroke_2.mp3',
            ],
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

    // Audio object pool
    const audioPoolRef = useRef<AudioPool | null>(null)

    // Track last sound index per key type and region
    const lastSoundIndexRef = useRef<Record<string, number>>({
        left: -1,
        right: -1,
        thumb: -1,
        space: -1,
        enter: -1,
    })

    useEffect(() => { sectionIdRef.current = sectionId }, [sectionId])
    useEffect(() => { soundFilesRef.current = soundFiles }, [soundFiles])
    useEffect(() => { enabledRef.current = enabled }, [enabled])

    // Sync mute state with global MuteToggle button
    useEffect(() => {
        const handleMuteChange = (e: Event) => {
            const detail = (e as CustomEvent).detail
            setIsMuted(detail.muted)
        }
        window.addEventListener('audio-mute-change', handleMuteChange)
        return () => window.removeEventListener('audio-mute-change', handleMuteChange)
    }, [])

    // ============================================
    // Audio Control Setup + Pool Init + Autoplay
    // ============================================

    useEffect(() => {
        mountedRef.current = true

        // Initialize autoplay unlock listener
        ensureAutoplayUnlock()

        // Initialize audio object pool
        const pool = new AudioPool()
        const allFiles = [
            ...(soundFiles.regular || []),
            ...(soundFiles.space || []),
            ...(soundFiles.enter || []),
        ]
        pool.preload([...new Set(allFiles)])
        audioPoolRef.current = pool

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
            pool.dispose()
            audioPoolRef.current = null
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
        // Clean up volume ramp decay timer on release
        if (volumeRampTimerRef.current) {
            clearTimeout(volumeRampTimerRef.current)
            volumeRampTimerRef.current = null
        }
    }, [sectionId])

    const resetVolumeRamp = useCallback(() => {
        keystrokeCountRef.current = 0
        if (volumeRampTimerRef.current) {
            clearTimeout(volumeRampTimerRef.current)
            volumeRampTimerRef.current = null
        }
    }, [])

    // ============================================
    // Sound Selection — region-aware with
    // no-repeat for all key types
    // ============================================

    const selectSoundFile = useCallback((
        char: string,
        keyType: KeyType
    ): string => {
        const files = soundFilesRef.current

        if (keyType === 'space') {
            const pool = files.space && files.space.length > 0 ? files.space : [files.regular[0]]
            const idx = pickAvoidingRepeat(pool, lastSoundIndexRef.current.space)
            lastSoundIndexRef.current.space = idx
            return pool[idx]
        }

        if (keyType === 'enter') {
            const pool = files.enter && files.enter.length > 0 ? files.enter : [files.regular[1] || files.regular[0]]
            const idx = pickAvoidingRepeat(pool, lastSoundIndexRef.current.enter)
            lastSoundIndexRef.current.enter = idx
            return pool[idx]
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

        if (volumeRampEnabled) {
            keystrokeCountRef.current++

            const rampProgress = Math.min(
                keystrokeCountRef.current / globalAudioConfig.volumeRampKeystrokes,
                1
            )
            const minFraction = globalAudioConfig.volumeRampMinFraction
            vol *= minFraction + (1 - minFraction) * rampProgress

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
    // Pitch Variation — ±8% random per keystroke
    // ============================================

    const getRandomPitchRate = (): number => {
        return 0.92 + Math.random() * 0.16 // 0.92 to 1.08
    }

    // ============================================
    // Playback
    // ============================================

    const playKeystroke = useCallback((keyType: KeyType = 'regular', char?: string) => {
        if (isMuted || !enabledRef.current) return
        if (!audioController.hasControl(sectionId)) return

        try {
            // Use the actual char when provided, fall back to representative chars
            const resolvedChar = char ?? (keyType === 'space' ? ' ' : keyType === 'enter' ? '\n' : 'e')

            const soundFile = selectSoundFile(resolvedChar, keyType)
            const audio = audioPoolRef.current?.get(soundFile)

            if (!audio) return

            audio.volume = calculateVolume(resolvedChar, keyType, volume)
            audio.playbackRate = getRandomPitchRate()

            audio.play().catch((err) => {
                if (err.name === 'NotAllowedError') {
                    console.warn('[useKeystrokeAudio] Autoplay blocked — waiting for user interaction')
                } else {
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
                window.dispatchEvent(new CustomEvent('audio-mute-change', { detail: { muted: next } }))
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
 * Hook for creating audio callback for typing animations.
 * Passes the actual typed character through to playKeystroke
 * for keyboard-region-aware sound selection.
 */
export function useTypingAudioCallback(audio: UseKeystrokeAudioReturn) {
    const onTypingKeystroke = useCallback((
        char: string,
        index: number,
        isLast: boolean
    ) => {
        if (!audio.canPlay()) return

        const keyType: KeyType = isLast ? 'enter' : char === ' ' ? 'space' : 'regular'
        audio.playKeystroke(keyType, char)
    }, [audio])

    return {
        onTypingKeystroke,
        canPlay: audio.canPlay,
        isReady: audio.isReady,
    }
}
