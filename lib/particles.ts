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
    isFastParticle: boolean
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

interface ClusterZone {
    x: number
    y: number
    radius: number
    particleCount: number
}

/* ============================================
   PARTICLE SYSTEM CONFIGURATION
   ============================================ */

export const defaultParticleConfig: ParticleSystemConfig = {
    numberOfParticles: 200, // Increased from 140 to 200
    maxTrailLength: 8,
    connectionDistance: 180,
    hubConnectionDistance: 210,
    mouseConnectionDistance: 240,
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
   CLUSTER ZONES - High-density areas
   ============================================ */

function createClusterZones(canvasWidth: number, canvasHeight: number): ClusterZone[] {
    return [
        // Center cluster (around terminal area) - fewer particles, more spread out
        {
            x: canvasWidth * 0.5,
            y: canvasHeight * 0.4,
            radius: 250,
            particleCount: 18,
        },
        // Top-right cluster
        {
            x: canvasWidth * 0.8,
            y: canvasHeight * 0.2,
            radius: 150,
            particleCount: 15,
        },
        // Bottom-left cluster
        {
            x: canvasWidth * 0.2,
            y: canvasHeight * 0.8,
            radius: 150,
            particleCount: 15,
        },
        // Bottom-right cluster
        {
            x: canvasWidth * 0.85,
            y: canvasHeight * 0.85,
            radius: 140,
            particleCount: 14,
        },
        // Top-left corner cluster
        {
            x: canvasWidth * 0.15,
            y: canvasHeight * 0.15,
            radius: 120,
            particleCount: 12,
        },
    ]
}

/* ============================================
   PARTICLE CREATION WITH ZONES & DEPTH
   ============================================ */

export function createParticle(x: number, y: number, zone?: ParticleZone, isFastParticle: boolean = false, isFillerParticle: boolean = false): Particle {
    const isHub = Math.random() < 0.20 // 20% hubs

    // Three distinct depth/speed tiers with more variation
    const depthLayer = Math.random()
    let baseSize: number
    let speed: number
    let opacity: number

    // Filler particles are specifically small to medium
    if (isFillerParticle) {
        // Small to medium particles (0.5 to 2.5)
        baseSize = Math.random() * 2.0 + 0.5
        speed = 0.15
        opacity = Math.random() * 0.15 + 0.1 // 0.1 to 0.25 (subtle)
    } else if (depthLayer < 0.3) {
        // Far particles (30%) - tiny and slow (background layer)
        baseSize = Math.random() * 0.8 + 0.3 // 0.3 to 1.1
        speed = 0.12
        opacity = Math.random() * 0.12 + 0.05 // 0.05 to 0.17
    } else if (depthLayer < 0.7) {
        // Mid particles (40%) - small to medium (middle layer)
        baseSize = Math.random() * 1.2 + 0.8 // 0.8 to 2.0
        speed = 0.20
        opacity = Math.random() * 0.2 + 0.15 // 0.15 to 0.35
    } else {
        // Close particles (30%) - medium size (foreground layer)
        baseSize = Math.random() * 1.5 + 1.5 // 1.5 to 3.0
        speed = 0.35
        opacity = Math.random() * 0.25 + 0.25 // 0.25 to 0.5
    }

    // Hub particles are 1.5x larger with enhanced glow
    if (isHub && !isFillerParticle) {
        baseSize = (Math.random() * 1.5 + 2.5) * 1.5 // 3.75 to 6.0 (1.5x larger)
        opacity = Math.random() * 0.3 + 0.4 // 0.4 to 0.7 (brighter)
    }

    // Fast particles move 3x faster
    if (isFastParticle) {
        speed = speed * 3
        opacity = Math.random() * 0.2 + 0.3 // Slightly dimmer for "shooting star" effect
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
        isHub: isHub && !isFillerParticle, // Filler particles can't be hubs
        isFastParticle,
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

    // Create cluster zones for high-density areas
    const clusterZones = createClusterZones(canvasWidth, canvasHeight)

    // Calculate particles for clusters
    let clusterParticleCount = 0
    clusterZones.forEach(cluster => {
        clusterParticleCount += cluster.particleCount
    })

    // Add cluster particles
    clusterZones.forEach((cluster) => {
        for (let i = 0; i < cluster.particleCount; i++) {
            // Random position within cluster radius
            const angle = Math.random() * Math.PI * 2
            const distance = Math.random() * cluster.radius
            const x = cluster.x + Math.cos(angle) * distance
            const y = cluster.y + Math.sin(angle) * distance

            // Clamp to canvas bounds
            const clampedX = Math.max(20, Math.min(canvasWidth - 20, x))
            const clampedY = Math.max(20, Math.min(canvasHeight - 20, y))

            const particle = createParticle(clampedX, clampedY) // No zone = free-roaming
            particles.push(particle)
        }
    })

    // Calculate remaining particles to distribute
    const remainingParticles = numParticles - clusterParticleCount

    // 60 additional filler particles distributed evenly across the entire canvas
    const fillerParticleCount = 60
    const zones = createZones(canvasWidth, canvasHeight)
    const fillersPerZone = Math.ceil(fillerParticleCount / zones.length) // ~7 per zone

    // Add filler particles to each zone for balanced coverage
    zones.forEach((zone) => {
        for (let i = 0; i < fillersPerZone; i++) {
            const padding = 20
            const x = zone.minX + padding + Math.random() * (zone.maxX - zone.minX - padding * 2)
            const y = zone.minY + padding + Math.random() * (zone.maxY - zone.minY - padding * 2)

            const particle = createParticle(x, y, zone, false, true) // Mark as filler particle
            particles.push(particle)
        }
    })

    // Remaining particles distributed as before (zoned and free-roaming)
    const normalRemainingCount = remainingParticles - fillerParticleCount
    const zonedParticleCount = Math.floor(normalRemainingCount * 0.8)
    const particlesPerZone = Math.ceil(zonedParticleCount / zones.length)

    // Distribute zoned particles across all zones
    zones.forEach((zone) => {
        for (let i = 0; i < particlesPerZone && particles.length < numParticles - Math.floor(normalRemainingCount * 0.2); i++) {
            const padding = 20
            const x = zone.minX + padding + Math.random() * (zone.maxX - zone.minX - padding * 2)
            const y = zone.minY + padding + Math.random() * (zone.maxY - zone.minY - padding * 2)

            const particle = createParticle(x, y, zone)
            particles.push(particle)
        }
    })

    // Add free-roaming particles and fast particles (5% of total are fast)
    const fastParticleCount = Math.floor(numParticles * 0.05)
    let fastParticlesAdded = 0

    while (particles.length < numParticles) {
        const x = Math.random() * canvasWidth
        const y = Math.random() * canvasHeight
        const isFast = fastParticlesAdded < fastParticleCount
        const particle = createParticle(x, y, undefined, isFast)
        particles.push(particle)
        if (isFast) fastParticlesAdded++
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

        // Gentle attraction toward cursor - moves particles at normal speed toward mouse
        if (dist < 300 && dist > 150) {
            const angle = Math.atan2(-dy, -dx)
            // Get the particle's normal base speed for its depth tier
            const normalSpeed = particle.isFastParticle
                ? 0.8
                : (particle.baseSize < 1 ? 0.05 : (particle.baseSize < 2 ? 0.12 : 0.20))

            // Calculate current speed
            const currentSpeed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2)

            // Only adjust direction if particle is already moving at normal speed
            // This makes it turn toward cursor at its normal movement speed
            if (currentSpeed > normalSpeed * 0.5) {
                // Blend current direction with cursor direction (very gentle steering)
                const blendFactor = 0.02 // How quickly it turns toward cursor
                const targetSpeedX = Math.cos(angle) * normalSpeed
                const targetSpeedY = Math.sin(angle) * normalSpeed

                particle.speedX += (targetSpeedX - particle.speedX) * blendFactor
                particle.speedY += (targetSpeedY - particle.speedY) * blendFactor
            }
        }

        // ORIGINAL ATTRACTION CODE (COMMENTED OUT)
        // if (dist < 300 && dist > 150) {
        //     const angle = Math.atan2(-dy, -dx)
        //     const attractionForce = particle.baseSize > 2 ? 0.008 : 0.003
        //     particle.speedX += Math.cos(angle) * attractionForce
        //     particle.speedY += Math.sin(angle) * attractionForce
        // }

        // Different max speeds for different particle types
        const maxSpeed = particle.isFastParticle
            ? 3.0
            : (particle.baseSize > 2 ? 1.8 : (particle.baseSize > 1 ? 1.2 : 0.8))

        const speed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2)
        if (speed > maxSpeed) {
            particle.speedX = (particle.speedX / speed) * maxSpeed
            particle.speedY = (particle.speedY / speed) * maxSpeed
        }
    } else {
        // Reset to base size when mouse is not present
        particle.currentSize = particle.baseSize

        // Maintain constant movement - ensure minimum speed based on particle type
        const minSpeed = particle.isFastParticle
            ? 0.8
            : (particle.baseSize < 1 ? 0.05 : (particle.baseSize < 2 ? 0.12 : 0.20))

        const currentSpeed = Math.sqrt(particle.speedX ** 2 + particle.speedY ** 2)

        // If speed is too low, give it a gentle push
        if (currentSpeed < minSpeed) {
            const angle = Math.atan2(particle.speedY, particle.speedX)
            particle.speedX = Math.cos(angle) * minSpeed
            particle.speedY = Math.sin(angle) * minSpeed
        }
    }

    // Hub particles pulse more noticeably
    if (particle.isHub) {
        particle.pulsePhase += 0.03
        const pulseFactor = Math.sin(particle.pulsePhase) * 0.12 + 1
        particle.currentSize = particle.baseSize * pulseFactor
    }
}

