# Portfolio Audit

## Executive Summary

This is a well-architected, deeply-considered creative portfolio. The animation system — a custom imperative state machine driving character-by-character typing with 7-layer human-feel delay calculation, audio feedback, and centralized configuration — is genuinely impressive engineering. The section component pattern is consistent, the boot sequence is theatrical, and the particle system creates real depth. The codebase is clean, well-documented, and the README is among the best onboarding guides I've seen for a personal project. That said, there are real issues: a bug that defeats the keyboard-region-aware audio feature, no `prefers-reduced-motion` support in the JavaScript animation systems, accessibility gaps that would make this unusable for screen reader users during animation, and a set of dead code and type inconsistencies that signal unfinished cleanup. The most impactful improvements are fixing the audio character passthrough, adding reduced-motion support, and reconsidering the scroll-and-reset animation behaviour on completed sections.

---

## 1. Animation System

**[LOW]** — AnimationController state machine is correct and robust
The `idle -> running -> completed/cancelled` lifecycle is well-implemented. `clearAllTimers()` bulk-clears all pending `setTimeout` handles on cancel. The timer array pattern guarantees no orphaned callbacks. `start()` correctly rejects if already `running` or `completed`. `pause()`/`resume()` handle elapsed time accounting. No issues found with the core state machine.

**[MEDIUM]** — Potential race between IntersectionObserver and audio control readiness
The start-condition `useEffect` gates on `isBooted && isInView && audio.isAudioReady && audio.hasAudioControl && !animation.isCompleted && !animation.isRunning`. The `isAudioReady` flag is set via a `setTimeout(100)` in `useKeystrokeAudio`. If the user is already scrolled to a section when the page loads and the boot completes, there's a ~100ms window where `isInView` and `isBooted` are both true but `isAudioReady` is false. Since the effect re-runs when `isAudioReady` changes, the animation will start 100ms late. This is functionally correct but the artificial 100ms readiness delay has no clear purpose — it could be removed.

**[MEDIUM]** — `renderStaticContent` re-attaches glitch refs on completed sections
When the section transitions from animating to static, the `nameRef` (or equivalent) moves from the animating DOM to the static DOM. However, the glitch `useEffect` is gated on `[showOutput, isInView]`, and `showOutput` remains `true`. The effect's cleanup fires (clearing old intervals), but the new static DOM element gets the ref and the effect re-runs, re-wrapping the static content in glitch overlays. This is correct behaviour — glitch continues on static content. But if the user scrolls away and back, the glitch effect re-starts with fresh intervals even though the animation is completed. This is fine visually but worth noting: glitch intervals accumulate if the cleanup doesn't fire between scroll-away and scroll-back (it does fire — the `isInView` dependency handles this correctly).

**[LOW]** — `useInView` re-creates observer when `hasBeenInView` changes
The observer setup effect at `useInView.ts:87` includes `hasBeenInView` in its dependency array. When a section first enters the viewport, `setHasBeenInView(true)` fires inside the observer callback, which causes the effect to re-run and re-create the observer. Since `triggerOnce` is `false` for all sections, this re-creation happens once per section. It's harmless but unnecessary — `hasBeenInView` only needs to be in the deps for the `triggerOnce` early-return guard, and since sections don't use `triggerOnce`, the observer teardown/recreation is wasted work.

**[LOW]** — HeroSection uses custom inline delays instead of `sequenceTimings`
`HeroSection.tsx:105` uses `createDelayStep(800)` and `:126` uses `createDelayStep(400)`. `ProjectsSection.tsx:146,153` uses `600` and `300`. `ExperienceSection.tsx:142` uses `200` per item. These are intentional per-section pacing choices, not bugs, but they break the "single source of truth" claim. Consider adding named constants to `sequenceTimings` like `heroNameRevealDelay`, `experienceItemStagger`, etc., or documenting that `sequenceTimings` covers defaults and sections may override with inline values.

---

## 2. Audio System

**[CRITICAL]** — Keyboard-region-aware sound selection is completely broken
`useTypingAudioCallback` at `useKeystrokeAudio.ts:353-369` receives the actual `char` from the typing animation but only passes `keyType` (either `'regular'`, `'space'`, or `'enter'`) to `audio.playKeystroke(keyType)`. Inside `playKeystroke` at line 279, when `keyType === 'regular'`, the char is hardcoded to `'e'`:
```ts
const char = keyType === 'space' ? ' ' : keyType === 'enter' ? '\n' : 'e'
```
This means `selectSoundFile` always receives `'e'` for regular keystrokes. Since `'e'` maps to `getKeyboardRegion('e') -> 'left'`, every regular keystroke is treated as a left-hand character. The entire right-hand sound pool is never selected for regular keystrokes. The region-aware feature — one of the more creative audio design decisions — is non-functional.

