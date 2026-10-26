// lib/rateLimit.ts
//
// SERVER-ONLY. Shared rate limits in Upstash Redis (Vercel Marketplace),
// so the limits hold across serverless instances and cold starts:
//
//   chat     8 requests / IP / minute          (sliding window)
//   daily    200 agent requests / day, global  (fixed window — protects the
//            Gemini free-tier quota; a tool call costs two upstream calls)
//   message  3 messages / IP / hour            (contact form + send_message)
//
// Credentials come from UPSTASH_REDIS_REST_URL / _TOKEN, or the Marketplace's
// KV_REST_API_URL / _TOKEN. Without them (local dev) an in-memory limiter
// with the same numbers is used, per instance.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type LimitName = 'chat' | 'daily' | 'message'

const LIMITS: Record<LimitName, { tokens: number; windowMs: number; window: `${number} ${'m' | 'h' | 'd'}`; sliding: boolean }> = {
    chat: { tokens: 8, windowMs: 60_000, window: '1 m', sliding: true },
    daily: { tokens: 200, windowMs: 86_400_000, window: '1 d', sliding: false },
    message: { tokens: 3, windowMs: 3_600_000, window: '1 h', sliding: true },
}

function redisConfigured(): boolean {
    return !!((process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)
        && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN))
}

let limiters: Record<LimitName, Ratelimit> | null = null

function redisLimiters(): Record<LimitName, Ratelimit> {
    if (limiters) return limiters
    const redis = Redis.fromEnv()
    const make = (name: LimitName) => {
        const l = LIMITS[name]
        return new Ratelimit({
            redis,
            prefix: `portfolio:rl:${name}`,
            limiter: l.sliding ? Ratelimit.slidingWindow(l.tokens, l.window) : Ratelimit.fixedWindow(l.tokens, l.window),
        })
    }
    limiters = { chat: make('chat'), daily: make('daily'), message: make('message') }
    return limiters
}

// ── In-memory fallback (dev, or Redis not provisioned) ──
const memory = new Map<string, number[]>()

function memoryLimit(name: LimitName, id: string): boolean {
    const { tokens, windowMs } = LIMITS[name]
    const key = `${name}:${id}`
    const now = Date.now()
    const hits = (memory.get(key) ?? []).filter(t => t > now - windowMs)
    if (hits.length >= tokens) {
        memory.set(key, hits)
        return false
    }
    hits.push(now)
    memory.set(key, hits)
    return true
}

/** True if this request may proceed. Fails open if Redis is unreachable. */
export async function allow(name: LimitName, id: string): Promise<boolean> {
    if (!redisConfigured()) return memoryLimit(name, id)
    try {
        const { success } = await redisLimiters()[name].limit(id)
        return success
    } catch (err) {
        console.error('[rateLimit] Redis unavailable, using in-memory limit:', err)
        return memoryLimit(name, id)
    }
}

/** The caller's IP, as reported by the platform. */
export function clientIp(req: Request): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || req.headers.get('x-real-ip')
        || 'unknown'
}

/** Test hook: forget the in-memory windows. */
export function resetMemoryLimits(): void {
    memory.clear()
}
