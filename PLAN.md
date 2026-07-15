# PLAN — Phased Implementation

Phased build plan for the dual-mode developer portfolio (Next.js App Router + TypeScript + Tailwind). Five phases, each on its own short-lived branch off `main`, delivered in many small conventional commits. `main` stays deployable at every merge.

## Git & Commit Strategy

**Branch model.** Trunk-based with short-lived per-phase feature branches. `main` is always deployable — every merge must build clean with 0 TypeScript errors. One branch per phase, named `phase/<n>-<slug>`:

- `phase/1-setup-data`
- `phase/2-static-ui`
- `phase/3-interactive`
- `phase/4-toggle-integration`
- `phase/5-optimization`

Branch off the latest `main`, commit in many small conventional commits, open a PR titled after the phase, self-review against that phase's acceptance criteria, then merge preserving the small commits (merge commit or fast-forward). Do **not** rebase-squash the granular history away — the small commits are wanted. No `batman` empty-init commit: the repo already has history (branch off `main` at `26a265d`). Never force-push a shared branch. Tag each phase completion.

**Commit conventions.** Conventional Commits: `type(scope): subject` — imperative mood, ≤72-char subject, lower-case, no trailing period.

- Types: `feat`, `fix`, `perf`, `refactor`, `chore`, `docs`, `style`, `test`.
- Scopes mirror the tree: `data`, `types`, `lib`, `hero`, `sections`, `ui`, `layout`, `interactive`, `page`, `config`, `docs`.
- One logical change per commit; keep unrelated changes out. Optional body explains **why**, not what. No `Co-Authored-By: Claude` lines (project rule). Reference the phase in the body when useful (e.g. `Refs: Phase 3`).

**Checkpoints (tags).**

- `v0.1-data` — app boots, `/data` JSON + `ascii.txt` present, `/lib/types.ts` compiles with 0 TS errors, `next build` succeeds.
- `v0.2-static` — full Static Mode renders server-side, TextScramble works on hover for all headings, Lighthouse run recorded, 0 TS errors, 0 console errors.
- `v0.3-interactive` — AsciiCanvas, CursorTrail, FloatingProjects each work in isolation on a scratch/dev route, particle count verified in target 2,000–5,000 (floor ≥ 2,000, hard ceiling 8,000), 0 TS errors.
- `v0.4-toggle` — toggle flips both modes, interactive components load only via `next/dynamic` `ssr:false`, verified NO interactive JS in the initial Static payload, clean unmount on toggle-off, 0 TS errors.
- `v1.0` — all OPTIMIZATIONS.md rules verified (DPR cap 1.5, IntersectionObserver pause, squared-distance repulsion, translate3d trail, full RAF/listener cleanup), Static Mode Lighthouse Performance ≥95, no memory growth across repeated toggles.

---

## Phase 1 — Setup & Data Modeling

**Branch:** `phase/1-setup-data` · **Tag:** `v0.1-data`

**Goal.** Stand up the Next.js (App Router) + TypeScript + Tailwind foundation and lock down all content as typed local JSON so every later phase consumes stable, strongly-typed data. No UI polish yet — just a compiling skeleton and the data contract.

**Tasks (ordered).**

