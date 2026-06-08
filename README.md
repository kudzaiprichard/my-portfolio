# my-portfolio

A terminal-themed personal portfolio for **Kudzai Prichard Matizirofa**, built as a Next.js 16 / React 19 single-page experience. Every section renders as a typed-out shell session — phosphor green on dark, animated, interactive, and audible.

The site doubles as a working pseudo-OS: it boots, snaps between sections, accepts shell commands, ships an inline `vim`, an ASCII Snake game, a text adventure, and a Matrix rain mode. None of that is decorative — the components, hooks, and animation engine were built to support it.

The terminal is also **conversational**. A built-in AI agent (Google Gemini, grounded on this site's own content and speaking in the first person as Kudzai) answers plain-English questions, *acts* on them through function calling — scrolling to sections, downloading the CV, opening links, running safe commands, fetching live GitHub stats, even taking a message to Kudzai's inbox — and can be driven entirely **by voice** (mic in, spoken replies out) where the browser supports it.

> The git history is the source of truth. This README explains structure and intent; for *why a specific change exists*, read the commit.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Quick start](#quick-start)
3. [Environment variables](#environment-variables)
4. [Repository layout](#repository-layout)
5. [Architecture overview](#architecture-overview)
6. [Section anatomy](#section-anatomy)
7. [Hook dependency map](#hook-dependency-map)
8. [The animation pipeline](#the-animation-pipeline)
9. [Typing config reference](#typing-config-reference)
10. [Audio system](#audio-system)
11. [Interactive terminal](#interactive-terminal)
12. [Terminal AI agent](#terminal-ai-agent)
13. [Voice interaction](#voice-interaction)
14. [Contact form & email pipeline](#contact-form--email-pipeline)
15. [Boot screen & scroll model](#boot-screen--scroll-model)
16. [Content data model](#content-data-model)
17. [Styling & theming](#styling--theming)
18. [Accessibility](#accessibility)
19. [SEO](#seo)
20. [Customising the content](#customising-the-content)
21. [Deployment](#deployment)
22. [Things to know before contributing](#things-to-know-before-contributing)

---

## Tech stack

| Layer            | Choice                                                                           |
|------------------|----------------------------------------------------------------------------------|
| Framework        | **Next.js 16** (App Router, `app/` directory)                                    |
| UI runtime       | **React 19** (client components for everything interactive)                      |
| Language         | **TypeScript 5** (strict mode, `@/*` path alias to repo root)                    |
| Styling          | Custom CSS (CSS custom properties) + per-component scoped `<style>` blocks. **Tailwind v4** + `@tailwindcss/postcss` are wired up but the codebase does not currently use Tailwind utility classes — the build pipeline is in place if you want to start. |
| Email            | **Resend** + `@react-email/components` for the contact pipeline                  |
| AI agent         | **Google Gemini** (AI Studio `generateContent` REST API) behind a server-only `/api/chat` route — function calling, grounded on the site's own content. No SDK; called over `fetch`. |
| Voice            | Browser-native **Web Speech API** — speech recognition (mic → text) + speech synthesis (spoken replies). English-only, feature-detected, no dependency. |
| Lint             | `eslint-config-next` (core-web-vitals + typescript)                              |
| Node             | `20.x` (pinned in `package.json` `engines`)                                      |

There is **no test runner**, **no Storybook**, **no state-management library**, and **no UI kit**. Everything rendered on screen is hand-built from primitives in `src/`.

---

## Quick start

```bash
# Install
npm install

# Run dev server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm run start

# Type-check without emitting
npx tsc --noEmit

# Lint
npm run lint

# Regenerate the OG image (public/og-image.png) from the inline SVG
# Requires `sharp` to be installed locally.
node scripts/generate-og.js
```

Copy the env template and fill in your values:

```bash
cp .env.example .env.local
```

Everything degrades gracefully when keys are missing:

- **No `RESEND_API_KEY`** → the contact form and the agent's `send_message` tool report a friendly failure (the route no longer hard-500s the page).
- **No `GEMINI_API_KEY`** → the AI agent politely says it's offline and points visitors to `help`/`email`; the rest of the terminal works untouched.

The boot screen, animations, games, and the full command-driven terminal all run with zero environment configuration.

---

## Environment variables

A documented template lives at **`.env.example`** — `cp .env.example .env.local` and fill it in. All public values use the `NEXT_PUBLIC_` prefix and are inlined at build time. `RESEND_API_KEY`, `GEMINI_API_KEY`, and `GITHUB_TOKEN` are server-only and never reach the client bundle.

| Variable                       | Used by                                  | Notes |
|--------------------------------|------------------------------------------|-------|
| `NEXT_PUBLIC_SITE_URL`         | `app/layout.tsx`, `sitemap.ts`, `robots.ts`, `StructuredData` | Canonical URL for OG/Twitter cards, sitemap, JSON-LD. Defaults to `http://localhost:3000`. **Set this in production** — every link that references itself derives from it. |
| `NEXT_PUBLIC_EMAIL`            | `app/api/contact/route.ts`, `src/lib/sendContactEmail.ts`, `src/content/personal.ts` | Owner email — recipient for contact-form notifications **and** the `replyTo` address, so replying in your mail client goes directly to the sender. Also required for the agent's `send_message` tool. |
| `RESEND_API_KEY`               | `src/lib/sendContactEmail.ts` (via `/api/contact` and the agent) | **Server-only.** Without it, both the contact form and the agent's message tool report a friendly failure. |
| `GEMINI_API_KEY`               | `app/api/chat/route.ts`                  | **Server-only.** Powers the terminal AI agent. Free key from [Google AI Studio](https://aistudio.google.com/app/apikey). If unset, the agent replies that it's offline — the terminal still works. **Never** prefix with `NEXT_PUBLIC_`. |
| `GEMINI_MODEL`                 | `app/api/chat/route.ts`                  | Optional model override. Defaults to `gemini-2.5-flash-lite`. The route also keeps an internal fallback chain (see [Terminal AI agent](#terminal-ai-agent)). |
| `GITHUB_TOKEN`                 | `src/lib/agentTools.ts`                  | **Optional, server-only.** Raises the GitHub API rate limit (60→5000/hr) for the agent's `get_repo_stats` tool. Works unauthenticated without it. |
| `NEXT_PUBLIC_GITHUB_URL`       | `personal.ts`, `StructuredData`          | Full URL e.g. `https://github.com/kudzaiprichard` |
| `NEXT_PUBLIC_LINKEDIN_URL`     | `personal.ts`, `StructuredData`          | |
| `NEXT_PUBLIC_TWITTER_URL`      | `personal.ts`, `StructuredData`          | |
| `NEXT_PUBLIC_GITHUB_HANDLE`    | `personal.ts` (display)                  | e.g. `@kudzaiprichard` |
| `NEXT_PUBLIC_TWITTER_HANDLE`   | `personal.ts`, `app/layout.tsx`          | Used as Twitter card `creator` and displayed on the Contact card. |
| `NEXT_PUBLIC_LINKEDIN_NAME`    | `personal.ts`                            | Display label for LinkedIn link. |
| `NEXT_PUBLIC_RESUME_URL`       | `personal.ts` (used by terminal `cv` cmd) | If unset, falls back to `/resume.pdf`. External URLs open in a new tab; same-origin paths trigger `download` attribute. |

A `.env.local` is used locally — strip the API keys before pushing anywhere shared.

---

## Repository layout

```
my-portfolio/
├── app/                              # Next.js App Router root
│   ├── api/chat/route.ts             # POST handler — Gemini proxy + function-calling round-trip
│   ├── api/contact/route.ts          # POST handler — thin wrapper over lib/sendContactEmail
│   ├── globals.css                   # Theme tokens, snap-scroll, glitch keyframes
│   ├── layout.tsx                    # Root layout, metadata, BootProvider, ambient layers
│   ├── page.tsx                      # Snap-scroll composition + arrow-key nav + VoiceProvider
│   ├── robots.ts                     # /robots.txt generator
│   └── sitemap.ts                    # /sitemap.xml generator
│
├── scripts/
│   └── generate-og.js                # Renders public/og-image.png from inline SVG (via sharp)
│
├── src/
│   ├── components/
│   │   ├── layout/                   # Cross-cutting layout chrome
│   │   │   ├── Background.tsx        # Particle canvas + grid + gradient
│   │   │   ├── BootScreen.tsx        # The boot sequence overlay (5 phases)
│   │   │   ├── CustomCursor.tsx      # Section-aware cursor (dot/ring/caret)
│   │   │   ├── ScrollHint.tsx        # Up/down scroll indicators
│   │   │   ├── context/BootContext.tsx
│   │   │   └── seo/
│   │   │       ├── SEOContent.tsx    # Visually-hidden semantic content for crawlers
│   │   │       └── StructuredData.tsx # JSON-LD Person + WebSite schemas
│   │   │
│   │   ├── sections/                 # The six full-viewport sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── ProjectsSection.tsx
│   │   │   ├── ExperienceSection.tsx
│   │   │   ├── ContactSection.tsx
│   │   │   └── TerminalSection.tsx
│   │   │
│   │   └── shared/
│   │       ├── AgentOrb.tsx          # Canvas voice-bars visualizer for the AI agent presence
│   │       ├── AmbientHum.tsx        # Looped 0.06-volume drone, fades in after boot
│   │       ├── MuteToggle.tsx        # Persists to localStorage, broadcasts via CustomEvent
│   │       ├── ScrollSection.tsx     # Wraps a section, syncs URL hash on intersect
│   │       ├── TerminalContainer.tsx # The 3-dot framed CRT box every section uses
│   │       ├── TerminalInput.tsx     # Active-line + history renderer, mic + chips + kbd proxy
│   │       ├── VoiceProvider.tsx     # Page-wide shared useVoice instance (React context)
│   │       └── email-templates/
│   │           ├── ContactConfirmation.tsx  # Reply-to-sender template
│   │           ├── ContactNotification.tsx  # Owner-notification template
│   │           └── index.ts                 # Re-exports both templates
│   │
│   ├── constants/
│   │   └── typingConfig.ts           # SINGLE source of truth for all typing feel
│   │
│   ├── content/                      # Site copy & data — edit these to make it yours
│   │   ├── personal.ts               # owner + contact (env-driven)
│   │   ├── projects.ts               # Project[] with its own Project interface
│   │   ├── experience.ts             # Experience[] with its own Experience interface
│   │   ├── skills.ts                 # SkillCategory[] + specializations[]
│   │   └── index.ts                  # Re-exports
│   │
│   ├── hooks/                        # All client-side logic lives here
│   │   ├── useAnimationController.ts # React wrapper around lib/animationController
│   │   ├── useTypingAnimation.ts     # Step-generator for human-like typing
│   │   ├── useKeystrokeAudio.ts      # Audio pool + keystroke playback per section
│   │   ├── useInView.ts              # IntersectionObserver wrapper
│   │   ├── useReducedMotion.ts       # prefers-reduced-motion media query
│   │   ├── useTerminalInput.ts       # The interactive shell + AI agent client — the core
│   │   ├── useVoice.ts               # Web Speech API: mic recognition + speech synthesis
│   │   ├── useSnakeGame.ts           # Snake game state machine
│   │   └── useAdventureGame.ts       # Text adventure world + parser
│   │
│   ├── lib/                          # Framework-agnostic utilities
│   │   ├── aiAgent.ts                # Agent "brain": persona, grounding, tool decls, parsing (server-safe, no secrets)
│   │   ├── agentTools.ts             # Server-side tool execution (send_message, get_repo_stats)
│   │   ├── sendContactEmail.ts       # Shared contact-send used by /api/contact AND the agent
│   │   ├── animationController.ts    # Imperative step-runner with cancellation
│   │   ├── animationTypes.ts         # All animation/audio interfaces
│   │   ├── audioController.ts        # Global "which section owns the audio" arbiter
│   │   ├── glitch.ts                 # Per-character glitch overlay system
│   │   ├── particles.ts              # Particle physics, zones, clusters, hubs
│   │   └── utils.ts                  # delay, debounce, throttle
│   │
│   └── types/
│       └── index.ts                  # Shared component prop types
│
├── public/
│   ├── sounds/                       # ambient_hum.wav + keystroke_{1..4}.mp3
│   └── favicon.* / og-image.png / site.webmanifest / web-app-manifest-*.png
│
├── .env.example                      # Documented env template — copy to .env.local
├── eslint.config.mjs
├── next.config.ts                    # Empty config — all defaults
├── postcss.config.mjs                # Loads @tailwindcss/postcss
├── tsconfig.json                     # @/* → ./*
└── package.json
```

---

## Architecture overview

The site is a single page composed of six full-viewport snap-scrolled sections. A shared layout owns the persistent visual chrome (boot screen, particles, cursor, audio toggle, scroll hint) and a `BootProvider` context gates anything that should not run before the user dismisses the boot screen. `app/page.tsx` wraps the sections in a `VoiceProvider`, so a single voice instance is shared as the visitor scrolls. Two server routes sit behind the page: `/api/contact` (contact form) and `/api/chat` (the AI agent) — both server-only, both reusing `lib/sendContactEmail` for outbound mail.

```mermaid
flowchart TB
    subgraph RootLayout["app/layout.tsx (RootLayout)"]
        BootProvider --> SkipLink[skip-to-content link]
        BootProvider --> SEOContent[SEOContent — sr-only crawler copy]
        BootProvider --> BootScreen
        BootProvider --> Background[Background — gradient + grid + particles canvas]
        BootProvider --> CustomCursor
        BootProvider --> MuteToggle
        BootProvider --> AmbientHum
        BootProvider --> ScrollHint
        BootProvider --> Page["app/page.tsx (Home)"]
    end

    Page --> VP["VoiceProvider (shared voice context)"]
    VP -->|ScrollSection #home| S1[HeroSection]
    VP -->|ScrollSection #about| S2[AboutSection]
    VP -->|ScrollSection #projects| S3[ProjectsSection]
    VP -->|ScrollSection #experience| S4[ExperienceSection]
    VP -->|ScrollSection #contact| S5[ContactSection]
    VP -->|ScrollSection #terminal| S6[TerminalSection]

    S5 -. "POST /api/contact" .-> CT["app/api/contact/route.ts"]
    S6 -. "POST /api/chat" .-> CH["app/api/chat/route.ts (Gemini)"]
    CT --> Mail["lib/sendContactEmail → Resend"]
    CH -. "send_message tool" .-> Mail
    CH -. "get_repo_stats tool" .-> GH["GitHub REST API"]
    StructuredData[/JSON-LD — Person + WebSite/] --- RootLayout
```

> The mini-shells on the Hero/About/Projects/Experience sections share the same `useTerminalInput` hook; the full agent experience (plain-English Q&A, voice, the guided tour) is exposed in the dedicated **`#terminal`** section.

---

## Section anatomy

Every section (except `Terminal`) follows the same two-render-mode pattern:

```mermaid
flowchart TD
    Mount([Section mounts]) --> RM{useReducedMotion?}
    RM -- yes --> Static[renderStaticContent\ninstant full reveal]
    RM -- no --> OOV{In view\n≥ 30% visible?}
    OOV -- no --> Idle[Idle — nothing rendered]
    OOV -- yes --> Request[requestAudioControl\nsectionId]
    Request --> Start[animationController.start\nsteps array]
    Start --> Animate[renderAnimatingContent\nchar-by-char typing]
    Animate --> Done{isCompleted?}
    Done -- no --> Animate
    Done -- yes --> Static
    Static --> Input[TerminalInput mounts\nmini-shell active]
```

**What happens at each stage:**

1. **`sr-only` block** — always in the DOM, carries the real semantic content for screen readers and crawlers. The visible animated tree is `aria-hidden="true"` during animation.
2. **`TerminalContainer`** — the 3-dot CRT frame. Renders either the *animating* tree (char-by-char) or the *static* tree (instant full reveal).
3. **Animating render** — types out one or more shell-style commands, then reveals their output (real content from `src/content/`).
4. **Static render** — shown immediately under `prefers-reduced-motion`, or once animation completes.
5. **`TerminalInput`** — mounts after animation completes; provides the per-section mini-shell.

The full lifecycle in terms of hook orchestration:

```mermaid
sequenceDiagram
    participant V as Viewport
    participant H as useInView
    participant A as useKeystrokeAudio
    participant C as useAnimationController
    participant T as useTypingAnimation
    participant S as Section state

    V->>H: IntersectionObserver fires (≥30% visible)
    H->>A: requestAudioControl(sectionId)
    A->>A: audioController.setActiveSection — others release
    A-->>H: hasAudioControl = true
    H->>C: start(steps)
    loop For each AnimationStep
        C->>T: emit a keystroke (delay-aware)
        T->>S: setText(prev + char)
        T->>A: onTypingKeystroke(char) → playKeystroke
    end
    C->>S: onComplete → flip to static render
    Note over S: TerminalInput mounts, mini-shell active
```

The `audioController` ensures only one section at a time owns the keystroke channel, so scrolling between sections does not produce overlapping click loops.

---

## Hook dependency map

Which hooks each part of the site uses:

| Consumer | useInView | useAnimationController | useTypingAnimation | useReducedMotion | useKeystrokeAudio | useTerminalInput | useSnakeGame | useAdventureGame |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| HeroSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (mini) | | |
| AboutSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (mini) | | |
| ProjectsSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (mini) | | |
| ExperienceSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (mini) | | |
| ContactSection | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| TerminalSection | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (full) | ✓ | ✓ |
| CustomCursor | | | | ✓ | | | | |
| Background | | | | ✓ | | | | |

"mini" = reduced command set keyed to the section; "full" = the complete interactive shell.

Two hooks aren't in the table because they're consumed differently:

- **`useVoice`** is instantiated once by `VoiceProvider` (in `app/page.tsx`) and shared via context, so every section's `TerminalInput` reads the *same* voice instance — the mic/speech toggle never desyncs as you scroll.
- **`AgentOrb`** consumes `useReducedMotion` directly to drive (or freeze) its canvas visualizer.

---

## The animation pipeline

Three layers, separated for testability and cancellation safety:

```mermaid
flowchart LR
    Config["constants/typingConfig.ts\nbaseSpeed, multipliers,\nsequence timings"]
    -->|getBaseSpeedForSection\ngetPatternForSection| Hook

    Hook["useTypingAnimation\ngenerateSteps()"]
    -->|"AnimationStep[]"| Controller

    Controller["lib/animationController\nstate machine + timers"]
    --> Section[Section state setters]

    Hook --> Audio["onKeystroke\n→ useKeystrokeAudio"]

    subgraph States
        idle --> running --> completed
        running --> cancelled
        running --> paused --> running
    end
```

- **`constants/typingConfig.ts`** is the *only* place to change typing feel. It is the single source of truth for base speeds, pattern multipliers, audio ramp settings, and sequence timings. See [Typing config reference](#typing-config-reference) below.
- **`lib/animationController.ts`** is a class-based imperative runner. It tracks state (`idle | running | paused | completed | cancelled`), holds `AnimationStep[]` (each step is `{ action: () => void, duration: number }`), and is responsible for **clean cancellation** — every timer it schedules is recorded and cleared on `cancel()`. Sections call `animation.cancel()` on unmount and on `inView = false`, so navigating away never leaves orphaned `setTimeout` chains.
- **`useTypingAnimation`** turns a target string into an `AnimationStep[]` honouring the section's pattern: positional speed (slow at start, fast through middle, slight slowdown at end), character-class multipliers, repeat-character reduction (muscle memory), random micro-pauses, and ±30% natural jitter.

### Reduced-motion path

Every section checks `useReducedMotion()` and, when set, **skips animation entirely** — flipping straight to the static render and calling `animation.complete()` immediately. Glitch overlays, the particle field loop, and cursor pulse also short-circuit under this flag.

---

## Typing config reference

All values live in `src/constants/typingConfig.ts` and are the exact numbers in the codebase:

### Per-section base speeds

| Section | `baseSpeed` | Character-feel notes |
|---------|------------|----------------------|
| `hero` | **90 ms/char** | Most dramatic: `startSpeedMultiplier 2.2`, 10% random-pause probability, extension slowdown ×4.0 |
| `about` | **65 ms/char** | Flows faster in the middle (`middleSpeedMultiplier 0.65`), fewer hesitations (6% pause prob) |
| `projects` | **70 ms/char** | Extension slowdown ×3.0 |
| `experience` | **70 ms/char** | Slightly quicker start (`startSpeedMultiplier 1.6`) |
| `contact` | **70 ms/char** | Global defaults, no overrides |
| `terminal` | **25 ms/char** | Near-instant: uniform multipliers (1.0/0.9/1.0), 3% pause probability |

### Global pattern (applied to every section before overrides merge)

| Parameter | Value | Effect |
|-----------|-------|--------|
| `startSpeedMultiplier` | 1.8× | Slower at the start — thinking before typing |
| `middleSpeedMultiplier` | 0.7× | Fastest in the flow |
| `endSpeedMultiplier` | 1.3× | Slight brake near end |
| `extensionSpeedMultiplier` | 3.5× | Pause on `.txt`, `.sh`, etc. |
| `randomPauseProbability` | 8% | Chance of micro-hesitation per keystroke |
| `randomPauseMultiplier` | 2.5× | How long each hesitation lasts |
| `repeatedCharMultiplier` | 0.8× | Faster on consecutive identical chars (muscle memory) |
| Slow characters | `. / \ - _ ~ \|` | +1.5× duration each |

### Character-class multipliers

| Class | Multiplier | Rationale |
|-------|-----------|-----------|
| Space | 0.72× | Thumb — fastest key |
| Lowercase | 1.0× | Baseline |
| Uppercase | 1.25× | Holding Shift |
| Digit | 1.35× | Reaching for number row |
| Path separator (`-_/\|~.;`) | 1.45× | Deliberate terminal keystrokes |
| Special symbol (`@#$%^&*…`) | 1.55× | Shift + number row |

### Sequence timing defaults

| Timing | Value |
|--------|-------|
| Initial delay before first command | 500 ms |
| Post-command delay (before output appears) | 350 ms |
| Between-commands delay (output → next command) | 900 ms |

### Audio config (also in `typingConfig.ts`)

| Setting | Value |
|---------|-------|
| `baseVolume` | 0.4 |
| `volumeRampEnabled` | true |
| `volumeRampKeystrokes` | 10 (ramp from 50% → 100% of baseVolume) |
| `volumeDecayDelayMs` | 2 000 ms of silence triggers decay |
| `volumeDecayFactor` | 0.5 (halves the ramp progress) |

---

## Audio system

```mermaid
flowchart TD
    Section1[HeroSection] -- requestAudioControl hero --> Ctrl[audioController\nactiveSection: string?]
    Section2[AboutSection] -- requestAudioControl about --> Ctrl
    Section3[TerminalSection] -- requestAudioControl terminal --> Ctrl

    Ctrl -- only one section owns it --> Pool[AudioPool\n3 elements per file × 4 keystroke files]
    Pool --> KS["keystroke_1..4.mp3\npublic/sounds/"]

    Mute[MuteToggle button] -- localStorage: keystroke-audio-muted --> Hook[useKeystrokeAudio]
    Mute -- CustomEvent: audio-mute-change --> Hook
    Hook --> Pool

    AmbientHum[AmbientHum] -. "fades to 0.06 volume" .-> HumFile["ambient_hum.wav\npublic/sounds/"]
    BootCtx[BootProvider isBooted] --> AmbientHum
```

Notes worth knowing before changing anything in `useKeystrokeAudio.ts`:

- **Object pool** — three `Audio` element instances per source file are created up front and rotated, because reusing a single element on rapid keystrokes (every 25–90 ms) drops sounds in Safari/iOS.
- **Volume ramp** — `audioConfig.volumeRampEnabled` makes the first 10 keystrokes after a `resetVolumeRamp()` call ramp from 50% to 100% of base volume. This eliminates the "machine gun" feel when a long string begins. Each section calls `resetVolumeRamp()` at the start of every command in its sequence.
- **Decay after inactivity** — after 2 s of silence the next keystroke partially decays the ramp (`volumeDecayFactor: 0.5`) so a fresh burst again starts softer.
- **Hand alternation** — characters are mapped to left/right/thumb keyboard regions; each region picks a different keystroke sample, with a "no-immediate-repeat" guard. Space gets its own sample.
- **Mute persistence** — `localStorage` key `keystroke-audio-muted`. Because `localStorage` storage events do not fire in the same tab, `MuteToggle` also dispatches a `CustomEvent('audio-mute-change')` for in-tab listeners.
- **`AmbientHum`** loops `/sounds/ambient_hum.wav` at volume 0.06. It starts only after `BootProvider.isBooted === true` and respects the same mute key.

---

## Interactive terminal

`useTerminalInput.ts` (~3,300 lines) is the largest single file in the codebase and the heart of the experience. It contains the entire shell **and** the client half of the AI agent (the conversation history, the `/api/chat` round-trip, action execution, and the guided tour). It is consumed by every section's `TerminalInput`, but only **`TerminalSection` (`#terminal`)** exposes the full command set and the full agent.

Every `Enter` first passes through `decideAgentRouting`: a tour phrase launches the guided tour with no AI call, a recognised command (or close typo) goes to the normal dispatcher, and plain-English input is routed to the AI agent.

```mermaid
flowchart TD
    KeyDown[window keydown] --> Filter{section in view?\nnot in form input?}
    Filter -- yes --> Buffer[inputText buffer]
    Buffer -->|Tab| AC[autocomplete:\ncommands + filesystem\n+ section names]
    Buffer -->|Right / End| Ghost[accept ghost suggestion]
    Buffer -->|↑ / ↓| Hist[command history nav]
    Buffer -->|Enter| Route{decideAgentRouting}

    Route -->|tour phrase| Tour["guided tour — no AI call"]
    Route -->|known command| Resolve[resolveAlias → getCommandResponse]
    Route -->|plain-English question| Agent["runAgentQuery → POST /api/chat"]

    Agent --> Reply["type reply as 'agent' variant\nrun returned actions\nrender follow-up chips"]

    Resolve --> Branch{response kind}
    Branch --> Print[type out response\nline-by-line, char-by-char]
    Branch --> Render["renderSection: home/about/projects/experience/contact\ncd alias → inline section content"]
    Branch --> Mode{enterMode?}
    Mode --> Vim["VIM_FILE_CONTENT viewer\n:q to exit"]
    Mode --> Matrix["Matrix rain canvas\nany key exits"]
    Mode --> Snake["useSnakeGame\narrow keys / on-screen pad"]
    Mode --> Adv["useAdventureGame\nlook / take / use / go"]
    Branch --> Side["downloadUrl or openUrl\ncv → resume / email → mailto:"]
```

### Full command reference

Commands are registered in `getCommandResponse()` and surfaced via `help`.

| Category | Commands |
|----------|----------|
| **Navigation** | `cd home\|about\|projects\|experience\|contact` — renders section content inline |
| **Filesystem** | `ls`, `ls -l`, `ls -la`, `pwd`, `cat <file>`, `cd <dir>` |
| **System** | `whoami`, `neofetch`, `htop`, `kill <proc>`, `date`, `history`, `man <topic>`, `echo <text>` |
| **Network** | `ping <host>`, `ssh <host>`, `curl <args>`, `sudo <cmd>` |
| **Git** | `git log`, `git blame` (aliases: `hist`, `annotate`) |
| **Reach-out** | `cv` (downloads resume), `email` (opens `mailto:` with pre-filled subject) |
| **Games** | `snake`, `adventure` |
| **Fun** | `vim` / `vi` / `nano`, `ascii`, `matrix`, `hack`, `sl` |
| **AI / guide** | `tour` (guided walkthrough) — plus any plain-English question, routed to the AI agent |
| **Utility** | `help` / `?` / `commands`, `clear`, `exit`, `settings` |

### Aliases and did-you-mean

`COMMAND_ALIASES` maps Windows/Mac names to canonical commands — `dir`, `type`, `notepad`, `runas`, `nvim`, `code`, `wget`, `screenfetch`, etc., all resolve. Unknown commands run through `findClosestCommand` for a `Did you mean: ?` suggestion before returning `bash: <cmd>: command not found`.

### Loading messages

Commands that feel "heavyweight" (`neofetch`, `htop`, `git log`, `ssh`, `sudo`, `curl`) show a sequence of fake loading lines before their real output, defined in `LOADING_SETS`. This is the right place to add fake telemetry for a new command.

### In-memory filesystem

The terminal maintains a fake `~` directory tree containing project READMEs at `~/projects/<slug>/README.md`, an `experience.log`, fake config files, and a `~/.secret/` directory rewarded by `ls -la`. These are hand-authored in `useTerminalInput.ts` and currently mirror but do not automatically track changes in `src/content/projects.ts` — if you add or rename a project, update the filesystem tree manually.

### Inline mini-shell on non-terminal sections

Hero, About, Projects, and Experience sections mount a `TerminalInput` after animation completes, with a **reduced** command set (navigation, `whoami`, `help`, `clear`). They share the same `useTerminalInput` hook keyed by `sectionId`, and `getCommandResponse` switches on it.

### Mobile soft keyboard

The terminal has no real text field — input is captured by a document-level `keydown` listener. That works for hardware keyboards but mobile browsers only raise the on-screen keyboard for a focused form element. `TerminalInput` therefore renders a hidden, 1px "keyboard proxy" `<input data-terminal-proxy>` that is focused on tap (inside the tap gesture, so mobile actually opens the keyboard) and bridges its inserted characters into synthetic `keydown` events for the same handler. The handler's input-focus guard explicitly exempts this proxy so its keystrokes are still captured.

---

## Terminal AI agent

Plain-English questions in the terminal are answered by an AI agent that speaks in the **first person as Kudzai**, is **grounded** on this site's own content (so it doesn't hallucinate a career), and can **act** — not just talk — through Gemini function calling. The browser never sees the model key: everything goes through the server-only `/api/chat` route.

### Three-file split

| File | Runs | Responsibility |
|------|------|----------------|
| `src/lib/aiAgent.ts` | server-safe, **no secrets** | The "brain": builds the system instruction (persona + guardrails), serializes the portfolio content into a grounded knowledge base, declares the tools, and parses the reply. Importable anywhere, unit-testable. |
| `app/api/chat/route.ts` | **server only** | Talks to Gemini over `fetch`. Rate limiting, history clamping, the function-calling round-trip, model fallback, and graceful degradation. Holds `GEMINI_API_KEY`. |
| `src/lib/agentTools.ts` | **server only** | Executes the tools that need secrets or network (`send_message` via `sendContactEmail`, `get_repo_stats` via the GitHub API). |

### What the agent can do (tools)

Declared once in `TOOL_DECLARATIONS` (single source of truth). Each tool is either a **client action** (returned to the browser and mapped onto an existing terminal side-effect — no new execution path) or a **server tool** (executed during the round-trip, its real result fed back to the model).

| Tool | Kind | Effect |
|------|------|--------|
| `navigate_to_section` | client | Smooth-scroll the page to a section |
| `show_section` | client | Render a section inline (like `cd <section>`) |
| `download_resume` | client | Trigger the CV download (`cv`) |
| `open_link` | client | Open GitHub / LinkedIn / Twitter / email |
| `run_command` | client | Run a **whitelisted, read-only** command (`whoami`, `neofetch`, `ls`, `cat`, `cd`, `pwd`, `date`, `history`, `man`, `ascii`, `git log`, `git blame`) |
| `start_tour` | client | Launch the guided tour |
| `send_message` | **server** | Send a message to Kudzai's inbox (only after collecting name + valid email + message) |
| `get_repo_stats` | **server** | Fetch live GitHub stars / language / last-updated for a project (10-min cache) |

Raw Gemini `functionCall`s are validated and narrowed into a typed `AgentAction` union by `toAgentAction()`; unknown tool names, bad enum values, and non-whitelisted commands return `null` and are dropped (the model occasionally hallucinates). The client fires instant actions (navigate, open link, download) immediately and **defers** inline-render / `run_command` / `start_tour` until *after* the spoken reply finishes typing.

### The function-calling round-trip

```mermaid
sequenceDiagram
    participant Term as Terminal (client)
    participant API as /api/chat
    participant Gem as Gemini
    participant Tools as agentTools (server)

    Term->>API: POST messages history
    API->>API: rate-limit + clamp history/size
    API->>Gem: round 1 — system + content + tool declarations
    Gem-->>API: text and/or functionCall parts
    alt a server tool was called
        API->>Tools: executeServerTool(name, args)
        Tools-->>API: real result (mail sent / repo stats)
        API->>Gem: round 2 — feed tool result, mode NONE
        Gem-->>API: final prose reply
    end
    API->>API: parseReply — strip the ::SUGGEST:: chips line
    API-->>Term: JSON of text, actions, suggestions
    Term->>Term: type reply, run client actions, render chips
```

Round 2 only runs when a server tool executed (so the reply reflects the real result) or the model called tools but produced no prose. It forces `functionCallingConfig.mode: NONE` so the model replies in words instead of looping, and it's wrapped in its own try/catch — if the confirmation wording fails, the round-1 actions are still returned rather than lost.

### Guardrails

- **Grounded, on-topic only.** The model answers from the injected knowledge base (built from `src/content/`), declines anything off-topic, and is told never to invent jobs, dates, metrics, or projects.
- **Prompt-injection resistant.** It's instructed to ignore any attempt (from the visitor or embedded text) to change its rules, reveal the system prompt, or impersonate a different assistant.
- **`run_command` is whitelisted** by prefix to safe read-only commands — `exit`, `clear`, and anything destructive are excluded.
- **Multilingual** — it replies in the visitor's language (including Shona/Ndebele), falling back to English when it can't answer accurately.

### Resilience & cost control (in `route.ts`)

| Concern | Mechanism |
|---------|-----------|
| Per-IP abuse | 8 requests / rolling minute / IP (in-memory) |
| Global free-tier cap | Hard daily ceiling (`DAILY_GLOBAL_CAP`, default 200), rolls at UTC midnight |
| Context flooding | History clamped to 12 turns, each message capped at 1000 chars |
| Model exhaustion / overload | `MODEL_CHAIN` fallback — on 429/500/503 it transparently retries the next model (`gemini-2.5-flash-lite` → `gemini-flash-latest` → `gemini-2.5-flash` → `gemini-2.0-flash`) |
| Latency / token waste | `thinkingBudget: 0` disables Gemini 2.5's internal thinking pass |
| No / bad key, quota hit | Never 500s the page — returns a friendly in-character message and points the visitor to `help` / `email` |

### Suggested follow-ups

The model ends every reply with a hidden `::SUGGEST:: q1 | q2 | q3` line. `parseReply()` strips it from the visible text and returns up to three short questions, which render as clickable chips below the input — phrased the way a visitor would type them. After the agent has answered once, recruiter-focused quick-action chips (`download CV`, `view projects`, `experience`, `get in touch`) are also available.

---

## Voice interaction

The terminal can be driven entirely by voice, built on the **browser-native Web Speech API** — no dependency, no third-party service. It's **English-only** and fully feature-detected: where the browser lacks support, `supported` is `false` and the mic affordance is hidden entirely.

- **One shared instance.** `useVoice` is created once by `VoiceProvider` (`app/page.tsx`) and shared via context, so the voice toggle stays consistent as the visitor scrolls between sections.
- **Recognition (mic → text).** Continuous mode with a **2-second silence finalizer**: the mic keeps listening across short pauses and only submits after ~2s of quiet (or when the visitor taps stop), so speakers aren't cut off mid-sentence. The live interim transcript is shown for feedback.
- **Synthesis (text → speech).** Replies are spoken aloud **only when the question was asked by voice** (tracked per-turn). It picks the smoothest available English voice (prefers neural/"Natural" on Edge, then Google voices on Chrome) and strips ASCII-art / prompt characters that read badly aloud.
- **The agent orb.** `AgentOrb.tsx` is a hand-built canvas "voice bars" visualizer (no library, `requestAnimationFrame`) that gives the agent a living presence. It has four states — `idle` (slow breathing), `thinking` (fast pulse), `speaking`, and `listening` — derived from terminal activity, inherits the terminal theme colour, and freezes to a static frame under `prefers-reduced-motion`.

---

## Contact form & email pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant C as ContactSection
    participant API as POST /api/contact
    participant R as Resend SDK
    participant O as Owner inbox
    participant S as Sender inbox

    U->>C: fills name / email / message
    C->>C: client validateForm — required + email regex
    C->>API: fetch JSON {name, email, message}
    API->>API: parse + validate (400 on bad input)
    par dual send
        API->>R: send ContactNotification → ownerEmail (replyTo: sender)
        API->>R: send ContactConfirmation → sender
    end
    R-->>API: result with optional error
    API-->>C: 200 success | 500 error
    C->>U: render success / error state in form
```

- **Shared send path.** Both the form (`POST /api/contact`) and the agent's `send_message` tool call the same `src/lib/sendContactEmail.ts`, so the two routes can never drift apart. It validates server-side, sends both emails, and returns a structured `{ success, error? }` result instead of throwing. `app/api/contact/route.ts` is now a thin wrapper that maps that result to a 200 / 400 / 500.
- Both emails use `@react-email/components` templates (`src/components/shared/email-templates/`, re-exported via `index.ts`). They share a CRT-window aesthetic matching the site.
- The notification sets `replyTo` to the sender's email, so the owner can reply directly from their mail client.
- The `from` address is `noreply@prichard.co.zw` in `sendContactEmail.ts`. **Change this if you fork** — Resend requires a verified sending domain.
- The path does **not** persist messages anywhere. To keep a record, add a write to your store inside `sendContactEmail`.
- Client-side validation: required fields + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` for email. The same regex re-validates on the server. Field-level errors clear on edit.

### Easter egg

After Contact finishes animating, a `root@kudzai:~# press Enter to enter superuser mode` line appears. Pressing **Enter** while no form field is focused scrolls to `#terminal`. Modifier keys are ignored; any active `INPUT`/`TEXTAREA`/`BUTTON`/`SELECT`/`contentEditable` short-circuits the handler.

---

## Boot screen & scroll model

`BootScreen` overlays a 5-phase CRT-style boot when the page first loads:

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> idle : bootSequence lines appear one by one\n"start_portfolio.sh" button enables
    idle --> scrolling : user clicks Start or Skip
    scrolling --> clearing : existing log scrolls away
    clearing --> scanline : shutdown lines print
    scanline --> flash : scanline sweep + horizontal collapse
    flash --> done : CRT compress (scaleY 0)
    done --> [*] : completeBoot\nBootContext.isBooted = true\nsessionStorage portfolio-booted = "1"
```

- `sessionStorage['portfolio-booted']` skips the screen on subsequent navigations within the same tab, so internal hash-link navigation does not replay the sequence.
- A **Skip** button appears 1.5 s in for impatient users.
- `prefers-reduced-motion` collapses every phase animation to 0.01 ms.

### Scroll model

`html` has `overflow: hidden`; `body` has `overflow-y: scroll; scroll-snap-type: y mandatory`. Every `<section>` is a `100vh` snap target with `scroll-snap-stop: always`. `ScrollSection` updates `window.location.hash` via `replaceState` when its section is ≥50% visible, and reads the hash on mount to restore the right section from a deep link.

`app/page.tsx` adds **arrow-key navigation** (`Up`/`Left` and `Down`/`Right`) that pages between sections and moves DOM focus. It is gated on `isBooted` and respects `e.defaultPrevented` so per-section handlers (the terminal's own arrow handling, the Contact Enter easter egg) win.

---

## Content data model

### The two interface systems — and why they differ

There are two parallel sets of interfaces in this codebase:

- **`src/types/index.ts`** — general-purpose component prop types. `Project` here has fields like `title`, `demoUrl`, `featured`, `imageUrl`, `status: 'completed' | 'in-progress' | 'archived'`.
- **`src/content/*.ts`** — the interfaces actually consumed by section components. Each content file re-declares a simpler, purpose-built interface.

The section components and `useTerminalInput` import exclusively from `src/content/`. `src/types/index.ts` is used for component props (`ScrollSectionProps`, `TerminalContainerProps`, `ButtonProps`, etc.). If you need to add a field to a project card, edit the interface in `src/content/projects.ts` and the data in `projects[]` — not `types/index.ts`.

### Actual content shapes (what sections render)

```mermaid
erDiagram
    OWNER {
        string name
        string fullName
        string title
        string[] description
        string bio
        string[] aliases
    }

    CONTACT {
        string email
        string githubUrl
        string linkedinUrl
        string twitterUrl
        string githubHandle
        string twitterHandle
        string linkedinName
        string resumeUrl
    }

    PROJECT {
        string id
        string name
        string status
        string description
        string[] technologies
        string githubUrl
        string liveUrl
    }

    EXPERIENCE {
        string id
        string period
        string role
        string company
        string description
        string[] achievements
        string[] technologies
    }

    SKILL_CATEGORY {
        string title
        string icon
        string[] technologies
    }

    SPECIALIZATION {
        string name
    }

    OWNER ||--|| CONTACT : "personal.ts exports both"
    SKILL_CATEGORY ||--o{ SPECIALIZATION : "skills.ts"
    PROJECT }o--|| PROJECT : "projects[] array"
    EXPERIENCE }o--|| EXPERIENCE : "experiences[] array"
```

`status` on `Project` is the display badge: `'LIVE' | 'BETA' | 'WIP'`. `period` on `Experience` is a freeform string (`'2023 - Present'`).

### How content flows to the UI

```mermaid
flowchart LR
    personal["content/personal.ts\nowner + contact"] --> Hero[HeroSection\nwhoami output]
    personal --> About[AboutSection\nbio in terminal]
    personal --> Contact[ContactSection\nlinks card]
    personal --> Term[useTerminalInput\nwhoami / cd about]

    projects["content/projects.ts\nprojects[]"] --> Proj[ProjectsSection\ncard grid]
    projects --> Term

    experience["content/experience.ts\nexperiences[]"] --> Exp[ExperienceSection\ntimeline]
    experience --> Term

    skills["content/skills.ts\nskillCategories[]\nspecializations[]"] --> About
```

The **AI agent's knowledge base** is also derived from these same content files: `buildKnowledgeBase()` in `src/lib/aiAgent.ts` serializes `personal`, `skills`, `projects`, and `experiences` into the grounded prompt on every request, so editing `src/content/` updates what the agent knows with no rebuild step.

Note: the terminal's **in-memory filesystem** (`~/projects/<slug>/README.md`) does *not* auto-sync with `content/projects.ts` — those README files are hand-authored inside `useTerminalInput.ts`.

---

## Styling & theming

All theme values live as CSS custom properties in `app/globals.css`. There are five families:

| Family             | Examples                                              |
|--------------------|-------------------------------------------------------|
| Colours            | `--color-primary`, `--color-bg-dark`, dim/dimmer/dimmest opacity tiers |
| Spacing            | `--spacing-xs` … `--spacing-2xl` (mobile-first, 6 breakpoint overrides) |
| Typography         | `--font-mono`, `--font-size-xs` … `--font-size-3xl`, `--line-height-*` |
| Layout             | `--container-max-width`, `--terminal-padding-*`, `--grid-size`, `--grid-opacity` |
| Z-index            | `--z-background` (0) … `--z-cursor` (100 000)          |

### Per-section phosphor tints

Each section shifts the green hue via a `section[id="..."]` selector that overrides `--color-primary` and its dim variants. Hue-only shift keeps contrast against `#0a0f0a` constant (S=100% / L≈50%):

| Section     | Tint        |
|-------------|-------------|
| `home`      | `#00ff41` (anchor) |
| `about`     | `#22ff52`   |
| `projects`  | `#00ff7d`   |
| `experience`| `#3aff2a`   |
| `contact`   | `#00ff41` (anchor — action point) |
| `terminal`  | `#00ff70`   |

Background, particles, grid, gradient, and cursor stay at the anchor `#00ff41` — they form the constant ambient layer that prevents the per-section shift from feeling like five different sites.

### Component-scoped styles

Every section component has a `<style>{...}</style>` block at the bottom for its own classnames (`.hero-section-name`, `.about-section-skill-category`, etc.). Convention:

- Use CSS variables from `globals.css` for anything that should track the theme.
- Hard-code anchor green (`rgba(0, 255, 65, …)`) for *fills* and *backgrounds* you want constant across sections (skill-card washes, tech-badge fills) — this is intentional and keeps variation cohesive.

### Glitch effects

`src/lib/glitch.ts` provides `startCharacterGlitch` — a per-character overlay that rotates through random chars at configurable cadence and intensity. Active on:

- Hero name + four highlight phrases in About.
- Project names in Projects.
- Role names in Experience.
- The `visitor@kudzai` part of the terminal title bar.
- Random output lines after `cd <section>` in the Terminal.

All glitch effects no-op under `prefers-reduced-motion`.

### Custom cursor

Hidden on touch devices (`@media (hover: none) and (pointer: coarse)` — `cursor: none !important` on `*`, replaced by a `<div class="custom-cursor">` containing a dot (8 px), ring (36 px border), and caret (2 px). JS sets `data-state="default|link|input"` and `data-section="home|about|…"` based on `event.target.closest()` and IntersectionObserver. Per-section glow multipliers (hero 1.2×, terminal 1.3×, about 0.8×) are derived from typing-config pacing — faster sections get brighter glows.

### Particle background

`Background.tsx` runs `lib/particles.ts` on a `<canvas>` at z-index 2. Particles maintain *zones* (3×3 grid to prevent drift) and *cluster zones* (focal points of higher density).

| Setting              | Desktop | Mobile |
|----------------------|---------|--------|
| `numberOfParticles`  | 200     | 70     |
| `connectionDistance` | 180 px  | 120 px |
| `hubConnectionDistance` | 210 px | 150 px |
| Target FPS           | 60      | 30     |

Mobile detection: `width < 768 || ontouchstart || maxTouchPoints > 0`. `prefers-reduced-motion` renders **one** static frame and stops the RAF loop entirely.

---

## Accessibility

This site goes hard on the visual aesthetic, which makes accessibility especially important. What is in place:

- **Skip link** (`a.skip-to-content`) at the top of `<body>`, visible on focus, jumps to `#home`.
- **`SEOContent`** in `app/layout.tsx` is a visually-hidden but DOM-present block with the full semantic content (heading hierarchy, projects, experience, contact). Crawlers and assistive tech that do not execute the animation pipeline still get everything.
- Every animated section renders a parallel `<div class="sr-only" aria-live="polite">` with the same content as plain HTML, and marks the visible animated tree as `aria-hidden="true"` while it is typing.
- **`prefers-reduced-motion: reduce`** is honoured in: every section's animation (skipped → static), particle field (single static frame), boot screen (collapsed durations), glitch effects (no-op), and a `globals.css` rule that compresses every `*` animation/transition to 0.01 ms.
- **Focus management** — arrow-key section navigation calls `targetSection.focus({ preventScroll: true })` so the next section becomes a tab anchor. Sections have `tabIndex={-1}` and `outline: none` so the focus is programmatic rather than visible.
- **Focus indicators** — `:focus-visible` gets a 2 px green outline + glow site-wide.
- **Touch targets** — `--min-touch-target: 44 px` (48 px on coarse pointers), enforced on CTAs, contact links, social icons, and the Snake on-screen d-pad.
- **Form errors** — per-field error messages with `[ERROR]` prefix, distinct red border, and animated entry — rendered inline below each field.
- **`role="log"`** on `TerminalContainer` with an `aria-label`.
- **AI agent & voice** — the `AgentOrb` visualizer is `aria-hidden` (decorative); its canvas freezes to a static frame under `prefers-reduced-motion`. Voice is an *optional* affordance, fully feature-detected — when the Web Speech API is absent the mic is hidden, never a dead button. The hidden mobile keyboard proxy is `aria-hidden` and `tabIndex={-1}` so it's skipped by assistive tech and the tab order.

What is *not* fully accessible: the interactive terminal lacks a validated power-user screen-reader workflow. The `sr-only` summary in `TerminalSection` lists available commands, but this has not been tested with a real blind-user workflow.

---

## SEO

Three layers of crawler signal:

1. **`metadata`** in `app/layout.tsx` — title, description, keywords, authors, canonical, OG image, Twitter card, robots directives.
2. **`StructuredData`** (`<script type="application/ld+json">`) — `Person` and `WebSite` schema, with `alternateName` for name spelling variants and `knowsAbout` enumerating tech stack.
3. **`SEOContent`** — the visually-hidden DOM block with full semantic heading hierarchy, projects, experience, and contact. Crawlers that do not execute JS animations still index the real content.

Plus `app/sitemap.ts` (one entry, monthly changeFrequency, priority 1.0) and `app/robots.ts` (allow all, disallow `/api/` and `/_next/`).

---

## Customising the content

If you fork this for yourself, **everything you need to change lives in `src/content/` and `.env.local`**:

| File | Edit to change |
|------|---------------|
| `src/content/personal.ts` | Name, title, bio, three-line description, aliases. Contact links read from env. |
| `src/content/projects.ts` | Project cards. Each `Project` has `id`, `name`, `status` (`LIVE`/`BETA`/`WIP`), `description`, `technologies[]`, `githubUrl`, optional `liveUrl`. (These hold Kudzai's real projects — replace with your own when forking.) |
| `src/content/experience.ts` | Work history. `Experience[]` with `period`, `role`, `company` (prefix with `@ `), `description`, `achievements[]`, `technologies[]`, optional `url`. |
| `src/content/skills.ts` | `skillCategories[]` (4 cards: AI/ML, Backend, Frontend, Cloud & DevOps) + `specializations[]` (6 chip tags). |
| `.env.local` | All contact links, email, resume URL, site URL — plus `GEMINI_API_KEY` for the AI agent and `RESEND_API_KEY` for mail. |

The terminal's `formatSectionLines` in `useTerminalInput.ts` reads from these same content files — a change in `src/content/projects.ts` automatically updates the Projects card grid, the output of `cd projects` in the terminal, **and** the AI agent's grounded knowledge (see [Content data model](#content-data-model)). Edit the content; the agent stays accurate.

Two places you also need to update manually when changing projects:
1. The in-memory filesystem tree in `useTerminalInput.ts` (project READMEs under `~/projects/<slug>/README.md`) — hand-authored, does not auto-sync.
2. The `AboutSection.tsx` bio JSX block — it uses a richer JSX tree with four glitching highlight phrases hardcoded in the component. The `bio` field in `personal.ts` is used by the *terminal's* `whoami` and `cd about` output, not by the visual About card.

Static assets (`/og-image.png`, `/resume.pdf`, favicons) live in `public/`.

---

## Deployment

- **Configured for Vercel** (the most recent migration removed `netlify.toml`; there is no `vercel.json` because the defaults work for a Next.js App Router project).
- Node 20.x is pinned in `package.json` `engines`.
- All env vars in [Environment variables](#environment-variables) must be set in the Vercel dashboard. The server-only ones are `RESEND_API_KEY`, `GEMINI_API_KEY`, and the optional `GITHUB_TOKEN` — keep these **un-prefixed** so they never reach the client bundle.
- **Set `NEXT_PUBLIC_SITE_URL`** to the canonical domain — every OG image URL, sitemap entry, JSON-LD `url`, and Resend `replyTo` derives from it.
- The `from` address `noreply@prichard.co.zw` in `src/lib/sendContactEmail.ts` requires a verified domain in your Resend account. Change it if you're not running this site under that domain.
- **Serverless note:** the AI agent's rate-limit state in `/api/chat` is in-memory, so it's per-instance, not global. It's a cheap first line of defence; the daily cap is the real seatbelt. For a hard global guarantee, back it with a shared store (e.g. Upstash/Redis).

---

## Things to know before contributing

These are non-obvious, learned-the-hard-way things — read them before touching the listed files.

### Animation cancellation is load-bearing

`useAnimationController.cancel()` is called from every section's unmount cleanup *and* from the `onInViewChange(false)` handler when the section scrolls out before completing. Without it, you get stuck partial states — half-typed strings that never reveal their output, leaked `setTimeout` chains, and audio that keeps firing after navigation. If you add a new section, mirror the pattern in `HeroSection.tsx` (look for the `eslint-disable-next-line react-hooks/exhaustive-deps` comments — they document why the unmount-only effect is intentionally dep-free).

### `audioController` is a singleton

There is exactly one global "active section" at a time. New sections must call `requestAudioControl(sectionId)` on enter and `releaseAudioControl()` on exit — otherwise their `onTypingKeystroke` callback will silently no-op (`hasAudioControl === false`) or steal audio from a section that should own it.

### Don't put typing speeds in components

All typing feel — base speed, pattern multipliers, sequence delays, audio ramp settings — lives in `src/constants/typingConfig.ts`. Tune one section by editing its entry in `sectionTypingConfigs`, not by sprinkling magic numbers in the component. The helpers `getBaseSpeedForSection` and `getPatternForSection` are the only intended consumers.

### The two `Project` / `Experience` interfaces

`src/types/index.ts` and the individual content files each define their own `Project` and `Experience` interfaces with **different shapes**. The section components import from `src/content/` — that is the authoritative shape for what gets rendered. `src/types/index.ts` is for component prop types. Do not confuse them when adding fields.

### `<style>{...}</style>` blocks at the bottom of section components

Intentional — each section's component-specific CSS lives in a `<style>` element inside its return. Do not move them to `globals.css`; the locality is what makes large refactors safe. When writing a new section, scope all classnames with the section prefix (`.hero-section-…`, `.about-section-…`).

### The interactive terminal is one large file by design

`useTerminalInput.ts` is ~3,300 lines because it contains the entire shell — command table, alias map, in-memory filesystem, response generators, parser, history, autocomplete, mode dispatch — **and** the client side of the AI agent (conversation history, the `/api/chat` round-trip, action execution, and the guided tour). It has been kept in one file so all the pieces stay co-located. If you add a command: add a response generator in the "RESPONSES" region, a branch in `getCommandResponse`, and an entry in `generateHelp`.

### The AI agent is split server/client for a reason

Keep secrets out of `src/lib/aiAgent.ts` — it's deliberately server-safe and secret-free so it can be imported anywhere and unit-tested. Anything needing a key or an external fetch lives in `app/api/chat/route.ts` (the Gemini key) or `src/lib/agentTools.ts` (Resend, GitHub). To **add a tool**: declare it once in `TOOL_DECLARATIONS`; for a *client* action, map it in `toAgentAction()` and handle it in the terminal's `executeAgentAction`; for a *server* tool, add it to `SERVER_TOOL_NAMES` and implement it in `executeServerTool`. The grounded knowledge base is rebuilt from `src/content/` on every request — never hard-code facts into the prompt.

### Reduced motion is non-negotiable

Every animated effect needs a `prefers-reduced-motion` short-circuit. The pattern is `const prefersReducedMotion = useReducedMotion()` then early-return or skip-to-static. There is no CI enforcement — the only protection is the convention.

### Tailwind v4 is plumbed but unused

`@tailwindcss/postcss` is configured and `tailwindcss` is a devDependency. There are no utility classes in the codebase. Either start using Tailwind for new components, or remove the dependency — the current state costs ~1.4 MB of devDependencies for nothing.

---

## License

Released under the [MIT License](LICENSE) — © 2026 Kudzai Prichard Matizirofa. You are free to use, modify, and distribute the code provided the copyright notice is retained.

Note that the **personal content** — bio, project descriptions, experience copy, résumé, and the AI agent's persona/knowledge base — is Kudzai's own. If you fork this for yourself, replace it with your own (see [Customising the content](#customising-the-content)).
