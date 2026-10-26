# Phosphor Implementation Plan

Six phases that implement **every** change from the Phosphor Portfolio Review. Nothing in the review is optional. This file is the working checklist; the review is the specification.

## Source documents

| Document | Use it for |
|---|---|
| [`Phosphor Portfolio Review.md`](./Phosphor%20Portfolio%20Review/Phosphor%20Portfolio%20Review.md) | The written spec: findings, reasoning, code sketches, tables. Line refs below (`MD:123`) point into this file. |
| [`Phosphor Portfolio Review.html`](./Phosphor%20Portfolio%20Review/Phosphor%20Portfolio%20Review.html) | The live demos. Its `<script>` holds the **reference implementations**: the `THEMES` array, `newDelay()` typing engine, `key()` / `tone()` / `SND` synth sounds, `humStart()` hum, `drawNew()` particle renderer, and the CSS keyframes `crton`, `phos`, `lnin`, `chan`, `rgb`, `flick`. Open it in a browser to see and hear the target, and copy those values exactly. |

When the review and this plan seem to disagree, the review wins. Where this plan resolves an ambiguity in the review, it says so under **Decisions**.

---

## Status board

| Phase | Name | Status | Started | Finished |
|---|---|---|---|---|
| 1 | Foundation: cleanup, bug fixes, safety net | DONE | 2026-10-24 | 2026-10-24 |
| 2 | Architecture and performance | DONE | 2026-10-24 | 2026-10-24 |
| 3 | Theme and typography system | DONE | 2026-10-24 | 2026-10-24 |
| 4 | Audio engine | DONE | 2026-10-24 | 2026-10-24 |
| 5 | Typing, motion and boot experience | DONE | 2026-10-24 | 2026-10-25 |
| 6 | Agent, reach, accessibility and quality | DONE | 2026-10-25 | 2026-10-25 |

### How to work this plan (rules for the AI)

1. **Do phases in order.** Each phase assumes the ones before it are DONE. Don't start a phase while another is IN PROGRESS.
2. **When you pick a phase:** set its status to `IN PROGRESS` in the status board **and** in the phase heading, and fill in the Started date (YYYY-MM-DD). Do this before you write any code.
3. **While working:** tick each checklist item `- [x]` as soon as it is done and verified. Never delete an item. If an item truly can't be done, mark it `- [!]` and write the reason and what you did instead on the next line. Then tell the user. Never skip an item silently.
4. **When every item is ticked** and the phase's *Definition of done* passes: set status to `DONE`, fill in the Finished date, and add a short **Completion notes** list under the phase (what changed, anything deferred, follow-ups).
5. **Read the referenced review sections before starting each item.** The review has the reasoning and exact values; this plan has the checklist.
6. **Keep and build on** (MD:19): the cancellation-safe animation controller, the one-section-owns-audio rule, the reduced-motion paths, and the server/client agent split. Refactors may move them but must keep their guarantees.
7. **Reduced motion is non-negotiable.** Every new animation, sound-linked visual, shader or transition needs a `prefers-reduced-motion` path.
8. Ask the user before committing. Never add AI attribution (`Co-Authored-By` and similar) to commits.

### Definition of done (every phase)

- `npm run lint`, `npx tsc --noEmit` and `npm run build` pass.
- Tests added so far pass (`npm test`, and the Playwright smoke from Phase 1 onward).
- The site was run (`npm run dev`) and the phase's changes were checked in a browser on desktop and at phone width, with and without reduced motion.
- `README.md` is updated for anything this phase changed (architecture, commands, file layout, config).
- The Traceability matrix (end of this file) shows every item for this phase ticked.

---

## Phase 1: Foundation — cleanup, bug fixes, safety net

**Status: DONE** (started 2026-10-24, finished 2026-10-24, branch `phase-1-foundation`, not committed)

**Goal:** a smaller, correct codebase with tests and analytics in place before the big refactors. Nothing visible changes except the bug fixes.

**Read first:** Part 03 "About 1,700 lines can go" (MD:438–479), Part 01 Findings (MD:107–223), "Measure before you tune" (MD:572), "Tests where they protect the most" (MD:576).

### 1.1 Safety net (do this first)
- [x] Add Vitest. Unit tests for `toAgentAction()` (the whitelist), the command parser and `COMMAND_ALIASES` / `findClosestCommand`, and the typing delay function in `useTypingAnimation`. These pin current behaviour so the cleanup can't break it.
- [x] Add Playwright with one smoke test: load, skip boot, see the hero name, scroll to `#terminal`, run `help`, run `snake`, exit. Add `npm test` and `npm run test:e2e` scripts.
- [x] Run `npx knip` once (install with `npm init @knip/config`; enable its Next.js plugin) to confirm the dead-code list below. Review its output by hand; never run `--fix` blind.

### 1.2 Measurement (MD:572)
- [x] Add Vercel Analytics and Speed Insights (`@vercel/analytics`, `@vercel/speed-insights`) to `app/layout.tsx`.
- [x] Custom events: `boot_skipped`, `boot_completed`, `sound_muted`, `first_command`, `agent_question`, `cv_downloaded`. Put the event names in one constants file so later phases reuse them.

### 1.3 Delete dead code (MD:446–460) — behaviour must not change
- [x] Delete `src/lib/utils.ts` (344 lines, zero imports).
- [x] Trim `src/types/index.ts` to `SectionId`, `ScrollSectionProps`, `TerminalContainerProps`. Remove its duplicate `Project` / `Experience` / `SkillCategory`.
- [x] `src/lib/glitch.ts`: remove `applyBorderGlitch`, `startPeriodicGlitch`, `startBorderGlitch`, `randomGlitchEvent`, `getIntensityPreset`, and config fields `textGlitchInterval`, `borderGlitchInterval`, `textFlickerInterval`, `charGlitchChance`. Keep `startCharacterGlitch`.
- [x] `src/lib/animationController.ts`: remove pause/resume and `pausedTime` / `elapsedBeforePause` / `getElapsedTime`, `setDebug`, `combineSteps`, the unused state getters and setters, and `log()` with its call sites. Keep cancellation exactly as it is.
- [x] Remove unused hook return values: `useAnimationController` (pause, resume, state, status, isIdle, canStart, progress, controller), `useKeystrokeAudio` (toggleMute, setMuted, isLoaded, isReady), `useTypingAudioCallback` (canPlay, isReady), `useInView` (entry, hasBeenInView, and the unused `triggerOnce` branch, dropping the `setEntry` re-render).
- [x] `src/lib/animationTypes.ts`: remove `AnimationSequence`, `SectionAnimationConfig`, `TypingAnimationResult`, `isActive()`, the `AnimationEvent` enum. Also remove `calculateDistance` in `particles.ts` and `audioConfig.volumeResetDelay`.
- [x] `app/globals.css`: delete the unused classes (`.command-line`, `.output-section`, `.cta-buttons`, `.skills-grid`, `.skill-category`, `.category-*`, `.tech-stack`, `.tech-badge`, `.spec-*`, `.text-primary`, `.text-dim`, `.bio-text`, `.fade-in-up`, `.typing-text`, `.cursor`, `.name-cursor`, utility classes, `.glitch-text`, `.typed-command`, `.page-indicators`, `.floating-code`), their media-query and print copies, and the keyframes `floatCode`, `typeCommand`, `pulse`, `typing`, `blinkTypingCursor`, `blink`, `fadeInUp`, `glitch-border`. Check template-string class names (such as `boot-screen-line-${type}`) before deleting anything.
- [x] Delete unused CSS variables: the nine `--breakpoint-*`, `--color-bg-darker`, `--z-vignette`, `--z-code-snippets`, `--z-indicators`.
- [x] Delete the broken selector `.section-cursor-blink about-section-cursor-blink {` (and its siblings) in all six sections (MD:462).
- [x] `git rm prod-server.log` and add `*.log` to `.gitignore`.
- [x] Remove the 13 "Priority N" labels from `CustomCursor.tsx` comments and the one in `globals.css`. Keep the explanations.
- [x] Remove Tailwind (`tailwindcss`, `@tailwindcss/postcss`, `postcss.config.mjs`) since nothing uses it (MD:216). Decision: remove rather than adopt.

### 1.4 Merge duplication
- [x] Create `useSectionAnimation` and move the ~60 lines each section repeats into it: audio setup, `hasCompletedOnceRef`, typing callback, controller, in-view handler (remove the double ref wrapping), start effect, reduced-motion effect, unmount cleanup. Use it in all six sections.
- [x] Move the copy-pasted section CSS (`.X-prompt` ×6, `.X-content` ×5, `.X-command-line` ×3, identical fade keyframes) to shared classes in `globals.css`.

