// components/layout/CustomCursor.tsx
"use client"

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null)
    const ringRef = useRef<HTMLDivElement>(null)
    const [isClicked, setIsClicked] = useState(false)
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        const dot = dotRef.current
        const ring = ringRef.current
        if (!dot || !ring) return

        let mouseX = 0
        let mouseY = 0
        let ringX = 0
        let ringY = 0

        // Show cursor immediately on first move
        let hasMovedOnce = false

        // Update mouse position instantly for dot
        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY

            // Show cursor on first movement
            if (!hasMovedOnce) {
                dot.style.opacity = '1'
                ring.style.opacity = '1'
                hasMovedOnce = true
            }

            // Dot follows immediately
            dot.style.left = `${mouseX}px`
            dot.style.top = `${mouseY}px`
        }

        // Ring follows with smooth delay
        const animateRing = () => {
            // Smooth lerp (linear interpolation) for liquid effect
            ringX += (mouseX - ringX) * 0.15
            ringY += (mouseY - ringY) * 0.15

            ring.style.left = `${ringX}px`
            ring.style.top = `${ringY}px`

            requestAnimationFrame(animateRing)
        }

        // Click handlers
        const handleMouseDown = () => setIsClicked(true)
        const handleMouseUp = () => setIsClicked(false)

        // Hide cursor when mouse leaves the window
        const handleMouseLeave = () => {
            dot.style.opacity = '0'
            ring.style.opacity = '0'
        }

        // Show cursor when mouse enters the window
        const handleMouseEnter = () => {
            if (hasMovedOnce) {
                dot.style.opacity = '1'
                ring.style.opacity = '1'
            }
        }

        // Hover detection for interactive elements
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.classList.contains('cta-btn') ||
                target.closest('button') ||
                target.closest('a')
            ) {
                setIsHovering(true)
            } else {
                setIsHovering(false)
            }
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseover', handleMouseOver)
        document.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.addEventListener('mouseleave', handleMouseLeave)
        document.body.addEventListener('mouseenter', handleMouseEnter)

        const animationFrame = requestAnimationFrame(animateRing)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseover', handleMouseOver)
            document.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.removeEventListener('mouseleave', handleMouseLeave)
            document.body.removeEventListener('mouseenter', handleMouseEnter)
            cancelAnimationFrame(animationFrame)
        }
    }, [])

    return (
        <>
            <div
                ref={dotRef}
                className={`cursor-dot ${isClicked ? 'clicked' : ''}`}
                style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
            />
            <div
                ref={ringRef}
                className={`cursor-ring ${isClicked ? 'clicked' : ''} ${isHovering ? 'hovering' : ''}`}
                style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
            />
        </>
    )
}