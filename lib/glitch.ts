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
        duration: 100,               // Show for 100ms
    },
    medium: {
        singleCharInterval: 1500,    // Every 1.5 seconds
        multiCharInterval: 3000,     // Every 3 seconds
        numChars: 2,                 // 2-3 characters at a time
        duration: 120,               // Show for 120ms
    },
    high: {
        singleCharInterval: 800,     // Every 0.8 seconds
        multiCharInterval: 1800,     // Every 1.8 seconds
        numChars: 3,                 // 3-5 characters at a time
        duration: 150,               // Show for 150ms
    },
}

/* ============================================
   CSS-BASED GLITCH EFFECTS
   ============================================ */

/**
 * Applies RGB split glitch effect (CSS animation only)
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
 * Subtle flicker effect (CSS-only)
 */
export function subtleFlicker(element: HTMLElement): void {
    element.classList.add('text-flicker-smooth')
    setTimeout(() => element.classList.remove('text-flicker-smooth'), 200)
}

/**
 * Shimmer text effect (CSS-only)
 */
export function shimmerText(element: HTMLElement): void {
    element.classList.add('text-shimmer-smooth')
    setTimeout(() => element.classList.remove('text-shimmer-smooth'), 150)
}

/**
 * Chromatic aberration effect (CSS-only, looks like character glitching)
 */
export function chromaticAberration(element: HTMLElement): void {
    element.classList.add('chromatic-aberration')
    setTimeout(() => element.classList.remove('chromatic-aberration'), 200)
}

/**
 * Scan line pass effect
 */
export function scanLineEffect(element: HTMLElement): void {
    element.classList.add('scan-line-pass')
    setTimeout(() => element.classList.remove('scan-line-pass'), 400)
}

/**
 * Wave distortion effect
 */
export function waveDistortion(element: HTMLElement): void {
    element.classList.add('wave-distortion')
    setTimeout(() => element.classList.remove('wave-distortion'), 300)
}

/**
 * Digital noise overlay
 */
export function digitalNoise(element: HTMLElement): void {
    element.classList.add('digital-noise')
    setTimeout(() => element.classList.remove('digital-noise'), 180)
}

/* ============================================
   CHARACTER REPLACEMENT GLITCH EFFECTS
   ============================================ */

/**
 * SMOOTH single character replacement - uses RAF for smoothness
 */
export function smoothCharacterGlitch(element: HTMLElement, duration: number = 120): void {
    const text = element.textContent || ''
    if (text.length === 0) return

    // Pick one random position (skip spaces)
    let randomPos
    let attempts = 0
    do {
        randomPos = Math.floor(Math.random() * text.length)
        attempts++
    } while (text[randomPos].trim() === '' && attempts < 10)

    if (text[randomPos].trim() === '') return

    const glitchChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ!@#$%^&*█▓▒░'
    const randomChar = glitchChars[Math.floor(Math.random() * glitchChars.length)]

    const originalText = text
    const glitchedText = text.substring(0, randomPos) + randomChar + text.substring(randomPos + 1)

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        element.textContent = glitchedText

        // Restore after delay using RAF
        setTimeout(() => {
            requestAnimationFrame(() => {
                if (element.textContent === glitchedText) {
                    element.textContent = originalText
                }
            })
        }, duration)
    })
}

/**
 * SMOOTH multi-character replacement - glitches multiple characters smoothly
 */
