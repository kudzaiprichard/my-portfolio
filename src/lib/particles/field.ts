// lib/particles/field.ts
/**
 * Particle field renderer. Same physics as before (physics.ts); the drawing
 * is rebuilt for speed:
 *
 * - Glow comes from pre-rendered sprites stamped with drawImage, not shadowBlur
 *   (one of the slowest Canvas 2D operations).
 * - Neighbours are found through a spatial grid instead of comparing all pairs.
 * - Lines and particle cores are batched into a handful of Path2D fills/strokes
 *   by width and quantized opacity, instead of one style change per line.
 * - The canvas is sized for devicePixelRatio (capped at 2), so it's crisp on
 *   Retina/4K screens.
 *
 * No DOM access: the same class runs on the main thread or inside a worker
 * with an OffscreenCanvas.
 */

import {
    defaultParticleConfig,
    initializeParticles,
    mobileParticleConfig,
    updateParticle,
    type Particle,
    type ParticleSystemConfig,
} from './physics'

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type AnyCanvas = HTMLCanvasElement | OffscreenCanvas

/** Creates a scratch canvas for sprites (OffscreenCanvas when available). */
export type CanvasFactory = (width: number, height: number) => AnyCanvas

export interface FieldSize {
    width: number      // CSS pixels
    height: number     // CSS pixels
    dpr: number        // devicePixelRatio (capped by the field)
    isMobile: boolean
}

// Depth buckets — glow radius (px) and glow strength, as in the original
// shadowBlur values, plus a typical core size used to shape the sprite.
const GLOW_BUCKETS = [
    { blur: 3, glow: 0.2, typicalSize: 0.7 },  // far (baseSize < 1)
    { blur: 5, glow: 0.3, typicalSize: 1.4 },  // mid (1–2)
    { blur: 7, glow: 0.4, typicalSize: 2.25 }, // close, non-hub
    { blur: 12, glow: 0.5, typicalSize: 1.5 }, // fast particles
    { blur: 15, glow: 0.7, typicalSize: 7 },   // hubs
] as const

function glowBucket(p: Particle): number {
    if (p.isFastParticle) return 3
    if (p.baseSize < 1) return 0
    if (p.baseSize < 2) return 1
    if (p.isHub) return 4
    return 2
}

const SPRITE_SIZE = 64
const CORE_ALPHA_LEVELS = 6
const LINE_ALPHA_LEVELS = [0.2, 0.5, 0.8] // centre of each third of the fade

export class ParticleField {
    private ctx: Ctx2D
    private canvas: AnyCanvas
    private makeCanvas: CanvasFactory
    private particles: Particle[] = []
    private config: ParticleSystemConfig = defaultParticleConfig
    private size: FieldSize = { width: 0, height: 0, dpr: 1, isMobile: false }
    private rgb = '0 255 65'
    private sprites: AnyCanvas[] = []
    private pointer: { x: number; y: number } | null = null
    private clickFramesLeft = 0
    private lastFrame = 0

    constructor(canvas: AnyCanvas, makeCanvas: CanvasFactory) {
        const ctx = canvas.getContext('2d') as Ctx2D | null
        if (!ctx) throw new Error('2D canvas not available')
        this.canvas = canvas
        this.ctx = ctx
        this.makeCanvas = makeCanvas
        this.buildSprites()
    }

    /** Resize the backing store and re-seed the particles for the new layout. */
    resize(size: FieldSize): void {
        const dpr = Math.min(Math.max(size.dpr || 1, 1), 2)
        this.size = { ...size, dpr }
        this.config = size.isMobile ? mobileParticleConfig : defaultParticleConfig
        this.canvas.width = Math.round(size.width * dpr)
        this.canvas.height = Math.round(size.height * dpr)
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        this.particles = initializeParticles(size.width, size.height, this.config, size.isMobile)
    }

    /** Space-separated RGB triplet, e.g. "0 255 65" (from the --glow CSS token). */
    setColor(rgb: string): void {
        const clean = rgb.trim()
        if (!clean || clean === this.rgb) return
        this.rgb = clean
        this.buildSprites()
    }

    setPointer(x: number | null, y: number | null): void {
        this.pointer = x === null || y === null ? null : { x, y }
    }

