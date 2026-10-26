// lib/glitchDirector.ts
/**
 * One director for every <GlitchText> on the page. Every 0.9–2 s it picks a
 * random glitch text that is on screen (and already revealed by its
 * section's intro) and plays one effect on it:
 *
 *   flicker   a few characters swap to random glyphs for a few frames
 *   scramble  the whole text (or a stretch of it) decodes left to right
 *   rgb       the 160 ms red/cyan split (`rgb` keyframes) plus a flicker
 *
 * Effects only write into each character's overlay span (`.gch-x`), which
 * React renders empty and never touches — the real text is never changed.
 * Off under reduced motion and in plain mode; paused while the tab is hidden.
 * Timing and weights: constants/glitchConfig.ts.
 */

import { glitchConfig as cfg } from '@/src/constants/glitchConfig'
import { after, onFrame } from '@/src/lib/fxScheduler'

const registered = new Set<HTMLElement>()
const visible = new Set<HTMLElement>()
const busy = new Set<HTMLElement>()
let observer: IntersectionObserver | null = null
let stopLoop: (() => void) | null = null
let last: HTMLElement | null = null

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const glyph = () => cfg.glyphs[Math.floor(Math.random() * cfg.glyphs.length)]

function allowed(): boolean {
    if (typeof window === 'undefined') return false
    if (document.visibilityState !== 'visible') return false
    if (document.documentElement.dataset.mode === 'plain') return false
    return !matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Glitchable: on screen, and not inside an intro item still waiting to be revealed. */
function eligible(el: HTMLElement): boolean {
    if (busy.has(el) || !visible.has(el)) return false
    const pending = el.closest('[data-reveal]')
    return !pending || pending.classList.contains('is-revealed')
}

function chars(el: HTMLElement): HTMLElement[] {
    return Array.from(el.querySelectorAll<HTMLElement>('.gch'))
}

function setGlyph(ch: HTMLElement, g: string | null) {
    const x = ch.lastElementChild as HTMLElement | null
    if (!x) return
    if (g === null) {
        ch.classList.remove('on')
        x.textContent = ''
    } else {
        ch.classList.add('on')
        x.textContent = g
    }
}

function flicker(el: HTMLElement, done: () => void) {
    const all = chars(el)
    if (!all.length) return done()
    let bursts = randInt(cfg.flickerBursts[0], cfg.flickerBursts[1])
    const burst = () => {
        const picks = new Set<HTMLElement>()
        const n = Math.min(all.length, randInt(cfg.flickerChars[0], cfg.flickerChars[1]))
        while (picks.size < n) picks.add(all[Math.floor(Math.random() * all.length)])
        picks.forEach(ch => setGlyph(ch, glyph()))
        after(rand(cfg.flickerFrameMs[0], cfg.flickerFrameMs[1]), () => {
            picks.forEach(ch => setGlyph(ch, null))
            if (--bursts > 0) after(rand(40, 120), burst)
            else done()
        })
    }
    burst()
}

function scramble(el: HTMLElement, done: () => void) {
    const all = chars(el)
    if (!all.length) return done()
    const start = all.length > cfg.scrambleMaxChars ? randInt(0, all.length - cfg.scrambleMaxChars) : 0
    const run = all.slice(start, start + cfg.scrambleMaxChars)
    let elapsed = 0
    let sinceFrame: number = cfg.scrambleFrameMs
    const total = run.length * cfg.scrambleCharMs + 120
    const stop = onFrame((_, delta) => {
        elapsed += delta
        sinceFrame += delta
        const settled = Math.floor((elapsed - 120) / cfg.scrambleCharMs)
        if (sinceFrame >= cfg.scrambleFrameMs) {
            sinceFrame = 0
            run.forEach((ch, i) => setGlyph(ch, i < settled ? null : glyph()))
        }
        if (elapsed >= total) {
            stop()
            run.forEach(ch => setGlyph(ch, null))
            done()
        }
    })
}

function rgb(el: HTMLElement, done: () => void) {
    el.classList.add('rgb')
    after(160, () => el.classList.remove('rgb'))
    flicker(el, done)
}

function play(el: HTMLElement) {
    busy.add(el)
    const finish = () => busy.delete(el)
    const w = cfg.weights
    const r = Math.random() * (w.flicker + w.scramble + w.rgb)
    if (r < w.flicker) flicker(el, finish)
    else if (r < w.flicker + w.scramble) scramble(el, finish)
    else rgb(el, finish)
}

function tick() {
    stopLoop = after(rand(cfg.minGapMs, cfg.maxGapMs), () => {
        if (allowed()) {
            let pool = [...registered].filter(eligible)
            if (pool.length > 1) pool = pool.filter(el => el !== last)
            const el = pool[Math.floor(Math.random() * pool.length)]
            if (el) {
                last = el
                play(el)
            }
        }
        tick()
    })
}

/** Register a glitch text; returns its cleanup. */
export function registerGlitch(el: HTMLElement): () => void {
    // "On screen" means at least half of it is visible
    observer ??= new IntersectionObserver(entries => {
        for (const e of entries) {
            if (e.isIntersecting) visible.add(e.target as HTMLElement)
            else visible.delete(e.target as HTMLElement)
        }
    }, { threshold: 0.5 })
    registered.add(el)
    observer.observe(el)
    if (!stopLoop) tick()
    return () => {
        registered.delete(el)
        visible.delete(el)
        busy.delete(el)
        observer?.unobserve(el)
        chars(el).forEach(ch => setGlyph(ch, null))
        if (registered.size === 0) {
            stopLoop?.()
            stopLoop = null
        }
    }
}
