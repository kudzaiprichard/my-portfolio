// constants/bootConfig.ts
// Boot behaviour and pacing. The <head> script in app/layout.tsx reads the
// same settings before first paint.

/** localStorage: this browser has booted the portfolio before. */
export const BOOTED_KEY = 'portfolio-booted'

/** sessionStorage: this tab has booted already (survives a refresh, not a new tab). */
export const TAB_BOOTED_KEY = 'portfolio-tab-booted'

export const bootBehaviour = {
    /**
     * Boot once per tab: on the first visit and in every new tab, but a
     * refresh in the same tab goes straight to the sections typing out.
     */
    oncePerTab: true,
    /**
     * Skip the boot screen for every returning visitor, in any tab (stricter
     * than oncePerTab).
     */
    skipForReturningVisitors: false,
    /**
     * Start the site on its own after autoContinueMs. Off: the boot waits for
     * [ start ] / [ start silent ] / any key. Browsers only allow sound after
     * a click or key press, so waiting is what lets the first section's
     * typing be heard.
     */
    autoContinue: false,
} as const

export const bootTimings = {
    /** One BIOS line every … ms */
    lineMs: 130,
    /** With autoContinue: the site starts on its own this long after landing */
    autoContinueMs: 1600,
    /** …but the log is always on screen at least this long */
    minVisibleMs: 700,
    /** CRT power-on (matches --dur-crt in globals.css) */
    powerOnMs: 900,
} as const