**Fix:** Change `playKeystroke` to accept an optional `char` parameter, and pass the actual character through from `useTypingAudioCallback`. The volume calculation also uses this char for uppercase/punctuation volume boosts, which are similarly broken.

**[MEDIUM]** — `new Audio()` per keystroke creates unnecessary GC pressure
Each keystroke creates a new `Audio` object, plays it, and discards it. For a section with ~50 typed characters, that's 50 `Audio` instances created and garbage-collected. While modern browsers handle this well enough, an object pool of 4-6 pre-created `Audio` elements (one per sound file) would eliminate allocation entirely and reduce first-keystroke latency from file fetch to zero.

**Recommendation:** Pre-create `Audio` objects for each sound file on mount. On play, clone the node (`audio.cloneNode()`) or reset `currentTime` and replay. This also eliminates the browser cache dependency for first-keystroke latency.

**[MEDIUM]** — Browser autoplay policy could cause silent first keystrokes
The audio system catches `NotAllowedError` silently (line 286). On browsers that enforce autoplay policy (Chrome, Safari), if the user hasn't interacted with the page before the first section animation starts, all audio will fail silently. The boot screen button click counts as a user interaction, which should satisfy autoplay policy on first visit. But on return visits (where `sessionStorage` skips the boot), there's no guaranteed user interaction before the hero section starts typing. If the browser unloads the autoplay gesture between sessions, the first section could be entirely silent.

**Recommendation:** Add a one-time interaction listener that sets an `audioUnlocked` flag. Don't gate animation start on it — that would delay the experience — but log or track when autoplay fails so you know the scope of the issue.

**[LOW]** — Volume ramp decay timer is never cleaned up on section transition
When a section loses audio control (scroll away), `releaseAudioControl` is called, but `volumeRampTimerRef` may still have a pending decay timeout. The timer fires after the section no longer has control, which calls `keystrokeCountRef.current = Math.max(...)`. This is harmless since the ref value isn't used when the section doesn't have control, but it's a loose end.

**[LOW]** — Mute toggle works correctly across refreshes
Mute state is persisted in `localStorage['keystroke-audio-muted']` and restored on mount. However, there's no mute toggle UI visible anywhere in the sections. The `toggleMute` and `setMuted` functions are exposed but never wired to a button. Users have no way to mute the audio short of browser-level controls.

---

## 3. Typing Feel

**[LOW]** — The combined multiplier stack produces genuinely convincing results
The 7-layer delay calculation (char class, extension, positional, slow-char, repeated-char, random pause, natural variation) is well-tuned. The `±30%` natural variation prevents mechanical periodicity. The positional multipliers (slow start, fast middle, hesitant end) match real typing rhythm. The `repeatedCharMultiplier: 0.8` for doubled characters is a subtle, correct observation about muscle memory.

**[LOW]** — Per-section overrides are well-chosen
Hero's `startSpeedMultiplier: 2.2` creates a dramatic, deliberate entrance. About's `middleSpeedMultiplier: 0.65` makes the longer commands feel fluid. Projects' `extensionSpeedMultiplier: 3.0` (lower than global 3.5) tones down the file extension drama for the section that types the most path-like text. These feel intentional and effective.

**[MEDIUM]** — Extension slowdown applies to the entire extension, not just the dot
In `useTypingAnimation.ts:108`, the extension detection checks `index >= extensionStart` where `extensionStart = fullText.lastIndexOf('.')`. This means the dot *and* every character after it get the multiplier. For `cat role.txt`, the characters `.`, `t`, `x`, `t` are all slowed by 4x (hero config). The dot slowdown is satisfying. But `t`, `x`, `t` being uniformly slow after the dot feels slightly mechanical — a real typist would slow for the dot, then type the extension characters at near-normal speed since they're finishing a known filename. Consider applying the full multiplier only to the dot and the first extension character, then ramping back toward 1.0 for subsequent characters.

**[LOW]** — `charClassMultipliers.space: 0.85` could be slightly faster
Space is the most practiced keystroke for any typist — it's a thumb hit with no targeting. 0.85x is barely faster than baseline. A value of 0.70-0.75 would make the flow feel more natural, especially in commands with multiple spaces like `ls -la ./tech_stack/`.

---

