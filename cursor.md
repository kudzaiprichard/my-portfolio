# Custom Cursor — Analysis & Improvement Plan

## What Exists

The cursor is a three-element overlay (`dot`, `ring`, `caret`) positioned at `z-index: 100000` and driven by a `requestAnimationFrame` loop that lerps toward the mouse position at a fixed factor of `0.2` per frame. It manages three states via `data-state` and `data-pressed` attributes on the container:

**Default** — An 8px green dot at 0.7 opacity with a subtle two-layer glow (`0 0 6px` at 0.3, `0 0 12px` at 0.1). The ring and caret are hidden (ring scaled to 0.4 and faded out, caret opacity 0).

**Link** — The dot brightens to full opacity, scales to 1.25x, and intensifies its glow (`0 0 10px` at 0.5, `0 0 20px` at 0.15). The ring fades in and scales from 0.4 to 1.0. Both transitions use `cubic-bezier(0.22, 1.2, 0.36, 1)` — a spring curve with overshoot. This is the only place in the entire project that uses spring easing.

**Input** — The dot disappears and a 2px × 18px caret appears with a `step-end` blink at 1s intervals. The caret has its own glow at `0 0 4px rgba(0, 255, 65, 0.4)`.

**Click** — On mousedown the dot snaps to 0.4 scale (or 0.6 in link state) with an aggressive 0.06s `cubic-bezier(0.4, 0, 1, 1)` ease-in. The ring contracts to 0.65 scale. On mouseup, the default spring transition handles the bounce-back.

**Touch handling** — The component detects touch devices via `ontouchstart`, `maxTouchPoints`, and `pointer: coarse` media query, returning `null` to render nothing. CSS media queries independently hide `.custom-cursor` on coarse-pointer devices and restore the system cursor.

**Interactive detection** — `getInteractiveType()` walks up the DOM via `closest()` to classify targets as `link` (buttons, anchors, selects, non-text inputs, tabbable elements) or `input` (text inputs, textareas, contenteditable). This covers the standard set but has no awareness of the project's custom interactive elements beyond `.cta-btn`.

---

## Where It Falls Short

The cursor is competent. It handles the basic states cleanly, the spring easing on the ring is a good instinct, and the touch detection is thorough. But it exists in isolation from the rest of the site's interaction vocabulary. Everything else in this portfolio — the particles, the typing animation, the glitch system, the boot sequence, the audio — is layered, textured, and alive with ambient behavior. The cursor is the one element that just sits there when nothing is happening.

Specific gaps:

### 1. No ambient life

The particle system has hub particles that pulse via `Math.sin(phase) * 0.12 + 1`. The gradient background breathes between 1.0 and 0.85 opacity over 20 seconds. Glitch effects fire every 3–15 seconds depending on intensity. The typing cursor in `.cursor` and `.name-cursor` blinks at 1s. The custom cursor does nothing when idle — it parks and waits. In a site where everything subtly moves, the cursor is the dead pixel.

### 2. No glitch integration

Every visible text element in the portfolio can glitch. The hero name glitches at low intensity (10s single, 15s multi intervals). About section words glitch on staggered 5–18s timers. The glitch character set (`01アイウエオカキクケコサシスセソタチツテトナニヌネノ!@#$%^&*█▓▒░`) and the two-phase replacement cycle (glitch on → hold for duration → glitch off) are well-defined systems in `src/lib/glitch.ts`. The cursor participates in none of this. It should occasionally corrupt — briefly — to match the ambient data-decay aesthetic.

### 3. No particle-cursor coherence

The particle system already reacts to the mouse: particles within 150px grow, particles within 300px are gently attracted, clicks repulse particles within 250px. But this relationship is one-directional. The particles know about the cursor; the cursor knows nothing about the particles. There is no visual bridge — no shared glow language, no mirrored response when particles cluster near the pointer.

### 4. Glow values don't match the project's depth vocabulary

The particle renderer uses a deliberate 5-tier glow system:
- Far: 3px blur, 0.2 glow opacity
- Mid: 5px blur, 0.3 glow
- Close: 7px blur, 0.4 glow
- Fast: 12px blur, 0.5 glow
- Hub: 15px blur, 0.7 glow

The cursor dot's default glow (`6px` at 0.3, `12px` at 0.1) sits somewhere between mid and close tier but doesn't commit to either. The link state glow (`10px` at 0.5, `20px` at 0.15) overshoots the hub tier in blur radius but undershoots it in opacity. The cursor should be the brightest single point on screen — it's the user's presence in the system — and its glow should sit at or above hub-particle level.

