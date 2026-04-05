// components/shared/AmbientHum.tsx
"use client"

import { useEffect, useRef } from 'react'
import { useBootContext } from '@/src/components/layout/context/BootContext'

const MUTE_KEY = 'keystroke-audio-muted'
const HUM_VOLUME = 0.06
const FADE_DURATION_MS = 3000
const FADE_STEPS = 60

export default function AmbientHum() {
    const { isBooted } = useBootContext()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const targetVolumeRef = useRef(HUM_VOLUME)
    const mountedRef = useRef(false)

    useEffect(() => {
        mountedRef.current = true

        const audio = new Audio('/sounds/ambient_hum.wav')
        audio.loop = true
        audio.volume = 0
        audio.preload = 'auto'
        audioRef.current = audio

        return () => {
            mountedRef.current = false
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
            audio.pause()
            audio.src = ''
            audioRef.current = null
        }
    }, [])

    // Fade volume to target over duration
    const fadeTo = (target: number, duration: number) => {
        const audio = audioRef.current
        if (!audio) return

        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)

        const startVol = audio.volume
        const diff = target - startVol
        if (Math.abs(diff) < 0.001) {
            audio.volume = target
            if (target === 0) audio.pause()
            return
        }

        const stepTime = duration / FADE_STEPS
        let step = 0

        fadeIntervalRef.current = setInterval(() => {
            step++
            const progress = step / FADE_STEPS
            // Ease-in-out
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2

            audio.volume = Math.max(0, Math.min(1, startVol + diff * eased))

            if (step >= FADE_STEPS) {
                if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
                fadeIntervalRef.current = null
                audio.volume = Math.max(0, Math.min(1, target))
                if (target === 0) audio.pause()
            }
        }, stepTime)
    }

    // Start/stop based on boot and mute state
    useEffect(() => {
        if (!isBooted) return
        const audio = audioRef.current
        if (!audio) return

        const isMuted = localStorage.getItem(MUTE_KEY) === 'true'

        if (!isMuted) {
            audio.play().then(() => {
                fadeTo(HUM_VOLUME, FADE_DURATION_MS)
            }).catch(() => {
                // Autoplay blocked — will retry on mute toggle
            })
        }
    }, [isBooted])

    // Listen for mute changes
    useEffect(() => {
        const handleMuteChange = (e: Event) => {
            const detail = (e as CustomEvent).detail
            const audio = audioRef.current
            if (!audio) return

            if (detail.muted) {
                fadeTo(0, 500)
            } else {
                audio.play().then(() => {
                    fadeTo(HUM_VOLUME, 1000)
                }).catch(() => {
                    // Autoplay still blocked
                })
            }
        }

        window.addEventListener('audio-mute-change', handleMuteChange)
        return () => window.removeEventListener('audio-mute-change', handleMuteChange)
    }, [])

    // No visible UI
    return null
}
