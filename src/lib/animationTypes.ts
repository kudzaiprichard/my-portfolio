// lib/animationTypes.ts
/**
 * Core type definitions for the animation system
 * Centralized types ensure consistency across all animation components
 *
 * NOTE: Default typing pattern values live in constants/typingConfig.ts
 * This file only defines the interfaces/types.
 */

/**
 * Animation lifecycle states
 */
export type AnimationState = 'idle' | 'running' | 'completed' | 'cancelled'

/**
 * Single step in an animation sequence
 */
export interface AnimationStep {
    /** Unique identifier for this step (optional, for debugging) */
    id?: string

    /** The action to execute for this step */
    action: () => void

    /** Duration in milliseconds before moving to next step */
    duration: number
}

/**
 * Configuration for animation controller
 */
export interface AnimationControllerConfig {
    /** Called when animation completes successfully */
    onComplete?: () => void

    /** Called when animation is cancelled */
    onCancel?: () => void

    /** Called when animation state changes */
    onStateChange?: (state: AnimationState) => void
}

/**
 * Key type for audio playback
 */
export type KeyType = 'regular' | 'space' | 'enter' | 'backspace'

/**
 * Audio keystroke configuration
 */
export interface KeystrokeAudioConfig {
    /** Section ID for audio control */
    sectionId: string

    /** Whether audio is enabled */
    enabled?: boolean

    /** Base volume (0.0 to 1.0) */
    volume?: number

    /** Enable volume ramping effect */
    volumeRampEnabled?: boolean
}

/**
 * View intersection configuration
 */
export interface InViewConfig {
    /** Threshold for triggering (0.0 to 1.0) */
    threshold?: number

    /** Root margin for intersection observer */
    rootMargin?: string

    /** Callback when view state changes */
    onInViewChange?: (isInView: boolean) => void
}

/**
 * Error types for animation system
 */
export class AnimationError extends Error {
    constructor(
        message: string,
        public code: string,
        public context?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'AnimationError'
    }
}