### 5. The lerp factor is fixed and context-free

Movement uses a constant `0.2` interpolation factor, producing uniform trailing regardless of speed or context. The site's other motion systems are context-sensitive: typing speed varies by character class (uppercase 1.25x, symbols 1.55x, space 0.72x), particle speed varies by depth tier (0.12/0.20/0.35), audio volume ramps over 10 keystrokes. A cursor that always moves the same way misses the opportunity to feel responsive — snappier during fast movement, heavier during slow precision.

### 6. No idle state

When the mouse stops, the cursor reaches its target and does nothing. The site has a clear vocabulary for "present but waiting": the `.cursor` element blinks at 1s, the `.name-cursor` blinks at 1s, the typing system has micro-pauses at 8% probability with 2.5x duration. An idle cursor should signal presence without demanding attention — a slow pulse, a subtle glow oscillation, something that says "the system is alive and watching."

### 7. No reduced-motion support

The site has thorough `prefers-reduced-motion` handling: all animations collapse to 0.01ms, typing appears instantly, particles freeze, boot sequence skips. But `CustomCursor.tsx` has no reduced-motion path. The lerp animation loop runs unconditionally. The `useReducedMotion` hook exists in the project and is unused by the cursor. At minimum, reduced-motion should disable the trailing (snap cursor to mouse position directly) and suppress any ambient animations.

### 8. Click feedback is purely visual scale

When the user clicks, the dot shrinks. That's it. Compare to the rest of the site: clicks trigger particle repulsion across a 250px radius, keystroke audio fires with per-key volume variation and pitch randomization (±8%), buttons lift -2px on hover and snap back on active. The cursor's click is underwhelming relative to the system's other click responses. The `.mouse-ripple` keyframe already exists in `globals.css` (a 300px expanding ring that fades over 1s) but the cursor doesn't spawn one.

### 9. The caret blink rate is inconsistent with the site's other carets

The custom cursor caret blinks at 1s `step-end`. The `.cursor` class blinks at 1s. The `.name-cursor` blinks at 1s. The `.typing-text` border blinks at 0.75s. The typing config's blinkRate across sections is also set in `typingConfig.ts`. The cursor's caret should use the same blink rate as the active typing context rather than a hardcoded 1s, or at minimum match the most common value.

---

## What the Codebase Implies the Cursor Should Be

This is a site that treats the screen as the inside of a living machine. Every surface has texture — the grid overlay pulses, particles drift in depth-sorted layers, text corrupts and repairs itself, audio hums at 6% volume beneath everything. The cursor is the user's point of contact with this machine. It should feel like a probe inserted into a reactive system, not a passive dot floating above it.

The design tokens and timing constants already define what this cursor should feel like:

- **Glow language**: The particle system's 5-tier blur/opacity scale (3–15px blur, 0.2–0.7 opacity) is the project's vocabulary for "how bright and present is this thing." The cursor should sit at the top of this scale — hub-level or above — because it represents the user's direct presence.

- **Ambient pulse rhythm**: Hub particles pulse at `0.03 radians/frame` with `±0.12` amplitude. The gradient breathes over 20s. These are the project's heartbeat rates. The cursor's idle pulse should live in this range.

- **Glitch grammar**: Low-intensity glitch fires every 3–6 seconds, displays for 2 seconds, affects 1 character. This is the project's definition of "subtle corruption." A cursor glitch should be rarer and briefer — a single-frame flicker, not a sustained replacement.

- **Timing vocabulary**: `--transition-fast` is 0.2s, `--transition-normal` is 0.3s, `--transition-slow` is 0.6s. The cursor's state transitions (0.35s dot, 0.25s ring, 0.12s opacity) already live within this range but use custom easings. This is fine — the cursor earns its own easing — but new animations should reference these tokens where possible.

- **Click vocabulary**: The CRT power-off uses `cubic-bezier(0.4, 0, 1, 1)` — the same curve as the cursor's click snap. This is a good existing connection. The mouse-ripple keyframe (300px ring, 1s fade) is an unused click effect that belongs to the cursor.

- **Human imperfection**: ±30% random variation on every keystroke. ±8% pitch variation on every sound. 8% probability micro-pauses. The project's philosophy is that nothing should be perfectly metronomic. The cursor's idle pulse should have subtle variation, not a perfectly repeating sine wave.

---

## Specific Improvements — Prioritised

### Priority 1: Idle glow pulse