1. Scaffold Next.js App Router app with TypeScript + Tailwind (`src/app`, `layout.tsx`, `page.tsx`); configure `@/*` path alias to `/src`. Toolchain is **Bun** (`bun install`, `bun run dev`, `bun run build`); configure ESLint + Prettier in this scaffold commit. Verification posture for the whole project = `tsc --noEmit` + `next build` + Lighthouse (no unit tests required for v1; the `test` conventional-commit type is optional/omitted).
2. Establish the dark terminal/monospace base theme in globals + Tailwind config: flat solid dark background, ONE committed accent color (terminal green), a monospace font stack, and a modular type scale. Document the token choices; use none of the banned AI-slop patterns (no radial glow, no purple-on-dark, no glass, no all-caps eyebrows).
3. Create `/src/data` and author `profile.json` (name, location, bio, socials), `techStack.json` (technologies grouped by category), `projects.json` (must include 1Stop, BlogBubble, E-commerce API), `achievements.json` (hackathons/timeline).
4. Author `/public/data/ascii.txt` (source grid up to ~100 columns × ~50 rows) ASCII art of initials/face, sized so non-whitespace chars land in the target 2,000–5,000 particles after parsing (acceptance floor ≥ 2,000; if a denser source exceeds the hard ceiling of 8,000, `parseAscii` stride-samples down to ≤ 8,000). Served statically and fetched at runtime via `fetch('/data/ascii.txt')`; the JSON data stays in `/src/data/*.json` and is imported, not fetched.
5. Define strict TypeScript interfaces for every JSON shape in `/src/lib/types.ts` (Profile, TechCategory, Project, Achievement) and confirm the JSON validates against them.
6. Author `IMPLEMENTATION.md` capturing the locked design language (accent color, type scale, banned patterns, component-first rule) as the binding spec for future sessions.

**Deliverables.**

- Compiling Next.js App Router + TS + Tailwind project skeleton (blank `page.tsx`/`layout.tsx`).
- Dark terminal theme tokens (single accent = terminal green) in Tailwind config + globals.
- `/src/data/{profile,techStack,projects,achievements}.json` fully populated.
- `/public/data/ascii.txt` populated at target density (served statically, fetched at runtime).
- `/src/lib/types.ts` with strict interfaces for all data.
- `IMPLEMENTATION.md` design-language spec.

**Acceptance criteria.**

- `next build` and `tsc --noEmit` both pass with 0 TypeScript errors.
- All four JSON files parse and type-check against `/src/lib/types.ts` (no `any`).
- `ascii.txt` non-whitespace character count, after the planned stride-sampling rule, yields a target of 2,000–5,000 points (acceptance floor ≥ 2,000; hard ceiling 8,000 — stride-sample down if a denser source exceeds it).
- Theme uses exactly one accent color and contains none of the banned patterns.
- Dev server runs with 0 console errors on a blank page.

**Commits.**

- `chore(config): scaffold Next.js App Router with TypeScript and Tailwind` — `src/app/{layout,page}.tsx` skeleton, tailwind + tsconfig + next config, `@/*` path alias.
- `chore(config): set dark terminal theme tokens and single accent color` — Tailwind theme extension (colors, mono font stack, modular type scale), globals base styles, accent = terminal green.
- `feat(data): add profile and techStack JSON content` — `src/data/profile.json`, `src/data/techStack.json`.
- `feat(data): add projects JSON (1Stop, BlogBubble, E-commerce API)` — `src/data/projects.json`.
- `feat(data): add achievements JSON content` — `src/data/achievements.json`.
- `feat(data): add pre-generated ascii.txt art for particle canvas` — `public/data/ascii.txt` sized for a target of 2,000–5,000 particles (floor ≥ 2,000, hard ceiling 8,000).
- `feat(types): define strict TypeScript interfaces for all data models` — `src/lib/types.ts` (Profile, TechCategory, Project, Achievement).
- `docs: add IMPLEMENTATION.md design-language spec` — `IMPLEMENTATION.md` with accent, type scale, banned patterns, component-first rule.

---

## Phase 2 — Static UI & Global Scramble

**Branch:** `phase/2-static-ui` · **Tag:** `v0.2-static`

**Goal.** Build the complete, fully server-rendered Static Mode: hero, sections, navbar, footer, plus the vanilla-TS TextScramble effect wired into all headings so it works in both modes. This is the default recruiter/SEO experience and must be fast and hydration-light.

**Tasks (ordered).**

