// lib/animationTypes.ts
/**
 * Core type definitions for the animation system
 * Centralized types ensure consistency across all animation components
 */

/**
 * Animation lifecycle states
 */
export type AnimationState = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled'

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

    /** Optional metadata for debugging/tracking */
    metadata?: Record<string, unknown>
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

    /** Called before each step executes */
    onStepStart?: (step: AnimationStep, index: number) => void

    /** Called after each step completes */
    onStepComplete?: (step: AnimationStep, index: number) => void

    /** Enable debug logging */
    debug?: boolean
}

/**
 * Typing animation configuration
 */
export interface TypingAnimationConfig {
    /** Base typing speed in milliseconds per character */
    baseSpeed?: number

    /** Called on each keystroke */
    onKeystroke?: (char: string, index: number, isLast: boolean) => void

    /** Custom delay calculation function */
    getDelay?: (char: string, index: number, text: string) => number

    /** Whether to play enter sound at the end */
    playEnterSound?: boolean
}

/**
 * Key type for audio playback
 */
export type KeyType = 'regular' | 'space' | 'enter'

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

    /** Sound files for different key types */
    soundFiles?: {
        regular: string[]
        space?: string
        enter?: string
    }
}

/**
 * View intersection configuration
 */
export interface InViewConfig {
    /** Threshold for triggering (0.0 to 1.0) */
    threshold?: number

    /** Root margin for intersection observer */
    rootMargin?: string

    /** Only trigger once */
    triggerOnce?: boolean

    /** Callback when view state changes */
    onInViewChange?: (isInView: boolean) => void
}

/**
 * Animation sequence builder helper type
 */
export type AnimationSequence = AnimationStep[]

/**
 * Result of typing animation generation
 */
export interface TypingAnimationResult {
    /** Generated animation steps */
    steps: AnimationStep[]

    /** Total duration in milliseconds */
    totalDuration: number

    /** Number of characters */
    characterCount: number
}

/**
 * Animation controller status
 */
export interface AnimationStatus {
    /** Current state */
    state: AnimationState

    /** Current step index */
    currentStep: number

    /** Total number of steps */
    totalSteps: number

    /** Elapsed time in milliseconds */
    elapsedTime: number

    /** Whether animation is completed */
    isCompleted: boolean

    /** Whether animation is running */
    isRunning: boolean

    /** Whether animation is idle */
    isIdle: boolean
}

/**
 * Section animation configuration
 */
export interface SectionAnimationConfig {
    /** Unique section identifier */
    sectionId: string

    /** Whether to reset on scroll away */
    resetOnLeave?: boolean

    /** Whether to restart if interrupted */
    restartIfInterrupted?: boolean

    /** Minimum time in view before starting (ms) */
    delayBeforeStart?: number

    /** Audio configuration */
    audioConfig?: KeystrokeAudioConfig

    /** View configuration */
    viewConfig?: InViewConfig
}

/**
 * Human typing pattern configuration
 */
export interface HumanTypingPattern {
    /** Speed multiplier for start of text */
    startSpeedMultiplier?: number

    /** Speed multiplier for middle of text */
    middleSpeedMultiplier?: number

    /** Speed multiplier for end of text */
    endSpeedMultiplier?: number

    /** Speed multiplier for file extensions (.txt, .sh) */
    extensionSpeedMultiplier?: number

    /** Probability of random pause (0.0 to 1.0) */
    randomPauseProbability?: number

    /** Random pause multiplier */
    randomPauseMultiplier?: number

    /** Speed multiplier for repeated characters */
    repeatedCharMultiplier?: number

    /** Characters that trigger slower typing */
    slowCharacters?: string[]

    /** Speed multiplier for slow characters */
    slowCharMultiplier?: number
}

/**
 * Default human typing pattern
 */
export const DEFAULT_HUMAN_TYPING_PATTERN: Required<HumanTypingPattern> = {
    startSpeedMultiplier: 1.8,
    middleSpeedMultiplier: 0.7,
    endSpeedMultiplier: 1.3,
    extensionSpeedMultiplier: 3.5,
    randomPauseProbability: 0.05,
    randomPauseMultiplier: 2.5,
    repeatedCharMultiplier: 0.8,
    slowCharacters: ['/', '.', '-', '_'],
    slowCharMultiplier: 1.5,
}

/**
 * Animation event types for tracking
 */
export enum AnimationEvent {
    START = 'animation:start',
    STEP = 'animation:step',
    COMPLETE = 'animation:complete',
    CANCEL = 'animation:cancel',
    RESET = 'animation:reset',
    PAUSE = 'animation:pause',
    RESUME = 'animation:resume',
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

/**
 * Type guard for checking if state is terminal
 */
export function isTerminalState(state: AnimationState): boolean {
    return state === 'completed' || state === 'cancelled'
}

/**
 * Type guard for checking if state allows starting
 */
export function canStart(state: AnimationState): boolean {
    return state === 'idle' || state === 'cancelled'
}

/**
 * Type guard for checking if animation is active
 */
export function isActive(state: AnimationState): boolean {
    return state === 'running' || state === 'paused'
}