// components/layout/Background.tsx
"use client"

import { useEffect, useRef, useState } from 'react'
import {
    initializeParticles,
    animateParticles,
    updateMouseTrail,
    getCanvasContext,
    resizeCanvas,
    defaultParticleConfig,
} from '@/lib/particles'
import type { Particle, MouseTrailPoint } from '@/types'

export default function Background() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseTrailRef = useRef<MouseTrailPoint[]>([])
    const mousePositionRef = useRef<{ x: number | null; y: number | null }>({
        x: null,
        y: null,
    })
    const animationFrameRef = useRef<number>()

    const [dimensions, setDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    })

    // Initialize canvas and particles
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = getCanvasContext(canvas)
        if (!ctx) return

        // Set initial canvas size
        resizeCanvas(canvas, dimensions.width, dimensions.height)

        // Initialize particles
        particlesRef.current = initializeParticles(
            dimensions.width,
            dimensions.height,
            defaultParticleConfig
        )

        // Animation loop
        const animate = () => {
            animateParticles(
                ctx,
                particlesRef.current,
                dimensions.width,
                dimensions.height,
                mousePositionRef.current.x,
                mousePositionRef.current.y,
                mouseTrailRef.current,
                defaultParticleConfig
            )

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [dimensions])

    // Handle mouse movement
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            mousePositionRef.current = {
                x: event.clientX,
                y: event.clientY,
            }

            // Update mouse trail
            if (mousePositionRef.current.x !== null && mousePositionRef.current.y !== null) {
                mouseTrailRef.current = updateMouseTrail(
                    mouseTrailRef.current,
                    mousePositionRef.current.x,
                    mousePositionRef.current.y,
                    defaultParticleConfig.maxTrailLength
                )
            }
        }

        const handleMouseLeave = () => {
            mousePositionRef.current = { x: null, y: null }
            mouseTrailRef.current = []
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth
            const newHeight = window.innerHeight

            setDimensions({
                width: newWidth,
                height: newHeight,
            })

            // Reinitialize particles with new dimensions
            particlesRef.current = initializeParticles(
                newWidth,
                newHeight,
                defaultParticleConfig
            )
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <>
            {/* Gradient Background */}
            <div className="gradient-bg" />

            {/* Grid Overlay */}
            <div className="grid-overlay" />

            {/* Particles Canvas */}
            <canvas
                ref={canvasRef}
                id="particles-canvas"
                className="particles-canvas"
            />

            {/* Vignette Effect */}
            <div className="vignette" />

            <style jsx>{`
        .gradient-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
              circle at 20% 30%,
              rgba(0, 50, 20, 0.3) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(0, 70, 30, 0.2) 0%,
              transparent 50%
            ),
            linear-gradient(
              135deg,
              #0a0f0a 0%,
              #0d1a0d 50%,
              #0a0f0a 100%
            );
          animation: gradientShift 20s ease infinite;
          z-index: 0;
        }

        .grid-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(
              rgba(0, 255, 65, 0.03) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(0, 255, 65, 0.03) 1px,
              transparent 1px
            );
          background-size: 50px 50px;
          opacity: 0.3;
          z-index: 1;
          pointer-events: none;
        }

        .particles-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }

        .vignette {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at center,
            transparent 0%,
            rgba(0, 0, 0, 0.6) 100%
          );
          pointer-events: none;
          z-index: 3;
        }

        @keyframes gradientShift {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
        </>
    )
}