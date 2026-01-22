// components/layout/CustomCursor.tsx
"use client"

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null)
    const ringRef = useRef<HTMLDivElement>(null)
    const [isClicked, setIsClicked] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [isTouchDevice, setIsTouchDevice] = useState(false)

    // Detect if device is touch-enabled
    useEffect(() => {
        const checkTouchDevice = () => {
            // Check multiple indicators for touch support
            const hasTouch = (
                ('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                // @ts-ignore - for older browsers
                (navigator.msMaxTouchPoints > 0)
            )

            // Additional check: if primary input is coarse (finger), it's a touch device
            const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches

            setIsTouchDevice(hasTouch || hasCoarsePointer)
        }

        checkTouchDevice()

        // Re-check on resize (device orientation change, etc.)
        window.addEventListener('resize', checkTouchDevice)

        return () => {
            window.removeEventListener('resize', checkTouchDevice)
        }
    }, [])

    useEffect(() => {
        // Don't initialize custom cursor on touch devices
        if (isTouchDevice) {
            // Re-enable default cursor on touch devices
            document.body.style.cursor = 'auto'
            return
        }

        const dot = dotRef.current
        const ring = ringRef.current
        if (!dot || !ring) return

        // Ensure custom cursor is hidden on desktop
        document.body.style.cursor = 'none'

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
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.classList.contains('cta-btn') ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('input') ||
                target.closest('textarea')
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
            // Restore default cursor
            document.body.style.cursor = 'auto'
        }
    }, [isTouchDevice])

    // Don't render custom cursor on touch devices
    if (isTouchDevice) {
        return null
    }

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