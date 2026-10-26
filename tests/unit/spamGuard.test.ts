import { beforeEach, describe, expect, it } from 'vitest'
import { checkGuard, MIN_FILL_MS } from '@/src/lib/spamGuard'
import { allow, resetMemoryLimits } from '@/src/lib/rateLimit'

describe('checkGuard', () => {
    const now = 1_000_000

    it('accepts a real visitor', () => {
        expect(checkGuard({ website: '', startedAt: now - MIN_FILL_MS - 1 }, now)).toBe('ok')
    })

    it('catches a filled honeypot', () => {
        expect(checkGuard({ website: 'http://spam.example', startedAt: now - 60_000 }, now)).toBe('bot')
    })

    it('refuses instant submissions', () => {
        expect(checkGuard({ website: '', startedAt: now - 200 }, now)).toBe('too-fast')
    })

    it('refuses requests without the guard', () => {
        expect(checkGuard(undefined, now)).toBe('missing')
        expect(checkGuard({ website: '' }, now)).toBe('missing')
    })
})

describe('allow (in-memory fallback)', () => {
    beforeEach(() => {
        delete process.env.UPSTASH_REDIS_REST_URL
        delete process.env.KV_REST_API_URL
        resetMemoryLimits()
    })

    it('allows 3 messages an hour per IP', async () => {
        const results = []
        for (let i = 0; i < 4; i++) results.push(await allow('message', '9.9.9.9'))
        expect(results).toEqual([true, true, true, false])
        expect(await allow('message', '8.8.8.8')).toBe(true)
    })

    it('allows 8 chat requests a minute per IP', async () => {
        const results = []
        for (let i = 0; i < 9; i++) results.push(await allow('chat', '1.1.1.1'))
        expect(results.filter(Boolean)).toHaveLength(8)
    })
})
