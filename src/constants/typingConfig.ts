// constants/typingConfig.ts

/**
 * SINGLE SOURCE OF TRUTH for all typing behaviour across the portfolio.
 *
 * Tune the entire typing "feel" from this one file. Components never hold
 * speeds or delays; they read them from here.
 *
 * The model (Phosphor review, "Typing that feels human and never blocks"):
 * - a person types the *command* in bursts: common letter pairs come out fast
 *   and the pause sits at the start of each word;
 * - hands and fingers matter: alternating hands is quick, the same finger on
 *   two different keys is slow, Shift costs a beat, and fast pairs sometimes
 *   roll over (the next key goes down before the last comes up);
 * - gaps between keys are log-normal: mostly quick, now and then a slow one;
 * - they hesitate before a flag or a path, and check the line before Enter;
 * - now and then they make a typo (a neighbouring key, swapped or doubled
 *   letters, or one only noticed a few keys later) and backspace it;
 * - the *machine* prints the answer line by line at about 30 ms a line.
 */

/* ============================================
   SECTION IDS
   ============================================ */

export type SectionId = 'hero' | 'about' | 'projects' | 'experience' | 'contact' | 'terminal'

/* ============================================
   HUMAN TYPING — the per-character delay model
   ============================================ */

export const typingFeel = {
    /** Base delay per character (ms) */
    baseDelay: 52,

    /** First letter of a word: the typist finds the next word */
    wordStartMultiplier: 1.6,

    /** Common letter pairs roll off the fingers */
    bigramMultiplier: 0.6,
    bigrams: new Set([
        'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'st', 'es', 'or', 'te', 'ti', 'is', 'it',
        'ar', 'ca', 'ls', 'ro', 'ol', 'le', 'xt', 'pr', 'oj', 'ec', 'ts', 'wh', 'ho', 'am', 'mi', 'ct', 'je',
    ]),

    /** Space: d × multiplier + a random 40–100 ms thumb beat */
    spaceMultiplier: 0.8,
    spaceExtraMin: 40,
    spaceExtraMax: 100,

    /** Path and punctuation keys are deliberate */
    slowChars: './-_',
    slowCharMultiplier: 1.35,

    /** The next key is on the other hand: it is already waiting */
    otherHandMultiplier: 0.85,
    /** The same finger has to travel to a different key ("ed", "un", "ce") */
    sameFingerMultiplier: 1.3,
    /** The same key twice ("ll", "ss") is a quick double tap */
    doubleLetterMultiplier: 0.75,
    /** Capitals and shifted symbols wait for Shift */
    shiftMultiplier: 1.25,

    /** A beat before a flag or a path (a word starting with - . ~ /), ms */
    tokenPauseChars: '-.~/',
    tokenPauseMin: 120,
    tokenPauseMax: 260,

    /**
     * Rollover: in a fast pair across the two hands the next key goes down
     * before the last is released, so the two land almost together.
     */
    rolloverChance: 0.12,
    rolloverMin: 12,
    rolloverMax: 28,

    /**
     * Jitter is log-normal (mostly quick strokes, now and then a slow one):
     * delay × e^(sigma·z), z ~ N(0, 1), clamped to [jitterMin, jitterMax].
     */
    jitterSigma: 0.25,
    jitterMin: 0.65,
    jitterMax: 2,

    /** Typed commands end with Enter, after a beat to read the line (ms) */
    enterPauseMin: 180,
    enterPauseMax: 340,
} as const

/* ============================================
   RARE CORRECTIONS
   A typo, a beat to notice it, backspace (with sound), the right keys.
   ============================================ */

export type TypoKind = 'neighbour' | 'late' | 'swap' | 'double'

export const corrections = {
    /** Chance per eligible letter */
    probability: 0.03,
    /** Never in the first characters of a line */
    minIndex: 4,
    /** At most one correction per line */
    maxPerLine: 1,
    /** The beat before noticing the mistake (ms): 170–280 */
    noticeMin: 170,
    noticeMax: 280,
    /** Backspace to the correct key (ms) */
    afterBackspace: 80,
    /** Between backspaces when deleting several keys: a quick burst (ms) */
    backspaceRepeat: 55,
    /**
     * How often each kind of typo is chosen (relative weights):
     * neighbour — the key next to the right one;
     * late — a neighbour key, noticed only 1–3 keys later;
     * swap — two letters in the wrong order ("teh");
     * double — one letter twice.
     */
    kinds: { neighbour: 0.45, late: 0.25, swap: 0.15, double: 0.15 } satisfies Record<TypoKind, number>,
    /** A late typo is noticed after this many more keys */
    lateMin: 1,
    lateMax: 3,
} as const

/** QWERTY neighbour used for a mistyped letter. */
export const NEIGHBOUR_KEYS: Readonly<Record<string, string>> = {
    a: 's', b: 'v', c: 'x', d: 's', e: 'w', f: 'd', g: 'f', h: 'j', i: 'u', j: 'h', k: 'l', l: 'k', m: 'n',
    n: 'm', o: 'i', p: 'o', q: 'w', r: 't', s: 'a', t: 'r', u: 'y', v: 'c', w: 'e', x: 'z', y: 't', z: 'x',
}

