# Implementation Spec — Design Language & Logic Rules

This is the binding spec for styling and behavior. Future sessions MUST obey it. It complements `ARCHITECTURE.md` (structure), `PLAN.md` (phasing), and `OPTIMIZATIONS.md` (performance). Where this file says "always" or "never", treat it as a hard rule, not a suggestion.

`portfolio.md` describes an ABANDONED vision. Ignore it entirely except to know what NOT to build. There is NO game/platformer/"Hades" concept, NO GSAP, and NO Zustand anywhere in this project.

---

## 1. Design language

- **Aesthetic:** clean, terminal/monospace-influenced, dark theme. Flat solid backgrounds. Restrained 1px borders. Boring-and-native beats flashy-and-generic.
- **One accent color, committed:** the accent is **terminal green**. There is exactly one accent across the whole site. Never introduce a second accent hue.
- **Typography:** sentence-case headings (e.g. "Selected work", not "SELECTED WORK"). A real modular type scale (see §4). Monospace font stack throughout.
- **Component-first rule:** ALWAYS reach for the project's own components (`ScrambleText`, the section components, the shared tokens) before writing new markup. Do not fork one-off styles when an existing primitive fits.
- **Restraint:** solid fills, thin borders, generous but consistent spacing. No decorative flourishes that aren't in this spec.

---

## 2. Banned patterns (instant AI-slop tells — NEVER use)

These are forbidden anywhere in the UI. Reject any design that includes them:

- **Radial-gradient "glow" backgrounds / blobs** on cards, heroes, or sections. No `bg-gradient-radial`, no soft ambient glows, no glowing blobs behind content.
- **Purple/indigo-on-dark default themes.** This project's accent is terminal green — never reach for violet/indigo/purple accents.
- **Status pills with colored dots** (e.g. a green-dot "● Live" badge in a translucent rounded-full pill). If a live/status indicator is genuinely needed, keep it plain text.
- **ALL-CAPS wide-letter-spacing micro-labels / eyebrows** (`uppercase tracking-widest text-xs` section labels). Use normal sentence-case headings.
- **Colored left-accent border cards** (the 4px colored `border-l-4` stripe on alert/notification cards). Style with the existing border/background treatment instead.
- **Glassmorphism** — `backdrop-blur` + translucent white borders.
- **Glow `box-shadow`s** in accent colors.
- **Oversized border radii on everything.**
- **Gradient text.**
- **Emoji inside UI labels.**
- **Generic three-column "feature card" grids** (icon + title + blurb).

The physics render loop enforces the no-glow rule at the engine level: no `shadowBlur`, no gradients, no per-particle `globalAlpha` (see `OPTIMIZATIONS.md`).

---

## 3. Design tokens

Commit these as the single source of truth (Tailwind theme extension + CSS variables in globals). Values below are the authored intent; keep them consistent everywhere.

| Token | Value | Usage |
| --- | --- | --- |
| `--bg` | `#0a0e0a` (near-black, faint green cast) | Page background. Flat, solid. |
| `--bg-elevated` | `#111511` | Cards, footer, elevated surfaces. Solid, not translucent. |
| `--fg` | `#d6e0d6` (soft off-white) | Primary body text. |
| `--fg-muted` | `#7d887d` | Secondary text, captions, meta. |
| `--accent` | `#4ade80` (terminal green) | The ONE accent. Links, active toggle, scramble cursor, particle fill. |
| `--accent-dim` | `#2f8f52` | Hover/pressed accent, dimmed accent text. |
| `--border` | `#1e261e` | All 1px borders and dividers. |

- **Accent fill (canvas):** particles and cursor trail use `--accent` (terminal green), set once on `ctx.fillStyle` outside the loop. Never per-particle color.
- **Font stack (monospace, one family):**
  `ui-monospace, "JetBrains Mono", "SFMono-Regular", "Menlo", "Consolas", monospace`.
  Load the primary monospace face in `layout.tsx`. No secondary display/serif face.
- **Borders:** always 1px, always `--border`. No shadows for elevation — use `--bg-elevated` background difference instead.
- **Radius:** small and uniform (`4px`). Never oversized pill/blob radii on content containers.

---

## 4. Type scale

