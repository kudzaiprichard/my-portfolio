# To do later

Follow-ups left after the Phosphor plan (`.docs/PHASED_PLAN.md`). Tick them off as they're done.

## Partly done (marked `[!]` in the plan)

- [ ] **Test streaming against the real Gemini models.** Only a simulated server has been tested so far, because there was no key on the build machine.
  1. Copy `.env.example` to `.env.local`.
  2. Set `GEMINI_API_KEY`.
  3. Run `npm run check:gemini`. It tests streaming plus a tool call on every model in the fallback chain (`modelChain()` in `src/lib/gemini.ts`).
  4. If a model fails, drop it from the chain.
- [ ] **Fill in the project pages** (`src/content/projects.ts`; the pages, the terminal READMEs and `/llms.txt` update automatically).
  - [ ] A measured `result` (with its `source`) for Whiteboard Studio, Anvil, METIS, AURA, Sentinel and OurAfrica. Only the IndabaX hackathon entry and UBot have one; never add a number you can't point to.
  - [ ] `media` (screenshot or short clip) for AURA. Its repo is private, so there's no image.
  - [ ] A `liveUrl` for any project that is deployed. No project has a live link yet.
  - [ ] A `year` for AURA (currently shows `----`).

## Built, but needs a step only you can do

- [ ] **Upstash Redis:** add it from the Vercel Marketplace. It sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`, or set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` yourself. Until then the rate limits are per server instance instead of shared.
- [ ] **CI:** commit, push and open a pull request so `.github/workflows/ci.yml` runs (lint, types, tests, Knip, build, Playwright, Lighthouse). It passed every Lighthouse budget locally. Optionally add the `LHCI_GITHUB_APP_TOKEN` secret for Lighthouse status checks on pull requests.
- [ ] **WebMCP:** wired up (`src/components/shared/WebMcpTools.tsx`) but untested with a real browser agent. The API is still a W3C draft. Try it in a Chrome build with WebMCP enabled, and re-check the spec (`document.modelContext` vs `navigator.modelContext`) before relying on it.

## Checked by machine only — try it yourself

- [ ] **Audio by ear**, especially on an iPhone (Safari): keystrokes, the hum, the boot and achievement chimes, mute. The automated checks only confirmed the sounds fire with the right settings.
- [ ] **Microphone levels on the agent orb** with a real mic (tap the mic in the terminal and speak).
- [ ] **Screen-reader mode** with a real screen reader (NVDA, VoiceOver): type `screenreader on`, run a few commands, ask the agent a question.

## SEO (after deploying)

- [ ] Set `NEXT_PUBLIC_SITE_URL=https://prichard.co.zw` in Vercel (Production). The code falls back to it, but set it explicitly.
- [ ] Add the site to Google Search Console (domain property for `prichard.co.zw`) and submit `https://prichard.co.zw/sitemap.xml`.
- [ ] Check the home page and one project page in Google's Rich Results Test (https://search.google.com/test/rich-results): `ProfilePage`, `BreadcrumbList`.
- [ ] Use the same name everywhere Google links to you: "Kudzai Prichard Matizirofa" on LinkedIn, GitHub, X and Hugging Face, each linking back to the site.
- [ ] Link to the site from teleagents.co.zw and ourafrica.co.zw (for example a team / founder page). This is the strongest signal that ties the companies to you.
- [ ] Refresh the social preview cache after deploying: LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) and the X card validator.

## Keystroke sound

- [ ] Optional: record your own keyboard (about 10 seconds of normal typing, plus a few presses each of Space, Enter and Backspace; a quiet room, the phone or mic 20–30 cm away, WAV or high-quality MP3). Hand the file over and the clips can be cut from it: press and release halves for `KEY_CLIP_PARTS` in `src/lib/audioEngine.ts`, then `node scripts/embed-sounds.mjs`.
- [ ] Listen on a real device (laptop speakers, headphones, a phone) and tune `keySound` in `src/constants/typingConfig.ts` if anything stands out.
