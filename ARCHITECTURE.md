# Architecture

A dual-mode developer portfolio: Next.js (App Router) + TypeScript + Tailwind CSS. Static Mode is the default, server-rendered, SEO-friendly experience. Interactive Mode is a client-only opt-in that boots heavy animations. A single `isInteractive` boolean drives the switch; all heavy code is code-split behind `next/dynamic` with `{ ssr: false }`.

## Directory structure

```text
/src
  /app
    layout.tsx              # server. HTML shell: monospace font, SEO metadata, dark theme + accent
    page.tsx                # "use client". Sole owner of isInteractive; imports JSON; renders trees
  /components
    /layout
      Navbar.tsx            # "use client". Sticky nav + the Static<->Interactive toggle switch
      Footer.tsx            # server. Terminal-style footer (name, email, socials). Shared, both modes
    /ui
      ScrambleText.tsx      # "use client". Wraps the TextScramble lib class. Global heading primitive
    /hero
      StaticHero.tsx        # server. Pure HTML/CSS hero. Instant paint, SEO content
      InteractiveHero.tsx   # "use client", default export. Parses ascii.txt -> AsciiPoint[], mounts canvas
      AsciiCanvas.tsx       # "use client". Canvas 2D particle-physics engine (RAF loop)
    /interactive
      CursorTrail.tsx       # "use client", default export. Fixed 15-node lerped mouse trail
      FloatingProjects.tsx  # "use client", default export. Physics bubbles per project
    /sections
      TechStack.tsx         # server. Tech tags grouped by category. Shared, both modes
      Projects.tsx          # server. Static card grid. Static mode only
      Achievements.tsx      # server. Timeline sorted by date desc. Shared, both modes
  /data
    profile.json            # Profile        — single object (not an array)
    techStack.json          # TechCategory[] — technologies grouped by category
    projects.json           # Project[]      — MUST include 1Stop, BlogBubble, E-commerce API
    achievements.json       # Achievement[]  — sorted client-side by date descending
  /lib
    types.ts                # All interfaces in this doc. Types only, erased at build
    textScramble.ts         # Vanilla TS TextScramble class (RAF, no React)
    parseAscii.ts           # Pure fn: raw text -> { points, cols, rows } with sampling
    useRafLoop.ts           # Shared RAF-loop hook (used by AsciiCanvas + FloatingProjects; IO-pause aware)
/public
  /data
    ascii.txt               # Raw monospace art (~100 cols x ~50 rows). Fetched at runtime via fetch('/data/ascii.txt'), never as JSON
```

Path alias `@/*` resolves to `/src`.

## Data flow

1. **Content** is local JSON in `/src/data` plus `ascii.txt`. No backend, no CMS. `page.tsx` imports the four JSON files at module scope and passes them down as typed props.
2. **Static path** — server-rendered by default. `layout.tsx` sets the shell; `page.tsx` renders `StaticHero`, `Projects`, and the shared sections. All content is present in view-source with JS disabled.
3. **ASCII parsing** — runs only in Interactive Mode. On `InteractiveHero` mount (client-only), it fetches `/data/ascii.txt` and calls `parseAscii(raw)`, which scans the grid row-major and emits one `AsciiPoint {char,col,row}` per non-whitespace cell. If the non-space count exceeds `MAX_PARTICLES` (8000), it keeps every `stride`-th cell where `stride = max(1, ceil(nonSpaceCount / MAX_PARTICLES))`; at or below the 8000 ceiling it keeps `stride = 1` (no upsampling). The resulting `{ points, cols, rows }` feeds `AsciiCanvas`.
4. **Grid -> screen** mapping happens once per resize inside `AsciiCanvas`, in CSS px before DPR scaling. Monospace cells are ~0.5 as wide as tall, so `cellH = min((canvasCssW/COLS)/0.5, canvasCssH/ROWS)`, `cellW = cellH*0.5`; the art is centered via `offsetX/offsetY`, and each point's target is `tx = offsetX + col*cellW + cellW/2`, `ty = offsetY + row*cellH + cellH/2`. Each `AsciiPoint` becomes one `Particle` that springs toward `(tx,ty)`.
5. **Runtime physics** state (`Particle`, `TrailNode`) is never serialized — it lives in refs inside the client components and is created/destroyed with them.

## State model — `isInteractive`

`page.tsx` is the single client component that owns the toggle. No Context, no Zustand.

```ts
const [isInteractive, setIsInteractive] = React.useState<boolean>(false); // false = Static Mode
```

- The boolean and its setter are passed by props to `Navbar` (the only control) and used locally for conditional rendering.
- Flipping to `true` mounts the interactive tree; flipping to `false` unmounts it, firing each interactive component's `useEffect` cleanup (`cancelAnimationFrame`, `removeEventListener`, `observer.disconnect()`).
- Shared sections (`TechStack`, `Achievements`, `Footer`) render once, outside the toggle branch, in both modes.
- If deep prop drilling ever appears, a minimal `InteractiveModeContext` is the sanctioned escape hatch — but plain props are the default.

## Component tree

### Static Mode (`isInteractive === false`, default)

```text
<Page>
  <Navbar isInteractive={false} setIsInteractive={setIsInteractive} />
  <StaticHero data={profile} />
  <Projects data={projects} />
  <TechStack data={techStack} />          # shared
  <Achievements data={achievements} />    # shared
  <Footer data={profile} />               # shared
</Page>
```

No canvas/physics JS ships or hydrates here.

### Interactive Mode (`isInteractive === true`)

