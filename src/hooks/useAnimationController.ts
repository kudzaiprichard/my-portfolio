// hooks/useAnimationController.ts
"use client"

/**
 * React hook wrapper for AnimationController
 * Provides React-friendly interface with automatic cleanup
 *
 * Key Features:
 * - State synchronization with React
 * - Memoized callbacks for performance
 * - Automatic cancellation on unmount
 */

import { useEffect, useState } from 'react'
import { AnimationController } from '@/src/lib/animationController'
import {
    AnimationState,
    AnimationStep,
    AnimationControllerConfig,
} from '@/src/lib/animationTypes'

type UseAnimationControllerOptions = Pick<AnimationControllerConfig, 'onComplete' | 'onCancel'>

interface UseAnimationControllerReturn {
    start: (steps: AnimationStep[]) => boolean
    cancel: () => void
    reset: () => void
    complete: () => void
    isCompleted: boolean
    isRunning: boolean
}

/**
 * Hook for managing animation sequences with proper lifecycle control
 *
 * @example
 * const { start, cancel, isRunning, isCompleted } = useAnimationController({
 *   onComplete: () => console.log('Done!'),
 * })
 *
 * start([
 *   { action: () => setText('Hello'), duration: 100 },
 *   { action: () => setText('World'), duration: 100 },
 * ])
 */
export function useAnimationController(
    options: UseAnimationControllerOptions = {}
): UseAnimationControllerReturn {
    const { onComplete, onCancel } = options

    // Controller instance persists across renders
    const [controller] = useState(() => new AnimationController({ onComplete, onCancel }))
    const [state, setState] = useState<AnimationState>('idle')

    // Mirror controller state into React state
    useEffect(() => {
        controller.updateConfig({ onStateChange: setState })
    }, [controller])

    // Keep callbacks current
    useEffect(() => {
        controller.updateConfig({ onComplete, onCancel })
    }, [controller, onComplete, onCancel])

    // Cancel on unmount
    useEffect(() => {
        return () => controller.cancel()
    }, [controller])

    const start = (steps: AnimationStep[]): boolean => {
        try {
            controller.setSteps(steps)
            const started = controller.start()
            setState(controller.getState())
            return started
        } catch (error) {
            console.error('[useAnimationController] Start failed:', error)
            return false
        }
    }

    const cancel = () => {
        controller.cancel()
        setState(controller.getState())
    }

    const reset = () => {
        controller.reset()
        setState(controller.getState())
    }

    const complete = () => {
        controller.complete()
        setState(controller.getState())
    }

    return {
        start,
        cancel,
        reset,
        complete,
        isCompleted: state === 'completed',
        isRunning: state === 'running',
    }
}