    /** Outward push around the pointer for ~100 ms (mouse click). */
    click(): void {
        this.clickFramesLeft = this.size.isMobile ? 3 : 6
    }

    /**
     * Advance and draw, throttled to 60 fps on desktop and 30 fps on mobile.
     * Returns true when a frame was drawn.
     */
    tick(now: number): boolean {
        const frameDelay = 1000 / (this.size.isMobile ? 30 : 60)
        if (now - this.lastFrame < frameDelay) return false
        this.lastFrame = now
        this.step()
        this.draw()
        return true
    }

    /** Draw the current state once without moving anything (reduced motion). */
    drawStatic(): void {
        this.draw()
    }

    // ============================================
    // Simulation
    // ============================================

    private step(): void {
        const { width, height } = this.size
        const px = this.pointer?.x ?? null
        const py = this.pointer?.y ?? null
        const click = this.clickFramesLeft > 0
        if (click) this.clickFramesLeft--
        for (let i = 0; i < this.particles.length; i++) {
            updateParticle(this.particles[i], width, height, px, py, click)
        }
    }

    // ============================================
    // Rendering
    // ============================================

    private color(alpha: number): string {
        return `rgb(${this.rgb} / ${alpha.toFixed(3)})`
    }

    private buildSprites(): void {
        this.sprites = GLOW_BUCKETS.map(({ blur, glow, typicalSize }) => {
            const sprite = this.makeCanvas(SPRITE_SIZE, SPRITE_SIZE)
            const sctx = sprite.getContext('2d') as Ctx2D
            const c = SPRITE_SIZE / 2
            const inner = typicalSize / (typicalSize + blur)
            const g = sctx.createRadialGradient(c, c, 0, c, c, c)
            // Roughly Gaussian falloff past the core edge, like shadowBlur
            const halo = (t: number) => Math.min(1, inner + (1 - inner) * t)
            g.addColorStop(0, this.color(glow * 0.8))
            g.addColorStop(inner, this.color(glow * 0.7))
            g.addColorStop(halo(0.25), this.color(glow * 0.32))
            g.addColorStop(halo(0.55), this.color(glow * 0.1))
            g.addColorStop(1, this.color(0))
            sctx.fillStyle = g
            sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
            return sprite
        })
    }

    private draw(): void {
        const ctx = this.ctx
        const { width, height } = this.size
        ctx.clearRect(0, 0, width, height)

        this.drawParticles()
        this.drawConnections()
        if (this.pointer) this.drawPointerLinks(this.pointer.x, this.pointer.y)
    }

    private drawParticles(): void {
        const ctx = this.ctx
        const cores: Path2D[] = Array.from({ length: CORE_ALPHA_LEVELS }, () => new Path2D())

        // Glow halos: one sprite stamp per particle
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]
            const b = glowBucket(p)
            const r = p.currentSize + GLOW_BUCKETS[b].blur
            ctx.drawImage(this.sprites[b], p.x - r, p.y - r, r * 2, r * 2)