## 4. Glitch System

**[LOW]** — 2-phase glitch implementation is correct
The `smoothCharacterGlitch` and `smoothMultiCharGlitch` functions correctly use `requestAnimationFrame` for both phases, preventing layout thrash. The `wrapCharactersWithOverlay` function is idempotent (guarded by `data-glitch-wrapped`). The overlay approach (visibility toggle via CSS class rather than text replacement) is clean.

**[MEDIUM]** — No cleanup if element is removed mid-glitch-cycle
`startCharacterGlitch` returns a cleanup function that clears the `setInterval` handles. But if the element is removed from the DOM between phase 1 and phase 2 (the `setTimeout` inside `smoothCharacterGlitch`), the phase 2 callback will run against a detached or null element. `querySelector` on a detached element returns `null`, and `classList.remove` on null would throw. In practice, this can't happen in the current codebase because sections stay mounted and glitch effects are only started when output is visible and in-view. But the glitch functions themselves have no defensive null checks for the phase 2 callback.

**Recommendation:** Add a guard in the phase 2 `setTimeout` callback: check if the element is still connected to the DOM (`element.isConnected`) before proceeding.

**[LOW]** — Intensity tuning is appropriate for a portfolio
The `low` preset (3s single / 6s multi / 2s display) is subtle enough to feel atmospheric without being distracting. The sections use `low` intensity with long custom intervals (10-18 seconds), which is the right call — a portfolio needs to be readable. The glitch adds character without interfering with content.

**[LOW]** — Glitch works correctly on static content
When the section transitions to `renderStaticContent()`, the glitch refs re-attach to the new DOM elements. The old glitch intervals are cleaned up by the `useEffect` return, and new intervals start on the static elements. The character wrapping is re-applied since the static DOM is fresh (no `data-glitch-wrapped` attribute). This is correct.

---

## 5. Particle System

**[LOW]** — Spatial distribution creates genuine depth
The three-tier depth system (far/mid/close) with different sizes, speeds, and opacities is effective. Hub particles (20%, 1.5x larger, brighter, pulsing) create natural focal points. The 3x3 zone grid prevents the common problem of particles clumping in corners. Filler particles (opacity 0.1-0.25) fill background gaps without visual noise. The overall composition reads as depth, not flatness.

**[MEDIUM]** — `connectParticles` is O(n^2) with no spatial partitioning
For 200 particles at 60fps, this is 40,000 distance checks per frame — 2.4M checks/second. Each check involves a `Math.sqrt` call. On modern hardware this is fine, but it's the single most expensive operation on the page. If you ever increase particle count or target lower-end devices, this will be the first bottleneck.

**Recommendation for later:** A grid-based spatial hash would reduce this to near-O(n), but given that 200 particles at 60fps works fine on current target hardware, this is optimisation for a future need, not a current problem.

**[LOW]** — Mouse interaction is appropriately subtle
The grow effect (40% size increase within 150px) is gentle. The 2% blend-factor steering at 150-300px creates organic attraction without snapping. Click repulsion scales by depth, which adds to the parallax feel. These are well-tuned.

**[LOW]** — Mobile optimisation is sufficient
70 particles, 30fps cap, 3 clusters, shorter connection distances. The O(n^2) cost drops from 2.4M/sec to ~147K/sec. Mouse tracking is fully disabled. This should be smooth on mid-range mobile hardware.

**[MEDIUM]** — `shadowBlur` set/cleared per particle is expensive for Canvas 2D
In `drawParticle`, `ctx.shadowBlur` is set before each `arc()` call and reset to 0 after. Canvas shadow blur is one of the most expensive 2D context operations — it requires a separate compositing pass. With 200 particles, that's 200 shadow state changes per frame. Batching particles by blur amount (draw all blur-3 particles, then all blur-5, etc.) would reduce state transitions to ~4 per frame.

---

## 6. Performance

**[MEDIUM]** — TerminalContainer scrolls to bottom on every character typed
`TerminalContainer.tsx:14-22` runs `scrollTo({ top: scrollHeight, behavior: 'smooth' })` inside a `useEffect([children])`. During typing animation, `children` changes on every character (because the parent re-renders with new typing text). For a 30-character command at ~70ms/char, that's ~430 `scrollTo` calls in 2 seconds. The browser coalesces these, but it's still triggering layout recalculation on every character.

**Recommendation:** Debounce the scroll-to-bottom or only scroll when output blocks are revealed (when `showOutput` changes), not on every character.