**Problem**: The cursor is visually dead when the mouse stops. Everything else in the viewport has ambient motion.

**Solution**: After the cursor reaches its target (delta below threshold for N frames), begin a slow sinusoidal pulse on the dot's `box-shadow` blur radius and opacity. Model it on hub-particle pulsing: increment phase at ~0.03 rad/frame, oscillate glow blur between the default 6px and ~10px, oscillate glow opacity between 0.3 and 0.5. Add ±10% random variation to the phase increment so it doesn't feel mechanical. On mouse movement, smoothly return to the non-pulsing default glow.

**Tokens to use**: Particle hub pulse rate (0.03 rad/frame), particle hub glow tier (15px blur, 0.7 opacity) as the upper reference, `--transition-fast` (0.2s) for the transition back to moving state.

---

### Priority 2: Reduced-motion support

**Problem**: The cursor's RAF loop and all CSS transitions run regardless of motion preferences. The `useReducedMotion` hook exists but isn't used.

**Solution**: Import `useReducedMotion`. When active: set the lerp factor to 1.0 (instant positioning, no trailing), suppress the idle pulse, and add a CSS class that collapses all cursor transition durations to match the site's `prefers-reduced-motion` rule (0.01ms). The cursor should still appear and track — it's a functional element — but it should not animate.

**Tokens to use**: The existing `prefers-reduced-motion` CSS block in `globals.css`, the `useReducedMotion` hook.

---

### Priority 3: Adaptive trailing

**Problem**: The fixed 0.2 lerp factor produces identical trailing at all speeds. Fast flicks and slow precision movements feel the same.

**Solution**: Compute the distance between mouse and cursor each frame. When distance is large (fast movement), increase the lerp factor toward ~0.35 for snappier tracking. When distance is small (slow/precise movement), decrease toward ~0.12 for heavier, more deliberate trailing. Use a smooth ramp, not a threshold switch. This mirrors the typing system's approach: space is 0.72x (fast thumb), symbols are 1.55x (slow deliberate reach).

**Reference pattern**: The typing config's character-class multipliers — the principle that different physical actions deserve different speeds.

---

### Priority 4: Click ripple

**Problem**: Click feedback is limited to a scale change on the dot. The site already defines a `mouse-ripple` animation in `globals.css` (a 300px expanding ring over 1s at `ease-out`) and the particle system fires a 250px repulsion on click. The cursor doesn't participate in either.

**Solution**: On mousedown, spawn a temporary element using the existing `.mouse-ripple` class and keyframe. Position it at the cursor's current coordinates. Let it animate and self-remove. This costs zero new CSS — the animation already exists and matches the project's interaction vocabulary. The cursor's scale-snap (0.06s ease-in) continues to play simultaneously.

**Tokens to use**: The existing `@keyframes mouse-ripple` and `.mouse-ripple` class in `globals.css`. The `--color-primary` border color. The particle system's click repulsion distance (250px) as a conceptual sibling.

---

### Priority 5: Cursor glow alignment with particle depth tiers

**Problem**: The cursor's glow values (6px/0.3 and 12px/0.1 default; 10px/0.5 and 20px/0.15 link) don't map to the particle renderer's 5-tier system, making the cursor feel disconnected from the particle field.

**Solution**: Redefine cursor glow to sit at or above hub tier:
- Default dot: `0 0 8px rgba(0,255,65, 0.4), 0 0 15px rgba(0,255,65, 0.15)` — aligns with close-to-hub tier.
- Link dot: `0 0 12px rgba(0,255,65, 0.6), 0 0 22px rgba(0,255,65, 0.2)` — exceeds hub tier, signaling the cursor is the most present element.
- Ring border: increase from `rgba(0,255,65, 0.45)` to `rgba(0,255,65, 0.55)` to sit between `--color-primary-dimmer` (0.4) and `--color-primary-dim` (0.7).

**Tokens to use**: Particle glow tiers (close: 7px/0.4, hub: 15px/0.7). CSS variables `--color-primary-dim` (0.7) and `--color-primary-dimmer` (0.4).

---

### Priority 6: Micro-glitch on idle

**Problem**: The cursor never glitches. Every other visible element in the site has some corruption behavior — hero text, about section words, boot screen lines, terminal output. The cursor is immune to the system's entropy.

