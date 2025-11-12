// components/layout/Background.tsx
"use client"

import { useEffect, useRef } from 'react'
import {
    initializeParticles,
    animateParticles,
    updateMouseTrail,
    getCanvasContext,
    resizeCanvas,
    type Particle,
    type MouseTrailPoint,
} from '@/lib/particles'

export default function Background() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null })
    const mouseTrailRef = useRef<MouseTrailPoint[]>([])
    const animationFrameRef = useRef<number | undefined>(undefined)
    const mouseClickEffectRef = useRef<boolean>(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = getCanvasContext(canvas)
        if (!ctx) return

        // Initialize canvas size
        const handleResize = () => {
            resizeCanvas(canvas, window.innerWidth, window.innerHeight)
            particlesRef.current = initializeParticles(canvas.width, canvas.height)
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
            mouseTrailRef.current = updateMouseTrail(
                mouseTrailRef.current,
                e.clientX,
                e.clientY
            )
        }

        // Mouse leave handler - cursor disappears when leaving page
        const handleMouseLeave = () => {
            mouseRef.current = { x: null, y: null }
            mouseTrailRef.current = [] // Clear trail immediately
        }

        // Mouse enter handler - cursor reappears when entering page
        const handleMouseEnter = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }

        // Mouse click handler - creates ripple effect
        const handleMouseClick = (e: MouseEvent) => {
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

        // Use document to properly detect when mouse leaves the entire page
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('mouseenter', handleMouseEnter)
        document.addEventListener('click', handleMouseClick)

        // Animation loop
        const animate = () => {
            animateParticles(
                ctx,
                particlesRef.current,
                canvas.width,
                canvas.height,
                mouseRef.current.x,
                mouseRef.current.y,
                mouseTrailRef.current,
                mouseClickEffectRef.current
            )

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('mouseenter', handleMouseEnter)
            document.removeEventListener('click', handleMouseClick)
            if (animationFrameRef.current !== undefined) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

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