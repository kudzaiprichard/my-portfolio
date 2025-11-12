// lib/particles.ts

/* ============================================
   TYPE DEFINITIONS
   ============================================ */

export interface Particle {
    x: number
    y: number
    baseSize: number
    currentSize: number
    speedX: number
    speedY: number
    opacity: number
    isHub: boolean
    pulsePhase: number
    zone?: ParticleZone
}

export interface MouseTrailPoint {
    x: number
    y: number
}

export interface ParticleSystemConfig {
    numberOfParticles: number
    maxTrailLength: number
    connectionDistance: number
    hubConnectionDistance: number
    mouseConnectionDistance: number
}

interface ParticleZone {
    minX: number
    maxX: number
    minY: number
    maxY: number
}

/* ============================================
   PARTICLE SYSTEM CONFIGURATION
   ============================================ */

export const defaultParticleConfig: ParticleSystemConfig = {
    numberOfParticles: 90,
    maxTrailLength: 8,
    connectionDistance: 150,
    hubConnectionDistance: 180,
    mouseConnectionDistance: 200,
}

/* ============================================
   PARTICLE ZONES - Keep particles in areas
   ============================================ */

function createZones(canvasWidth: number, canvasHeight: number): ParticleZone[] {
    const cols = 3
    const rows = 3
    const zoneWidth = canvasWidth / cols
    const zoneHeight = canvasHeight / rows

    const zones: ParticleZone[] = []

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            zones.push({
                minX: col * zoneWidth,
                maxX: (col + 1) * zoneWidth,
                minY: row * zoneHeight,
                maxY: (row + 1) * zoneHeight,
            })
        }
    }

    return zones
}

/* ============================================
   PARTICLE CREATION WITH ZONES & DEPTH
   ============================================ */

export function createParticle(x: number, y: number, zone?: ParticleZone): Particle {
    const isHub = Math.random() < 0.15

    const depthLayer = Math.random()
    let baseSize: number
    let speed: number
    let opacity: number

    if (depthLayer < 0.3) {
        baseSize = Math.random() * 0.8 + 0.3
        speed = 0.08
        opacity = Math.random() * 0.12 + 0.05
    } else if (depthLayer < 0.7) {
        baseSize = Math.random() * 1.2 + 0.8
        speed = 0.15
        opacity = Math.random() * 0.2 + 0.15
    } else {
        baseSize = Math.random() * 1.5 + 1.5
        speed = 0.25
        opacity = Math.random() * 0.25 + 0.25
    }

    if (isHub) {
        baseSize = Math.random() * 1.5 + 2.5
        opacity = Math.random() * 0.3 + 0.3
    }

    // Give particles initial velocity so they start moving immediately
    const initialSpeedX = (Math.random() - 0.5) * speed
    const initialSpeedY = (Math.random() - 0.5) * speed

    return {
        x,
        y,
        baseSize,
        currentSize: baseSize,
        speedX: initialSpeedX,
        speedY: initialSpeedY,
        opacity,
        isHub,
        pulsePhase: Math.random() * Math.PI * 2,
        zone,
    }
}

export function initializeParticles(
    canvasWidth: number,
    canvasHeight: number,
    config: ParticleSystemConfig = defaultParticleConfig
): Particle[] {
    const particles: Particle[] = []
    const numParticles = config.numberOfParticles

    const zones = createZones(canvasWidth, canvasHeight)

    const zonedParticleCount = Math.floor(numParticles * 0.6)
    const particlesPerZone = Math.ceil(zonedParticleCount / zones.length)

    zones.forEach((zone) => {
        for (let i = 0; i < particlesPerZone; i++) {
            const padding = 20
            const x = zone.minX + padding + Math.random() * (zone.maxX - zone.minX - padding * 2)
            const y = zone.minY + padding + Math.random() * (zone.maxY - zone.minY - padding * 2)

            const particle = createParticle(x, y, zone)
            particles.push(particle)
        }
    })

    const freeRoamingCount = numParticles - particles.length
    for (let i = 0; i < freeRoamingCount; i++) {
        const x = Math.random() * canvasWidth
        const y = Math.random() * canvasHeight
        const particle = createParticle(x, y)
        particles.push(particle)
    }

    return particles
}

/* ============================================
   PARTICLE UPDATE WITH ZONE CONSTRAINTS
   ============================================ */

