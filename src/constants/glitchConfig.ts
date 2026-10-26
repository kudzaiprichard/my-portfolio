// constants/glitchConfig.ts
// The character glitch (components/shared/GlitchText, lib/glitchDirector).
// Tune how often and how hard text glitches here.

export const glitchConfig = {
    /** One glitch somewhere on screen every … ms (random in this range) */
    minGapMs: 900,
    maxGapMs: 2000,

    /** How often each effect is picked (relative weights) */
    weights: {
        /** A few characters flicker to random glyphs, then settle */
        flicker: 6,
        /** The whole text scrambles and decodes itself left to right */
        scramble: 3,
        /** A 160 ms red/cyan split plus a short flicker */
        rgb: 2,
    },

    /** flicker: how many characters, how many bursts, how long each */
    flickerChars: [1, 4] as const,
    flickerBursts: [2, 4] as const,
    flickerFrameMs: [55, 140] as const,

    /** scramble: ms per character to decode, and how fast glyphs change */
    scrambleCharMs: 28,
    scrambleFrameMs: 45,
    /** Long texts only scramble a stretch of this many characters */
    scrambleMaxChars: 48,

    /** The glyphs a character can turn into */
    glyphs: '█▓▒░#@$%&*+=/\\<>?!01ｱｲｳｴｵｶｷｸｹｺ',
} as const
