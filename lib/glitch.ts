// lib/glitch.ts

/* ============================================
   FLEXIBLE CHARACTER GLITCH SYSTEM
   ============================================ */

/**
 * Configuration for glitch effects
 */
export interface GlitchConfig {
    textGlitchInterval?: number
    borderGlitchInterval?: number
    textFlickerInterval?: number
    charGlitchChance?: number
    intensity?: 'low' | 'medium' | 'high'
    // Custom interval overrides
    singleCharInterval?: number
    multiCharInterval?: number
}

export const defaultGlitchConfig: GlitchConfig = {
    textGlitchInterval: 8000,
    borderGlitchInterval: 12000,
    textFlickerInterval: 5000,
    charGlitchChance: 0.02,
    intensity: 'medium',
}

// Intensity presets
const intensityPresets = {
    low: {
        singleCharInterval: 3000,    // Every 3 seconds
        multiCharInterval: 6000,     // Every 6 seconds
        numChars: 1,                 // 1 character at a time
        duration: 800,               // Show glitch char for 800ms (increased for readability)
        displayDuration: 600,        // Time glitch char is visible before restoring
    },
    medium: {
        singleCharInterval: 1500,    // Every 1.5 seconds
        multiCharInterval: 3000,     // Every 3 seconds
        numChars: 2,                 // 2-3 characters at a time
        duration: 900,               // Show glitch char for 900ms
        displayDuration: 700,        // Time glitch char is visible
    },
    high: {
        singleCharInterval: 800,     // Every 0.8 seconds
        multiCharInterval: 1800,     // Every 1.8 seconds
        numChars: 3,                 // 3-5 characters at a time
        duration: 1000,              // Show glitch char for 1000ms
        displayDuration: 800,        // Time glitch char is visible
    },
}

/* ============================================
   CSS-BASED GLITCH EFFECTS (VINTAGE ONLY)
   ============================================ */

/**
 * Applies RGB split glitch effect (CSS animation only) - VINTAGE EFFECT
 */
export function applyTextGlitch(element: HTMLElement, duration: number = 150): void {
    element.style.animation = `glitch-rgb ${duration}ms ease-in-out`

    setTimeout(() => {
        element.style.animation = ''
    }, duration)
}

/**
 * Applies border glitch effect
 */
export function applyBorderGlitch(element: HTMLElement, duration: number = 150): void {
    element.style.animation = `glitch-border ${duration}ms ease-in-out`

    setTimeout(() => {
        element.style.animation = ''
    }, duration)
}

/**
 * Chromatic aberration effect (CSS-only) - VINTAGE EFFECT
 */
export function chromaticAberration(element: HTMLElement): void {
    element.classList.add('chromatic-aberration')
    setTimeout(() => element.classList.remove('chromatic-aberration'), 200)
}

/**
 * Digital noise overlay - VINTAGE EFFECT
 */
export function digitalNoise(element: HTMLElement): void {
    element.classList.add('digital-noise')
    setTimeout(() => element.classList.remove('digital-noise'), 180)
}

/* ============================================
   CHARACTER REPLACEMENT GLITCH EFFECTS - WITH VINTAGE
   ============================================ */

/**
 * Wraps each character with overlay divs for glitch replacement
 * Original character stays in place, glitch appears as overlay
 * PRESERVES SPACES - doesn't wrap them
 */
function wrapCharactersWithOverlay(element: HTMLElement): void {
    // Check if already wrapped
    if (element.dataset.glitchWrapped === 'true') return

    const text = element.textContent || ''
    const fragment = document.createDocumentFragment()

    // Wrap each character
    for (let i = 0; i < text.length; i++) {
        const char = text[i]

        // If it's a space, just add it as text node (don't wrap)
        if (char === ' ') {
            fragment.appendChild(document.createTextNode(' '))
            continue
        }

        // Create wrapper for non-space characters
        const wrapper = document.createElement('span')
        wrapper.className = 'glitch-char-wrapper'
        wrapper.dataset.charIndex = i.toString()

        // Create original character (maintains layout)
        const original = document.createElement('span')
        original.className = 'glitch-char-original'
        original.textContent = char
        original.dataset.originalChar = char

        // Create overlay (for glitch character)
        const overlay = document.createElement('span')
        overlay.className = 'glitch-char-overlay'
        overlay.textContent = char // Initially same as original

        wrapper.appendChild(original)
        wrapper.appendChild(overlay)
        fragment.appendChild(wrapper)
    }

    // Clear and replace
    element.innerHTML = ''
    element.appendChild(fragment)
    element.dataset.glitchWrapped = 'true'
}