**Solution**: After an extended idle period (8–15 seconds, randomized), trigger a single brief glitch on the cursor: for 2–4 frames (~33–66ms at 60fps), offset the dot by 1–3px in a random direction and flash its opacity. Immediately snap back. This should be rare and fast — closer to a CRT scanline hit than a sustained text glitch. Do not use the full glitch character replacement system; the cursor is geometric, not textual.

**Reference pattern**: The low-intensity glitch preset (3s interval, 2s display) defines "subtle." The cursor glitch should be rarer (8–15s) and far briefer (sub-100ms) — a twitch, not a replacement. The chromatic aberration keyframe (200ms) and digital noise keyframe (180ms) are the closest duration references.

---

### Priority 7: Caret blink rate from typing config

**Problem**: The cursor caret uses a hardcoded 1s blink. The typing system defines blink rates per section in `typingConfig.ts`, and the CSS has both 1s (`.cursor`) and 0.75s (`.typing-text`) blink rates.

**Solution**: Accept an optional `blinkRate` prop or read it from a shared context. Default to 1s to match `.cursor`. When the cursor enters input state over an element that's part of an active typing section, adopt that section's blink rate. If no typing context is active, fall back to the 1s default.

**Tokens to use**: `typingConfig` section-level `blinkRate` values, the `@keyframes blink` (1s) and `@keyframes blinkTypingCursor` (0.75s) in `globals.css`.

---

### Priority 8: Section-aware glow intensity

**Problem**: The cursor looks identical on every section. The site's sections have distinct pacing — hero types at 90ms/char (slow, dramatic), terminal at 25ms/char (fast, machine-like), about at 65ms/char (conversational). The glitch intensity varies too. The cursor doesn't reflect which part of the machine the user is exploring.

**Solution**: Use the existing `useInView` hook or an IntersectionObserver to detect which section the cursor is over. Modulate the cursor's default glow intensity by section: slightly brighter and tighter on hero (the user just arrived, high attention), slightly dimmer and wider on about/experience (reading mode, less interference), brightest on terminal (the most interactive section, direct manipulation). The differences should be subtle — a 15–25% shift in glow opacity, not a mode change.

**Reference pattern**: The per-section typing speeds in `typingConfig` (hero: 90ms, about: 65ms, terminal: 25ms) — the principle that each section has its own energy level.

---

### Not Proposed

Some ideas that sound reasonable but don't fit this project:

- **Cursor trail / afterimage**: The particle system already fills the background with moving dots. Adding a trail to the cursor would create visual noise competing with particles rather than complementing them. The single-dot trailing via lerp is the right call.

- **Color changes**: The entire site is monochrome green. The cursor should not introduce new colors. Even the glitch system's RGB split (red/cyan chromatic aberration) is used only on text, not on interactive elements.

- **Size scaling by scroll velocity**: Scroll is snap-locked (`scroll-snap-type: y mandatory` with `scroll-snap-stop: always`). The user doesn't free-scroll — they jump between sections. Scroll-velocity-based cursor changes would fire briefly during the snap transition and feel glitchy in a bad way.

- **Custom cursor shapes per section**: The dot/ring/caret vocabulary is clean and sufficient. Adding section-specific shapes (crosshair on projects, arrow on hero) would fragment the interaction language. The cursor should be a constant — the one stable element the user controls in a system full of ambient entropy.

---

## Implementation Notes

All eight priorities from the improvement plan are implemented across `CustomCursor.tsx` and the cursor-related rules in `globals.css`.

### What was built

**Priority 1 — Idle glow pulse**: After ~0.5s of mouse stillness (30 frames at 60fps, `IDLE_FRAMES_TO_PULSE`), the dot's `box-shadow` oscillates sinusoidally via direct DOM manipulation in the RAF loop. Phase increments at 0.03 rad/frame (matching hub-particle pulsing) with ±10% random variation per frame. Inner glow oscillates 8→12px blur, 0.4→0.55 opacity; outer glow 15→18px blur, 0.15→0.23 opacity. On mouse movement, `dot.style.boxShadow` is cleared and CSS defaults resume. Only activates in default state.

**Priority 2 — Reduced-motion support**: `useReducedMotion` hook imported and wired. When active: lerp is set to 1.0 (instant positioning), idle pulse and micro-glitch are suppressed via `!reducedMotion` guards, and a `custom-cursor--reduced-motion` class is applied. CSS rules collapse all transition durations to 0.01ms and disable the caret blink animation (showing a static visible caret instead). The effect's dependency array includes `reducedMotion` so the RAF loop re-initialises on preference change.