```text
<Page>
  <Navbar isInteractive={true} setIsInteractive={setIsInteractive} />
  <CursorTrail />                         # dynamic, ssr:false
  <DynamicInteractiveHero data={profile} />  # dynamic, ssr:false; renders AsciiCanvas
  <FloatingProjects data={projects} />    # dynamic, ssr:false
  <TechStack data={techStack} />          # shared, same component as static
  <Achievements data={achievements} />    # shared
  <Footer data={profile} />               # shared
</Page>
```

`ScrambleText` is used for headings in **both** trees (hero name, section/card headings).

## Dynamic loading strategy (`next/dynamic`, `ssr: false`)

All interactive components are default-exported and imported at module scope in `page.tsx`:

```ts
const DynamicInteractiveHero = dynamic(() => import('@/components/hero/InteractiveHero'), { ssr: false });
const CursorTrail = dynamic(() => import('@/components/interactive/CursorTrail'), { ssr: false });
const FloatingProjects = dynamic(() => import('@/components/interactive/FloatingProjects'), { ssr: false });
```

- `{ ssr: false }` guarantees this code never runs or hydrates on the server.
- The dynamic components are referenced **only** inside the `isInteractive === true` branch, so their bundles are code-split and fetched on the first toggle-on. Static Mode's first paint carries zero canvas/physics JS.
- `AsciiCanvas` is imported normally inside `InteractiveHero` (it inherits the ssr:false boundary of its dynamically loaded parent).
- Each `dynamic()` import passes an explicit lightweight `loading` fallback (or a documented `none`), and `InteractiveHero` degrades gracefully: if the `fetch('/data/ascii.txt')` fails or returns non-200 it renders the `ScrambleText` hero heading without the canvas, logs once, and does not throw.

## TypeScript interfaces

Canonical home: `/src/lib/types.ts`. Serialized data models first, then runtime-only types.

```ts
// ---- Serialized data models (match the JSON files) ----

export interface Profile {
  name: string;         // Full display name; rendered via ScrambleText in both heroes
  initials: string;     // 1-3 chars; conceptually matches the glyph in ascii.txt
  role: string;         // Headline title, e.g. "Full-stack developer"
  location: string;
  bio: string;          // 1-3 sentence intro for the hero/footer
  email: string;
  resumeUrl?: string;   // Absolute or /public path to resume PDF
  socials: SocialLink[]; // Ordered; rendered in Footer and StaticHero
}

export interface SocialLink {
  platform: 'github' | 'linkedin' | 'x' | 'email' | 'website' | string; // machine key for icon/label
  label: string;        // Human label, e.g. "GitHub"
  url: string;          // Full href (mailto: for email)
  handle?: string;      // Optional display handle, e.g. "@ishaan"
}

export interface TechCategory {
  category: string;     // Group heading, e.g. "Languages", "Frameworks", "Tools", "Databases"
  items: TechItem[];
}

export interface TechItem {
  name: string;         // Display name, e.g. "TypeScript"
  level?: 'core' | 'proficient' | 'familiar'; // Optional emphasis. No numeric bars
}

export interface Project {
  id: string;           // Stable unique key; React key and FloatingProjects bubble id
  slug: string;         // URL-safe slug, e.g. "1stop", "blogbubble", "ecommerce-api"
  title: string;        // Rendered via ScrambleText on card headings
  tagline: string;      // One-line summary; also the floating bubble caption
  description: string;  // Longer paragraph for the static card body
  tech: string[];       // Stack tags; should reference names in techStack.json
  role?: string;        // e.g. "Solo", "Backend", "Frontend"
  year?: number;
  repoUrl?: string;
  liveUrl?: string;
  featured?: boolean;   // Featured projects may render larger in the static grid
  bubble?: ProjectBubbleMeta; // Physics hints consumed only by FloatingProjects
}

export interface ProjectBubbleMeta {
  radius?: number;      // Base bubble radius (CSS px); default derived from title length
  seedX?: number;       // 0-1 normalized initial X; randomized if omitted
  seedY?: number;       // 0-1 normalized initial Y; randomized if omitted
}

export interface Achievement {
  id: string;           // Stable unique key
  title: string;        // e.g. "1st place — Realtime track"; rendered via ScrambleText
  event: string;        // Hackathon / program name
  placement?: string;   // e.g. "Winner", "Finalist", "Top 10"
  date: string;         // ISO date or "YYYY-MM"; sorts the timeline descending
  description?: string;
  url?: string;         // Link to writeup / devpost / repo
}

// ---- Parse output ----

export interface AsciiPoint {
  char: string;         // Single non-space glyph from ascii.txt
  col: number;          // 0-based column in the source grid
  row: number;          // 0-based row in the source grid
}

// ---- Runtime-only (never serialized) ----

export interface Particle {
  x: number;            // Current CSS-px X (ctx.scale handles DPR)
  y: number;            // Current CSS-px Y
  tx: number;           // Target X (scaled/centered from AsciiPoint)
  ty: number;           // Target Y
  vx: number;           // Velocity X
  vy: number;           // Velocity Y
  char: string;         // Glyph drawn at (x,y)
}

export interface TrailNode {
  x: number;            // CSS-px X. Head follows mouse; tail lerps toward the node ahead
  y: number;
}

// ---- Component prop contracts ----

export interface ScrambleTextProps {
  text: string;         // Resolved final string
  as?: 'h1' | 'h2' | 'h3' | 'span' | keyof JSX.IntrinsicElements; // default "span"
  className?: string;
  trigger?: 'hover' | 'mount' | 'both'; // default "hover"
}
```

## Design language (binding)

Terminal/monospace-influenced, flat dark theme, exactly one accent color (terminal green), restrained 1px borders, sentence-case headings, a real modular type scale. The full spec and the list of banned AI-slop patterns live in `IMPLEMENTATION.md`; performance rules live in `OPTIMIZATIONS.md`. Component-first: reach for the project's own components before adding anything new.