/**
 * SMOOTH single character replacement using overlay method
 * WITH VINTAGE EFFECTS applied during character change
 */
export function smoothCharacterGlitch(element: HTMLElement, duration: number = 800, displayDuration: number = 600): void {
    // Wrap if not already wrapped
    wrapCharactersWithOverlay(element)

    const wrappers = element.querySelectorAll('.glitch-char-wrapper')
    if (wrappers.length === 0) return

    // Find non-space characters
    const nonSpaceWrappers: HTMLElement[] = []
    wrappers.forEach((wrapper) => {
        const original = wrapper.querySelector('.glitch-char-original')
        if (original && (original.textContent || '').trim() !== '') {
            nonSpaceWrappers.push(wrapper as HTMLElement)
        }
    })

    if (nonSpaceWrappers.length === 0) return

    // Pick random wrapper
    const randomWrapper = nonSpaceWrappers[Math.floor(Math.random() * nonSpaceWrappers.length)]
    const overlay = randomWrapper.querySelector('.glitch-char-overlay') as HTMLElement

    if (!overlay) return

    const glitchChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ!@#$%^&*█▓▒░'
    const randomChar = glitchChars[Math.floor(Math.random() * glitchChars.length)]
    const original = randomWrapper.querySelector('.glitch-char-original') as HTMLElement
    const originalChar = original?.dataset.originalChar || original?.textContent || ''

    // PHASE 1: Apply vintage effect WHEN changing to glitch character
    requestAnimationFrame(() => {
        // Apply vintage effects to the entire element
        applyTextGlitch(element, 150)
        digitalNoise(element)

        // Show glitch character
        overlay.textContent = randomChar
        randomWrapper.classList.add('glitching')

        // PHASE 2: Keep glitch character visible for displayDuration (user can read it)
        setTimeout(() => {
            // PHASE 3: Apply vintage effect WHEN restoring original character
            requestAnimationFrame(() => {
                applyTextGlitch(element, 150)
                chromaticAberration(element)

                // Restore original character
                overlay.textContent = originalChar
                randomWrapper.classList.remove('glitching')
            })
        }, displayDuration)
    })
}

/**
 * SMOOTH multi-character replacement using overlay method
 * WITH VINTAGE EFFECTS applied during character changes
 */
export function smoothMultiCharGlitch(
    element: HTMLElement,
    numChars: number = 2,
    duration: number = 900,
    displayDuration: number = 700
): void {
    // Wrap if not already wrapped
    wrapCharactersWithOverlay(element)

    const wrappers = element.querySelectorAll('.glitch-char-wrapper')
    if (wrappers.length < 2) return

    const glitchChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ!@#$%^&*█▓▒░'
    const actualNumChars = Math.min(numChars + Math.floor(Math.random() * 2), wrappers.length)

    // Find non-space characters
    const nonSpaceWrappers: HTMLElement[] = []
    wrappers.forEach((wrapper) => {
        const original = wrapper.querySelector('.glitch-char-original')
        if (original && (original.textContent || '').trim() !== '') {
            nonSpaceWrappers.push(wrapper as HTMLElement)
        }
    })

    if (nonSpaceWrappers.length === 0) return

    // Pick random positions
    const selectedWrappers: HTMLElement[] = []
    const overlays: HTMLElement[] = []
    const originals: HTMLElement[] = []
    const originalChars: string[] = []
    const replacements: string[] = []

    let attempts = 0
    while (selectedWrappers.length < Math.min(actualNumChars, nonSpaceWrappers.length) && attempts < actualNumChars * 3) {
        const randomWrapper = nonSpaceWrappers[Math.floor(Math.random() * nonSpaceWrappers.length)]
        if (!selectedWrappers.includes(randomWrapper)) {
            const overlay = randomWrapper.querySelector('.glitch-char-overlay') as HTMLElement
            const original = randomWrapper.querySelector('.glitch-char-original') as HTMLElement

            if (overlay && original) {
                selectedWrappers.push(randomWrapper)
                overlays.push(overlay)
                originals.push(original)
                originalChars.push(original.dataset.originalChar || original.textContent || '')
                replacements.push(glitchChars[Math.floor(Math.random() * glitchChars.length)])
            }
        }
        attempts++
    }

    if (selectedWrappers.length === 0) return

    // PHASE 1: Apply vintage effect WHEN changing to glitch characters
    requestAnimationFrame(() => {
        // Apply vintage effects to the entire element
        applyTextGlitch(element, 150)
        digitalNoise(element)

        // Show glitch characters
        selectedWrappers.forEach((wrapper, idx) => {
            overlays[idx].textContent = replacements[idx]
            wrapper.classList.add('glitching')
        })

        // PHASE 2: Keep glitch characters visible for displayDuration (user can read them)
        setTimeout(() => {
            // PHASE 3: Apply vintage effect WHEN restoring original characters
            requestAnimationFrame(() => {
                applyTextGlitch(element, 150)
                chromaticAberration(element)

                // Restore original characters
                selectedWrappers.forEach((wrapper, idx) => {
                    overlays[idx].textContent = originalChars[idx]
                    wrapper.classList.remove('glitching')
                })
            })
        }, displayDuration)
    })
}