### 1.5 Bug fixes (MD:109–135, 185–209)
- [x] **Touchscreen laptops have no cursor** (MD:109). Decide per pointer event (`e.pointerType === 'mouse'`) and toggle `html.has-custom-cursor`. Only hide the system cursor under that class. Apply the same pointer-based detection to the particle field so touch laptops get the desktop config.
- [x] **Double ripple** (MD:125). Remove the ripple from `Background.tsx`; keep the cursor's.
- [x] **Cursor speed depends on refresh rate** (MD:185). `k = 1 - Math.pow(1 - base, deltaTime / 16.67)`.
- [x] **Mobile height and nested scroll** (MD:198). `100dvh` with `100vh` fallback for sections, html and body. On small screens let long sections grow and use `scroll-snap-type: y proximity`.
- [x] **Glitch rewrites React-owned DOM** (MD:204). Give the glitch its own child element React never renders into, or render per-letter spans in JSX and let the glitch toggle classes only.

### 1.6 Docs
- [x] Update `README.md`: remove `utils.ts`, the "two interface systems" section, the Tailwind note; document tests, Knip, analytics.

**Completion notes:**

- **Size:** tracked files went from 3,563 lines removed / 856 added (excluding `package-lock.json`), plus ~620 lines of new files, most of them tests. Lint went from 23 errors and 27 warnings to 0 and 0. Knip reports nothing.
- **Safety net:** 27 Vitest unit tests (`tests/unit/`: agent whitelist and reply parsing, aliases, did-you-mean, command routing, typing delay) and one Playwright smoke test (`tests/e2e/smoke.spec.ts`). To make them testable, `calculateTypingDelay` was extracted as a pure function and the terminal's pure helpers are exported. Vitest 4 is used instead of 5 because Vitest 5 needs `@types/node` ≥ 22 and the project pins Node 20.
- **Analytics:** `src/lib/analytics.ts` holds the six event names and a never-throwing `trackEvent()`. Events fire from `BootScreen` (skipped/completed), `MuteToggle` (muted), and `useTerminalInput` (first command, agent question, CV via command or agent).
- **Glitch fix:** new `GlitchText` component renders per-character markup; `lib/glitch.ts` only writes into empty overlay spans. The terminal title and the random output-line glitch now go through React state (`glitchLineIds`) instead of DOM rewrites.
- **Cursor fix:** `CustomCursor` uses Pointer Events and toggles `html.has-custom-cursor`; verified with a touch-capable desktop context (tap → system cursor, mouse → custom cursor). Pulse and idle timing are also frame-rate independent now, not only the trailing.
- **Lint fixes made along the way** (needed for the Definition of done): `MuteToggle`, `BootScreen` session check and `useReducedMotion` moved to `useSyncExternalStore`; `useAnimationController` keeps its controller in `useState`; `getPrompt` moved out of `useAdventureGame`; matrix mode clears in its effect cleanup; `processCommand` depends on the stable game callbacks; `AgentReply` now types the `/api/chat` response (it was missing `suggestions`).
- **Extra dead code found and removed:** `.cta-btn` (no element used it), `.prompt`, `.flex`, `.specializations`, `getKeyType`, `getDelay` / `metadata` / `playEnterSound` in the typing config, `onStepStart` / `onStepComplete` / the `paused` state in the controller, `normalizePath`, `getParentPath`, `drawParticle`, `StartTourAction`, the unused `generateSudo` argument, unused type re-exports in `src/content/index.ts`.
- **OG script** converted to `scripts/generate-og.mjs` (ES module) so it lints cleanly. Phase 3 should regenerate the OG image with the new P1 palette.
- **Small behaviour notes:** the system cursor now shows until the mouse first moves (before, there was no cursor at all until then). The particle "click pulse" fires on `pointerdown` instead of `click`, so it lines up with the cursor's ripple.
- **Browser check:** desktop 1366×800, iPhone 13, each with and without reduced motion, plus the touch-laptop case. No console errors; one ripple per click.
- **Follow-up for later phases:** `help` prints ~2,000 characters one at a time (about 40 s), so the smoke test waits up to 120 s for it. Phase 5's line-by-line output fixes the cause.

---

## Phase 2: Architecture and performance

**Status: DONE** (started 2026-10-24, finished 2026-10-24, branch `phase-2-architecture`, not committed — also carries the uncommitted Phase 1 changes)

**Goal:** the HTML arrives with every section's final text; animation only reveals it. One terminal engine, one animation loop, a cheap particle field.

**Read first:** Part 01 "How it works today" / "Where it should go" (MD:57–94), findings "Five terminals, five engines" (MD:137), "Typing re-renders whole sections" (MD:152), "The particle field pays for glow" (MD:173), "Smaller cleanups" (MD:216), Part 04 tools table (MD:485). Reference renderer: `drawNew()` in the HTML export.

### 2.1 Rendering model
- [x] Turn sections into Server Components that print their final text into the HTML. Remove `"use client"` from `app/page.tsx`; keep client code in small islands (reveal animation, terminal input, cursor, background).
- [x] The reveal island animates text that already exists in the DOM (hide-then-reveal with a caret), so content, SEO and screen readers work before JS runs.
- [x] Delete `SEOContent.tsx` and the per-section `sr-only` duplicates once the real text is in the HTML. Keep JSON-LD.
- [x] Enable Cache Components (`cacheComponents: true`) and mark the static section content with `'use cache'`.

### 2.2 Terminal engine
- [x] Split `useTerminalInput.ts` into modules: `terminal/commands/` (registry: one file per command group), `terminal/fs.ts`, `terminal/agent.ts`, `terminal/tour.ts`, `terminal/games/` (snake, adventure, matrix, vim).
- [x] One store (`useSyncExternalStore` or Zustand) holds terminal state; each section gets a view onto it. **Exactly one** keyboard listener on the page.
- [x] Lazy-load games and modes with `import()` the first time they run (sketch at MD:137).
- [x] Replace the hidden keyboard proxy with a real, visible `<input>` for the prompt, so screen readers, autocorrect, dictation and IME work (MD:589). Keep the same look.

### 2.3 Typing render path
- [x] Typewriter writes straight into a text node from one `requestAnimationFrame` loop (`typeInto` sketch, MD:152). React owns only finished lines.
- [x] AI replies use the same loop. No more one `setTimeout` per character (`useTerminalInput.ts:2224`).

### 2.4 One animation loop
- [x] Add an FX scheduler: one `requestAnimationFrame` loop that drives particles, cursor and glitch ticks.
- [x] Particles: glow sprite drawn once and stamped with `drawImage` (no `shadowBlur`), spatial grid for neighbour search, lines batched into three opacity paths, canvas sized with `devicePixelRatio` capped at 2. Match `drawNew()` in the HTML export.
- [x] Move the particle field into an OffscreenCanvas worker (`transferControlToOffscreen`), with the main-thread renderer as fallback.
- [x] Pause particles while the boot screen covers them and while a game or Matrix mode is on.
- [x] Particles and cursor read colours from CSS tokens (prepare the hook here; Phase 3 supplies the tokens).

### 2.5 Tooling
- [x] Enable the React Compiler (`reactCompiler: true`, `babel-plugin-react-compiler`). Remove hand-written `useCallback` / `useMemo` (about 90) file by file, checking with React DevTools.
- [x] Add `@next/bundle-analyzer` and record before/after bundle sizes in the completion notes.

**Completion notes:**