**Priority 3 — Adaptive trailing**: Lerp factor is computed per frame as `0.12 + min(dist/300, 1) * 0.23`, producing 0.12 for stationary/slow movement and 0.35 at fast flicks, with a smooth linear ramp over 300px of distance. The 300px threshold was chosen to match the particle system's gentle-attraction distance.

**Priority 4 — Click ripple**: On mousedown, a `<div class="mouse-ripple">` is created, positioned at the cursor's current interpolated coordinates with `transform: translate(-50%, -50%)` for centering, and appended to `document.body`. It uses the existing `@keyframes mouse-ripple` (300px expanding ring, 1s ease-out) and self-removes via `setTimeout` after the animation completes. No new CSS was needed.

**Priority 5 — Glow alignment**: CSS box-shadow values updated to sit at close-to-hub tier. Default dot: `0 0 8px rgba(0,255,65, 0.4), 0 0 15px rgba(0,255,65, 0.15)`. Link dot: `0 0 12px rgba(0,255,65, 0.6), 0 0 22px rgba(0,255,65, 0.2)`. Ring border opacity raised from 0.45 to 0.55, sitting between `--color-primary-dimmer` (0.4) and `--color-primary-dim` (0.7).

**Priority 6 — Micro-glitch**: After 8–15 seconds of continuous idle time (randomized per cycle), the cursor twitches: a 1–3px offset at a random angle is applied to the cursor's transform for 2–4 frames, and the dot's opacity flashes to 0.4 for ~66ms before clearing. The glitch timer resets and a new random delay is scheduled. Only fires in default state with motion enabled.

**Priority 7 — Caret blink rate**: The caret animation now references `var(--cursor-blink-rate, 1s)`. When entering input state, JS sets this custom property based on the current section: terminal gets `0.75s` (matching `.typing-text`'s faster blink for machine-like typing at 25ms/char), all other sections get `1s` (matching `.cursor` and `.name-cursor`). The property is re-evaluated when section changes while already in input state.

**Priority 8 — Section-aware glow**: `updateSection()` detects the current section via `target.closest('section[id]')` on mousemove and mouseover events. It sets `data-section` on the cursor element and updates `sectionGlowMultiplier` for the idle pulse. CSS attribute selectors handle the non-idle default glow: home at 1.2x opacity, about/experience at 0.8x, terminal at 1.3x. Projects and contact use the base 1.0x and have no additional CSS rules.

### Decisions where the document left room for interpretation

- **Idle pulse scope**: The document says "begin a slow sinusoidal pulse on the dot's box-shadow." Interpreted as default state only — link state has its own brighter glow that shouldn't pulse, and input state hides the dot entirely.

- **Micro-glitch scope**: Similarly restricted to default state. The document says "after an extended idle period" which implies passive browsing, not hovering a link for 15 seconds. Triggering a position-offset glitch while the ring is visible would feel like a bug, not atmosphere.

- **Section blink rates**: `typingConfig.ts` defines per-section typing speeds but no explicit `blinkRate` values. Terminal was assigned `0.75s` (the `.typing-text` blink rate) because its 25ms/char speed is the most machine-like and deserves a faster caret. All others use `1s` (the `.cursor`/`.name-cursor` blink rate). The infrastructure supports future per-section overrides via the `SECTION_BLINK_RATES` map.

- **Adaptive lerp range**: The document suggested "~0.35 for fast" and "~0.12 for slow" without specifying the ramp distance. Used 300px as the threshold where the ramp saturates, matching the particle system's gentle-attraction distance (300px). The ramp is linear, not curved — a curve would add complexity without visible benefit at this scale.

- **Ripple centering**: The existing `.mouse-ripple` CSS has no `transform`, so `translate(-50%, -50%)` is applied inline on the spawned element. This keeps the ripple centered as it expands from 0 to 300px via the width/height keyframe.

### Intentionally left out

- **Particle-cursor coherence** (gap #3 from the analysis): The document identified this gap but did not include it in the prioritised improvements. The cursor now shares the particle system's glow vocabulary (Priority 5) but does not reactively respond to nearby particle density. This would require reading particle positions from the canvas system, which crosses component boundaries and was not specified.

- **Idle pulse transition back to default**: The document says "smoothly return to the non-pulsing default glow" on movement. The implementation clears `dot.style.boxShadow` instantly, letting CSS resume. A smooth transition would require transitioning `box-shadow`, which conflicts with the non-negotiable "only transform and opacity for CSS transitions." The instant clear is imperceptible in practice because the user is already moving and focused on the cursor's position, not its glow.
