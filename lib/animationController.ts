// lib/animationController.ts
/**
 * Core animation controller with proper cancellation support
 * Provides imperative control over animation sequences
 *
 * Key Features:
 * - Reliable cancellation (no orphaned timers)
 * - State machine for lifecycle management
 * - Supports pause/resume
 * - Debug logging
 * - Event callbacks
 */

import {
    AnimationState,
    AnimationStep,
    AnimationControllerConfig,
    AnimationStatus,
    AnimationEvent,
    AnimationError,
    isTerminalState,
    canStart,
} from './animationTypes'

export class AnimationController {
    // State
    private state: AnimationState = 'idle'
    private steps: AnimationStep[] = []
    private currentStepIndex = 0
    private timers: NodeJS.Timeout[] = []
    private startTime: number = 0
    private pausedTime: number = 0
    private elapsedBeforePause: number = 0

    // Configuration
    private config: AnimationControllerConfig = {}

    constructor(config: AnimationControllerConfig = {}) {
        this.config = {
            debug: false,
            ...config,
        }
        this.log('AnimationController initialized')
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
        this.log('Steps set', { stepCount: steps.length })
    }

    /**
     * Start animation from beginning
     * Returns false if animation cannot start (already completed/running)
     */
    start(): boolean {
        // If completed, don't restart
        if (this.state === 'completed') {
            this.log('Animation already completed, not restarting')
            return false
        }

        // If already running, ignore
        if (this.state === 'running') {
            this.log('Animation already running')
            return false
        }

        // Validate we have steps
        if (this.steps.length === 0) {
            throw new AnimationError(
                'No animation steps defined',
                'NO_STEPS',
                { state: this.state }
            )
        }

        this.log('Starting animation')
        this.setState('running')
        this.currentStepIndex = 0
        this.startTime = Date.now()
        this.elapsedBeforePause = 0

        this.executeNextStep()
        return true
    }

    /**
     * Cancel animation immediately
     * Clears all timers and resets to idle state
     */
    cancel(): void {
        if (this.state === 'idle' || this.state === 'cancelled') {
            return
        }

        this.log('Cancelling animation', {
            currentStep: this.currentStepIndex,
            totalSteps: this.steps.length,
        })

        this.clearAllTimers()
        this.setState('cancelled')
        this.currentStepIndex = 0

        if (this.config.onCancel) {
            this.config.onCancel()
        }
    }

    /**
     * Pause animation (can be resumed)
     */
    pause(): void {
        if (this.state !== 'running') {
            this.log('Cannot pause, not running', { state: this.state })
            return
        }

        this.log('Pausing animation')
        this.clearAllTimers()
        this.pausedTime = Date.now()
        this.setState('paused')
    }

    /**
     * Resume paused animation
     */
    resume(): void {
        if (this.state !== 'paused') {
            this.log('Cannot resume, not paused', { state: this.state })
            return
        }

        this.log('Resuming animation')
        this.elapsedBeforePause += Date.now() - this.pausedTime
        this.setState('running')
        this.executeNextStep()
    }

    /**
     * Reset animation to initial state
     * Can be called at any time
     */
    reset(): void {
        this.log('Resetting animation')
        this.cancel()
        this.state = 'idle'
        this.currentStepIndex = 0
        this.startTime = 0
        this.elapsedBeforePause = 0
        this.pausedTime = 0
    }

    /**
     * Complete animation (mark as done)
     * Prevents future restarts
     */
    complete(): void {
        this.log('Completing animation')
        this.clearAllTimers()
        this.setState('completed')

        if (this.config.onComplete) {
            this.config.onComplete()
        }
    }

    // ============================================
    // Public API - Query Methods
    // ============================================

    /**
     * Get current animation state
     */
    getState(): AnimationState {
        return this.state
    }

    /**
     * Get detailed status
     */
    getStatus(): AnimationStatus {
        return {
            state: this.state,
            currentStep: this.currentStepIndex,
            totalSteps: this.steps.length,
            elapsedTime: this.getElapsedTime(),
            isCompleted: this.state === 'completed',
            isRunning: this.state === 'running',
            isIdle: this.state === 'idle',
        }
    }