export function updateParticle(
    particle: Particle,
    canvasWidth: number,
    canvasHeight: number,
    mouseX: number | null,
    mouseY: number | null,
    mouseClickEffect: boolean = false
): void {
    // Update position - particles always move
    particle.x += particle.speedX
    particle.y += particle.speedY

    if (particle.zone) {
        if (particle.x < particle.zone.minX || particle.x > particle.zone.maxX) {
            particle.speedX = -particle.speedX
            particle.x = Math.max(particle.zone.minX, Math.min(particle.zone.maxX, particle.x))
        }
        if (particle.y < particle.zone.minY || particle.y > particle.zone.maxY) {
            particle.speedY = -particle.speedY
            particle.y = Math.max(particle.zone.minY, Math.min(particle.zone.maxY, particle.y))
        }
    } else {
        if (particle.x < 0 || particle.x > canvasWidth) {
            particle.speedX = -particle.speedX
            particle.x = Math.max(0, Math.min(canvasWidth, particle.x))
        }
        if (particle.y < 0 || particle.y > canvasHeight) {
            particle.speedY = -particle.speedY
            particle.y = Math.max(0, Math.min(canvasHeight, particle.y))
        }
    }

    if (mouseX !== null && mouseY !== null) {
        const dx = particle.x - mouseX
        const dy = particle.y - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 150) {
            const influence = 1 - dist / 150
            const growthFactor = particle.baseSize > 2 ? 0.4 : 0.25
            particle.currentSize = particle.baseSize + influence * particle.baseSize * growthFactor
        } else {
            particle.currentSize = particle.baseSize
        }

        if (mouseClickEffect && dist < 250) {
            const angle = Math.atan2(dy, dx)
            const depthFactor = particle.baseSize > 2 ? 2.5 : (particle.baseSize > 1 ? 1.5 : 1)
            const force = (1 - dist / 250) * depthFactor
            particle.speedX += Math.cos(angle) * force
            particle.speedY += Math.sin(angle) * force
        }

        if (dist < 300 && dist > 150) {
            const angle = Math.atan2(-dy, -dx)
            const attractionForce = particle.baseSize > 2 ? 0.008 : 0.003
            particle.speedX += Math.cos(angle) * attractionForce
            particle.speedY += Math.sin(angle) * attractionForce
        }

        const maxSpeed = particle.baseSize > 2 ? 1.8 : (particle.baseSize > 1 ? 1.2 : 0.8)
        const speed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2)
        if (speed > maxSpeed) {
            particle.speedX = (particle.speedX / speed) * maxSpeed
            particle.speedY = (particle.speedY / speed) * maxSpeed
        }
    } else {
        // Reset to base size when mouse is not present
        particle.currentSize = particle.baseSize

        // Maintain constant movement - no slowing down
        // Ensure particles always have minimum speed based on their depth
        const minSpeed = particle.baseSize < 1 ? 0.03 : (particle.baseSize < 2 ? 0.08 : 0.15)
        const currentSpeed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2)

        // If speed is too low, give it a gentle push
        if (currentSpeed < minSpeed) {
            const angle = Math.atan2(particle.speedY, particle.speedX)
            particle.speedX = Math.cos(angle) * minSpeed
            particle.speedY = Math.sin(angle) * minSpeed
        }
    }

    // Hub particles pulse gently
    if (particle.isHub) {
        particle.pulsePhase += 0.02
        const pulseFactor = Math.sin(particle.pulsePhase) * 0.08 + 1
        particle.currentSize = particle.baseSize * pulseFactor
    }
}

/* ============================================
   PARTICLE DRAWING WITH SUBTLE DEPTH BLUR
   ============================================ */

export function drawParticle(
    ctx: CanvasRenderingContext2D,
    particle: Particle
): void {
    let blurAmount: number
    let glowIntensity: number

    if (particle.baseSize < 1) {
        blurAmount = 3
        glowIntensity = 0.2
    } else if (particle.baseSize < 2) {
        blurAmount = 5
        glowIntensity = 0.3
    } else {
        blurAmount = particle.isHub ? 10 : 7
        glowIntensity = particle.isHub ? 0.5 : 0.4
    }

    ctx.fillStyle = `rgba(0, 255, 65, ${particle.opacity})`
    ctx.shadowBlur = blurAmount
    ctx.shadowColor = `rgba(0, 255, 65, ${glowIntensity})`
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
}

/* ============================================
   PARTICLE CONNECTIONS WITH DEPTH AWARENESS
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

            const maxDist =
                particles[a].isHub || particles[b].isHub
                    ? config.hubConnectionDistance
                    : config.connectionDistance

            if (dist < maxDist) {
                const avgSize = (particles[a].baseSize + particles[b].baseSize) / 2
                const depthOpacity = avgSize < 1 ? 0.08 : (avgSize < 2 ? 0.12 : 0.15)

                const opacityValue = depthOpacity * (1 - dist / maxDist)
                const lineWidth =
                    particles[a].isHub || particles[b].isHub ? 1.0 : 0.7

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
    for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - mouseX
        const dy = particles[i].y - mouseY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < config.mouseConnectionDistance) {
            const depthFactor = particles[i].baseSize > 2 ? 0.25 : (particles[i].baseSize > 1 ? 0.2 : 0.15)
            const opacityValue = depthFactor * (1 - dist / config.mouseConnectionDistance)
            const lineWidth = particles[i].isHub ? 0.8 : 0.5

            ctx.strokeStyle = `rgba(0, 255, 65, ${opacityValue})`
            ctx.lineWidth = lineWidth
            ctx.shadowBlur = 8
            ctx.shadowColor = `rgba(0, 255, 65, ${opacityValue * 0.5})`
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(mouseX, mouseY)
            ctx.stroke()
            ctx.shadowBlur = 0
        }
    }

    ctx.fillStyle = 'rgba(0, 255, 65, 0.3)'
    ctx.shadowBlur = 15
    ctx.shadowColor = 'rgba(0, 255, 65, 0.6)'
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2)
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
    mouseClickEffect: boolean,
    config: ParticleSystemConfig = defaultParticleConfig
): void {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    if (mouseX !== null && mouseY !== null) {
        if (mouseTrail.length > 0) {
            drawMouseTrail(ctx, mouseTrail)
        }
    }

    for (let i = 0; i < particles.length; i++) {
        updateParticle(particles[i], canvasWidth, canvasHeight, mouseX, mouseY, mouseClickEffect)
        drawParticle(ctx, particles[i])
    }

    connectParticles(ctx, particles, config)

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