1. Implement `/src/lib/textScramble.ts`: a framework-agnostic vanilla-TS class driving character randomization to resolved text via `requestAnimationFrame`, with a promise/callback on completion and internal cleanup.
2. Build `/src/components/ui/ScrambleText.tsx`: minimal `'use client'` wrapper that instantiates TextScramble and triggers `setText` on `onMouseEnter`; accepts the target string and renders semantic heading markup.
3. Build `/src/components/hero/StaticHero.tsx` consuming `profile.json`, using ScrambleText for the name.
4. Build section components `/src/components/sections/TechStack.tsx`, `Projects.tsx` (standard responsive grid of cards — not the banned 3-col icon+title+blurb pattern), and `Achievements.tsx`, each typed to its JSON.
5. Build `/src/components/layout/Navbar.tsx` (sticky, toggle placeholder/no-op for now) and `Footer.tsx` (terminal-style).
6. Assemble everything in `page.tsx` in pure Static Mode (no `isInteractive` yet) with correct sectioning.
7. Add SEO metadata via the Next.js `Metadata` export in `layout.tsx`, sourced from `profile.json`: `title` (name + role), `description` (bio), `metadataBase`, canonical URL, `openGraph` and `twitter` (`summary_large_image`), and `icons`/favicon. Provide `/public/assets/og-image.png` plus a favicon (or a documented emoji-free default).

**Deliverables.**

- `/src/lib/textScramble.ts` vanilla class with RAF + cleanup.
- `/src/components/ui/ScrambleText.tsx` reusable wrapper.
- StaticHero, TechStack, Projects, Achievements section components.
- Navbar (toggle placeholder) + Footer.
- Fully assembled, server-rendered Static Mode `page.tsx` with SEO metadata.

**Acceptance criteria.**

- 0 TypeScript errors; `next build` clean.
- Entire page renders server-side (visible in view-source / disabled-JS): all content present without client JS.
- TextScramble fires on hover for every main heading and always resolves to the correct final string, with no leaked RAF after the effect completes.
- Lighthouse run in Static Mode recorded with Performance/SEO/Accessibility ≥95 (baseline before interactive code exists).
- No banned design patterns present; single accent color respected.
- 0 console errors/warnings and no layout shift on hover.
- `prefers-reduced-motion: reduce` is honored: `ScrambleText` renders the final text with NO RAF scramble and skips its mount/hover auto-triggers.
- The Navbar mode toggle is a keyboard-operable `role="switch"` with `aria-checked` bound to `isInteractive` (placeholder wiring in this phase) and a visible focus ring using `--accent`.

**Commits.**

- `feat(lib): add vanilla TextScramble class with requestAnimationFrame` — `src/lib/textScramble.ts` including completion callback and cleanup.
- `feat(ui): add ScrambleText wrapper triggering scramble on hover` — `src/components/ui/ScrambleText.tsx`.
- `feat(hero): add StaticHero with scrambled name from profile data` — `src/components/hero/StaticHero.tsx`.
- `feat(sections): add TechStack grid from techStack data` — `src/components/sections/TechStack.tsx`.
- `feat(sections): add Projects static card grid from projects data` — `src/components/sections/Projects.tsx`.
- `feat(sections): add Achievements timeline from achievements data` — `src/components/sections/Achievements.tsx`.
- `feat(layout): add Navbar shell and terminal-style Footer` — `src/components/layout/Navbar.tsx` (toggle placeholder), `Footer.tsx`.
- `feat(page): assemble Static Mode layout` — `src/app/page.tsx` static composition and sectioning.
- `feat(layout): add SEO Metadata from profile data` — `src/app/layout.tsx` Next.js `Metadata` export (title = name + role, description = bio, `metadataBase`, canonical, `openGraph` + `twitter` `summary_large_image`, `icons`/favicon); `public/assets/og-image.png` + favicon (or documented emoji-free default).

---

## Phase 3 — Interactive Components

**Branch:** `phase/3-interactive` · **Tag:** `v0.3-interactive`