**[LOW]** — React state updates per character are batched by React 19
Each typing step calls `setText(currentText)` which triggers a re-render. React 19 batches these automatically even in `setTimeout` callbacks, so consecutive rapid state updates don't cause multiple re-renders. The rendering cost per character is one reconciliation pass over the section's JSX — lightweight given that only the typing text span changes.

**[LOW]** — Static content snapshot is a valid optimisation
Once `animation.isCompleted`, the section renders plain HTML with no timers, no refs watching animation state, and no typing text subscriptions. This eliminates all per-frame overhead for completed sections. Given that users will spend most of their time on a completed section (reading content), this is a meaningful win, not premature optimisation.

**[LOW]** — `new Audio()` GC pressure is real but manageable
50 Audio objects per section, 250 across all sections for a full scroll-through. Each is small (~100 bytes plus the decoded audio buffer reference). The browser's audio subsystem handles cleanup. This is not a bottleneck in practice but an audio pool would be a clean improvement (see Audio System section).

**[MEDIUM]** — `backdrop-filter: blur(5px)` on terminal containers is expensive on mobile
The `.terminal-container` class in `globals.css:261` applies `backdrop-filter: blur(5px)`. On mobile devices, this forces the compositor to sample and blur the area behind each terminal on every frame where scrolling or particles are animating. This can cause frame drops during scroll snap transitions.

**Recommendation:** Consider disabling `backdrop-filter` on mobile via a media query, or replacing it with a semi-transparent `background-color` fallback.

---

## 7. Accessibility

**[HIGH]** — `prefers-reduced-motion` is not respected by JavaScript animation systems
The CSS `@media (prefers-reduced-motion: reduce)` rule in `globals.css:854` sets `animation-duration: 0.01ms` for all CSS animations. However, the entire typing animation system (`AnimationController`, `useTypingAnimation`), the particle system (`requestAnimationFrame` loop), and the glitch system (`setInterval` cycles) run unconditionally in JavaScript. A user who has requested reduced motion still sees character-by-character typing, canvas particle animation, and glitch effects.

**Recommendation:** Check `window.matchMedia('(prefers-reduced-motion: reduce)')` at the application level. When active: skip typing animation and render static content immediately, disable the particle animation loop (render a static frame), and disable glitch intervals.

**[HIGH]** — Screen reader experience is broken during animation
During typing animation, the command text changes character-by-character. A screen reader would either announce each character change (creating a stream of letter announcements) or wait for the text to stabilise (missing the intermediate states). Output blocks appear suddenly when `showOutput` flips. There are no `aria-live` regions, no `role="status"` or `role="log"` attributes, and no `aria-label` on the terminal containers.

**Recommendation:** Add `aria-hidden="true"` to the animating content and provide the full static content in a visually-hidden `aria-live="polite"` region. Or detect screen reader presence and skip animation entirely.

**[MEDIUM]** — No visible mute/unmute control for audio
Keystroke audio plays automatically on every section with no visible way to mute it. The `toggleMute` function exists but is not wired to any UI element. Users who find the audio annoying have no recourse other than muting their device or browser tab.

**Recommendation:** Add a small mute toggle button (e.g., in the terminal header or fixed to the viewport corner).

**[MEDIUM]** — Keyboard navigation is limited to arrow keys
`page.tsx:27-57` implements arrow key navigation between sections. However, there's no visible focus indicator when navigating by keyboard, no skip-to-content link, and the contact form inputs are the only focusable elements within sections. Tab navigation through the page has no logical flow between sections since the terminal containers don't have tabindex.

**[LOW]** — `SEOContent` uses `aria-hidden="true"` correctly
The visually-hidden semantic content for crawlers is properly hidden from screen readers with `aria-hidden="true"`. This prevents duplicate content announcements. Good.

---

## 8. SEO & Crawlability

**[LOW]** — SEOContent provides strong semantic markup
`SEOContent.tsx` contains a full, well-structured HTML document with proper heading hierarchy (`h1` through `h3`), descriptive paragraphs, and semantic `article` elements for projects and experience. This gives crawlers clean content regardless of JavaScript execution.

**[LOW]** — JSON-LD structured data is complete
`StructuredData.tsx` provides both a `Person` schema and a `WebSite` schema with correct `sameAs` links, `knowsAbout` array, and `alternateName` variants. This is thorough.

**[LOW]** — Robots and sitemap are correctly configured
`robots.ts` disallows `/api/` and `/_next/`, allows everything else, and points to the sitemap. `sitemap.ts` returns the base URL with monthly change frequency and priority 1. Both are correct for a single-page portfolio.