/* ============================================
   PER-SECTION FEEL
   speedScale multiplies every delay (1 = the model above).
   corrections: whether this section's typist ever makes a typo.
   ============================================ */

interface SectionTypingConfig {
    speedScale: number
    corrections: boolean
}

const sectionTypingConfigs: Record<SectionId, SectionTypingConfig> = {
    hero: { speedScale: 1, corrections: true },
    about: { speedScale: 0.95, corrections: true },
    projects: { speedScale: 1, corrections: true },
    experience: { speedScale: 1, corrections: true },
    contact: { speedScale: 1, corrections: false },
    // The interactive terminal's banner and `cd` status lines: brisk, no typos
    terminal: { speedScale: 0.5, corrections: false },
}

export function getSectionTyping(sectionId: SectionId): SectionTypingConfig {
    return sectionTypingConfigs[sectionId]
}

/* ============================================
   MACHINE OUTPUT
   ============================================ */

export const outputTimings = {
    /** One output line every ~30 ms, each with a short phosphor flare */
    lineMs: 30,
    /** A blank line or a section rule holds the stream a little longer */
    pauseLineMs: 70,
    /** Agent replies still type character by character (ms per char) */
    agentCharMs: 18,
} as const

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
   KEYSTROKE SOUND — how one key sounds
   Each recorded clip holds a key going down and coming back up; they are
   played separately so the gap between them varies like a real finger.
   ============================================ */

export const keySound = {
    /** Key-up comes this long after key-down (ms) */
    releaseMinMs: 70,
    releaseMaxMs: 140,
    /** Key-up level relative to the recording */
    releaseGain: 0.9,

    /**
     * Every key has its own voice, fixed for the visit: one of the clips, a
     * pitch within ±fingerprintCents and a tone (low-pass) in a range. Each
     * press then varies only slightly around it.
     */
    fingerprintCents: 22,
    toneMinHz: 5000,
    toneMaxHz: 11000,
    variationCents: 7,
    variationDb: 1.5,

    /**
     * Force follows speed: keys in a fast burst land lighter, the first key
     * after a pause lands harder. Interval since the previous key (ms) → gain.
     */
    fastMs: 60,
    fastGain: 0.78,
    steadyMs: 220,
    pauseMs: 700,
    pauseGain: 1.12,

    /** Stereo spread across the keyboard: −panWidth/2 (left edge) … +panWidth/2 */
    panWidth: 0.6,

    /** The space bar: deeper and longer, with a short stabiliser rattle (clip = index into KEY_CLIPS) */
    space: { clip: 3, detune: -260, lowpass: 2600, gain: 0.95, rattleMinMs: 14, rattleMaxMs: 24, rattleGain: 0.22, releaseMinMs: 110, releaseMaxMs: 170 },
    /** Enter: a firm, deliberate press */
    enter: { clip: 1, detune: -120, lowpass: 4200, gain: 1.15, releaseMinMs: 120, releaseMaxMs: 180 },
    /** Backspace: a little brighter */
    backspace: { detune: 70, lowpass: 9000, gain: 0.95 },
} as const

/* ============================================
   SEQUENCE PACING
   Pauses between the steps of a section's intro. Elements may override one
   step with data-delay, but the values themselves live here.
   ============================================ */

export const sequenceTimings = {
    /** Before the first command starts typing (ms) */
    initialDelay: 200,

    /** After Enter, before the command's output prints (ms) */
    postCommandDelay: 90,

    /** After output, before the next command starts (ms) */
    betweenCommandsDelay: 200,

    /** Between consecutive output blocks, e.g. timeline entries (ms) */
    staggerDelay: 30,

    /** A deliberate longer beat (the hero's description, the superuser prompt) */
    dramaticPause: 600,
} as const

/* ============================================
   SKIP AND RETURNING VISITORS
   ============================================ */

export const skipConfig = {
    /** localStorage key: the "# press any key to skip" hint has been shown */
    hintSeenKey: 'portfolio-skip-hint-seen',
} as const

/**
 * When a section starts and stops.
 */
export const sectionStart = {
    /**
     * Browsers block sound until the visitor clicks or presses a key (a
     * refresh resets that). On: a section about to type waits, caret blinking
     * with "press any key or click to start", for that first gesture — so its
     * typing is heard. Off: it types straight away, silently until then.
     * Never waits when sound is muted, in plain mode or under reduced motion.
     */
    waitForSound: true,
    /**
     * Leaving a section before its intro finishes: 'restart' resets it so it
     * types from the beginning next time; 'finish' completes it instantly.
     */
    onScrollAway: 'restart' as 'restart' | 'finish',
}

/**
 * Returning visitors always skip the boot screen. With this off they still
 * watch every section type out (any key skips it); with it on, sections
 * print instantly for them (hero readable in ~0.5 s instead of ~3 s).
 */
export const returningVisitors = {
    printInstantly: false,
} as const
