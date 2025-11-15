// components/layout/CustomCursor.tsx
"use client"

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null)
    const ringRef = useRef<HTMLDivElement>(null)
    const [isClicked, setIsClicked] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const dot = dotRef.current
        const ring = ringRef.current
        if (!dot || !ring) return

        let mouseX = 0
        let mouseY = 0
        let ringX = 0
        let ringY = 0

        // Update mouse position instantly for dot
        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY

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

        // Mouse enter - show cursor
        const handleMouseEnter = () => {
            setIsVisible(true)
        }

        // Mouse leave - hide cursor
        const handleMouseLeave = () => {
            setIsVisible(false)
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
        document.addEventListener('mouseenter', handleMouseEnter)
        document.addEventListener('mouseleave', handleMouseLeave)

        const animationFrame = requestAnimationFrame(animateRing)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseover', handleMouseOver)
            document.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('mouseenter', handleMouseEnter)
            document.removeEventListener('mouseleave', handleMouseLeave)
            cancelAnimationFrame(animationFrame)
        }
    }, [])

    return (
        <>
            <div
                ref={dotRef}
                className={`cursor-dot ${isClicked ? 'clicked' : ''} ${!isVisible ? 'hidden' : ''}`}
            />
            <div
                ref={ringRef}
                className={`cursor-ring ${isClicked ? 'clicked' : ''} ${isHovering ? 'hovering' : ''} ${!isVisible ? 'hidden' : ''}`}
            />
        </>
    )
}