Modular scale, ratio ~1.25, monospace throughout. Line-heights tight on headings, comfortable on body.

| Step | Size (rem) | Line-height | Use |
| --- | --- | --- | --- |
| `display` | 3.05 | 1.05 | Hero name (`h1`, via `ScrambleText`). |
| `h1` | 2.44 | 1.1 | Rare; hero fallback. |
| `h2` | 1.95 | 1.15 | Section headings ("Projects", "Tech stack"). |
| `h3` | 1.56 | 1.2 | Card titles, project titles. |
| `body-lg` | 1.25 | 1.5 | Hero bio, lead paragraphs. |
| `body` | 1.0 | 1.6 | Default body text. |
| `small` | 0.8 | 1.5 | Captions, meta, tech tags, footer. |

- Headings are sentence-case. Never uppercase eyebrows.
- Weight: rely on the monospace family's regular/medium; avoid heavy synthetic bolding.

---

## 5. Static Text Scramble behavior

The scramble effect is the ONE global heading primitive and works in BOTH modes.

- **Class:** `/src/lib/textScramble.ts` — a framework-agnostic vanilla-TS `TextScramble` class. `constructor(el: HTMLElement)`; `setText(text: string): Promise<void>`. It drives per-character randomize→resolve via a SINGLE `requestAnimationFrame` loop, resolves the promise on completion, and cleans up its own RAF.
- **Wrapper:** `/src/components/ui/ScrambleText.tsx` (`"use client"`) instantiates `TextScramble` against its rendered element and calls `setText` per the `trigger`.
- **Props:** `text: string`, `as?: keyof JSX.IntrinsicElements` (default `"span"`), `className?: string`, `trigger?: "hover" | "mount" | "both"` (default `"hover"`).
- **Behavior rules:**
  - Randomizes characters through a noise charset, then resolves left-to-right to the exact `text`. It MUST always resolve to the correct final string.
  - Default trigger is `hover` (`onMouseEnter`). `mount` runs once on mount; `both` runs on mount and on subsequent hovers.
  - Uses a scramble charset consistent with the terminal aesthetic (e.g. `!<>-_\\/[]{}—=+*^?#`).
  - NEVER cause layout shift on scramble: the element must reserve final width (render the resolved text as the accessible/SSR content; scramble is a visual overlay of the same string length trajectory). Semantic markup and SEO text are always the resolved string.
  - **Cleanup:** every run must leave no leaked RAF. On unmount, cancel any in-flight frame.
- **Where used:** hero name, all section headings (`h2`), project/card titles (`h3`), achievement titles. Both Static and Interactive heroes use it.

---

## 6. Mode toggle behavior & rules

- **Single source of truth:** `isInteractive` boolean lives ONLY in `/src/app/page.tsx`:
  `const [isInteractive, setIsInteractive] = React.useState<boolean>(false);`
  Default `false` = Static Mode.
- **Only entry point:** the physical toggle switch in `Navbar.tsx` is the ONLY way to change mode. `Navbar` is a pure controlled component: it receives `isInteractive` + `setIsInteractive` as props, reflects state, and calls the setter. It holds no mode state of its own.
- **Static tree (`isInteractive === false`):** `StaticHero` + `Projects` (static card grid).
- **Interactive tree (`isInteractive === true`):** `CursorTrail` + `InteractiveHero` (renders `AsciiCanvas`) + `FloatingProjects` (bubbles). All three are dynamic-imported with `ssr:false`.
- **Shared in both modes:** `TechStack`, `Achievements`, `Footer` render once, OUTSIDE the toggle branch — never duplicated per branch.
- **Toggle to Static MUST unmount** every interactive component so their `useEffect` cleanups fire: `cancelAnimationFrame`, `removeEventListener` (by exact reference), `observer.disconnect()`, clear debounce timers, release particle arrays. After toggling off, NO RAF may keep ticking and NO listener may leak.
- **Toggle switch styling:** matches the design language — a bordered track + knob using `--border` and `--accent` for the active state. Not a status pill, no colored dot, no glow.
- The toggle affects only which tree renders; it never conditionally changes the shared sections.

---

## 7. React state rules