**Goal.** Build the three heavy client-only interactive components in isolation (parsed ASCII particle canvas, cursor trail, floating project bubbles) so they work correctly and visibly before being wired into the toggle. Correctness first; deep perf hardening is Phase 5 (but obey the cheap invariants now).

**Tasks (ordered).**

1. Implement `/src/lib/parseAscii.ts` to the canonical contract: `parseAscii(raw: string, maxParticles = 8000): { points: AsciiPoint[]; cols: number; rows: number }` where `AsciiPoint = { char: string; col: number; row: number }` in GRID space for non-whitespace cells ONLY. Apply stride sampling so `points.length <= maxParticles`. It does NOT scale to the viewport — grid→screen mapping is the caller's job. Return `cols`/`rows` (the source grid extent) so the canvas can map grid coords to screen space.
2. Build `/src/components/hero/AsciiCanvas.tsx` (`'use client'`): fetch `ascii.txt` at runtime, run `parseAscii`, and on mount/resize map each `AsciiPoint`'s `col`/`row` to a screen target — deriving each Particle's `tx`/`ty` (grid→screen mapping happens here, not in the parser). Particle runtime type: `{ x, y, tx, ty, vx, vy, char }` (use `tx`/`ty` everywhere, never `targetX`/`targetY`). Canvas 2D render loop via `requestAnimationFrame`, mouse repulsion and spring-back physics.
3. Build `/src/components/hero/InteractiveHero.tsx`: composes AsciiCanvas with ScrambleText heading (reusing the shared scramble effect). If `fetch('/data/ascii.txt')` fails or returns non-200, render the ScrambleText hero heading WITHOUT the canvas, log once, and do not throw.
4. Build `/src/components/interactive/CursorTrail.tsx`: fixed array of ~15 nodes; head follows mouse, tail nodes lerp toward the node ahead; positioned via transform.
5. Build `/src/components/interactive/FloatingProjects.tsx`: render `projects.json` titles/links as bubbles that drift and repel from the mouse.
6. Exercise each component on a temporary dev-only route/harness to verify behavior (this scaffold is removed or gated before the Phase 4 merge).

**Deliverables.**

- `/src/lib/parseAscii.ts` parser with stride sampling only (grid-space points; NO viewport scaling).
- `AsciiCanvas.tsx` particle physics engine.
- `InteractiveHero.tsx` composition.
- `CursorTrail.tsx` fixed-node trail.
- `FloatingProjects.tsx` physics bubbles.
- Temporary dev harness proving each works (not shipped).

**Acceptance criteria.**

- 0 TypeScript errors; every interactive file is marked `'use client'`.
- `parseAscii` output (`points.length`) lands in the target 2,000–5,000 (floor ≥ 2,000, hard ceiling 8,000 via stride sampling); only non-whitespace grid cells become `AsciiPoint`s / particles.
- If `fetch('/data/ascii.txt')` fails or returns non-200, InteractiveHero renders the ScrambleText heading without the canvas, logs once, and does not throw.
- AsciiCanvas forms the ASCII shape, particles repel from cursor and spring back smoothly; CursorTrail uses exactly its fixed node count (no unbounded DOM growth); FloatingProjects drift and repel and link to the correct project URLs.
- Each component runs at a smooth frame rate on the dev harness with 0 console errors.
- No interactive component is imported into `page.tsx` yet (still Static Mode default).

**Commits.**

