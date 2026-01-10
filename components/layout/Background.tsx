// components/layout/Background.tsx
"use client"

import { useEffect, useRef, useState } from 'react'
import {
    initializeParticles,
    animateParticles,
    getCanvasContext,
    resizeCanvas,
    defaultParticleConfig,
    mobileParticleConfig,
    type Particle,
} from '@/lib/particles'

export default function Background() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null })
    const animationFrameRef = useRef<number | undefined>(undefined)
    const mouseClickEffectRef = useRef<boolean>(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Detect mobile/tablet devices
        const checkMobile = () => {
            const mobile = window.innerWidth < 768 ||
                ('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0)
            setIsMobile(mobile)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => {
            window.removeEventListener('resize', checkMobile)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = getCanvasContext(canvas)
        if (!ctx) return

        // Initialize canvas size and particles
        const handleResize = () => {
            resizeCanvas(canvas, window.innerWidth, window.innerHeight)

            // Use device-specific configuration
            const config = isMobile ? mobileParticleConfig : defaultParticleConfig

            // Initialize particles with device-specific settings
            particlesRef.current = initializeParticles(
                canvas.width,
                canvas.height,
                config,
                isMobile
            )
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        // Mouse move handler (only on desktop)
        const handleMouseMove = (e: MouseEvent) => {
            if (!isMobile) {
                mouseRef.current = { x: e.clientX, y: e.clientY }
            }
        }

        // Mouse leave handler
        const handleMouseLeave = () => {
            mouseRef.current = { x: null, y: null }
        }

        // Mouse enter handler
        const handleMouseEnter = (e: MouseEvent) => {
            if (!isMobile) {
                mouseRef.current = { x: e.clientX, y: e.clientY }
            }
        }

        // Mouse click handler - creates ripple effect (only on desktop)
        const handleMouseClick = (e: MouseEvent) => {
            if (isMobile) return // Skip ripple on mobile for performance

            mouseClickEffectRef.current = true

            // Create visual ripple element
            const ripple = document.createElement('div')
            ripple.className = 'mouse-ripple'
            ripple.style.left = `${e.clientX}px`
            ripple.style.top = `${e.clientY}px`
            ripple.style.transform = 'translate(-50%, -50%)'
            document.body.appendChild(ripple)

            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove()
            }, 1000)

            // Reset click effect flag
            setTimeout(() => {
                mouseClickEffectRef.current = false
            }, 100)
        }

        // Only add mouse listeners on desktop
        if (!isMobile) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseleave', handleMouseLeave)
            document.addEventListener('mouseenter', handleMouseEnter)
            document.addEventListener('click', handleMouseClick)
        }

        // Animation loop with device-specific FPS
        let lastFrameTime = performance.now()
        const targetFPS = isMobile ? 30 : 60
        const frameDelay = 1000 / targetFPS

        // Get device-specific config for animation
        const config = isMobile ? mobileParticleConfig : defaultParticleConfig

        const animate = (currentTime: number) => {
            const elapsed = currentTime - lastFrameTime

            // Throttle frame rate based on device
            if (elapsed >= frameDelay) {
                animateParticles(
                    ctx,
                    particlesRef.current,
                    canvas.width,
                    canvas.height,
                    mouseRef.current.x,
                    mouseRef.current.y,
                    mouseClickEffectRef.current,
                    config
                )
                lastFrameTime = currentTime
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate(performance.now())

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)

            if (!isMobile) {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseleave', handleMouseLeave)
                document.removeEventListener('mouseenter', handleMouseEnter)
                document.removeEventListener('click', handleMouseClick)
            }

            if (animationFrameRef.current !== undefined) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isMobile])

    return (
        <>
            {/* Gradient Background with Green Glows */}
            <div className="gradient-background" />

            {/* Grid Overlay */}
            <div className="grid-overlay" />

            {/* Particles Canvas */}
            <canvas
                ref={canvasRef}
                className="particle-canvas"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            />

            {/* Vignette overlay */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(10, 15, 10, 0.8) 100%)',
                    pointerEvents: 'none',
                    zIndex: 3,
                }}
            />
        </>
    )
}