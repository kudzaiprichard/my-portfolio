// components/shared/reveal/SectionShell.tsx
"use client"

// The per-section mini-shell, mounted by SectionReveal once the intro completes.

import TerminalInput from '@/src/components/shared/TerminalInput'
import { useVoiceContext } from '@/src/components/shared/VoiceProvider'
import { useTerminalInput } from '@/src/hooks/useTerminalInput'
import { useSectionReveal } from '@/src/components/shared/reveal/SectionReveal'
import type { TerminalSectionId } from '@/src/terminal/types'

export default function SectionShell({ sectionId }: { sectionId: Exclude<TerminalSectionId, 'terminal'> }) {
    const { completed, isInView } = useSectionReveal()
    const voice = useVoiceContext()
    const terminal = useTerminalInput({
        sectionId,
        isActive: completed && isInView,
        onAgentReply: voice.speak,
        onAgentInterrupt: voice.cancelSpeak,
    })

    return (
        <TerminalInput
            terminal={terminal}
            showChips={terminal.mode === 'normal'}
            showHint
            hintText="# psst: type games to play snake, a typing race or train a neural network"
        />
    )
}