- **Single boolean, `useState`, in `page.tsx`.** No exceptions.
- **NEVER use Zustand or any external state library.** NEVER use GSAP.
- **Context only if genuinely required:** if deep prop drilling of the toggle ever appears, a minimal `InteractiveModeContext` is the sanctioned escape hatch — but plain props (`isInteractive`, `setIsInteractive`) passed to `Navbar` are the default and strongly preferred.
- **No React state on high-frequency events.** Mouse position for all physics/trail code lives in a `ref` updated by a PASSIVE `mousemove` listener. NEVER call `setState` on `mousemove` or per RAF frame.
- Data (`profile`, `techStack`, `projects`, `achievements`) is imported JSON, passed down by props. No client fetching for content; `ascii.txt` is the only runtime-fetched asset (client-only, at `InteractiveHero` mount).

---

## 8. Keeping interactive components client-only

- **`"use client"` required** on: `AsciiCanvas`, `InteractiveHero`, `CursorTrail`, `FloatingProjects`, and `ScrambleText`.
- **Default-export** each interactive component so it can be dynamic-imported.
- **ALWAYS import via `next/dynamic` with `{ ssr: false }`**, at module scope in `page.tsx`:
  ```ts
  const DynamicInteractiveHero = dynamic(() => import('@/components/hero/InteractiveHero'), { ssr: false });
  const CursorTrail = dynamic(() => import('@/components/interactive/CursorTrail'), { ssr: false });
  const FloatingProjects = dynamic(() => import('@/components/interactive/FloatingProjects'), { ssr: false });
  ```
- **Reference them ONLY inside the `isInteractive === true` branch**, so their bundles are code-split and fetched on first toggle-on. Static Mode's first paint ships ZERO canvas/physics/trail JS.
- **NEVER render an interactive component on the server.** They must never appear in the SSR/disabled-JS output. Verify via view-source and network chunk inspection: no interactive chunk loads until the toggle flips.
- **Static Mode is the SSR/SEO surface:** `RootLayout`, `StaticHero`, `Projects`, `TechStack`, `Achievements`, `Footer` are server components (except `ScrambleText`, a light client leaf). All portfolio content is present in server HTML without client JS.
- Any browser-only API (`window`, `document`, `devicePixelRatio`, `IntersectionObserver`, canvas) is touched ONLY inside `useEffect`/event handlers of these client components — never at module top level.

---

## 9. Accessibility

- **Honor `prefers-reduced-motion: reduce`.** When the user prefers reduced motion:
  - `ScrambleText` renders the final resolved text directly with NO RAF scramble, and skips both auto-triggers (`mount` and `both`). It never randomizes characters; it shows the exact string immediately.
  - Interactive auto-run animations (canvas particle settle, floating-project drift, cursor trail idle motion) are suppressed or attenuated — no animation that runs without direct user intent.
- **Mode toggle is keyboard-operable.** The `Navbar` toggle is a `role="switch"` control with `aria-checked` bound to `isInteractive`. It is focusable and operable by keyboard (Space/Enter), and exposes a visible focus ring using `--accent`.

---

## 10. SEO metadata

- Next.js `Metadata` is defined in `layout.tsx`, sourced from `profile.json`: title (name + role), description (bio), `metadataBase`, canonical, `openGraph`, and `twitter` (`summary_large_image`), plus `icons`/favicon. OG/favicon assets live under `/public/assets/`. See `PLAN.md` Phase 2 for the detailed implementation.

---

## 11. Non-negotiables (quick reference)

- One accent: terminal green. No second hue.
- None of the §2 banned patterns, ever.
- Scramble always resolves to the exact string; no layout shift; no leaked RAF.
- Toggle state is a single `useState` boolean in `page.tsx`; no Zustand, no GSAP.
- Interactive components: `"use client"` + `next/dynamic({ ssr:false })` + full cleanup on unmount.
- Honor `prefers-reduced-motion: reduce`; mode toggle is a keyboard-operable `role="switch"` with `aria-checked` and a `--accent` focus ring.
- SEO `Metadata` in `layout.tsx` is sourced from `profile.json` (OG + twitter + canonical + favicon).
- Performance rules in `OPTIMIZATIONS.md` are binding (DPR cap 1.5, squared-distance repulsion, for-loops in RAF, IntersectionObserver pause, `translate3d` trail, full teardown).