export function smoothMultiCharGlitch(
    element: HTMLElement,
    numChars: number = 2,
    duration: number = 150
): void {
    const text = element.textContent || ''
    if (text.length < 2) return

    const glitchChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ!@#$%^&*█▓▒░'
    const actualNumChars = Math.min(numChars + Math.floor(Math.random() * 2), text.length)

    const positions: number[] = []
    const replacements: string[] = []

    // Pick random positions (avoid spaces)
    let attempts = 0
    while (positions.length < actualNumChars && attempts < actualNumChars * 3) {
        const pos = Math.floor(Math.random() * text.length)
        if (text[pos].trim() !== '' && !positions.includes(pos)) {
            positions.push(pos)
            replacements.push(glitchChars[Math.floor(Math.random() * glitchChars.length)])
        }
        attempts++
    }

    if (positions.length === 0) return

    // Build glitched text
    const originalText = text
    const glitchedArray = text.split('')

    positions.forEach((pos, idx) => {
        glitchedArray[pos] = replacements[idx]
    })

    const finalGlitchedText = glitchedArray.join('')

    // Apply with RAF for smoothness
    requestAnimationFrame(() => {
        element.textContent = finalGlitchedText

        setTimeout(() => {
            requestAnimationFrame(() => {
                if (element.textContent === finalGlitchedText) {
                    element.textContent = originalText
                }
            })
        }, duration)
    })
}

/* ============================================
   PERIODIC GLITCH FUNCTIONS
   ============================================ */

/**
 * START CHARACTER GLITCH - Flexible for any element
 * Can be used on words, paragraphs, headings, spans, etc.
 *
 * @param element - The HTML element to apply glitch effects to
 * @param config - Configuration options including intensity
 * @returns Cleanup function to stop all glitch intervals
 *
 * @example
 * const cleanup = startCharacterGlitch(element, { intensity: 'high' })
 * // Later: cleanup() to stop glitching
 */
export function startCharacterGlitch(
    element: HTMLElement,
    config: GlitchConfig = {}
): () => void {
    const fullConfig = { ...defaultGlitchConfig, ...config }
    const preset = intensityPresets[fullConfig.intensity || 'medium']
    const intervals: NodeJS.Timeout[] = []

    // Single character glitch
    intervals.push(
        setInterval(() => {
            smoothCharacterGlitch(element, preset.duration)
        }, preset.singleCharInterval)
    )

    // Multi-character glitch
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.7) {
                smoothMultiCharGlitch(element, preset.numChars, preset.duration)
            }
        }, preset.multiCharInterval)
    )

    // RGB split effect
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.5) {
                applyTextGlitch(element, 150)
            }
        }, fullConfig.textGlitchInterval || 8000)
    )

    // Chromatic aberration (looks like glitching without changing text)
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.4) {
                chromaticAberration(element)
            }
        }, 3500)
    )

    return () => {
        intervals.forEach(clearInterval)
    }
}

/**
 * SMOOTH periodic glitch - CSS-only, no character replacement
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

    // RGB glitch effect
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.5) {
                applyTextGlitch(element, 150)
            }
        }, config.textGlitchInterval || 8000)
    )

    // Chromatic aberration
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.6) {
                chromaticAberration(element)
            }
        }, 2500)
    )

    // Shimmer effect
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.5) {
                shimmerText(element)
            }
        }, 3000)
    )

    // Subtle flicker
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.4) {
                subtleFlicker(element)
            }
        }, 4000)
    )

    // Scan line effect
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.3) {
                scanLineEffect(element)
            }
        }, 5000)
    )

    // Wave distortion
    intervals.push(
        setInterval(() => {
            if (Math.random() < 0.25) {
                waveDistortion(element)
            }
        }, 6000)
    )

    // Digital noise
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
 * Creates screen shake effect
 */
export function screenShake(duration: number = 300): void {
    document.body.style.animation = `screen-shake ${duration}ms ease-in-out`
    setTimeout(() => {
        document.body.style.animation = ''
    }, duration)
}

/**
 * Random glitch trigger - applies random effect to random element
 */
export function randomGlitchEvent(elements: HTMLElement[]): void {
    const randomElement = elements[Math.floor(Math.random() * elements.length)]

    if (randomElement) {
        const effects = [
            () => applyTextGlitch(randomElement),
            () => shimmerText(randomElement),
            () => chromaticAberration(randomElement),
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