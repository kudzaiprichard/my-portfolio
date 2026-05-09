// components/shared/VoiceProvider.tsx
"use client"

import { createContext, useContext, type ReactNode } from 'react'
import { useVoice, type UseVoiceReturn } from '@/src/hooks/useVoice'

// A single shared voice instance for the whole page. Every section's terminal
// consumes the SAME instance, so "voice on/off" stays consistent as the visitor
// scrolls between sections (a per-section hook would desync the toggle).
const VoiceContext = createContext<UseVoiceReturn | null>(null)

export function VoiceProvider({ children }: { children: ReactNode }) {
    const voice = useVoice()
    return <VoiceContext.Provider value={voice}>{children}</VoiceContext.Provider>
}

export function useVoiceContext(): UseVoiceReturn {
    const ctx = useContext(VoiceContext)
    if (!ctx) {
        throw new Error('useVoiceContext must be used within a <VoiceProvider>')
    }
    return ctx
}