            const level = Math.min(CORE_ALPHA_LEVELS - 1, Math.floor(p.opacity * CORE_ALPHA_LEVELS / 0.75))
            const path = cores[level]
            path.moveTo(p.x + p.currentSize, p.y)
            path.arc(p.x, p.y, p.currentSize, 0, Math.PI * 2)
        }

        // Solid cores, batched by quantized opacity
        for (let l = 0; l < CORE_ALPHA_LEVELS; l++) {
            ctx.fillStyle = this.color(((l + 0.5) / CORE_ALPHA_LEVELS) * 0.75)
            ctx.fill(cores[l])
        }
    }

    private drawConnections(): void {
        const ctx = this.ctx
        const { connectionDistance, hubConnectionDistance } = this.config
        const hubHubDistance = hubConnectionDistance * 1.2
        const cell = hubHubDistance
        const { width, height } = this.size
        const cols = Math.max(1, Math.ceil(width / cell) + 1)
        const rows = Math.max(1, Math.ceil(height / cell) + 1)

        // Bucket particle indices into grid cells
        const grid: number[][] = new Array(cols * rows)
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]
            const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / cell)))
            const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / cell)))
            const k = cy * cols + cx
            ;(grid[k] ||= []).push(i)
        }

        // [kind][alphaLevel] — kinds: 0 normal, 1 one hub, 2 hub↔hub
        const paths: Path2D[][] = [0, 1, 2].map(() => LINE_ALPHA_LEVELS.map(() => new Path2D()))
        const kindMaxAlpha = [0, 0, 0]
        const neighbours = [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] // half-neighbourhood, no duplicates

        for (let cy = 0; cy < rows; cy++) {
            for (let cx = 0; cx < cols; cx++) {
                const here = grid[cy * cols + cx]
                if (!here) continue
                for (const [ox, oy] of neighbours) {
                    const nx = cx + ox, ny = cy + oy
                    if (nx < 0 || nx >= cols || ny >= rows) continue
                    const there = grid[ny * cols + nx]
                    if (!there) continue
                    const same = ox === 0 && oy === 0
                    for (let ai = 0; ai < here.length; ai++) {
                        const a = this.particles[here[ai]]
                        for (let bi = same ? ai + 1 : 0; bi < there.length; bi++) {
                            const b = this.particles[there[bi]]
                            const bothHubs = a.isHub && b.isHub
                            const kind = bothHubs ? 2 : (a.isHub || b.isHub ? 1 : 0)
                            const maxDist = kind === 2 ? hubHubDistance : (kind === 1 ? hubConnectionDistance : connectionDistance)
                            const dx = a.x - b.x, dy = a.y - b.y
                            const d2 = dx * dx + dy * dy
                            if (d2 >= maxDist * maxDist) continue

                            const t = 1 - Math.sqrt(d2) / maxDist
                            const avgSize = (a.baseSize + b.baseSize) / 2
                            let depthOpacity = avgSize < 1 ? 0.08 : (avgSize < 2 ? 0.12 : 0.15)
                            if (bothHubs) depthOpacity *= 1.8
                            kindMaxAlpha[kind] = Math.max(kindMaxAlpha[kind], depthOpacity)

                            const level = t < 1 / 3 ? 0 : (t < 2 / 3 ? 1 : 2)
                            const path = paths[kind][level]
                            path.moveTo(a.x, a.y)
                            path.lineTo(b.x, b.y)
                        }
                    }
                }
            }
        }

        const widths = [0.65, 1.0, 1.5]
        for (let kind = 0; kind < 3; kind++) {
            if (!kindMaxAlpha[kind]) continue
            ctx.lineWidth = widths[kind]
            for (let l = 0; l < LINE_ALPHA_LEVELS.length; l++) {
                ctx.strokeStyle = this.color(kindMaxAlpha[kind] * LINE_ALPHA_LEVELS[l])
                ctx.stroke(paths[kind][l])
            }
        }
    }

    private drawPointerLinks(mx: number, my: number): void {
        const ctx = this.ctx
        const maxDist = this.config.mouseConnectionDistance
        const paths = LINE_ALPHA_LEVELS.map(() => new Path2D())
        let any = false

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]
            const dx = p.x - mx, dy = p.y - my
            const d2 = dx * dx + dy * dy
            if (d2 >= maxDist * maxDist) continue
            const t = 1 - Math.sqrt(d2) / maxDist
            const level = t < 1 / 3 ? 0 : (t < 2 / 3 ? 1 : 2)
            paths[level].moveTo(p.x, p.y)
            paths[level].lineTo(mx, my)
            any = true
        }

        if (any) {
            ctx.lineWidth = 0.6
            for (let l = 0; l < LINE_ALPHA_LEVELS.length; l++) {
                ctx.strokeStyle = this.color(0.25 * LINE_ALPHA_LEVELS[l])
                ctx.stroke(paths[l])
            }
        }

        // Pointer node: hub glow + soft core
        const r = 4 + GLOW_BUCKETS[4].blur
        ctx.drawImage(this.sprites[4], mx - r, my - r, r * 2, r * 2)
        ctx.fillStyle = this.color(0.3)
        ctx.beginPath()
        ctx.arc(mx, my, 4, 0, Math.PI * 2)
        ctx.fill()
    }
}