- `feat(lib): add parseAscii to map ascii.txt to grid-space points` — `src/lib/parseAscii.ts` returning `{ points, cols, rows }` with non-whitespace filter and stride sampling (`maxParticles = 8000`); NO viewport scaling.
- `feat(hero): add AsciiCanvas particle physics engine` — `src/components/hero/AsciiCanvas.tsx` fetches `ascii.txt`, maps grid `col`/`row` → screen `tx`/`ty` on mount/resize; Particle `{ x, y, tx, ty, vx, vy, char }`, RAF loop, repulsion + spring-back.
- `feat(hero): add InteractiveHero composing canvas and scramble heading` — `src/components/hero/InteractiveHero.tsx`.
- `feat(interactive): add CursorTrail with fixed lerped node array` — `src/components/interactive/CursorTrail.tsx`.
- `feat(interactive): add FloatingProjects physics bubbles from data` — `src/components/interactive/FloatingProjects.tsx`.
- `chore(hero): add temporary dev harness route to exercise components` — throwaway dev-only route/page used for isolated verification (removed/gated in Phase 4).

---

## Phase 4 — The Toggle & Integration

**Branch:** `phase/4-toggle-integration` · **Tag:** `v0.4-toggle`

**Goal.** Lift a single `isInteractive` boolean into `page.tsx`, add the Navbar toggle, and conditionally render Static vs Interactive trees — with every interactive component imported through `next/dynamic` `{ ssr: false }` so none of them ship or hydrate in the default Static payload.

**Tasks (ordered).**

1. Add `isInteractive` `useState` to `page.tsx` and pass `isInteractive` + `setIsInteractive` down to Navbar (no external state library; Context only if genuinely required).
2. Implement the physical toggle switch UI in `Navbar.tsx` (Static ↔ Interactive) matching the design language.
3. Wrap AsciiCanvas/InteractiveHero, CursorTrail, and FloatingProjects in `next/dynamic(() => import(...), { ssr: false })` and reference the dynamic versions only inside the `isInteractive` branch. Name the dynamically-imported hero const `DynamicInteractiveHero`. Each `dynamic()` call passes an explicit lightweight `loading` component (or a documented `loading: () => null`).
4. Implement conditional rendering: Static tree (StaticHero + Projects) when `false`; Interactive tree (CursorTrail + InteractiveHero + FloatingProjects) when `true`; shared sections (TechStack, Achievements, Footer) render in both.
5. Remove or hard-gate the Phase 3 dev harness so it is not part of the shipped app.

**Deliverables.**

- `page.tsx` with lifted `isInteractive` state and conditional Static/Interactive trees.
- Navbar toggle switch wired to state.
- `next/dynamic` `ssr:false` wrappers for all three interactive components.
- Dev harness removed/gated.

**Acceptance criteria.**

- 0 TypeScript errors; `next build` clean.
- Toggling the switch cleanly swaps between Static and Interactive trees both directions.
- Verified NO interactive component code executes or hydrates on initial load in Static Mode (confirm via disabled-JS render, network chunk inspection, and no interactive-canvas work before first toggle).
- Interactive components are reachable only through the `ssr:false` dynamic imports (they never render on the server).
- State is a single boolean via `useState` (no Zustand/other state lib), matching the locked decision.
- 0 console/hydration errors when toggling either direction.
- The Navbar mode toggle is a keyboard-operable `role="switch"` with `aria-checked` bound to `isInteractive` and a visible focus ring using `--accent`.
- `prefers-reduced-motion: reduce` is honored end-to-end: `ScrambleText` renders final text with no scramble and skips auto-triggers; interactive auto-run animations are suppressed/attenuated.
- Each `dynamic()` import passes an explicit lightweight `loading` component (or documented `loading: () => null`); if `fetch('/data/ascii.txt')` fails or returns non-200, InteractiveHero renders the ScrambleText heading without the canvas, logs once, and does not throw.

**Commits.**

- `feat(page): lift isInteractive boolean state into page` — `src/app/page.tsx` `useState` + prop passing to Navbar.
- `feat(layout): add Static/Interactive toggle switch to Navbar` — `src/components/layout/Navbar.tsx` toggle UI wired to `setIsInteractive`.
- `feat(page): load interactive components via next/dynamic ssr:false` — `dynamic()` wrappers (`DynamicInteractiveHero` for the hero, plus CursorTrail, FloatingProjects) each with an explicit `loading` fallback.
- `feat(page): conditionally render Static vs Interactive component trees` — `src/app/page.tsx` conditional rendering branches; shared sections in both.
- `chore(hero): remove temporary dev harness route` — deletion/gating of the Phase 3 throwaway route.