**[MEDIUM]** — The animated content is invisible to crawlers that don't execute JavaScript
The actual section content (project descriptions, experience details, skills) only appears after JavaScript-driven animation completes. `SEOContent` mitigates this with a static copy, but the static copy's content diverges from the animated sections — `SEOContent` describes different projects (DiabetesML, FreightFlow, DocIntel) than what `ProjectsSection` displays (AI ChatBot Platform, ML Image Classifier, etc.). Either the SEO content or the section content is stale.

**Recommendation:** Ensure `SEOContent` matches the actual displayed content. Consider generating both from a shared data source.

---

## 9. Code Quality & Architecture

**[MEDIUM]** — `hero.ts` is almost entirely dead code
`heroAnimationTiming`, `animationStages`, `heroStyles`, `getTotalAnimationDuration()`, `getDescriptionText()`, `getDescriptionLines()`, `a11yLabels` — none are imported by `HeroSection.tsx` or any other file. Only `heroContent` and `socialLinks` might be relevant, but even those are not imported. This file is ~160 lines of unused code.

**Recommendation:** Delete or integrate. If the intent was to externalize hero content, finish the job and import from it. If the section hardcodes its content, delete the file.

**[MEDIUM]** — `types/index.ts` has a stale `Particle` interface
`types/index.ts` defines `Particle` and `ParticleSystemConfig` that differ from the canonical versions in `particles.ts`. The `types/index.ts` version includes `maxTrailLength` (unused) and omits `isFastParticle`. The `particles.ts` version is what's actually used. This creates confusion for anyone reading the type definitions.

**Recommendation:** Remove the duplicate types from `types/index.ts` or make `particles.ts` import from it.

**[MEDIUM]** — ~200 lines of exported-but-unused hooks
`useAnimationController.ts` exports `useAnimationWithInView`, `useAnimationDelay`, `useSequentialAnimation` (none used). `useTypingAnimation.ts` exports `useMultiTyping`, `useTypingWithCursor` (none used). `useInView.ts` exports `useInViewWithDelay`, `useMultiInView`, `useScrollProgress` (none used). These are speculative abstractions that add maintenance burden and cognitive load.

**Recommendation:** Remove unused exports. They can be recreated from git history if ever needed.

**[LOW]** — Section component pattern is highly consistent
All five sections follow the identical structure: module-level config, boot gate, audio hook, animation controller, typing hooks, stable `onInViewChangeRef`, `useInView`, `buildAnimationSequence`, start-condition effect, glitch effect, cleanup effect, static/animating render split. The only deviation is ContactSection omitting glitch and having form state. This consistency is excellent.

**[LOW]** — `useAnimationController` accesses private config via bracket notation
At `useAnimationController.ts:133`, the hook reads `controller['config']?.onStateChange` using bracket notation to access a private property. This is a code smell — it couples the hook to the internal structure of `AnimationController`. The controller should expose a getter or the hook should track the original callback separately.

**[LOW]** — Empty-deps cleanup effects capture stale closures
Every section has `useEffect(() => { return () => { audio.releaseAudioControl(); animation.cancel() } }, [])`. The empty dependency array means `audio` and `animation` are captured from the initial render. `animation.cancel()` works because it calls through the ref-backed controller. `audio.releaseAudioControl()` works because `sectionId` is stable. But the ESLint exhaustive-deps rule would flag this, and the pattern is fragile if `sectionId` ever became dynamic.

**[LOW]** — `BootScreen` re-creates `shutdownLines` every render
`shutdownLines` is a local array declared inside the component body, causing `runExitSequence` (which depends on it) to be re-created every render. Move it to module scope.

---

## 10. User Experience & First Impression

**[HIGH]** — Animation replays on every scroll-back feel repetitive
With `triggerOnce: false` on all sections, every time the user scrolls away from a section and returns, the animation resets to idle and replays from scratch. This is a deliberate design choice, but it creates a frustrating experience for users who scroll back to re-read content — they have to wait for the full typing animation again. The first playthrough is impressive. The second is tolerable. The third feels like punishment.

**Recommendation:** After a section has completed once, don't reset it on scroll-away. Keep `triggerOnce: false` for the initial visit behaviour (animation starts when section enters viewport), but once `isCompleted` is true, render static content permanently for that page session. This preserves the first-visit experience while making the portfolio usable as a reference.