- **Bundle (production build, first visit to `/`, measured in Chromium):** JavaScript **191.1 KB → 182.6 KB** compressed (**691 → 615 KB** uncompressed). Snake, adventure, Matrix and the vim file are now separate chunks fetched only on first use. HTML grew 134.6 → 320.6 KB raw (**36 KB gzipped**) because the real content is now in it: about half is the server payload, much of it per-character `GlitchText` markup (432 wrappers) and section `<style>` blocks that used to ship inside JS. Phase 5 limits the glitch to the hero name, which removes most of that markup. `@next/bundle-analyzer` is wired up: `ANALYZE=true npm run build -- --webpack` (it needs a webpack build; the normal build is Turbopack).
- **Rendering:** `app/page.tsx` and all six sections are Server Components marked `'use cache'` (`cacheComponents: true`; `/` and `/sitemap.xml` prerender as static). Content renders and reads correctly with JavaScript disabled (checked). `SEOContent.tsx` and the per-section `sr-only` duplicates are gone. The Terminal's `sr-only` *usage instructions* stay, since they describe how to use the shell rather than duplicating visible text.
- **Reveal model:** `components/shared/reveal/` — `SectionReveal` (client island), `TypedLine`, `SectionShell`. Markup drives the sequence (`data-reveal="type|show"`, `data-delay`, `data-glitch`). An inline `<head>` script adds `html.reveal-ready` before first paint (not under reduced motion), so there is no flash. Pending items are collapsed like `.sr-only` (no layout space, still readable by assistive tech), so terminals grow as content appears, as they did before. Each item's own CSS fade plays when it is revealed. Every original delay is preserved; the 200 ms stagger moved into `typingConfig.sequenceTimings.staggerDelay`.
- **Terminal engine:** `src/terminal/` — `session.ts` (`TerminalSession`: all hook state and logic as a class with snapshots), `store.ts` (sessions + **one** terminal key listener, routed to the focused input's session or the most recently activated one), `types`, `sections`, `fs`, `agent`, `tour`, `commands/{index,aliases,suggest,system,network,git,fun,help}`, `games/{snake,adventure,matrix,vim}`. The pure parts were split mechanically (code moved verbatim). `useTerminalInput` is now a 40-line `useSyncExternalStore` view. `useSnakeGame` / `useAdventureGame` / `useTypingAnimation` are deleted. The matrix rain moved out of `TerminalSection` into `games/matrix`.
- **Real input:** the prompt is a visible, labelled `<input data-terminal-input>`. Typing with nothing focused still works (the key is applied and focus moves in). Form submit covers soft keyboards without an Enter keydown. Arrow-key section paging now ignores editable fields, so caret keys don't switch sections. On coarse pointers the input is 16px to stop iOS zooming on focus, slightly larger than the surrounding text on phones.
- **Typing render path:** `lib/typewriter.ts` writes prefixes straight into DOM nodes on the frame loop. Terminal replies (including spinners and `cd <section>` output) write into the live line; section commands write into `TypedLine`'s live node. Section sequencing still runs on `AnimationController` (keep-and-build-on: its cancellation guarantee is unchanged), with one typewriter per line. A force-finish (e.g. in a background tab) is silent, so it never fires a burst of keystroke sounds. `TerminalContainer` auto-scroll now watches the DOM (`MutationObserver`) instead of React children, ignoring glitch flicker and section intros, which `SectionReveal` scrolls itself.
- **One animation loop:** `lib/fxScheduler.ts` (`onFrame` / `after` / `every`) drives the cursor, glitch timers, typewriters, snake, Matrix and the main-thread particle fallback.
- **Particles:** `lib/particles/{physics,field,particles.worker,messages}.ts`. Physics moved verbatim; the renderer matches the review's `drawNew()` approach (glow sprites + `drawImage`, spatial grid, batched `Path2D` lines/cores, DPR capped at 2). It runs in a worker via `transferControlToOffscreen`, with a main-thread fallback. The driver survives React's dev double-mount, since a canvas can only be transferred once. It pauses during boot and games/Matrix (`lib/fxState.ts`). Colour comes from a new `--glow` token (`0 255 65` for now; Phase 3 sets it per theme), re-read when the theme attribute changes. The cursor's JS and CSS glows use the same token.
- **React Compiler:** `reactCompiler: true` with `babel-plugin-react-compiler`. **All** hand-written `useCallback` / `useMemo` are removed (about 90 before Phase 2, most of them inside the old terminal hook; the last 28 unwrapped mechanically). One non-reactive effect helper uses React 19.2's `useEffectEvent` so the classic `exhaustive-deps` rule stays clean. React DevTools weren't available; behaviour was verified with lint (compiler rules), the unit tests, the smoke test and scripted browser checks instead.
- **Keyboard listeners, for the record:** the terminal now has exactly one document listener. Separate, non-terminal listeners remain by design: arrow-key section paging (`SectionKeyNav`), the Contact superuser Enter shortcut, the scroll hint idle timer and the one-time audio unlock.
- **Tests:** `tests/e2e/smoke.spec.ts` now also types directly into the real input. `E2E_BASE_URL=http://localhost:3000 npm run test:e2e` reuses a running dev server; otherwise Playwright starts its own on :3100 (which can't run while another `next dev` holds the lock). Scripted checks covered: every section at desktop width, reduced motion, iPhone 13 width, no-JS rendering; vim, Matrix, snake, adventure, `cd about`, skip-on-keypress, the Hero mini-shell, the contact form validation and the superuser shortcut. No console or hydration errors.

---

## Phase 3: Theme and typography system

**Status: DONE** (started 2026-10-24, finished 2026-10-24, branch `phase-3-themes`, not committed — also carries the uncommitted Phase 1 and 2 changes)

**Goal:** a real palette with five selectable themes. **The current all-`#00ff41` look ("Today") is removed completely.** The default is **P1 Phosphor, tuned**.

**Read first:** Part 02 §4 "Colour" (MD:391–419), §5 "Typography" (MD:420–436), "About 70 hard-coded green literals" (MD:468), xterm.js note on minimum contrast (MD:541). Reference: the `THEMES` array and Theme lab in the HTML export.

### 3.1 Tokens and themes (copy these values exactly)

| Token | P1 Phosphor, tuned (`p1`, default) | P3 Amber (`p3`) | P4 Ice white (`p4`) | Night shift (`night`) | Daylight paper (`paper`) |
|---|---|---|---|---|---|
| `--bg` | `#07110B` | `#120C05` | `#0A0E14` | `#0F0B1A` | `#F3F1E7` |
| `--surface` | `#0C1A12` | `#1C140A` | `#111823` | `#181229` | `#E8E5D6` |
| `--text` | `#A8F5C0` | `#FFD08A` | `#D9E6F2` | `#E6DCFF` | `#1D3325` |
| `--bright` | `#4DFF8F` | `#FFB000` | `#FFFFFF` | `#5CF2FF` | `#0A6B39` |
| `--dim` | `#5E9C76` | `#A8834C` | `#7D8FA3` | `#8D80B3` | `#5F6E62` |
| `--warn` | `#FFB454` | `#FF7A45` | `#FFC46B` | `#FFC15E` | `#9A5200` |
| `--error` | `#FF6E61` | `#FF5D5D` | `#FF7A85` | `#FF6B8B` | `#B3261E` |
| `--agent` | `#6FD3FF` | `#8FD8FF` | `#7CC8FF` | `#FF7FDF` | `#0F5E8C` |

- [x] Define the token set on `:root` / `[data-theme="p1"]` and one block per theme. Add `--glow` as an RGB triplet of `--bright` (e.g. `77 255 143`) for `rgba(var(--glow) / a)`.
- [x] **Remove the "Today" theme entirely:** delete `--color-primary*` and every `#00ff41` / `rgba(0, 255, 65, …)` literal (about 70, MD:468). Replace each with a token. Don't keep a fallback to the old green.
- [x] **Remove the per-section tints** (`section[id="about"]` etc., `#22ff52`, `#00ff7d`, `#3aff2a`, `#00ff70`). The review found they add code without visible meaning (MD:393).
- [x] Apply the roles: `--text` for body copy, `--bright` only for prompts, caret, the name and `[LIVE]`, `--dim` for hints and comments, `--warn` for `[WIP]` and warnings, `--error` for "command not found" and form errors, `--agent` for agent replies and the agent label.
- [x] Particle canvas, cursor, boot screen, agent orb, email templates (where sensible) and `viewport.themeColor` all follow the active theme. Canvas reads tokens once per theme change, not per frame.
- [x] Glow is reserved for `--bright` elements; body text has no glow (halation, MD:393).

### 3.2 Switching
- [x] `theme` command: `theme` lists themes and marks the active one; `theme p3` or `theme amber` switches. Add to `help`, autocomplete and the agent's `run_command` whitelist.
- [x] A small theme picker in the UI (next to the mute toggle), keyboard accessible.
- [x] Persist in `localStorage` (`portfolio-theme`). An inline script in `<head>` sets `data-theme` before first paint, so there is no flash of the default.
- [x] Unknown or missing stored value falls back to `p1`.

### 3.3 Contrast guarantee
- [x] A unit test computes WCAG contrast for every theme: `--text`, `--dim`, `--warn`, `--error`, `--agent` against `--bg` must be ≥ 4.5:1. Adjust a value only if it fails, and record the change in the completion notes.

### 3.4 Typography
- [x] Load **JetBrains Mono** (400, 600) for everything and **VT323** for the hero name and boot banner only, via `next/font/google`. Remove `'Courier New'`.

**Completion notes:**

- **Tokens:** `app/globals.css` THEMES block, one per theme, with the exact values from the table, plus `--glow`, `--bg-rgb` and `--surface-rgb` triplets and `color-scheme` (light only for `paper`). `src/lib/themes.ts` holds the same palettes for the picker, the command and the tests. Both were generated from the same table, and `tests/unit/themes.test.ts` fails if they drift.
- **Old look removed:** every `--color-primary*`, `--color-bg-dark`, `#00ff41`, `rgba(0, 255, 65, …)`, the four per-section tints, `#0a0f0a` / `#0d1a0d` and the dark-green panel fills are gone from the site. A role-aware converter mapped about 200 uses by CSS property: text colours to `--text` / `--dim`; borders, fills and shadows to `rgb(var(--glow) / a)` at the original alpha. The rest were assigned by hand. The only deliberately theme-neutral colours left are the red/cyan RGB-split glitch keyframes and the black alpha masks.
- **Roles applied:**
  - `--bright`: prompts, carets, the hero name, links (project/experience/footer), the `[LIVE]` badge, the boot banner
  - `--agent`: agent reply text, its marker and its left rule
  - `--warn`: `[WIP]` and the boot warning line
  - `--error`: form errors and terminal lines starting `bash: …`
  - Status tags inside terminal output (`[LIVE]`/`[WIP]`/`[BETA]`) are coloured by a small renderer in `TerminalInput`.
  - Body copy (project and experience descriptions, achievements) moved from dim to `--text`.
  - Glitch characters now inherit their parent's colour, so the name stays `--bright` through a glitch.
  - The only text glow left is on links (`--bright`).
- **Follows the theme:** particle canvas (re-reads `--glow` on the `data-theme` change), cursor (CSS token), boot screen, agent orb (re-reads `currentColor` = `--agent` on change), vignette/gradient/panels (triplet tokens), browser `theme-color` (set in `<head>` before paint and by `setTheme`). Email templates can't use variables, so they now use P1 hex values (accent `#4DFF8F`, panels `#07110B`/`#0C1A12`). The OG image is recoloured to P1 and regenerated.
- **Switching:**
  - The `theme` command works in every terminal, including the mini-shells. It's in `help`, autocomplete and the agent's `run_command` whitelist. The pure logic is in `terminal/commands/theme.ts`, with aliases such as `amber`, `light`, `white`, `synth`.
  - `ThemePicker` sits beside the mute toggle. It's a menu of radio items with Arrow/Home/End/Escape support, and focus returns to its button.
  - The choice is stored in `localStorage['portfolio-theme']`. The `<head>` script applies it (or `p1`) before first paint; verified with all five themes that `data-theme` is set at first paint. Other tabs follow via the `storage` event.
- **Contrast:** all five themes pass ≥ 4.5:1 for `--text`, `--dim`, `--warn`, `--error`, `--agent` (and `--bright`) on `--bg`. **No value needed adjusting.** 44 theme tests; 71 unit tests in total.
- **Typography:** JetBrains Mono 400/600 and VT323 via `next/font/google` (CSS variables on `<html>`). The hero name and the boot banner (BIOS line) use VT323, scaled 1.4× and 1.8× because VT323 renders small. `'Courier New'` is gone from the site; it remains only as a fallback in the emails and the OG rasteriser, where JetBrains Mono may not be installed.
- **Checks:** types, lint, unit tests, Knip, build and the smoke test pass. Browser checks covered all five themes (hero and projects screenshots), reduced motion, phone width, the picker by keyboard and `theme night` / `theme` from the terminal. No console errors.

---

## Phase 4: Audio engine

**Status: DONE** (started 2026-10-24, finished 2026-10-24, branch `phase-4-audio`, not committed — also carries the uncommitted Phase 1–3 changes)

**Goal:** one Web Audio engine for every sound, working on iOS, with real pitch, stereo, a synthesised hum and a defined sound palette.

**Read first:** Part 02 §3 "Audio" (MD:319–390), the audio graph diagram and `AudioEngine` sketch, "Sound rules to adopt" (MD:384), Part 04 Web Audio row. Reference: `ensure()`, `key()`, `tone()`, `SND`, `panFor()`, `humStart()`, `humStop()` and the duck handler in the HTML export.

- [x] `src/lib/audioEngine.ts` singleton: one `AudioContext`, SFX bus and ambient bus → `DynamicsCompressor` (threshold −18, ratio 4) → master gain → destination. Unlock on first user gesture.
- [x] Decode the four keystroke clips once into `AudioBuffer`s. Delete the `AudioPool` and all 72 `<audio>` elements.
- [x] Each keystroke: `BufferSource` with `detune` ±60 cents (real pitch change), `GainNode` volume (works on iOS), `StereoPanner` by hand: left-hand keys about −0.25, right-hand about +0.25, space centred (reuse the existing `LEFT_HAND_CHARS` / `RIGHT_HAND_CHARS`).
- [x] Keep the volume ramp and decay from `typingConfig.ts`, now applied through gain nodes.
- [x] Keep the `audioController` rule that only one section owns the keystroke channel.
- [x] Mute is a ~60 ms ramp on the master gain (`setTargetAtTime`). Keep the `keystroke-audio-muted` key and the mute toggle UI.
- [x] Sound palette, each with a clear meaning and levels within a few dB: key, space, enter, success, error ("command not found"), agent thinking ticks, boot chime, and an achievement chime for Phase 6. Use the `SND` parameters from the HTML export as the starting point.
- [x] **Hum:** replace `ambient_hum.wav` with the synthesised hum (55 Hz sine, 110 Hz triangle, 165 Hz sine, low-passed noise at 380 Hz, 0.13 Hz drift on the bus gain, target level ≈0.11 on the ambient bus, as in `humStart()`). Delete the 882 KB WAV. Start it only after boot.
- [x] Duck the hum by about 12 dB while the agent speaks (speech synthesis start/end events), then restore.
- [x] Pause the hum on `visibilitychange` (hidden); fade it out after 2 minutes with no input; resume on input.
- [x] **Boot sound consent:** the boot screen offers two buttons, `[ start ]` and `[ start silent ]`. The choice sets mute and doubles as the audio unlock gesture. (Phase 5 redesigns the boot; it must keep both buttons.)
- [x] **Agent orb listens:** while the mic is on, the orb bars follow the real microphone level through an `AnalyserNode` (MD:316). Keep the reduced-motion freeze.

**Completion notes:**

- **Engine:** `src/lib/audioEngine.ts` (`audioEngine` singleton). One `AudioContext`, created inside the first `pointerdown` / `keydown` / `touchstart`. The SFX and ambient buses feed a `DynamicsCompressor` (−18 dB, 4:1), then the master gain, then the speakers. Server-side and before unlock every call is a silent no-op; `tests/unit/audioEngine.test.ts` covers that (75 unit tests in total).
- **Keystrokes:** the four clips are fetched and decoded once into `AudioBuffer`s.
  - Each stroke is a `BufferSource` with `detune` ±60 cents, then a `GainNode`, then a `StereoPanner` (left-hand keys −0.25, right-hand +0.25, space and Enter 0).
  - `AudioPool`, `ensureAutoplayUnlock`, the `playbackRate` trick and every `new Audio()` are gone. The browser check counted 0 `<audio>` elements and 1 context.
  - Ramp and decay from `typingConfig.ts`, hand-region sample choice and the `audioController` single-owner rule are unchanged inside `useKeystrokeAudio`. Its public API is unchanged too, so `useSectionAnimation` didn't change.
- **Mute:** a `setTargetAtTime(…, 0.02)` ramp on the master gain (about 60 ms). The key stays `keystroke-audio-muted`, and the `MuteToggle` UI is unchanged. The new `setAudioMuted()` is shared by the toggle and the boot buttons; other tabs follow via the `storage` event.
- **Palette** (from the HTML `SND` values):
  - `success`: 880 / 1318.5 Hz. Plays for a sent message in the terminal flow and the form.
  - `error`: 110 / 103 Hz square through a 900 Hz lowpass, gain 0.07. Plays for any response starting `bash:` and for a failed form.
  - thinking ticks: bandpassed noise at 5200 + (i % 3)·600 Hz, Q 6, every 130 ms, while the session is in its thinking state (agent queries and contact sending).
  - `boot`: 523.25 / 783.99 / 1046.5 Hz. Plays on `[ start ]`.
  - `achievement`: 659 / 988 / 1318 / 1976 Hz, defined for Phase 6 and not wired yet.
  - Key, space and Enter are the clips above, at the existing `baseVolume` 0.4 ramp.
- **Hum:** synthesised from 55 Hz sine 0.6, 110 Hz triangle 0.22, 165 Hz sine 0.08, and looped noise through a 380 Hz lowpass at 0.18, with a 0.13 Hz LFO (depth 0.18) on the bus gain. The ambient bus target is 0.11 (τ 0.7 in, 0.15 out).
  - `public/sounds/ambient_hum.wav` (882 KB) is deleted; `public/sounds/` is now 28 KB.
  - `AmbientHum` mounts the engine and calls `startHum()` only once `isBooted`.
- **Ducking:** `useVoice.speak` sets `utter.onstart` to `duckHum(true)` (bus target 0.0275, about −12 dB) and `onend` / `onerror` to `duckHum(false)`. `cancelSpeak` and unmount also restore.
- **Hidden / idle:** the hum target goes to 0 on `visibilitychange` (hidden) and comes back when visible. After 2 minutes with no pointer, key, wheel or touch input it fades out; the next input brings it back.
- **Boot consent:** two buttons, `[ start ]` (autofocused; unmutes, unlocks and plays the boot chime) and `[ start silent ]` (mutes). Both run the existing exit sequence. They wrap side by side on desktop and stack on phones. **Phase 5 must keep both.** The old `./start_portfolio.sh` label is replaced.
- **Orb:** `useVoice.startListening` starts `audioEngine.startMicMeter()`: a `getUserMedia` stream into an `AnalyserNode`, analysed only and never routed to the speakers. If listening ends while the permission prompt is still open, the stream is stopped at once.
  - `AgentOrb` reads `getMicLevel()` (peak of the time-domain data) each frame while `listening`: fast attack, slow release, centre bars tallest. It falls back to the canned wave if the mic is denied.
  - The reduced-motion path is untouched (static bars).
- **Checks:**
  - Types, lint, unit tests, Knip and the build pass, and so does the smoke test.
  - Browser checks with a Web Audio spy: boot chime oscillators; hum at 55 / 110 / 165 Hz plus the 0.13 Hz LFO and looped noise; strokes with spread detune and pans −0.25 / 0 / +0.25; mute and hidden ramp to 0; error tone on `whoamj`; ticks on an agent query; `[ start silent ]` stores muted and plays no strokes.
  - Screenshots of the consent buttons at 1366 px and 390 px. Reduced motion: the buttons appear and work. No console errors.
- **Not verifiable headless:** how it actually sounds, and the real mic level (Chromium's fake device). Worth a listen on a phone (iOS Safari especially) before release.

---

## Phase 5: Typing, motion and boot experience

**Status: DONE** (started 2026-10-24, finished 2026-10-25, branch `phase-5-motion`, not committed — also carries the uncommitted Phase 1–4 changes)

**Goal:** the site feels like a real machine and is readable fast: about 4.8 s to a fully readable hero on a first visit, about 1.2 s for a returning visitor (MD:99).

**Read first:** Part 02 §1 "Typing" (MD:229–250), §2 "Motion" (MD:251–318), Part 01 "The time it takes to read the hero" (MD:95–106), Part 04 View Transitions, scroll-driven animations, CRT shader rows (MD:485–510). Reference: `newDelay()`, `runNew()`, the keyframes `crton`, `phos`, `lnin`, `chan`, `rgb`, `flick`, and the tmux bar in the HTML export.

### 5.1 Motion tokens (add to `globals.css`, use everywhere)
- [x] `--dur-key: 80ms`, `--dur-quick: 160ms`, `--dur-base: 280ms`, `--dur-phosphor: 520ms`, `--dur-crt: 900ms`, `--ease-out: cubic-bezier(.16,1,.3,1)`, `--ease-crt: cubic-bezier(.7,0,.3,1)`, `--ease-spring: cubic-bezier(.22,1.2,.36,1)`. Replace ad-hoc durations and easings with these.

### 5.2 Typing v2
- [x] New delay model in `typingConfig.ts` (keep it the single source of truth): base ≈52 ms; word start ×1.6; common bigrams ×0.6 (`th he in er an re on at en nd st es or te ti is it ar ca ls ro ol le xt pr …`); space `d*0.8 + 40–100 ms`; `. / - _` ×1.35; jitter ×0.8–1.2. Per-section feel may still be tuned there.
- [x] Rare corrections: 2–4% chance per letter, never in names or the first characters. Wrong neighbouring key, a beat (≈170–280 ms), backspace with sound, then the right key.
- [x] Output prints line by line at about 30 ms per line with the `lnin` flare. Only the command is "typed by a human".
- [x] Phosphor afterglow (`phos`, 520 ms) on newly typed glyphs.
- [x] **Skip:** any key or click finishes the current animation instantly. Show a dim `# press any key to skip` hint the first time only.
- [x] Scrolling away mid-animation finishes it instead of resetting and retyping later (MD:216).

### 5.3 Boot
- [x] Boot log auto-continues after about 1.6 s; any key skips it. Keep `[ start ]` / `[ start silent ]` from Phase 4.
- [x] Replace the 4.3 s exit sequence with a CRT power-on (`crton`, `--dur-crt`).
- [x] Remember returning visitors in `localStorage` (not `sessionStorage`) and skip the boot for them.
- [x] Use VT323 for the boot banner (Phase 3 font).

### 5.4 Motion specimens, all of them
- [x] **CRT power-on** for boot exit (above).
- [x] **Scanlines + slow flicker**, opt-in through `crt on` / `crt off` commands, persisted, always off under reduced motion.
- [x] **Channel change** (`chan`, 420 ms) when moving between sections and when switching terminal modes (normal, vim, matrix), using `document.startViewTransition` with an instant fallback. Check react.dev: use React `<ViewTransition>` only if it is stable by then; otherwise the plain API.
- [x] **tmux status bar** as the page indicator (`[0:home] 1:about 2:projects …` with the active one highlighted, clickable, keyboard accessible).
- [x] **Restrained glitch:** only the hero name, one 160 ms RGB split (`rgb`) every 8–12 s. Remove the other glitch sites (About highlights, project names, role names, terminal title, random output lines).
- [x] **Keycap buttons:** press down 1 px with a flash and the Enter sound; apply to CTAs and buttons site-wide.
- [x] **Standby dimming:** sections not in focus sit at about 55% brightness and power up when snapped in, using `animation-timeline: view()` inside `@supports`, with no effect where unsupported.
- [x] **Cursor ring hugs buttons:** on hover the ring morphs to the button's bounding box with `--ease-spring`.
- [x] **Project cards as `ls -l`:** on hover the card prints extra columns (stack, year, status).
- [x] **Optional WebGL CRT post-process** (curvature, bloom) for the hero and boot screen only, behind `crt on`, off under reduced motion, feature-detected. Use an MIT-compatible shader. Do **not** copy cool-retro-term-webgl (GPL-3.0) (MD:502).

**Completion notes:**

- **Changes after review (2026-10-25), at the owner's request — the full experience for everyone:**
  - The boot shows once per tab: on the first visit and in every new tab; a refresh goes straight to the sections typing (sessionStorage, `bootBehaviour.oncePerTab`). Never on in-site navigation, deep links or plain mode. `bootBehaviour.skipForReturningVisitors` (off) skips it in every tab for returning visitors.
  - The terminal box no longer scrolls itself (only its content does), and the page scrollbar is hidden in every engine, so no second scrollbar can appear on a section's edge.
  - Leaving a section mid-intro now **restarts** it next time instead of finishing it (`sectionStart.onScrollAway: 'restart'`; `'finish'` is the Phase 5 behaviour). The navigation keys and clicks outside the section no longer count as "skip".
  - After a refresh (no boot click, so the browser still blocks sound), a section waits with "press any key or click to start" and types, heard, after the first gesture (`sectionStart.waitForSound`).
  - **Glitch, reversed at the owner's request:** instead of the name-only RGB split, the character glitch is back and visible in every section. `GlitchText` (per-character overlays, React-safe) appears on title bars, the hero name / role / description, About highlights and skill titles, project names, experience roles / companies / dates, and contact headings / labels. `lib/glitchDirector.ts` plays a flicker, scramble or RGB split on a random visible, revealed one every 0.9–2 s (`constants/glitchConfig.ts`). `NameGlitch` is removed. This overrides the "only the hero name keeps a glitch" decision below.
  - The boot waits for `[ start ]` / `[ start silent ]` / any key instead of auto-continuing, because browsers block sound until a click or key press, and auto-continue left the hero's typing silent. `bootBehaviour.autoContinue` (off) restores the 1.6 s auto-start; a key or click now also unlocks the audio.
  - The keystroke clips are fetched at page load and decoded at unlock, so the hero's first keystroke sounds about 0.4 s after the click.
  - Sections always type; the instant print for returning visitors is kept behind `returningVisitors.printInstantly` in `typingConfig.ts` (off).
  - Together these give up the 4.8 s / 1.2 s targets by design; turning the three settings on brings them back.
- **Readable hero, measured on a production build** (3 runs): first visit **4.8–5.4 s** after landing, boot included (the spread is typing jitter and the occasional typo); returning visitor **~0.5 s**. Before: ~21 s.
- **Motion tokens:**
  - The plan's eight tokens are in `:root`, plus `--dur-lnin` (360 ms, the review's line flare) and `--dur-chan` (420 ms).
  - A script converted every `transition` and one-shot `animation` in `globals.css` and the component style blocks. The old `--transition-*` tokens are removed, and the entrance fades (`section-fade-in*`, `experience-section-fadeInUp`, the contact fade-ins) became the `lnin` flare.
  - Infinite ambient loops (caret blinks, the gradient drift, mic breathing, scroll-hint bob) keep their own periods; they are rhythms, not transitions.
- **Typing v2:**
  - `typingConfig.ts` now holds `typingFeel` (the review's `newDelay()` values), `corrections`, `NEIGHBOUR_KEYS`, per-section `speedScale` and corrections flag, `outputTimings` and `sequenceTimings`. The old positional/character-class model and `HumanTypingPattern` are gone.
  - `lib/typingDelay.ts` builds keystroke plans (`{ delay, visible, key }`): corrections at 3%, at most one per line, never in the first 4 characters or in a capitalised word.
  - `lib/typewriter.ts` plays plans (`playKeystrokes`); backspace plays a keystroke sound.
  - Hero, projects, contact and terminal no longer pass millisecond delays: `data-delay` takes `sequenceTimings` keys (`dramaticPause`, `postCommandDelay`) or `"0"`.
  - The pauses were tightened from the first pass (initial 200, post-command 150, between commands 200 ms) to reach the 4.8 s target.
- **Output, afterglow and skip:**
  - `show` blocks print line by line (child elements, 30 ms apart, `lnin`).
  - Terminal command output in every shell now streams line by line too (`TerminalSession.streamLines`), and `cd` content uses the same 30 ms lines. Agent replies still type at 18 ms/char; Phase 6 streams them.
  - Each typed glyph is a `.k` span (`phos`, 520 ms). After typing, the glyphs stay in place (`has-live`) and the static copy stays in the accessibility tree.
  - Any key except modifiers and Tab, or any click, finishes the running intro. The hint shows on the first intro only (`localStorage['portfolio-skip-hint-seen']`).
  - Scrolling away now finishes instead of resetting; the reset path and `resetDisplay` are removed.
- **Boot:**
  - The log streams and auto-continues **1.6 s after landing** (counted from navigation, minimum 0.7 s on screen); any key or click skips it.
  - `[ start ]` / `[ start silent ]` are kept, and the `[ start ]` underline fills as a countdown.
  - The 4.3 s exit sequence is replaced by the CRT power-on: a view transition (`crton` on the new root frame) where supported, otherwise a full-screen tube overlay.
  - `localStorage['portfolio-booted']` is applied by the `<head>` script (`html.booted`) before paint, so returning visitors never see the overlay, and their sections print at machine speed (`isReturning` in `BootContext`). `sessionStorage` is no longer used.
  - VT323 on the banner was already done in Phase 3.
- **Specimens:**
  - **Channel change:** `lib/viewTransition.ts` and `lib/sectionNav.ts` (`goToSection`) are used by the arrow keys, the tmux bar, the agent and the superuser shortcut. `TerminalSession` batches full-screen mode switches (vim, matrix, snake, adventure) into a `chan` transition. React's `<ViewTransition>` is not in stable React 19.2, so the plain API is used.
  - **tmux bar:** `TmuxBar` is a set of buttons with `aria-current`; the scroll hint moved up above it.
  - **Glitch:** only the hero name (`NameGlitch`): one 160 ms `rgb` split every 8–12 s, only while the hero is visible.
    - `lib/glitch.ts`, `GlitchText`, every `data-glitch`, the terminal output-line glitch and the glitch CSS are deleted.
    - The cursor's micro-glitch is removed too ("only the name").
    - The `glitch_system.fact` and `typing_engine.fact` easter-egg files were rewritten to match.
  - **Keycaps:** `:active` 1 px press with a glow, plus `KeycapFeedback` (the Enter clip through `audioEngine.keycap()`, also for Enter/Space).
  - **Standby dimming:** a `view()` timeline inside `@supports`, using opacity rather than `filter`, which is cheaper.
  - **Cursor hug:** the ring takes the hovered control's box with `--ease-spring`.
  - **`ls -l` cards:** `year` was added to `src/content/projects.ts` from each repo's GitHub creation date. `aura` is not public, so it shows `----` rather than a guessed year.
  - **WebGL tube:** `CrtShader` is our own shader (MIT), gated by `crt on`, reduced motion and WebGL support, shown over the boot screen and the hero. A page can't feed its DOM into WebGL, so it draws curvature, bloom and a rolling band *over* the page rather than warping the text; documented in the README.
  - **`crt on|off`:** in every shell, autocomplete, help and the agent's run list. Persisted, applied before paint, ignored under reduced motion.
- **Bugs found and fixed while verifying:**
  - **Vertical command echo (reported by the user):** history input lines got the class `terminal-interactive-input`, which was also the text field's class (`width: <chars>ch`), so each sent command wrapped one letter per line. The field is now `terminal-interactive-field`, and the smoke test asserts the echo is one line.
  - A first visit turned "returning" when the boot set its key; the key is now read once per page load.
  - The returning visitor's power-on scaled `main`, which made every section "in view" for a moment and stole the keystroke channel. It is now an overlay, and sections in view reclaim the channel when it is freed (`audioController.onRelease`).
  - Mounting the shell scrolled the hero name out of view (`TerminalContainer` now follows only visitor-caused output).
- **Checks:**
  - Types, lint (0 warnings), Knip, 80 unit tests (typing model rewritten: 10 tests) and the production build pass. The smoke test is now 2 tests and covers the echo regression, the tmux bar and the returning visitor.
  - Browser checks: first visit, skip by key on a phone, returning visitor, `crt on` with the shader, vim channel change, tmux navigation, `ls -l` hover, cursor hug, keycap sound, standby opacity (55% / 100%), view transitions (`crton`, `chan`), reduced motion. No console errors.

---

## Phase 6: Agent, reach, accessibility and quality

**Status: DONE** (started 2026-10-25, finished 2026-10-25, branch `phase-6-agent-reach`, not committed — also carries the uncommitted Phase 1–5 changes)

**Goal:** the site works for recruiters and AI agents, is accessible, and stays fast and clean through CI.

**Read first:** Part 05 (MD:562–594), Part 01 "Stream the agent's replies" (MD:210), Part 04 Gemini streaming row, WebMCP, achievements, xterm.js, hiring notes (MD:485–544).

### 6.1 Agent
- [!] Stream replies: `:streamGenerateContent?alt=sse` piped through `/api/chat` as `text/event-stream`, fed into the Phase 2 typewriter as tokens arrive. Tool calls still execute. Keep the current non-streaming path as a fallback, and test every model in `MODEL_CHAIN` (forums report tool-call problems with streaming on some models).
  Streaming, tool calls and the fallback are implemented and unit-tested against a mocked upstream. The live per-model test could not run: there is no `GEMINI_API_KEY` in this environment. Run `npm run check:gemini` with a key; it tests streaming plus a tool call on every model in the chain.
- [x] Shared rate limit in Upstash Redis (Vercel Marketplace) replacing the in-memory map and daily cap.
- [x] Protect `send_message` and the contact form with Cloudflare Turnstile or a honeypot field.
- [x] Label the agent plainly: "AI agent, answers from this site's content".
- [x] One line next to the mic button: voice input in Chrome sends audio to Google for recognition.

### 6.2 Reach
- [x] **Plain mode:** a visible `--no-tty` switch (and terminal command) that shows the same content with no boot, typing, sound, or snap scrolling. Remember the choice. Use P4 Ice white as its suggested theme.
- [x] `[ download CV ]` on the first screen of both modes.
- [!] **Project pages** `/projects/[slug]`: screenshot or short clip, the problem, what was built, one measured result, live link, README link. Add them to the sitemap.
  Done for all six projects, using content from each public README. A sourced measured result exists for only two (SENTRY, UBot), and media for five (AURA's repo is private), so the rest show none rather than invented figures. Kudzai should add real results and screenshots to `src/content/projects.ts`; the page renders them automatically. No project has a `liveUrl`, so there is no live link yet.
- [x] The terminal's `cat projects/<slug>/README.md` renders from the same content source; delete the hand-written README copies in the terminal filesystem.
- [x] **WebMCP:** feature-detect `navigator.modelContext` and register the existing tools (`download_resume`, `navigate_to_section`, `get_repo_stats`, `send_message`) from `TOOL_DECLARATIONS`. The API is early (sources show `registerTool` and `provideContext`), so verify the current spec.
- [x] Publish a plain-text `/llms.txt` summary of the work, projects and contact.
- [x] **Achievements:** an `achievements` command ("found 3 of 9") covering the easter eggs (`~/.secret`, `sl`, `hack`, `snake`, `adventure`, `matrix`, `vim`, a theme switch, the tour or similar), with the achievement chime on unlock, persisted in `localStorage`.

### 6.3 Accessibility
- [x] Agent replies are announced through an `aria-live="polite"` region once each reply finishes, not per character.
- [x] A screen-reader mode that mirrors terminal output into a live region (idea from xterm.js `screenReaderMode`).
- [x] Confirm every theme still passes the Phase 3 contrast test, including ghost suggestions and hints.

### 6.4 Quality gates in CI
- [x] GitHub Actions on pull requests: lint, typecheck, Vitest, Playwright smoke, Knip, and Lighthouse CI with budgets.
- [x] Final README pass describing the new architecture, themes, audio engine, commands (`theme`, `crt`, `achievements`, `--no-tty`), and tooling.

**Completion notes:**

- **Streaming agent:**
  - `src/lib/gemini.ts` (server-only) holds the model chain, round 1 via `:streamGenerateContent?alt=sse` (function calls arrive as their own parts, so tools still run), server tools and round 2.
  - `VisibleTextStream` keeps the `::SUGGEST::` line off screen.
  - `/api/chat` answers as SSE (`event: delta` / `event: done`) when asked, JSON otherwise. The client (`terminal/agent.ts`) reads the stream, and the session types the first words at 18 ms/char instead of showing a spinner for the whole generation. The final reply is authoritative.
  - **Fallback:** if streaming fails before any text is shown (an error status, or an empty stream), the round is retried on `generateContent`.
  - **`[!]` Live per-model testing needs a key.** There is no `GEMINI_API_KEY` here (no `.env.local`), so the real models could not be called. Instead:
    - `tests/unit/gemini.test.ts` (9 tests) covers SSE parsing across chunk splits, marker hold-back, streaming, tool calls in the stream, fallback on error and on an empty stream, 429 model fallthrough, and the send_message guard, all against a mocked upstream.
    - `npm run check:gemini` (`scripts/check-gemini-stream.mjs`) checks streaming text plus a tool call on **every model in the chain** once a key is set. Run it before deploying.
    - The client path was checked in the browser with a mocked SSE `/api/chat`: the agent label appears about 0.2 s after Enter and the reply types as it streams.
- **Shared rate limit:** `src/lib/rateLimit.ts` uses `@upstash/ratelimit` + `@upstash/redis` (Vercel Marketplace; `UPSTASH_REDIS_REST_*` or `KV_REST_API_*`).
  - chat: 8 per IP per minute, sliding window
  - daily: 200 globally, fixed window
  - message: 3 per IP per hour
  - The in-memory map and daily counter are gone from the route; without Redis (dev) the same numbers run in memory. Upstash itself is not provisioned (that is a Vercel dashboard step); `.env.example` and the README say how.
- **Spam protection:** a honeypot rather than Turnstile, so no keys and no widget. `src/lib/spamGuard.ts` combines a honeypot field (`website`) with a minimum of 2.5 s since page load (`performance.timeOrigin`, because Next.js prerendering forbids `Date.now()` in render).
  - `/api/contact` gives a filled honeypot a silent fake success, and also applies the message limit.
  - `send_message` (agent and WebMCP) refuses without the page's guard, plus the message limit.
  - The contact form, the terminal's `email` flow and every chat request carry the guard.
- **Labels:**
  - "◆ AI agent · answers from this site's content" appears once, above the first agent reply.
  - The line next to the mic reads "Voice input in Chrome sends your audio to Google for recognition." The mic button references it with `aria-describedby`, and the listening row repeats it.
- **Plain mode:** a visible `--no-tty` / `tty` switch, plus the `--no-tty`, `plain` and `tty` commands in every terminal.
  - The choice is stored (`portfolio-plain`) and applied before paint (`html[data-mode="plain"]`).
  - No boot, no typing (sections reveal like reduced motion), no sound (`audioEngine.setSuppressed`), no snap scrolling, particles, cursor, CRT, scanlines or view transitions.
  - Switching in applies P4 Ice white; switching out restores the previous theme.
  - `[ download CV ]` (`CvLink`) is in the hero in both modes. Plain mode on a fresh load is readable in about 0.95 s.
- **Project pages:** static `/projects/[slug]` pages, in the sitemap, linked from every card (`→ Details`), each with its own metadata and Open Graph image.
  - Content fields (`slug`, `problem`, `built`, `result?`, `media?`, `year`) were added to `src/content/projects.ts` from each project's **public GitHub README**. Media are the repos' own images and GIF, served unoptimized because the image optimizer can't reach GitHub from this machine.
  - **`[!]` Measured results:** only two projects have a sourced one. SENTRY: "verdict in under a second" (a README design guarantee). UBot: "the backtest balance roughly doubles, ~500 → ~990 over ~44 trades" (read from the repo's backtest chart). The others show no result rather than an invented one. AURA's repository isn't public, so its page uses the existing description and has no media. **Kudzai should add real numbers and screenshots** to `projects.ts`.
  - Deep links never show the boot. Off the home page the tmux bar marks no current window, the scroll hint hides, and section links go to `/#section`.
- **Terminal from the same source:** `cat projects/<slug>/README.md` prints `projectReadme()` (`lib/projectDocs.ts`), the same fields as the page.
  - The hand-written README copies are deleted. They described projects that don't exist ("AI ChatBot Platform", a "96.2% accuracy" classifier).
  - So were invented `experience/` logs ("TechCorp Solutions", "100% client satisfaction"), `skills/` files and `personal/contact.txt` (`kudzai@example.com`). These folders are now generated from `src/content`.
  - The adventure game's fake employer and "45%" claims were reworded, and the `git log` author uses the real contact email.
- **WebMCP:** `WebMcpTools` registers `download_resume`, `navigate_to_section`, `get_repo_stats` and `send_message` from `TOOL_DECLARATIONS`, with annotations. Server tools go through the new `/api/agent-tool`, with the rate limit and guard.
  - **Spec verified 2026-10-25:** Chrome's current docs use `document.modelContext.registerTool(tool, { signal })` with AbortSignal unregistration. Earlier drafts and the first origin trial used `navigator.modelContext`, and `provideContext` was removed from the spec in March 2026. Both objects are feature-detected; nothing runs where neither exists. Not exercised against a real browser agent, because no WebMCP-enabled browser is available here.
- **`/llms.txt`:** a route built from content in the llmstxt.org format (summary, projects with results, experience, skills, contact); it is in the sitemap.
- **Achievements:** the `achievements` command shows "found N of 9" with hints; each unlock plays the Phase 4 achievement chime plus one line, and progress is kept in localStorage. The nine: `~/.secret` or any dot-file (`~/.secret` was added), `sl`, `hack`, `snake`, `adventure`, `matrix`, getting out of `vim`, a theme switch, the tour.
- **Accessibility:**
  - `TerminalContainer` was `role="log"`, an implicit live region that read every typed character. It is now a labelled `region`, and each terminal has an `aria-live="polite"` region.
  - Agent replies are announced once they finish (they only enter history whole).
  - `screenreader on|off` (`sr`) mirrors every output line, one node per line. It is stored, and a visually hidden note by the prompt tells screen-reader users about it.
  - Contact labels are tied to their inputs.
  - The skip link targets `#main-content` on every page.
  - The contact social icons were `href="#"` with no names; they are now labelled links (CV, GitHub, LinkedIn).
  - **Contrast:** all 44 theme tests still pass, and a new test pins hints, ghost suggestions, the agent label and the voice note to `--dim` at full strength.
  - Lighthouse accessibility is **1.0** on `/` and a project page.
- **CI:** `.github/workflows/ci.yml`.
  - Job 1: lint, typecheck, Vitest, Knip.
  - Job 2: build, Playwright against the production build (`CI=true` makes `playwright.config.ts` use `next start`), then Lighthouse CI.
  - `lighthouserc.json` budgets: performance ≥ 0.85, accessibility ≥ 0.95, best practices ≥ 0.9, SEO ≥ 0.95, LCP ≤ 2.5 s, CLS ≤ 0.05, TBT ≤ 200 ms, JS ≤ 260 KB, total ≤ 1.3 MB.
  - **Measured locally on the production build** (Lighthouse 12.8.2, desktop): `/` scores 0.98 / 1.0 / 0.96 / 1.0, LCP 0.70 s, CLS 0.018, TBT 3 ms, JS 202 KB, total 291 KB. `/projects/sentry` scores 0.99 / 1.0 / 0.96 / 1.0. Every budget passes.
  - The only console errors are the Vercel Analytics / Speed Insights scripts returning 404 off Vercel.
  - **The workflow has not run on GitHub**, because nothing is committed or pushed (as asked).
- **Final README pass:** streaming, the rate limit, the spam guard, plain mode, project pages, WebMCP, `llms.txt`, achievements, screen-reader mode, the new commands, CI with budgets, new env vars, the file tree and the content fields. Traceability row 16 is ticked.
- **Bugs found and fixed while verifying:**
  - The global `section` rule (100dvh, flex, snap) hit the project page's content sections; it is now `main > section`.
  - The hero and About fade classes started at `opacity: 0` and relied on their animation, so plain mode, which turns animations off, showed blank output. The redundant `opacity: 0` is removed, and the e2e test now checks opacity.
  - Next.js flagged `Date.now()` during prerender (the guard); it now uses `performance.timeOrigin`.
  - The `mode` getter now sees a mode switch still queued inside a view transition.
- **Checks:**
  - Types, lint (0 warnings), Knip (clean), **106 unit tests**, the production build, and **4 Playwright tests**: the boot/terminal flow with the echo regression, tmux and returning visitor, project pages, and plain mode. One run failed right after a dev-server restart while routes compiled; it then passed four times.
  - Browser checks: streaming (mocked), label, live region, chips, achievements, the screen-reader mirror, plain mode on both phone and desktop, project pages on both, `/llms.txt`, the SSE offline reply, and the contact guard (no guard → 400, honeypot → fake success).

---

## Decisions

Where the review left a choice open, these are the answers. Follow them.

- **Themes:** the "Today" theme is removed. *(2026-10-25, at the owner's request: the default is now `night`, Night shift.)* The five themes are `p1` (the original default), `p3`, `p4`, `night`, `paper`, all selectable through the picker and the `theme` command. Night shift is not locked; a theme switch counts as an achievement in Phase 6.
- **Per-section tints:** removed.
- **Hum:** synthesised (0 KB), not a re-encoded file.
- **Tailwind:** removed.
- **Boot exit:** the CRT power-on (≤ 900 ms) replaces the 4.3 s sequence. The review's timeline used 0.6 s for this segment; anything up to `--dur-crt` is acceptable as long as the hero is fully readable in about 4.8 s on a first visit.
- **Glitch:** only the hero name keeps a glitch. *(Superseded 2026-10-25 at the owner's request: the character glitch runs across every section — see the Phase 5 notes.)*
- **xterm.js:** not adopted; its two ideas (screen-reader mirror, minimum contrast) are.
- **Order of tests:** the Vitest and Playwright safety net comes in Phase 1 (the review's roadmap put tests in week 4) so the refactors in Phases 1–2 are protected.

---

## Traceability matrix

Every suggestion in the review, mapped to its phase. Tick it here when the phase item is done. Nothing may stay unticked when Phase 6 is DONE.

| # | Review item (MD line) | Phase | Done |
|---|---|---|---|
| 1 | Touch-laptop cursor (109) | 1 | [x] |
| 2 | Double ripple (125) | 1 | [x] |
| 3 | Frame-rate independent cursor (185) | 1 | [x] |
| 4 | `100dvh`, proximity snap on small screens (198) | 1 | [x] |
| 5 | Glitch DOM ownership (204) | 1 | [x] |
| 6 | Remove Tailwind (216) | 1 | [x] |
| 7 | Dead TS: utils, types, glitch, controller, hook returns, animationTypes (446–460) | 1 | [x] |
| 8 | Dead CSS classes, keyframes, variables (446–460) | 1 | [x] |
| 9 | Broken cursor-blink selector (462) | 1 | [x] |
| 10 | `prod-server.log`, `*.log` ignore (460) | 1 | [x] |
| 11 | "Priority N" comments (472) | 1 | [x] |
| 12 | `useSectionAnimation` + shared section CSS (446–460) | 1 | [x] |
| 13 | Knip run (472, 485) | 1 | [x] |
| 14 | Analytics, Speed Insights, custom events (572) | 1 | [x] |
| 15 | Vitest + Playwright (576) | 1 | [x] |
| 16 | README updates (472) | 1–6 | [x] |
| 17 | Server-rendered sections, client islands (57–94) | 2 | [x] |
| 18 | Remove `SEOContent` duplication (57) | 2 | [x] |
| 19 | Cache Components (485) | 2 | [x] |
| 20 | Split terminal, one store, one key listener (137) | 2 | [x] |
| 21 | Lazy-load games (137) | 2 | [x] |
| 22 | Real `<input>` for prompt (589) | 2 | [x] |
| 23 | rAF text-node typewriter, AI reply loop (152) | 2 | [x] |
| 24 | One FX scheduler loop (77) | 2 | [x] |
| 25 | Particles: sprite, grid, batched lines, DPR (173) | 2 | [x] |
| 26 | OffscreenCanvas worker (485) | 2 | [x] |
| 27 | Pause particles during boot and games (216) | 2 | [x] |
| 28 | React Compiler, remove manual memoization (472, 485) | 2 | [x] |
| 29 | Bundle analyzer (216) | 2 | [x] |
| 30 | Token palette with semantic colours (391) | 3 | [x] |
| 31 | Remove "Today" theme and all green literals (468) | 3 | [x] |
| 32 | Remove per-section tints (393) | 3 | [x] |
| 33 | Themes P1 (default), P3, P4, Night shift, Daylight paper (399) | 3 | [x] |
| 34 | Canvas and cursor read tokens (393) | 3 | [x] |
| 35 | `theme` command + picker + persistence (393) | 3 | [x] |
| 36 | Contrast ≥ 4.5:1 test, minimum contrast (541) | 3 | [x] |
| 37 | JetBrains Mono + VT323 via `next/font` (420) | 3 | [x] |
| 38 | Web Audio engine: buffers, detune, pan, gain, compressor (319) | 4 | [x] |
| 39 | Remove 72 audio elements (319) | 4 | [x] |
| 40 | Sound palette (370) | 4 | [x] |
| 41 | Synth hum, delete WAV, start after boot (131, 370) | 4 | [x] |
| 42 | Duck hum under speech (384) | 4 | [x] |
| 43 | Pause on hidden tab, idle fade (384) | 4 | [x] |
| 44 | `[ start ]` / `[ start silent ]` (384) | 4 | [x] |
| 45 | Orb follows mic level via AnalyserNode (316) | 4 | [x] |
| 46 | Motion tokens (251) | 5 | [x] |
| 47 | Typing v2: bursts, bigrams, rare corrections (229) | 5 | [x] |
| 48 | Line-streamed output, afterglow (229, 278) | 5 | [x] |
| 49 | Skip on any key + first-time hint (229) | 5 | [x] |
| 50 | Finish instead of retype on scroll-away (216) | 5 | [x] |
| 51 | Boot 1.6 s, any key, localStorage returning visitors (95) | 5 | [x] |
| 52 | CRT power-on replaces exit sequence (274) | 5 | [x] |
| 53 | Scanlines opt-in, `crt on/off` (286) | 5 | [x] |
| 54 | Channel change via View Transitions (296, 485) | 5 | [x] |
| 55 | tmux status bar page indicator (296) | 5 | [x] |
| 56 | Restrained glitch on name only (302) | 5 | [x] |
| 57 | Keycap buttons (308) | 5 | [x] |
| 58 | Standby dimming via scroll-driven animation (312, 485) | 5 | [x] |
| 59 | Cursor ring hugs buttons (312) | 5 | [x] |
| 60 | Project cards as `ls -l` (312) | 5 | [x] |
| 61 | Optional WebGL CRT shader, MIT only (502) | 5 | [x] |
| 62 | Stream agent replies with fallback (210, 485) | 6 | [x] |
| 63 | Upstash shared rate limit (582) | 6 | [x] |
| 64 | Turnstile or honeypot on `send_message` (582) | 6 | [x] |
| 65 | AI label, voice privacy note (582) | 6 | [x] |
| 66 | `--no-tty` plain mode, CV on first screen (564) | 6 | [x] |
| 67 | Project pages + sitemap, terminal README from same source (568, 533) | 6 | [x] |
| 68 | WebMCP tools + `/llms.txt` (510) | 6 | [x] |
| 69 | Achievements command (537) | 6 | [x] |
| 70 | `aria-live` on finished replies, screen-reader mirror (589, 541) | 6 | [x] |
| 71 | CI: lint, types, tests, Knip, Lighthouse CI (216, 472, 576) | 6 | [x] |
