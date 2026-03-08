// constants/typingConfig.ts

/**
 * SINGLE SOURCE OF TRUTH for all typing behavior across the portfolio.
 *
 * Tune the entire typing "feel" from this one file.
 * Every section component and typing hook imports from here.
 */

import { HumanTypingPattern } from '@/src/lib/animationTypes'

/* ============================================
   SECTION IDS
   ============================================ */

export type SectionId = 'hero' | 'about' | 'projects' | 'experience' | 'contact'

/* ============================================
   GLOBAL HUMAN TYPING PATTERN
   Base pattern shared across all sections.
   Section overrides merge on top of this.
   ============================================ */

export const globalTypingPattern: Required<HumanTypingPattern> = {
    // --- Positional speed multipliers ---
    startSpeedMultiplier: 1.8,       // Slower at the start (thinking before typing)
    middleSpeedMultiplier: 0.7,      // Faster in the flow
    endSpeedMultiplier: 1.3,         // Slight slowdown near the end

    // --- File extension slowdown (.txt, .sh, etc.) ---
    extensionSpeedMultiplier: 3.5,

    // --- Random micro-pauses (hesitation) ---
    randomPauseProbability: 0.08,    // 8% chance per keystroke (moderate)
    randomPauseMultiplier: 2.5,      // Pause is 2.5x the base delay

    // --- Repeated characters (e.g. "ll", "ss") ---
    repeatedCharMultiplier: 0.8,     // Slightly faster — muscle memory

    // --- Slow characters (path separators, punctuation) ---
    slowCharacters: ['.', '/', '\\', '-', '_', '~', '|'],
    slowCharMultiplier: 1.5,
}

/* ============================================
   CHARACTER CLASS SPEED MULTIPLIERS
   Applied on top of the base pattern.
   Higher = slower. 1.0 = no change.
   ============================================ */

export const charClassMultipliers = {
    /** Digits 0-9: reaching for number row */
    digit: 1.35,

    /** Uppercase letters: holding shift */
    uppercase: 1.25,

    /** Special symbols (@#$%^&*etc): shift + number row */
    specialSymbol: 1.55,

    /** Path/punctuation characters (- _ / \ | ~ .): deliberate keystrokes */
    pathSeparator: 1.45,

    /** Regular lowercase: baseline */
    lowercase: 1.0,

    /** Whitespace (space): thumb hit, slightly faster */
    space: 0.85,
} as const

/**
 * Characters considered "special symbols" for the multiplier above.
 */
export const specialSymbolChars = new Set(
    '!@#$%^&*()+=[]{}:\'",<>?`'.split('')
)

/**
 * Path/separator characters that get their own slower multiplier.
 * These are common in terminal commands (paths, flags, filenames).
 */
export const pathSeparatorChars = new Set(
    '-_/\\|~.;'.split('')
)

/* ============================================
   PER-SECTION SPEED PRESETS
   Each section can override baseSpeed and
   pattern values. Unspecified keys fall back
   to globalTypingPattern.
   ============================================ */

export interface SectionTypingConfig {
    /** Base typing speed in ms per character */
    baseSpeed: number
    /** Optional pattern overrides (merged with globalTypingPattern) */
    patternOverrides?: Partial<HumanTypingPattern>
}

export const sectionTypingConfigs: Record<SectionId, SectionTypingConfig> = {
    hero: {
        baseSpeed: 90,
        patternOverrides: {
            startSpeedMultiplier: 2.2,      // Extra dramatic start
            randomPauseProbability: 0.10,    // Slightly more hesitation
            extensionSpeedMultiplier: 4.0,   // Longer pause on .txt
        },
    },
    about: {
        baseSpeed: 65,
        patternOverrides: {
            middleSpeedMultiplier: 0.65,     // Flows a bit faster
            randomPauseProbability: 0.06,    // Less hesitation
        },
    },
    projects: {
        baseSpeed: 70,
        patternOverrides: {
            extensionSpeedMultiplier: 3.0,
        },
    },
    experience: {
        baseSpeed: 70,
        patternOverrides: {
            startSpeedMultiplier: 1.6,       // Slightly quicker start
        },
    },
    contact: {
        baseSpeed: 70,
        patternOverrides: {},
    },
}

/* ============================================
   AUDIO / VOLUME RAMP SETTINGS
   Tied to typing feel — configured here so
   audio "warmup" matches typing rhythm.
   ============================================ */

export const audioConfig = {
    /** Base volume for keystroke sounds (0.0 – 1.0) */
    baseVolume: 0.4,

    /** Whether volume ramps up from quiet to full */
    volumeRampEnabled: true,

    /** Number of keystrokes to ramp from min to max volume */
    volumeRampKeystrokes: 10,

    /** Starting volume as fraction of baseVolume during ramp */
    volumeRampMinFraction: 0.5,

    /** Milliseconds of inactivity before volume decays */
    volumeDecayDelayMs: 2000,

    /** Decay factor (0–1): how much of current ramp to keep after inactivity */
    volumeDecayFactor: 0.5,
} as const

/* ============================================
   DELAY BETWEEN COMMANDS
   Controls pacing between typed commands
   within a section's animation sequence.
   ============================================ */

export const sequenceTimings = {
    /** Delay before first command starts typing (ms) */
    initialDelay: 500,

    /** Pause after a command finishes typing, before output appears (ms) */
    postCommandDelay: 350,

    /** Pause after output appears, before next command starts (ms) */
    betweenCommandsDelay: 900,

    /** Delay for volume ramp reset action (ms) */
    volumeResetDelay: 0,
} as const

/* ============================================
   HELPER: Resolve full pattern for a section
   Merges section overrides onto global defaults.
   ============================================ */

export function getPatternForSection(sectionId: SectionId): Required<HumanTypingPattern> {
    const sectionConfig = sectionTypingConfigs[sectionId]
    return {
        ...globalTypingPattern,
        ...(sectionConfig.patternOverrides ?? {}),
    }
}

/**
 * Get the base speed for a section.
 */
export function getBaseSpeedForSection(sectionId: SectionId): number {
    return sectionTypingConfigs[sectionId].baseSpeed
}

/* ============================================
   HELPER: Classify a character
   Returns the appropriate speed multiplier
   for a given character based on its class.
   ============================================ */

export function getCharClassMultiplier(char: string): number {
    if (char === ' ') return charClassMultipliers.space

    // Path separators (- _ / \ | ~ . ;) — common in terminal commands
    if (pathSeparatorChars.has(char)) return charClassMultipliers.pathSeparator

    // Special symbols (@#$%^&* etc) — shift + number row
    if (specialSymbolChars.has(char)) return charClassMultipliers.specialSymbol

    // Digits
    if (/[0-9]/.test(char)) return charClassMultipliers.digit

    // Uppercase (letter that differs from its lowercase form)
    if (char !== char.toLowerCase() && char === char.toUpperCase()) {
        return charClassMultipliers.uppercase
    }

    return charClassMultipliers.lowercase
}