**[MEDIUM]** — Boot screen blocks content access
The boot sequence takes approximately 5-6 seconds (cumulative delays of boot lines + user click + 5-phase exit). First-time visitors must wait for the full sequence before seeing any portfolio content. While the CRT aesthetic is impressive, impatient visitors (especially recruiters scanning multiple portfolios) may bounce.

**Recommendation:** Keep the boot screen but make it skippable — add a "Skip" button that appears after 1-2 seconds, or allow clicking anywhere during the boot log to fast-forward.

**[LOW]** — `sessionStorage` boot-skip works correctly
Return visits within the same browser session skip the boot and go directly to content. The `sessionStorage` key `'portfolio-booted'` is set after the exit sequence completes. `completeBoot()` is called correctly on skip. No issues.

**[LOW]** — No loading state between boot completion and first section animation
After the boot screen exits, there's a ~600ms gap (initial delay + audio readiness + observer setup) before the hero section starts typing. During this gap, the page shows an empty terminal container. Consider adding a blinking cursor in the terminal to indicate "waiting for input" during this gap.

---

## 11. Missed Opportunities

**[IDEA]** — Typed command history on scroll-back
Instead of replaying the full animation, show a "scrollback buffer" effect when returning to a completed section — the terminal content scrolls up instantly like reviewing terminal history. This preserves the terminal metaphor while eliminating the re-animation frustration.

**[IDEA]** — Sound design with pitch variation
The keystroke audio uses 4 mp3 files with volume variation. Adding slight pitch variation per keystroke (±5-10% via `Audio.playbackRate`) would dramatically increase perceived variety without needing more sound files. Combined with fixing the keyboard-region bug, this would create a genuinely convincing keyboard soundscape.

**[IDEA]** — Ambient terminal hum
A subtle, looping background hum (like CRT monitor buzz or soft white noise) that fades in during the boot sequence and persists at very low volume would add significant atmosphere. Tie it to the mute toggle.

**[IDEA]** — Interactive terminal input
After the animation completes on any section, let the user type in the terminal. Recognize a few easter-egg commands (`help`, `clear`, `ls`, `cd ..`, `sudo`, `exit`). This would turn the portfolio from a spectacle into an experience. Even a simple `help` command listing the sections would delight technical visitors.

**[IDEA]** — Section transition effects
Currently, scroll-snap transitions between sections are instant (CSS `scroll-snap-type: y mandatory`). Adding a brief CRT scanline effect or screen flicker during section transitions would reinforce the terminal aesthetic during the moment where it's most visibly a web page.

**[IDEA]** — Particle system reacts to typing
When a section is actively typing, create a subtle pulse in the particle system — particles near the terminal briefly accelerate or brighten on each keystroke. This would create a subliminal connection between the foreground interaction and the background ambiance.

**[IDEA]** — Progressive content loading for crawlers
Instead of maintaining a separate `SEOContent` component that can drift out of sync, use server-side rendering to render the static content first, then hydrate with animation. The section components could accept a `preRenderedContent` prop that's shown until the animation takes over. This eliminates the content drift problem entirely.

---

## Fix First

1. **Fix keyboard-region audio bug** — The `playKeystroke` function needs to accept and pass through the actual typed character. This is the most creative audio feature in the codebase and it's completely non-functional. One-line interface change, small implementation change in two files.

2. **Add `prefers-reduced-motion` support** — Check the media query in a top-level hook or context. When active, skip typing animations (render static immediately), stop the particle animation loop, and disable glitch intervals. This is an accessibility requirement, not a nice-to-have.

3. **Stop re-animating completed sections on scroll-back** — Once `animation.isCompleted`, persist that state and render static content on return visits to the section. This single change transforms usability for anyone who scrolls back and forth.

4. **Add a mute toggle to the UI** — Wire the existing `toggleMute` function to a visible button. This is a basic UX requirement for any page that auto-plays audio.

5. **Add screen reader support** — At minimum, add `aria-hidden="true"` to animating content and expose static content via `aria-live` regions. Ensure terminal containers have `role="log"` or appropriate ARIA roles.

## Elevate

1. **Interactive terminal input after animation completes** — Let users type commands. Even 5-6 easter-egg responses would make this portfolio unforgettable and demonstrate technical ability in the most meta way possible.

2. **Pitch-varied keystroke audio + ambient hum** — Fix the region bug, add `playbackRate` variation, and add a subtle CRT background hum. The audio design is already 80% of the way to being genuinely immersive.

3. **Particle system reacts to typing** — Subliminal visual feedback that connects the terminal activity to the background particles. This would make the two systems feel like one cohesive environment instead of independent layers.
