// lib/animationController.ts
/**
 * Core animation controller with proper cancellation support
 * Provides imperative control over animation sequences
 *
 * Key Features:
 * - Reliable cancellation (no orphaned timers)
 * - State machine for lifecycle management
 * - Event callbacks
 */

import {
    AnimationState,
    AnimationStep,
    AnimationControllerConfig,
    AnimationError,
} from './animationTypes'

export class AnimationController {
    private state: AnimationState = 'idle'
    private steps: AnimationStep[] = []
    private currentStepIndex = 0
    private timers: ReturnType<typeof setTimeout>[] = []
    private config: AnimationControllerConfig

    constructor(config: AnimationControllerConfig = {}) {
        this.config = { ...config }
    }

    // ============================================
    // Public API - Control Methods
    // ============================================

    /**
     * Set animation steps (must be called before start)
     */
    setSteps(steps: AnimationStep[]): void {
        if (this.state === 'running') {
            throw new AnimationError(
                'Cannot set steps while animation is running',
                'INVALID_STATE',
                { currentState: this.state }
            )
        }

        this.steps = steps
    }

    /**
     * Start animation from beginning
     * Returns false if animation cannot start (already completed/running)
     */
    start(): boolean {
        if (this.state === 'completed' || this.state === 'running') return false

        if (this.steps.length === 0) {
            throw new AnimationError(
                'No animation steps defined',
                'NO_STEPS',
                { state: this.state }
            )
        }

        this.setState('running')
        this.currentStepIndex = 0
        this.executeNextStep()
        return true
    }

    /**
     * Cancel animation immediately
     * Clears all timers and moves to the cancelled state
     */
    cancel(): void {
        if (this.state === 'idle' || this.state === 'cancelled') return

        this.clearAllTimers()
        this.setState('cancelled')
        this.currentStepIndex = 0
        this.config.onCancel?.()
    }

    /**
     * Reset animation to initial state
     * Can be called at any time
     */
    reset(): void {
        this.cancel()
        this.state = 'idle'
        this.currentStepIndex = 0
    }

    /**
     * Complete animation (mark as done)
     * Prevents future restarts
     */
    complete(): void {
        this.clearAllTimers()
        this.setState('completed')
        this.config.onComplete?.()
    }

    getState(): AnimationState {
        return this.state
    }

    /**
     * Update configuration (callbacks)
     */
    updateConfig(config: Partial<AnimationControllerConfig>): void {
        this.config = { ...this.config, ...config }
    }

    // ============================================
    // Private Methods - Execution
    // ============================================

    private executeNextStep(): void {
        if (this.state !== 'running') return

        if (this.currentStepIndex >= this.steps.length) {
            this.complete()
            return
        }

        const step = this.steps[this.currentStepIndex]

        try {
            step.action()
        } catch (error) {
            throw new AnimationError(
                'Step execution failed',
                'STEP_ERROR',
                { step, error, index: this.currentStepIndex }
            )
        }

        const timer = setTimeout(() => {
            this.currentStepIndex++
            this.executeNextStep()
        }, step.duration)

        this.timers.push(timer)
    }

    private clearAllTimers(): void {
        this.timers.forEach((timer) => clearTimeout(timer))
        this.timers = []
    }

    private setState(newState: AnimationState): void {
        this.state = newState
        this.config.onStateChange?.(newState)
    }

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Create a delay step (useful for building sequences)
     */
    static createDelayStep(duration: number, id?: string): AnimationStep {
        return {
            id: id || `delay-${duration}`,
            action: () => {}, // No-op
            duration,
        }
    }

    /**
     * Create an action step
     */
    static createActionStep(
        action: () => void,
        duration: number = 0,
        id?: string
    ): AnimationStep {
        return {
            id,
            action,
            duration,
        }
    }
}