/* ============================================
   PARTICLE DRAWING WITH DEPTH BLUR
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
        // Enhanced glow for hub particles
        blurAmount = particle.isHub ? 15 : 7
        glowIntensity = particle.isHub ? 0.7 : 0.4
    }

    // Fast particles have trail-like glow
    if (particle.isFastParticle) {
        blurAmount = 12
        glowIntensity = 0.5
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
   PARTICLE CONNECTIONS WITH DYNAMIC THICKNESS
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

            // Hub-to-hub connections are special (strong connections)
            const bothHubs = particles[a].isHub && particles[b].isHub

            // Determine connection distance
            const maxDist = bothHubs
                ? config.hubConnectionDistance * 1.2 // Hub-to-hub can connect further
                : (particles[a].isHub || particles[b].isHub
                    ? config.hubConnectionDistance
                    : config.connectionDistance)

            if (dist < maxDist) {
                // Calculate average size for depth-aware connection opacity
                const avgSize = (particles[a].baseSize + particles[b].baseSize) / 2
                let depthOpacity = avgSize < 1 ? 0.08 : (avgSize < 2 ? 0.12 : 0.15)

                // Hub-to-hub connections are brighter and thicker
                if (bothHubs) {
                    depthOpacity *= 1.8 // Much brighter
                }

                const opacityValue = depthOpacity * (1 - dist / maxDist)

                // Dynamic line width based on proximity and particle types
                let lineWidth: number
                if (bothHubs) {
                    lineWidth = 1.5 // Thick hub-to-hub connections
                } else if (particles[a].isHub || particles[b].isHub) {
                    lineWidth = 1.0
                } else {
                    // Vary thickness based on proximity
                    const proximityFactor = 1 - (dist / maxDist)
                    lineWidth = 0.5 + (proximityFactor * 0.3) // 0.5 to 0.8
                }

                ctx.strokeStyle = `rgba(0, 255, 65, ${opacityValue})`
                ctx.lineWidth = lineWidth

                // Add subtle glow to hub connections
                if (bothHubs) {
                    ctx.shadowBlur = 3
                    ctx.shadowColor = `rgba(0, 255, 65, ${opacityValue * 0.5})`
                }

                ctx.beginPath()
                ctx.moveTo(particles[a].x, particles[a].y)
                ctx.lineTo(particles[b].x, particles[b].y)
                ctx.stroke()

                if (bothHubs) {
                    ctx.shadowBlur = 0
                }
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