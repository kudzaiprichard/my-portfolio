// lib/particles/physics.ts
// Particle model, layout (zones + clusters) and per-frame motion.
// Pure data — no canvas or DOM — so it runs on the main thread or in a worker.

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

export interface ParticleSystemConfig {
    numberOfParticles: number
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
    numberOfParticles: 200,
    connectionDistance: 180,
    hubConnectionDistance: 210,
    mouseConnectionDistance: 240,
}

// Mobile-optimized configuration (Option B: Balanced)
export const mobileParticleConfig: ParticleSystemConfig = {
    numberOfParticles: 70,
    connectionDistance: 120,
    hubConnectionDistance: 150,
    mouseConnectionDistance: 150,
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

function createClusterZones(canvasWidth: number, canvasHeight: number, isMobile: boolean = false): ClusterZone[] {
    // OPTION B: Mobile uses fewer, smaller clusters for balanced distribution
    if (isMobile) {
        return [
            // Center cluster - main focal point
            {
                x: canvasWidth * 0.5,
                y: canvasHeight * 0.4,
                radius: 200,
                particleCount: 10, // Reduced from 12
            },
            // Top-right cluster - secondary
            {
                x: canvasWidth * 0.8,
                y: canvasHeight * 0.2,
                radius: 120,
                particleCount: 5, // Reduced from 8
            },
            // Bottom-left cluster - secondary
            {
                x: canvasWidth * 0.2,
                y: canvasHeight * 0.8,
                radius: 120,
                particleCount: 5, // Reduced from 8
            },
        ]
    }

    // Desktop clusters (unchanged)
    return [
        {
            x: canvasWidth * 0.5,
            y: canvasHeight * 0.4,
            radius: 250,
            particleCount: 18,
        },
        {
            x: canvasWidth * 0.8,
            y: canvasHeight * 0.2,
            radius: 150,
            particleCount: 15,
        },
        {
            x: canvasWidth * 0.2,
            y: canvasHeight * 0.8,
            radius: 150,
            particleCount: 15,
        },
        {
            x: canvasWidth * 0.85,
            y: canvasHeight * 0.85,
            radius: 140,
            particleCount: 14,
        },
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

function createParticle(x: number, y: number, zone?: ParticleZone, isFastParticle: boolean = false, isFillerParticle: boolean = false): Particle {
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
    config: ParticleSystemConfig = defaultParticleConfig,
    isMobile: boolean = false
): Particle[] {
    const particles: Particle[] = []
    const numParticles = config.numberOfParticles

    // Create cluster zones for high-density areas (mobile-aware)
    const clusterZones = createClusterZones(canvasWidth, canvasHeight, isMobile)

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

    // OPTION B: Increased filler particles for better background coverage
    const fillerParticleCount = isMobile ? 30 : 60 // Changed from 20 to 30
    const zones = createZones(canvasWidth, canvasHeight)
    const fillersPerZone = Math.ceil(fillerParticleCount / zones.length) // ~3-4 per zone on mobile

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
