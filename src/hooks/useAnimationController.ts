// hooks/useAnimationController.ts
"use client"

/**
 * React hook wrapper for AnimationController
 * Provides React-friendly interface with automatic cleanup
 *
 * Key Features:
 * - Automatic lifecycle management
 * - State synchronization with React
 * - Memoized callbacks for performance
 * - Automatic cleanup on unmount
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { AnimationController } from '@/src/lib/animationController'
import {
    AnimationState,
    AnimationStep,
    AnimationControllerConfig,
    AnimationStatus,
} from '@/src/lib/animationTypes'

interface UseAnimationControllerOptions extends AnimationControllerConfig {
    /**
     * Enable automatic cleanup on unmount
     * @default true
     */
    autoCleanup?: boolean

    /**
     * Enable automatic reset when component re-renders
     * @default false
     */
    autoReset?: boolean

    /**
     * Initial debug mode
     * @default false
     */
    debug?: boolean
}

interface UseAnimationControllerReturn {
    // Control methods
    start: (steps: AnimationStep[]) => boolean
    cancel: () => void
    pause: () => void
    resume: () => void
    reset: () => void
    complete: () => void

    // State queries
    state: AnimationState
    status: AnimationStatus
    isCompleted: boolean
    isRunning: boolean
    isIdle: boolean
    canStart: boolean
    progress: number

    // Controller instance (for advanced usage)
    controller: AnimationController
}

/**
 * Hook for managing animation sequences with proper lifecycle control
 *
 * @example
 * const { start, cancel, isRunning, isCompleted } = useAnimationController({
 *   onComplete: () => console.log('Done!'),
 *   onCancel: () => console.log('Cancelled'),
 *   debug: true
 * })
 *
 * // Start animation
 * const steps = [
 *   { action: () => setText('Hello'), duration: 100 },
 *   { action: () => setText('World'), duration: 100 }
 * ]
 * start(steps)
 */
export function useAnimationController(
    options: UseAnimationControllerOptions = {}
): UseAnimationControllerReturn {
    const {
        autoCleanup = true,
        autoReset = false,
        debug = false,
        onComplete,
        onCancel,
        onStateChange,
        onStepStart,
        onStepComplete,
    } = options

    // Track user's onStateChange callback separately so we don't need
    // to reach into the controller's private config via bracket notation.
    const userOnStateChangeRef = useRef(onStateChange)
    useEffect(() => { userOnStateChangeRef.current = onStateChange }, [onStateChange])

    // Create controller instance (persists across renders)
    const controllerRef = useRef<AnimationController | null>(null)

    // Initialize controller only once
    if (!controllerRef.current) {
        controllerRef.current = new AnimationController({
            debug,
            onComplete,
            onCancel,
            onStateChange,
            onStepStart,
            onStepComplete,
        })
    }

    // State synchronization
    const [state, setState] = useState<AnimationState>('idle')
    const [status, setStatus] = useState<AnimationStatus>(() =>
        controllerRef.current!.getStatus()
    )

    // Update React state when controller state changes
    const syncState = useCallback(() => {
        const controller = controllerRef.current
        if (!controller) return

        setState(controller.getState())
        setStatus(controller.getStatus())
    }, [])

    // Setup state change listener
    useEffect(() => {
        const controller = controllerRef.current
        if (!controller) return

        // Wrap user's onStateChange to also sync our React state
        controller.onStateChange((newState) => {
            syncState()
            userOnStateChangeRef.current?.(newState)
        })

        // Initial sync
        syncState()
    }, [syncState])

    // Update callbacks when they change
    useEffect(() => {
        const controller = controllerRef.current
        if (!controller) return

        controller.updateConfig({
            onComplete,
            onCancel,
            onStepStart,
            onStepComplete,
        })
    }, [onComplete, onCancel, onStepStart, onStepComplete])

    // Auto-reset on re-render if enabled
    useEffect(() => {
        if (autoReset && controllerRef.current) {
            controllerRef.current.reset()
        }
    }, [autoReset])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoCleanup && controllerRef.current) {
                controllerRef.current.cancel()
            }
        }
    }, [autoCleanup])

    // ============================================
    // Memoized Control Methods
    // ============================================

    const start = useCallback((steps: AnimationStep[]): boolean => {
        const controller = controllerRef.current
        if (!controller) return false

        try {
            controller.setSteps(steps)
            const started = controller.start()
            syncState()
            return started
        } catch (error) {
            console.error('[useAnimationController] Start failed:', error)
            return false
        }
    }, [syncState])

    const cancel = useCallback(() => {
        const controller = controllerRef.current
        if (!controller) return

        controller.cancel()
        syncState()
    }, [syncState])

    const pause = useCallback(() => {
        const controller = controllerRef.current
        if (!controller) return

        controller.pause()
        syncState()
    }, [syncState])

    const resume = useCallback(() => {
        const controller = controllerRef.current
        if (!controller) return

        controller.resume()
        syncState()
    }, [syncState])

    const reset = useCallback(() => {
        const controller = controllerRef.current
        if (!controller) return

        controller.reset()
        syncState()
    }, [syncState])

    const complete = useCallback(() => {
        const controller = controllerRef.current
        if (!controller) return

        controller.complete()
        syncState()
    }, [syncState])

    // ============================================
    // Derived State
    // ============================================

    const isCompleted = status.isCompleted
    const isRunning = status.isRunning
    const isIdle = status.isIdle
    const canStartAnimation = controllerRef.current?.canStart() ?? false
    const progress = controllerRef.current?.getProgress() ?? 0

    return {
        // Control methods
        start,
        cancel,
        pause,
        resume,
        reset,
        complete,

        // State
        state,
        status,
        isCompleted,
        isRunning,
        isIdle,
        canStart: canStartAnimation,
        progress,

        // Controller instance for advanced usage
        controller: controllerRef.current!,
    }
}