/* ============================================
   PERIODIC GLITCH FUNCTIONS
   ============================================ */

/**
 * START CHARACTER GLITCH - Flexible for any element
 * Can be used on words, paragraphs, headings, spans, etc.
 * NOW WITH VINTAGE EFFECTS SYNCHRONIZED TO CHARACTER CHANGES
 *
 * @param element - The HTML element to apply glitch effects to
 * @param config - Configuration options including intensity and custom intervals
 * @returns Cleanup function to stop all glitch intervals
 *
 * @example
 * const cleanup = startCharacterGlitch(element, {
 *   intensity: 'low',
 *   singleCharInterval: 30000,
 *   multiCharInterval: 60000
 * })
 * // Later: cleanup() to stop glitching
 */
export function startCharacterGlitch(
    element: HTMLElement,
    config: GlitchConfig = {}
): () => void {
    const fullConfig = { ...defaultGlitchConfig, ...config }
    const preset = intensityPresets[fullConfig.intensity || 'medium']
    const intervals: NodeJS.Timeout[] = []

    // Wrap characters immediately
    wrapCharactersWithOverlay(element)

    // Use custom intervals if provided, otherwise use preset values
    const singleInterval = config.singleCharInterval ?? preset.singleCharInterval
    const multiInterval = config.multiCharInterval ?? preset.multiCharInterval

    // Single character glitch with vintage effects
    intervals.push(
        setInterval(() => {
            smoothCharacterGlitch(element, preset.duration, preset.displayDuration)
        }, singleInterval)
    )

    // Multi-character glitch with vintage effects
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.7) {
                smoothMultiCharGlitch(element, preset.numChars, preset.duration, preset.displayDuration)
            }
        }, multiInterval)
    )

    return () => {
        intervals.forEach(clearInterval)
    }
}

/**
 * SMOOTH periodic glitch - VINTAGE EFFECTS ONLY (no character replacement)
 * Use this for elements you DON'T want character replacement on
 *
 * @param element - The HTML element to apply CSS glitch effects to
 * @param config - Configuration options
 * @returns Cleanup function to stop all glitch intervals
 */
export function startPeriodicGlitch(
    element: HTMLElement,
    config: GlitchConfig = defaultGlitchConfig
): () => void {
    const intervals: NodeJS.Timeout[] = []

    // RGB glitch effect - VINTAGE
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.5) {
                applyTextGlitch(element, 150)
            }
        }, config.textGlitchInterval || 8000)
    )

    // Chromatic aberration - VINTAGE
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.6) {
                chromaticAberration(element)
            }
        }, 2500)
    )

    // Digital noise - VINTAGE
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.4) {
                digitalNoise(element)
            }
        }, 4500)
    )

    return () => {
        intervals.forEach(clearInterval)
    }
}

/**
 * Starts periodic border glitch on terminal containers
 *
 * @param element - The HTML element to apply border glitch to
 * @param interval - Milliseconds between glitch attempts
 * @returns Cleanup function
 */
export function startBorderGlitch(
    element: HTMLElement,
    interval: number = 12000
): () => void {
    const intervalId = setInterval(() => {
        if (Math.random() < 0.5) {
            applyBorderGlitch(element, 150)
        }
    }, interval)

    return () => clearInterval(intervalId)
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Random glitch trigger - applies random effect to random element
 */
export function randomGlitchEvent(elements: HTMLElement[]): void {
    const randomElement = elements[Math.floor(Math.random() * elements.length)]

    if (randomElement) {
        const effects = [
            () => applyTextGlitch(randomElement),
            () => chromaticAberration(randomElement),
            () => digitalNoise(randomElement),
            () => smoothCharacterGlitch(randomElement),
        ]

        const randomEffect = effects[Math.floor(Math.random() * effects.length)]
        randomEffect()
    }
}

/**
 * Get intensity preset configuration
 * Useful if you want to access preset values directly
 */
export function getIntensityPreset(intensity: 'low' | 'medium' | 'high') {
    return intensityPresets[intensity]
}