// components/shared/AudioSetup.tsx
"use client"

// Mounts the audio engine for the page: it listens for the first gesture to
// unlock audio and for mute changes. There is no background sound; the
// keystrokes and the interface sounds are the only audio.

import { useEffect } from 'react'
import { audioEngine } from '@/src/lib/audioEngine'

export default function AudioSetup() {
    useEffect(() => { audioEngine.install() }, [])

    // No visible UI
    return null
}
