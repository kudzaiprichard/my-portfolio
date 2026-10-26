// hooks/useTerminalInput.ts
"use client"

/**
 * React view onto a section's terminal session (src/terminal/session.ts).
 * The session owns all state and logic; this hook subscribes to its
 * snapshots and registers the section as active for keyboard input.
 */

import { useEffect, useSyncExternalStore } from 'react'
import { getTerminalSession, setTerminalActive } from '@/src/terminal/store'
import type { TerminalSectionId } from '@/src/terminal/types'

interface UseTerminalInputOptions {
    sectionId: TerminalSectionId
    /** Accepts keyboard input (intro finished and section in view). */
    isActive: boolean
    /** Called with each agent reply as it starts (used to speak it aloud). */
    onAgentReply?: (text: string) => void
    /** Called when the visitor interrupts a reply (used to stop speech). */
    onAgentInterrupt?: () => void
}

export function useTerminalInput({ sectionId, isActive, onAgentReply, onAgentInterrupt }: UseTerminalInputOptions) {
    const session = getTerminalSession(sectionId)
    const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot)

    useEffect(() => {
        session.setCallbacks({ onAgentReply, onAgentInterrupt })
    }, [session, onAgentReply, onAgentInterrupt])

    useEffect(() => {
        setTerminalActive(sectionId, isActive)
        return () => setTerminalActive(sectionId, false)
    }, [sectionId, isActive])

    return {
        ...snapshot,
        sectionId,
        submitCommand: session.submitCommand,
        submitVoiceCommand: session.submitVoiceCommand,
        snakeChangeDirection: session.snakeChangeDirection,
        wpmInput: session.wpmInput,
        gameAction: session.gameAction,
        setInputText: session.setInputText,
        attachInput: session.attachInput,
        attachLiveText: session.attachLiveText,
    }
}

export type TerminalView = ReturnType<typeof useTerminalInput>
