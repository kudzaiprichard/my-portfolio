// hooks/useVoice.ts
"use client"

/**
 * Voice I/O for the terminal agent, built on the browser-native Web Speech API.
 *
 * Scope: ENGLISH ONLY. Recognition (speech→text) and synthesis (text→speech)
 * are reliable in English on Chrome/Edge; other languages lack voices and good
 * recognition, so we hard-code en-US and feature-detect. If the browser lacks
 * support, `supported` is false and callers hide the affordance entirely.
 *
 * Recognition uses CONTINUOUS mode with a silence-gap finalizer: the mic keeps
 * listening across short pauses and only submits after ~2s of silence (or when
 * the visitor taps stop). This avoids the default behaviour of cutting the
 * speaker off the instant they pause mid-sentence.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/* ── Minimal Web Speech typings (the DOM lib ships partial/none for these) ── */
interface SpeechRecognitionAlt { transcript: string }
interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlt> {
    isFinal: boolean
}
interface SpeechRecognitionEventLike {
    resultIndex: number
    results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
    lang: string
    interimResults: boolean
    maxAlternatives: number
    continuous: boolean
    onresult: ((e: SpeechRecognitionEventLike) => void) | null
    onerror: ((e: { error?: string }) => void) | null
    onend: (() => void) | null
    start(): void
    stop(): void
    abort(): void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
    if (typeof window === 'undefined') return null
    const w = window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor
        webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

// How long the visitor can pause mid-sentence before we finalize.
const SILENCE_MS = 2000

export interface UseVoiceReturn {
    /** Whether the browser supports either speaking or listening. */
    supported: boolean
    /** Whether the mic is currently listening. */
    listening: boolean
    /** Live (interim) transcript while listening — for on-screen feedback. */
    interim: string
    /** Whether speech synthesis is available. */
    canSpeak: boolean
    /** Whether speech recognition is available. */
    canListen: boolean
    /** Speak text aloud. The caller decides when (voice-initiated replies only). */
    speak: (text: string) => void
    /** Stop any in-progress speech immediately. */
    cancelSpeak: () => void
    /** Start listening; the final transcript is delivered via the callback. */
    startListening: (onResult: (transcript: string) => void) => void
    /** Stop listening and submit whatever was captured so far. */
    stopListening: () => void
}

export function useVoice(): UseVoiceReturn {
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
    const finalizeRef = useRef<(() => void) | null>(null)
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
    const [listening, setListening] = useState(false)
    const [interim, setInterim] = useState('')

    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
    const [canListen] = useState(() => getRecognitionCtor() !== null)

    // Pick the smoothest available English voice (prefer neural/"Natural" voices
    // on Edge, then Google voices on Chrome, then any English voice).
    useEffect(() => {
        if (!canSpeak) return
        const pick = () => {
            const voices = window.speechSynthesis.getVoices()
            if (!voices.length) return
            voiceRef.current =
                voices.find(v => /^en/i.test(v.lang) && /natural|neural/i.test(v.name)) ||
                voices.find(v => /^en/i.test(v.lang) && /google/i.test(v.name)) ||
                voices.find(v => /^en-GB/i.test(v.lang)) ||
                voices.find(v => /^en[-_]US/i.test(v.lang)) ||
                voices.find(v => /^en/i.test(v.lang)) ||
                voices[0]
        }
        pick()
        window.speechSynthesis.onvoiceschanged = pick
        return () => { window.speechSynthesis.onvoiceschanged = null }
    }, [canSpeak])

    const cancelSpeak = useCallback(() => {
        if (canSpeak) window.speechSynthesis.cancel()
    }, [canSpeak])

    const speak = useCallback((text: string) => {
        if (!canSpeak || !text.trim()) return
        window.speechSynthesis.cancel()
        // Strip characters that read badly aloud (ascii art, prompts, separators).
        const clean = text
            .replace(/[`*_#>|]/g, ' ')
            .replace(/[─━┌└═╭╮╰╯]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        if (!clean) return
        const utter = new SpeechSynthesisUtterance(clean)
        utter.lang = 'en-US'
        utter.rate = 1.0
        utter.pitch = 1.0
        if (voiceRef.current) utter.voice = voiceRef.current
        window.speechSynthesis.speak(utter)
    }, [canSpeak])

    const stopListening = useCallback(() => {
        finalizeRef.current?.()
    }, [])

    const startListening = useCallback((onResult: (transcript: string) => void) => {
        const Ctor = getRecognitionCtor()
        if (!Ctor) return
        // Tear down any prior session.
        finalizeRef.current?.()
        recognitionRef.current?.abort()

        const rec = new Ctor()
        rec.lang = 'en-US'
        rec.interimResults = true
        rec.maxAlternatives = 1
        rec.continuous = true

        let finalText = ''
        let done = false

        const clearSilence = () => {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
            }
        }

        const finalize = () => {
            if (done) return
            done = true
            clearSilence()
            try { rec.stop() } catch { /* already stopped */ }
            recognitionRef.current = null
            finalizeRef.current = null
            setListening(false)
            setInterim('')
            const out = finalText.trim()
            if (out) onResult(out)
        }

        const armSilence = () => {
            clearSilence()
            // Only auto-finalize once the visitor has actually said something.
            if (finalText.trim()) {
                silenceTimerRef.current = setTimeout(finalize, SILENCE_MS)
            }
        }

        rec.onresult = (e) => {
            let interimText = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const r = e.results[i]
                const t = r[0]?.transcript || ''
                if (r.isFinal) finalText += t + ' '
                else interimText += t
            }
            setInterim((finalText + interimText).trim())
            armSilence()
        }
        rec.onerror = (ev) => {
            // 'no-speech' just means quiet so far — keep waiting. Otherwise stop.
            if (ev?.error === 'no-speech') return
            finalize()
        }
        rec.onend = () => { finalize() }

        recognitionRef.current = rec
        finalizeRef.current = finalize
        setListening(true)
        setInterim('')
        try {
            rec.start()
        } catch {
            setListening(false)
            recognitionRef.current = null
            finalizeRef.current = null
        }
    }, [])

    // Clean up on unmount.
    useEffect(() => {
        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
            recognitionRef.current?.abort()
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    return {
        supported: canSpeak || canListen,
        listening,
        interim,
        canSpeak,
        canListen,
        speak,
        cancelSpeak,
        startListening,
        stopListening,
    }
}