    /**
     * Check if animation is completed
     */
    isCompleted(): boolean {
        return this.state === 'completed'
    }

    /**
     * Check if animation is running
     */
    isRunning(): boolean {
        return this.state === 'running'
    }

    /**
     * Check if animation is idle
     */
    isIdle(): boolean {
        return this.state === 'idle'
    }

    /**
     * Check if animation can be started
     */
    canStart(): boolean {
        return canStart(this.state) && this.steps.length > 0
    }

    /**
     * Get progress (0.0 to 1.0)
     */
    getProgress(): number {
        if (this.steps.length === 0) return 0
        return this.currentStepIndex / this.steps.length
    }

    // ============================================
    // Private Methods - Execution
    // ============================================

    /**
     * Execute next step in sequence
     */
    private executeNextStep(): void {
        // Check if we should continue
        if (this.state !== 'running') {
            this.log('Stopping execution, state changed', { state: this.state })
            return
        }

        // Check if we've reached the end
        if (this.currentStepIndex >= this.steps.length) {
            this.log('All steps completed')
            this.complete()
            return
        }

        const step = this.steps[this.currentStepIndex]
        this.log('Executing step', {
            index: this.currentStepIndex,
            id: step.id,
            duration: step.duration,
        })

        // Fire onStepStart callback
        if (this.config.onStepStart) {
            this.config.onStepStart(step, this.currentStepIndex)
        }

        // Execute the step's action
        try {
            step.action()
        } catch (error) {
            this.log('Error executing step action', { error })
            throw new AnimationError(
                'Step execution failed',
                'STEP_ERROR',
                { step, error, index: this.currentStepIndex }
            )
        }

        // Fire onStepComplete callback
        if (this.config.onStepComplete) {
            this.config.onStepComplete(step, this.currentStepIndex)
        }

        // Schedule next step
        const timer = setTimeout(() => {
            this.currentStepIndex++
            this.executeNextStep()
        }, step.duration)

        this.timers.push(timer)
    }

    /**
     * Clear all pending timers
     */
    private clearAllTimers(): void {
        this.log('Clearing timers', { count: this.timers.length })
        this.timers.forEach((timer) => clearTimeout(timer))
        this.timers = []
    }

    /**
     * Update state and fire callbacks
     */
    private setState(newState: AnimationState): void {
        const oldState = this.state
        this.state = newState

        this.log('State changed', { from: oldState, to: newState })

        if (this.config.onStateChange) {
            this.config.onStateChange(newState)
        }
    }

    /**
     * Get elapsed time since start
     */
    private getElapsedTime(): number {
        if (this.state === 'idle') return 0
        if (this.state === 'paused') {
            return this.elapsedBeforePause + (this.pausedTime - this.startTime)
        }
        return this.elapsedBeforePause + (Date.now() - this.startTime)
    }

    /**
     * Debug logging
     */
    private log(message: string, data?: Record<string, unknown>): void {
        if (this.config.debug) {
            console.log(`[AnimationController] ${message}`, data || '')
        }
    }

    // ============================================
    // Public API - Configuration
    // ============================================

    /**
     * Update configuration
     */
    updateConfig(config: Partial<AnimationControllerConfig>): void {
        this.config = { ...this.config, ...config }
        this.log('Config updated')
    }

    /**
     * Set onComplete callback
     */
    onComplete(callback: () => void): void {
        this.config.onComplete = callback
    }

    /**
     * Set onCancel callback
     */
    onCancel(callback: () => void): void {
        this.config.onCancel = callback
    }

    /**
     * Set onStateChange callback
     */
    onStateChange(callback: (state: AnimationState) => void): void {
        this.config.onStateChange = callback
    }

    /**
     * Enable/disable debug mode
     */
    setDebug(enabled: boolean): void {
        this.config.debug = enabled
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

    /**
     * Combine multiple step arrays into one
     */
    static combineSteps(...stepArrays: AnimationStep[][]): AnimationStep[] {
        return stepArrays.flat()
    }
}