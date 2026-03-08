# Developer Portfolio — Architecture & Onboarding Guide

A terminal-themed developer portfolio built with Next.js. Every section animates like a real terminal session: commands type out character-by-character with keystroke audio, output fades in, and the whole thing resets gracefully when the user scrolls away.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Animation System Deep Dive](#3-animation-system-deep-dive)
4. [Typing Config — The Single Source of Truth](#4-typing-config--the-single-source-of-truth)
5. [Audio System](#5-audio-system)
6. [Glitch System](#6-glitch-system)
7. [Particle System](#7-particle-system)
8. [Section Component Pattern](#8-section-component-pattern)
9. [Key Files & Directory Structure](#9-key-files--directory-structure)
10. [How to Add a New Section](#10-how-to-add-a-new-section)
11. [How to Tune Typing Feel](#11-how-to-tune-typing-feel)

---

## 1. Project Overview

**What it is:** A single-page portfolio with five scroll sections (hero, about, projects, experience, contact), each rendered inside a terminal chrome. On first visit, a CRT boot screen plays before the portfolio becomes interactive.

**Tech stack:**

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, component-scoped `<style>` blocks |
| Email | Resend + @react-email/components |
| Audio | Web Audio API (`new Audio()`) |
| Animation | Custom step-based controller (no external lib) |
| Particles | Canvas 2D API |

---

## 2. Architecture Overview

```
app/layout.tsx
└── BootProvider (context)
    ├── BootScreen          — CRT boot sequence overlay
    ├── Background          — Canvas particle system (fixed, full-viewport)
    ├── CustomCursor        — Green dot cursor
    ├── ScrollHint          — Scroll indicator
    └── app/page.tsx
        └── <main>
            ├── ScrollSection id="home"       → HeroSection
            ├── ScrollSection id="about"      → AboutSection
            ├── ScrollSection id="projects"   → ProjectsSection
            ├── ScrollSection id="experience" → ExperienceSection
            └── ScrollSection id="contact"    → ContactSection
```

**How the major systems relate:**

- **BootContext** gates every section: no animation starts until `isBooted === true`. The boot screen writes `sessionStorage['portfolio-booted']` so the animation skips on return visits.
- **audioController** (`lib/audioController.ts`) is a module-level singleton. Only one section can own audio at a time; sections compete for control via `requestAudioControl()` / `releaseAudioControl()`.
- **AnimationController** (`lib/animationController.ts`) is instantiated per section via `useAnimationController`. It drives everything — typing, output reveals, inter-command delays — as a flat array of `AnimationStep`s.
- **typingConfig.ts** is the single configuration file. It supplies speed presets and pattern values to every section and hook. No speeds are hardcoded anywhere else.
- **Glitch system** and **particle system** are self-contained. Glitch is called directly from section `useEffect`s after output is revealed; particles run continuously in `Background`.

---

## 3. Animation System Deep Dive

### Core class: `AnimationController` (`src/lib/animationController.ts`)

An imperative state machine with the lifecycle:

```
idle → running → completed
            ↓
         cancelled → (reset back to) idle
         paused   → resumed → running
```

It holds a flat `AnimationStep[]`. Each step has:

```ts
// src/lib/animationTypes.ts:18
interface AnimationStep {
  id?: string
  action: () => void   // executed immediately when step is reached
  duration: number     // ms to wait before advancing to next step
}
```

The controller fires `action()`, then schedules `setTimeout(executeNextStep, duration)`. All pending timers are tracked in an array and bulk-cleared on `cancel()`. This guarantees no orphaned callbacks after scroll-away.

### React wrapper: `useAnimationController` (`src/hooks/useAnimationController.ts`)

Stores the `AnimationController` instance in a `useRef` so it survives re-renders. Exposes memoized methods (`start`, `cancel`, `reset`, etc.) and syncs controller state to React state so components can re-render on transitions:

```ts
// src/hooks/useAnimationController.ts:177
const start = useCallback((steps: AnimationStep[]): boolean => {
  controller.setSteps(steps)
  const started = controller.start()
  syncState()
  return started
}, [syncState])
```

Auto-cancels on unmount (`autoCleanup = true` by default).

### Typing steps: `useTypingAnimation` (`src/hooks/useTypingAnimation.ts`)

Generates one `AnimationStep` per character. Each step calls `setText(currentText)` and fires `onKeystroke(char, index, isLast)` for audio. The inter-character delay is calculated by `calculateDelay()` which stacks:

1. Character-class multiplier (from `typingConfig.getCharClassMultiplier`)
2. File extension slowdown (characters after the last `.` in text containing an extension)
3. Positional multipliers (start / middle / end of string)
4. Slow-character rules (path separators, punctuation)
5. Repeated-character acceleration (muscle memory)
6. Random micro-pause (probability gate)
7. ±30% natural variation

```ts
// src/hooks/useTypingAnimation.ts:91
const calculateDelay = useCallback((char, index, fullText, speed) => {
  let delay = speed
  delay *= getCharClassMultiplier(char)
  // ... positional, slow-char, random layers applied in sequence ...
  return Math.max(10, delay)
}, [])
```

### Viewport detection: `useInView` (`src/hooks/useInView.ts`)

Wraps `IntersectionObserver`. Returns `{ ref, isInView, hasBeenInView }`. Sections use `triggerOnce: false` so the animation resets every time the user scrolls away and returns.

### How they connect in a section

```
useInView.onInViewChange(inView)
  → if inView:  audio.requestAudioControl()
  → if !inView: audio.releaseAudioControl()
                resetAnimationState()   ← cancels controller + clears typing state

useEffect([isBooted, isInView, audio.hasAudioControl, animation.isCompleted])
  → when all conditions true:
       steps = buildAnimationSequence()
       animation.start(steps)
```

`buildAnimationSequence()` is a `useCallback` that assembles the full flat step array: initial delay → volume ramp reset → typing steps for command 1 → post-command delay → show output → between-commands delay → repeat for commands 2…N.

Once `animation.isCompleted === true`, the component switches to `renderStaticContent()` — a plain HTML snapshot of the final state — and never re-animates until the page is refreshed.

---

## 4. Typing Config — The Single Source of Truth

**File:** `src/constants/typingConfig.ts`

Every number that affects how typing feels lives here. No speed or pattern value is hardcoded in any hook or section component.

### Per-section speed presets

```ts
// src/constants/typingConfig.ts:100
export const sectionTypingConfigs: Record<SectionId, SectionTypingConfig> = {
  hero:       { baseSpeed: 90,  patternOverrides: { startSpeedMultiplier: 2.2, randomPauseProbability: 0.10 } },
  about:      { baseSpeed: 65,  patternOverrides: { middleSpeedMultiplier: 0.65 } },
  projects:   { baseSpeed: 70,  patternOverrides: { extensionSpeedMultiplier: 3.0 } },
  experience: { baseSpeed: 70,  patternOverrides: { startSpeedMultiplier: 1.6 } },
  contact:    { baseSpeed: 70,  patternOverrides: {} },
}
```

`baseSpeed` is milliseconds per character at baseline (before all multipliers). Lower = faster.

### Global human typing pattern

```ts
// src/constants/typingConfig.ts:24
export const globalTypingPattern: Required<HumanTypingPattern> = {
  startSpeedMultiplier: 1.8,       // slow start (thinking before typing)
  middleSpeedMultiplier: 0.7,      // fast in the flow
  endSpeedMultiplier: 1.3,         // slight hesitation at end
  extensionSpeedMultiplier: 3.5,   // dramatic pause on .txt / .sh
  randomPauseProbability: 0.08,    // 8% chance of a micro-pause per keystroke
  randomPauseMultiplier: 2.5,      // pause = 2.5× base delay
  repeatedCharMultiplier: 0.8,     // "ll", "ss" — muscle memory, slightly faster
  slowCharacters: ['.', '/', '\\', '-', '_', '~', '|'],
  slowCharMultiplier: 1.5,
}
```

Section `patternOverrides` are shallow-merged on top: `{ ...globalTypingPattern, ...patternOverrides }`.

### Character-class multipliers

```ts
// src/constants/typingConfig.ts:51
export const charClassMultipliers = {
  digit:         1.35,   // reaching for number row
  uppercase:     1.25,   // holding shift
  specialSymbol: 1.55,   // shift + number row  (@#$%^&*)
  pathSeparator: 1.45,   // - _ / \ | ~ . ;
  lowercase:     1.0,    // baseline
  space:         0.85,   // thumb hit — slightly faster
}
```

### Audio / volume ramp settings

```ts
// src/constants/typingConfig.ts:140
export const audioConfig = {
  baseVolume: 0.4,
  volumeRampEnabled: true,
  volumeRampKeystrokes: 10,      // keystrokes to ramp from min to full volume
  volumeRampMinFraction: 0.5,    // starts at 50% of baseVolume
  volumeDecayDelayMs: 2000,      // ms of silence before the ramp decays
  volumeDecayFactor: 0.5,        // ramp drops to 50% of current value on decay
}
```

### Sequence timings

```ts
// src/constants/typingConfig.ts:166
export const sequenceTimings = {
  initialDelay: 500,           // pause before first command starts
  postCommandDelay: 350,       // pause after typing ends, before output appears
  betweenCommandsDelay: 900,   // pause between output reveal and next command
}
```

### Helper functions

- `getPatternForSection(id)` — returns the merged `Required<HumanTypingPattern>` for a section
- `getBaseSpeedForSection(id)` — returns `baseSpeed` for a section
- `getCharClassMultiplier(char)` — returns the correct multiplier for one character

---

## 5. Audio System

### Global controller: `audioController` (`src/lib/audioController.ts`)

A module-level singleton (`export const audioController = new GlobalAudioController()`). Tracks a single `activeSection: string | null`. When a section calls `setActiveSection(id)`, the previous section is notified it lost control via a subscribed callback. This ensures only one section plays sounds at a time.

```ts
// src/lib/audioController.ts:10
setActiveSection(sectionId: string) {
  if (this.activeSection === sectionId) return
  const previousSection = this.activeSection
  this.activeSection = sectionId
  if (previousSection) this.notifyListeners(previousSection)
  this.notifyListeners(sectionId)
}
```

### Hook: `useKeystrokeAudio` (`src/hooks/useKeystrokeAudio.ts`)

Handles everything for one section:

- **Sound file arrays** — `regular[]`, `space[]`, `enter[]`. Defaults to four keystroke mp3s. Pass custom arrays via the `soundFiles` option.
- **Keyboard-region-aware selection** — Left-hand characters (`qwertasdfgzxcvb…`) pull from the first half of the `regular` pool; right-hand characters from the second half. A no-repeat guard prevents the same file playing back-to-back within the same region.
- **Volume per keystroke** — uppercase and punctuation play slightly louder (×1.05–1.15); spaces play quieter (×0.75–0.90); enter plays louder (×1.10–1.25).
- **Volume ramp** — keystroke count is tracked in a ref. Volume scales from `baseVolume × volumeRampMinFraction` up to `baseVolume` over `volumeRampKeystrokes` keystrokes. A `setTimeout` decays the ramp counter after `volumeDecayDelayMs` of silence.
- **Mute persistence** — stored in `localStorage` as `keystroke-audio-muted`.

```ts
// src/hooks/useKeystrokeAudio.ts:274
const playKeystroke = useCallback((keyType: KeyType = 'regular') => {
  if (isMuted || !audioController.hasControl(sectionId)) return
  const audio = new Audio(soundFile)
  audio.volume = calculateVolume(char, keyType, volume)
  audio.play().catch(...)
}, [isMuted, volume, sectionId, ...])
```

### Bridge: `useTypingAudioCallback` (`src/hooks/useKeystrokeAudio.ts:353`)

Converts the `onKeystroke(char, index, isLast)` callback signature used by `useTypingAnimation` into the `playKeystroke(keyType)` call used by `useKeystrokeAudio`. Sections use it like this:

```ts
const audio = useKeystrokeAudio({ sectionId: 'hero', ... })
const { onTypingKeystroke } = useTypingAudioCallback(audio)

// In buildAnimationSequence:
cmd1Typing.generateSteps('whoami', { onKeystroke: onTypingKeystroke })
```

### Sound file configuration

Default files live in `public/sounds/`:

```ts
soundFiles: {
  regular: ['/sounds/keystroke_1.mp3', '…_2.mp3', '…_3.mp3', '…_4.mp3'],
  space:   ['/sounds/keystroke_1.mp3'],
  enter:   ['/sounds/keystroke_2.mp3'],
}
```

Add more files to any array to increase variety. The hook auto-selects without repeating consecutive hits within the same key type / region.

---

## 6. Glitch System

**File:** `src/lib/glitch.ts`

### 2-phase character glitch cycle

Every glitch event has two phases:

1. **Phase 1** — Vintage CSS effects fire (`glitch-rgb` animation + `digital-noise` class). Simultaneously, a random character from the pool `01アイウエオ…!@#$%^&*█▓▒░` replaces a random character in the target element via an overlay `<span>`. The vintage effects fade in ~150ms but the **glitch character stays visible**.
2. **Phase 2** — After `glitchCharDisplayDuration` ms, vintage effects fire again and the **original character is restored** to the overlay.

The DOM wraps each non-space character on first call:

```html
<span class="glitch-char-wrapper">
  <span class="glitch-char-original" data-original-char="K">K</span>
  <span class="glitch-char-overlay">K</span>  ← swapped in phase 1
</span>
```

Spaces are left as plain text nodes to preserve layout. The wrapping is idempotent (`data-glitch-wrapped` guard).

### Entry point: `startCharacterGlitch`

```ts
// src/lib/glitch.ts:333
const cleanup = startCharacterGlitch(element, {
  intensity: 'low',
  singleCharInterval: 10000,        // single-char glitch every 10s
  multiCharInterval: 15000,         // multi-char glitch every 15s
  glitchCharDisplayDuration: 3000,  // glitch char visible for 3s
})
// Call cleanup() to stop (returns from useEffect)
```

### Intensity presets

| Preset | singleCharInterval | multiCharInterval | numChars | glitchCharDisplayDuration |
|---|---|---|---|---|
| `low` | 3000ms | 6000ms | 1 | 2000ms |
| `medium` | 1500ms | 3000ms | 2–3 | 1500ms |
| `high` | 800ms | 1800ms | 3–5 | 1000ms |

Custom interval/duration options override the preset values when provided.

### CSS-only vintage effects (no character replacement)

`startPeriodicGlitch(element)` fires `glitch-rgb`, `chromatic-aberration`, and `digital-noise` CSS classes on a schedule without touching the DOM text. Use this for containers where character replacement would break layout.

---

## 7. Particle System

**Files:** `src/lib/particles.ts` (all logic), `src/components/layout/Background.tsx` (rendering loop)

### Spatial structure

Particles are distributed across three overlapping structures at init:

1. **Cluster zones** — Pre-seeded high-density areas. Desktop: 5 clusters (center radius 250px × 18 particles, four corners ~120–150px × 12–15 particles). Mobile: 3 clusters with reduced counts. Cluster particles are free-roaming (no zone bounds).
2. **Particle zones** — A 3×3 grid divides the canvas into 9 cells. Most regular particles are assigned a zone and bounce within its bounds, ensuring even coverage.
3. **Filler particles** — Small, subtle (opacity 0.1–0.25) particles, ~4 per grid cell, filling background gaps.

### Depth layers

Three tiers simulate parallax:

| Layer | % of total | Size | Base speed | Opacity |
|---|---|---|---|---|
| Far | 30% | 0.3–1.1px | 0.12 | 0.05–0.17 |
| Mid | 40% | 0.8–2.0px | 0.20 | 0.15–0.35 |
| Close | 30% | 1.5–3.0px | 0.35 | 0.25–0.50 |

### Hub particles

20% of non-filler particles are hubs: 1.5× larger (3.75–6.0px), brighter (0.4–0.7 opacity), with a sine-wave pulse (`pulsePhase += 0.03` per frame). Hub-to-hub connections extend 20% further than the `hubConnectionDistance` threshold, render at 1.8× brightness, and use 1.5px line width.

### Fast particles

5% of particles move at 3× their tier speed, creating "shooting star" streaks with 12px canvas shadow blur.

### Mouse interaction (desktop only)

In `updateParticle` (`src/lib/particles.ts:314`):

- **0–150px from cursor** — particle `currentSize` grows up to 40% beyond `baseSize`.
- **150–300px from cursor** — gentle direction steering toward cursor at 2% blend per frame.
- **Click** — radial repulsion force scaled by depth (`depthFactor` 1–2.5×, radius 250px).

Mouse tracking is skipped entirely on mobile (no `mousemove` listener, no ripple on click).

### Mobile optimization

`mobileParticleConfig`: 70 particles (vs 200), shorter connection distances (120/150/150 vs 180/210/240), 30fps cap (vs 60fps), 3 smaller clusters.

---

## 8. Section Component Pattern

All five sections follow the same structure. This is the critical pattern for adding a new section.

### Full annotated pattern

```ts
// --- Module level: pull config once, not inside the component ---
const pattern = getPatternForSection('hero')
const speed   = getBaseSpeedForSection('hero')

export default function HeroSection() {
  // 1. BootContext gate — nothing runs until the boot screen completes
  const { isBooted } = useBootContext()

  // 2. Output visibility flags — one per command output block
  const [showOutput1, setShowOutput1] = useState(false)

  // 3. Audio — section declares its own sectionId
  const audio = useKeystrokeAudio({
    sectionId: 'hero',
    volume: audioConfig.baseVolume,
    volumeRampEnabled: audioConfig.volumeRampEnabled,
  })
  const { onTypingKeystroke } = useTypingAudioCallback(audio)

  // 4. Animation controller
  const animation = useAnimationController({ onComplete: () => {} })

  // 5. One useTypingAnimation instance per command in the section
  const cmd1Typing = useTypingAnimation({ baseSpeed: speed, humanPattern: pattern })

  // 6. Stable ref for inView callback — prevents observer teardown on state changes
  const onInViewChangeRef = useRef<((inView: boolean) => void) | undefined>(undefined)
  useEffect(() => {
    onInViewChangeRef.current = (inView: boolean) => {
      if (inView) {
        audio.requestAudioControl()
      } else {
        audio.releaseAudioControl()
        if (animation.isRunning) resetAnimationState()  // cancel controller + reset all typing
      }
    }
  }, [audio, animation.isRunning, resetAnimationState])

  // 7. Attach IntersectionObserver
  const { ref, isInView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
    onInViewChange: (inView) => onInViewChangeRef.current?.(inView),
  })

  // 8. Build the flat step array — all commands, outputs, and delays in sequence
  const buildAnimationSequence = useCallback(() => {
    const steps = []
    steps.push(AnimationController.createDelayStep(sequenceTimings.initialDelay))
    steps.push(AnimationController.createActionStep(() => audio.resetVolumeRamp()))
    steps.push(...cmd1Typing.generateSteps('whoami', { onKeystroke: onTypingKeystroke }))
    steps.push(AnimationController.createDelayStep(sequenceTimings.postCommandDelay))
    steps.push(AnimationController.createActionStep(() => setShowOutput1(true)))
    // ... repeat pattern for each subsequent command
    return steps
  }, [cmd1Typing, onTypingKeystroke, audio])

  // 9. Start condition — all gates must pass simultaneously
  useEffect(() => {
    if (!isBooted) return
    if (!isInView || !audio.isAudioReady || !audio.hasAudioControl) return
    if (animation.isCompleted || animation.isRunning) return
    animation.start(buildAnimationSequence())
  }, [isBooted, isInView, audio.isAudioReady, audio.hasAudioControl,
      animation.isCompleted, animation.isRunning, buildAnimationSequence, animation])

  // 10. Optional: start glitch on output elements after they appear
  useEffect(() => {
    if (!showOutput1 || !isInView || !nameRef.current) return
    return startCharacterGlitch(nameRef.current, { intensity: 'low', ... })
  }, [showOutput1, isInView])

  // 11. Release resources on unmount
  useEffect(() => {
    return () => {
      audio.releaseAudioControl()
      animation.cancel()
    }
  }, [])

  // 12. Once completed → static snapshot; otherwise animated content
  return (
    <div ref={ref}>
      <TerminalContainer title="developer@portfolio:~$">
        {animation.isCompleted ? renderStaticContent() : renderAnimatingContent()}
      </TerminalContainer>
    </div>
  )
}
```

**Why `renderStaticContent`?** Once `animation.isCompleted`, the section renders a plain HTML snapshot. This removes all typing-state React overhead and gives crawlers clean, stable markup.

**Why the stable `onInViewChangeRef`?** `useInView` captures `onInViewChange` inside its observer setup `useEffect`. Using a ref-forwarded callback prevents the observer from being disconnected and re-created every time `audio` or `animation` state changes.

---

## 9. Key Files & Directory Structure

```
.
├── app/
│   ├── layout.tsx              — Root layout: BootProvider, Background, BootScreen
│   ├── page.tsx                — ScrollSection wrappers + keyboard navigation
│   ├── globals.css             — CSS custom properties (colors, fonts, spacing)
│   ├── robots.ts               — robots.txt generation
│   └── sitemap.ts              — sitemap.xml generation
│
└── src/
    ├── constants/
    │   ├── typingConfig.ts     — ★ SINGLE SOURCE OF TRUTH: all typing/audio config
    │   └── hero.ts             — Static content constants for hero section
    │
    ├── lib/
    │   ├── animationController.ts  — AnimationController class (imperative state machine)
    │   ├── animationTypes.ts       — All TypeScript interfaces/types for animation system
    │   ├── audioController.ts      — GlobalAudioController singleton
    │   ├── glitch.ts               — 2-phase character glitch + CSS vintage effects
    │   ├── particles.ts            — Particle creation, update, draw, connection logic
    │   └── utils.ts                — General utilities
    │
    ├── hooks/
    │   ├── useAnimationController.ts — React wrapper for AnimationController
    │   ├── useTypingAnimation.ts     — Generates AnimationStep[] for character typing
    │   ├── useInView.ts              — IntersectionObserver hook
    │   └── useKeystrokeAudio.ts      — Audio playback + useTypingAudioCallback bridge
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Background.tsx        — Canvas particle system (fixed, full-viewport)
    │   │   ├── BootScreen.tsx        — CRT boot sequence overlay (5-phase exit)
    │   │   ├── CustomCursor.tsx      — Custom cursor element
    │   │   ├── ScrollHint.tsx        — Scroll indicator
    │   │   ├── context/
    │   │   │   └── BootContext.tsx   — isBooted / completeBoot context
    │   │   └── seo/
    │   │       ├── SEOContent.tsx    — Visually-hidden semantic HTML for crawlers
    │   │       └── StructuredData.tsx — JSON-LD structured data (Person schema)
    │   │
    │   ├── sections/
    │   │   ├── HeroSection.tsx
    │   │   ├── AboutSection.tsx
    │   │   ├── ProjectsSection.tsx
    │   │   ├── ExperienceSection.tsx
    │   │   └── ContactSection.tsx
    │   │
    │   └── shared/
    │       ├── TerminalContainer.tsx — Terminal chrome wrapper (title bar + border)
    │       ├── ScrollSection.tsx     — Full-height scroll-snap section wrapper
    │       └── email-templates/      — Resend email templates (confirmation + notification)
    │
    └── types/
        └── index.ts              — Shared application types
```

---

## 10. How to Add a New Section

### Step 1 — Register the section ID in `typingConfig.ts`

```ts
// src/constants/typingConfig.ts
export type SectionId = 'hero' | 'about' | 'projects' | 'experience' | 'contact' | 'skills'

export const sectionTypingConfigs: Record<SectionId, SectionTypingConfig> = {
  // ... existing entries ...
  skills: {
    baseSpeed: 70,
    patternOverrides: {
      randomPauseProbability: 0.07,
    },
  },
}
```

### Step 2 — Create the section component

Create `src/components/sections/SkillsSection.tsx` following the [Section Component Pattern](#8-section-component-pattern). The minimal imports you need:

```ts
import { useBootContext } from '@/src/components/layout/context/BootContext'
import { useInView } from '@/src/hooks/useInView'
import { useKeystrokeAudio, useTypingAudioCallback } from '@/src/hooks/useKeystrokeAudio'
import { useAnimationController } from '@/src/hooks/useAnimationController'
import { useTypingAnimation } from '@/src/hooks/useTypingAnimation'
import { AnimationController } from '@/src/lib/animationController'
import TerminalContainer from '@/src/components/shared/TerminalContainer'
import {
  getBaseSpeedForSection,
  getPatternForSection,
  audioConfig,
  sequenceTimings,
} from '@/src/constants/typingConfig'
```

### Step 3 — Wire it into `app/page.tsx`

```tsx
import SkillsSection from '@/src/components/sections/SkillsSection'

// Inside <main>:
<ScrollSection id="skills">
  <SkillsSection />
</ScrollSection>
```

Add `'skills'` to the `sections` array in the keyboard navigation `useEffect` in `page.tsx`.

### Step 4 — (Optional) Add glitch to output elements

After output is revealed, start a glitch on any `ref`-attached element:

```ts
useEffect(() => {
  if (!showOutput1 || !isInView || !myRef.current) return
  return startCharacterGlitch(myRef.current, {
    intensity: 'low',
    singleCharInterval: 12000,
    glitchCharDisplayDuration: 2500,
  })
}, [showOutput1, isInView])
```

---

## 11. How to Tune Typing Feel

All adjustments are made exclusively in `src/constants/typingConfig.ts`.

### Make a section type faster or slower overall

Change `baseSpeed` (milliseconds per character; lower = faster):

```ts
skills: { baseSpeed: 50, ... }  // fast — was 70
skills: { baseSpeed: 110, ... } // slow — deliberate, dramatic
```

### Make the start less or more dramatic

Adjust `startSpeedMultiplier` in `patternOverrides` (1.0 = no effect, 3.0 = very slow start):

```ts
patternOverrides: { startSpeedMultiplier: 1.2 }  // quicker to get going
```

### Reduce or increase hesitation

`randomPauseProbability` is the per-keystroke chance of a micro-pause (0 = never, 0.15 = frequent):

```ts
patternOverrides: { randomPauseProbability: 0.04 }  // smooth, less hesitant
```

`randomPauseMultiplier` controls how long that pause is relative to the base delay:

```ts
globalTypingPattern.randomPauseMultiplier = 4.0  // very long hesitations when they hit
```

### Make file extension typing more or less dramatic

`extensionSpeedMultiplier` applies to characters after the last `.` in text like `cat role.txt`:

```ts
projects: { baseSpeed: 70, patternOverrides: { extensionSpeedMultiplier: 6.0 } }
```

### Change how individual character classes feel

Edit `charClassMultipliers` (higher = slower):

```ts
export const charClassMultipliers = {
  digit: 1.5,          // was 1.35 — number row feels more labored
  specialSymbol: 1.3,  // was 1.55 — symbols feel less effortful
  space: 0.7,          // was 0.85 — thumb hits are snappier
}
```

### Add a new slow character

Append to `slowCharacters` in `globalTypingPattern`:

```ts
slowCharacters: ['.', '/', '\\', '-', '_', '~', '|', ':'],
```

### Adjust audio volume ramp speed

Change how many keystrokes reach full volume, and how quiet the first keystroke is:

```ts
export const audioConfig = {
  volumeRampKeystrokes: 5,    // was 10 — louder faster
  volumeRampMinFraction: 0.2, // was 0.5 — starts very quiet
  volumeDecayDelayMs: 1000,   // was 2000 — ramp resets faster after silence
}
```

### Change inter-command pacing

These apply globally to all sections:

```ts
export const sequenceTimings = {
  initialDelay: 300,          // was 500 — less pause before first command
  postCommandDelay: 150,      // was 350 — output appears quicker after typing
  betweenCommandsDelay: 600,  // was 900 — tighter flow between commands
}
```
