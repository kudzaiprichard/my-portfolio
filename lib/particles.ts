// lib/particles.ts
import type { Particle, MouseTrailPoint, ParticleSystemConfig } from '@/types'

/* ============================================
   PARTICLE SYSTEM CONFIGURATION
   ============================================ */

export const defaultParticleConfig: ParticleSystemConfig = {
    numberOfParticles: 65,
    maxTrailLength: 8,
    connectionDistance: 150,
    hubConnectionDistance: 180,
    mouseConnectionDistance: 200,
}

/* ============================================
   PARTICLE CREATION
   ============================================ */

export function createParticle(x: number, y: number): Particle {
    const isHub = Math.random() < 0.15 // 15% chance to be a hub particle

    return {
        x,
        y,
        baseSize: isHub ? Math.random() * 3 + 2 : Math.random() * 2 + 0.5,
        currentSize: 0,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: isHub ? Math.random() * 0.4 + 0.2 : Math.random() * 0.3 + 0.1,
        isHub,
        pulsePhase: Math.random() * Math.PI * 2,
    }
}

export function initializeParticles(
    canvasWidth: number,
    canvasHeight: number,
    config: ParticleSystemConfig = defaultParticleConfig
): Particle[] {
    const particles: Particle[] = []

    for (let i = 0; i < config.numberOfParticles; i++) {
        const x = Math.random() * canvasWidth
        const y = Math.random() * canvasHeight
        const particle = createParticle(x, y)
        particle.currentSize = particle.baseSize
        particles.push(particle)
    }

    return particles
}

/* ============================================
   PARTICLE UPDATE
   ============================================ */

export function updateParticle(
    particle: Particle,
    canvasWidth: number,
    canvasHeight: number,
    mouseX: number | null,
    mouseY: number | null
): void {
    // Update position
    particle.x += particle.speedX
    particle.y += particle.speedY

    // Bounce off edges
    if (particle.x < 0 || particle.x > canvasWidth) {
        particle.speedX = -particle.speedX
    }
    if (particle.y < 0 || particle.y > canvasHeight) {
        particle.speedY = -particle.speedY
    }

    // Mouse interaction - grow particles near cursor
    if (mouseX !== null && mouseY !== null) {
        const dx = particle.x - mouseX
        const dy = particle.y - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 150) {
            const influence = 1 - dist / 150
            particle.currentSize = particle.baseSize + influence * particle.baseSize * 0.8
        } else {
            particle.currentSize = particle.baseSize
        }
    } else {
        particle.currentSize = particle.baseSize
    }

    // Hub particles pulse
    if (particle.isHub) {
        particle.pulsePhase += 0.02
        const pulseFactor = Math.sin(particle.pulsePhase) * 0.1 + 1
        particle.currentSize = particle.baseSize * pulseFactor
    }
}

/* ============================================
   PARTICLE DRAWING
   ============================================ */

export function drawParticle(
    ctx: CanvasRenderingContext2D,
    particle: Particle
): void {
    const glowIntensity = particle.isHub ? 0.5 : 0.3

    ctx.fillStyle = `rgba(0, 255, 65, ${particle.opacity})`
    ctx.shadowBlur = particle.isHub ? 8 : 5
    ctx.shadowColor = `rgba(0, 255, 65, ${glowIntensity})`
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
}

/* ============================================
   PARTICLE CONNECTIONS
   ============================================ */

export function connectParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    config: ParticleSystemConfig = defaultParticleConfig
): void {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x
            const dy = particles[a].y - particles[b].y
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Hub particles have longer connection distance
            const maxDist =
                particles[a].isHub || particles[b].isHub
                    ? config.hubConnectionDistance
                    : config.connectionDistance

            if (dist < maxDist) {
                const opacityValue = 0.08 * (1 - dist / maxDist)
                const lineWidth =
                    particles[a].isHub || particles[b].isHub ? 0.8 : 0.5

                ctx.strokeStyle = `rgba(0, 255, 65, ${opacityValue})`
                ctx.lineWidth = lineWidth
                ctx.beginPath()
                ctx.moveTo(particles[a].x, particles[a].y)
                ctx.lineTo(particles[b].x, particles[b].y)
                ctx.stroke()
            }
        }
    }
}

/* ============================================
   MOUSE TRAIL
   ============================================ */

export function updateMouseTrail(
    trail: MouseTrailPoint[],
    mouseX: number,
    mouseY: number,
    maxLength: number = defaultParticleConfig.maxTrailLength
): MouseTrailPoint[] {
    const newTrail = [...trail, { x: mouseX, y: mouseY }]

    if (newTrail.length > maxLength) {
        newTrail.shift()
    }

    return newTrail
}

export function drawMouseTrail(
    ctx: CanvasRenderingContext2D,
    trail: MouseTrailPoint[]
): void {
    if (trail.length < 2) return

    for (let i = 0; i < trail.length - 1; i++) {
        const opacity = (i / trail.length) * 0.3
        const size = (i / trail.length) * 4

        ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`
        ctx.shadowBlur = 10
        ctx.shadowColor = `rgba(0, 255, 65, ${opacity})`
        ctx.beginPath()
        ctx.arc(trail[i].x, trail[i].y, size, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.shadowBlur = 0
}

/* ============================================
   MOUSE CONNECTIONS
   ============================================ */

export function connectToMouse(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    mouseX: number,
    mouseY: number,
    config: ParticleSystemConfig = defaultParticleConfig
): void {
    // Draw connections to particles
    for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - mouseX
        const dy = particles[i].y - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < config.mouseConnectionDistance) {
            const opacityValue = 0.4 * (1 - dist / config.mouseConnectionDistance)
            const lineWidth = particles[i].isHub ? 2 : 1.5

            ctx.strokeStyle = `rgba(0, 255, 65, ${opacityValue})`
            ctx.lineWidth = lineWidth
            ctx.shadowBlur = 15
            ctx.shadowColor = 'rgba(0, 255, 65, 0.6)'
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(mouseX, mouseY)
            ctx.stroke()
            ctx.shadowBlur = 0
        }
    }

    // Draw cursor glow
    ctx.fillStyle = 'rgba(0, 255, 65, 0.3)'
    ctx.shadowBlur = 25
    ctx.shadowColor = 'rgba(0, 255, 65, 1)'
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
}

/* ============================================
   MAIN ANIMATION LOOP
   ============================================ */

export function animateParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    canvasWidth: number,
    canvasHeight: number,
    mouseX: number | null,
    mouseY: number | null,
    mouseTrail: MouseTrailPoint[],
    config: ParticleSystemConfig = defaultParticleConfig
): void {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw mouse trail
    if (mouseTrail.length > 0) {
        drawMouseTrail(ctx, mouseTrail)
    }

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
        updateParticle(particles[i], canvasWidth, canvasHeight, mouseX, mouseY)
        drawParticle(ctx, particles[i])
    }

    // Draw connections between particles
    connectParticles(ctx, particles, config)

    // Draw connections to mouse
    if (mouseX !== null && mouseY !== null) {
        connectToMouse(ctx, particles, mouseX, mouseY, config)
    }
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

export function getCanvasContext(
    canvas: HTMLCanvasElement | null
): CanvasRenderingContext2D | null {
    if (!canvas) return null
    return canvas.getContext('2d')
}

export function resizeCanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
): void {
    canvas.width = width
    canvas.height = height
}

export function calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const dx = x1 - x2
    const dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy)
}