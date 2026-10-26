import { describe, expect, it } from 'vitest'
import { AGENT_RUNNABLE_COMMANDS, parseReply, SUGGEST_MARKER, toAgentAction } from '@/src/lib/aiAgent'

describe('toAgentAction', () => {
    it('maps navigation to a valid section', () => {
        expect(toAgentAction('navigate_to_section', { section: 'projects' }))
            .toEqual({ type: 'navigate', section: 'projects' })
        expect(toAgentAction('show_section', { section: 'about' }))
            .toEqual({ type: 'showSection', section: 'about' })
    })

    it('rejects unknown sections and link targets', () => {
        expect(toAgentAction('navigate_to_section', { section: 'admin' })).toBeNull()
        expect(toAgentAction('show_section', {})).toBeNull()
        expect(toAgentAction('open_link', { target: 'facebook' })).toBeNull()
    })

    it('maps parameterless tools', () => {
        expect(toAgentAction('download_resume', undefined)).toEqual({ type: 'downloadResume' })
        expect(toAgentAction('start_tour', undefined)).toEqual({ type: 'startTour' })
        expect(toAgentAction('open_link', { target: 'github' })).toEqual({ type: 'openLink', target: 'github' })
    })

    it('only runs whitelisted commands', () => {
        for (const cmd of AGENT_RUNNABLE_COMMANDS) {
            expect(toAgentAction('run_command', { command: cmd })).toEqual({ type: 'runCommand', command: cmd })
        }
        expect(toAgentAction('run_command', { command: 'cat about.txt' }))
            .toEqual({ type: 'runCommand', command: 'cat about.txt' })
        expect(toAgentAction('run_command', { command: 'exit' })).toBeNull()
        expect(toAgentAction('run_command', { command: 'clear' })).toBeNull()
        expect(toAgentAction('run_command', { command: 'rm -rf /' })).toBeNull()
        expect(toAgentAction('run_command', { command: 'whoamix' })).toBeNull()
        expect(toAgentAction('run_command', { command: '   ' })).toBeNull()
        expect(toAgentAction('run_command', { command: 42 })).toBeNull()
    })

    it('produces no client action for server tools and unknown tools', () => {
        expect(toAgentAction('send_message', { name: 'a' })).toBeNull()
        expect(toAgentAction('get_repo_stats', { project: 'aura' })).toBeNull()
        expect(toAgentAction('delete_everything', {})).toBeNull()
    })
})

describe('parseReply', () => {
    it('strips the suggestion line and returns up to three chips', () => {
        const raw = `Hello there.\n${SUGGEST_MARKER} one | two | three | four`
        const { text, suggestions } = parseReply(raw)
        expect(text).toBe('Hello there.')
        expect(suggestions.length).toBeLessThanOrEqual(3)
        expect(suggestions[0]).toBe('one')
    })

    it('returns no suggestions when the marker is absent', () => {
        expect(parseReply('Just text').suggestions).toEqual([])
    })
})