---

## Phase 5 — Optimization

**Branch:** `phase/5-optimization` · **Tag:** `v1.0`

**Goal.** Apply and verify every constraint in OPTIMIZATIONS.md so Static Mode stays instant and interactive animations run smoothly with no CPU waste or memory leaks. Largely perf-typed commits and measured verification.

**Tasks (ordered).**

1. Cap DPR at 1.5: read `window.devicePixelRatio`, set canvas `width`/`height` × dpr, `ctx.scale(dpr,dpr)`; handle resize correctly.
2. Add IntersectionObserver on canvas elements: `cancelAnimationFrame` when offscreen, restart RAF when back in view.
3. Optimize the physics loop: squared-distance comparisons (no `Math.sqrt` in the RAF), plain for-loops instead of `forEach` over particle arrays.
4. Optimize CursorTrail: confirm fixed N-node array and `transform: translate3d` hardware-accelerated positioning (no top/left).
5. Implement full cleanup: `cancelAnimationFrame` + `removeEventListener` (mousemove/resize) + `observer.disconnect()` in all `useEffect` cleanups, so toggling back to Static frees everything.
6. Measure and verify: Static Mode Lighthouse, frame rate under load, and no memory growth across repeated toggle on/off cycles; tune particle sampling if needed.

**Deliverables.**

- DPR-capped, resize-correct canvas rendering.
- IntersectionObserver pause/resume on all animated canvases.
- sqrt-free, for-loop physics update path.
- `translate3d` fixed-node cursor trail confirmed.
- Complete RAF/listener/observer cleanup on unmount and toggle-off.
- Recorded perf verification (Lighthouse + memory/FPS notes).

**Acceptance criteria.**

- Every OPTIMIZATIONS.md rule verified present: DPR cap 1.5, IntersectionObserver pause via `cancelAnimationFrame`, squared-distance repulsion, for-loops in RAF, fixed-node `translate3d` trail, full cleanup.
- No `Math.sqrt` call inside any per-frame RAF loop (code-audited).
- Toggling to Static Mode and offscreen scroll both stop all RAFs (0 ongoing animation CPU when idle/static).
- Repeated toggle on/off shows no growing listener/RAF count and no monotonic heap growth (no leak).
- Static Mode Lighthouse Performance ≥95; interactive animations hold a smooth frame rate at target particle count.
- 0 TypeScript errors; `next build` clean; final tag `v1.0`.

**Commits.**

- `perf(hero): cap devicePixelRatio at 1.5 and scale canvas context` — AsciiCanvas DPR read/cap, `width`/`height` × dpr, `ctx.scale`, resize handling.
- `perf(hero): pause RAF offscreen via IntersectionObserver` — IntersectionObserver on canvas wired into the shared `/src/lib/useRafLoop.ts` hook (used by AsciiCanvas and FloatingProjects) where the pause logic lives; `cancelAnimationFrame` offscreen, restart on re-entry.
- `perf(hero): use squared-distance repulsion and for-loops in RAF` — remove `Math.sqrt` from `update()`; replace `forEach` with for-loops in the frame loop.
- `perf(interactive): use translate3d and fixed nodes for CursorTrail` — CursorTrail `transform: translate3d` positioning, confirmed fixed N-node array.
- `perf(interactive): full RAF and listener cleanup on unmount and toggle` — `cancelAnimationFrame` + `removeEventListener` + `observer.disconnect()` in `useEffect` cleanups across interactive components.
- `docs: record perf verification results and finalize v1.0` — OPTIMIZATIONS verification notes (Lighthouse, FPS, memory), IMPLEMENTATION.md sign-off.
