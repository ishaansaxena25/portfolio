# Asset Manifest

Inventory of every static asset the dual-mode portfolio consumes: the `/public/assets` tree, the `/src/data` JSON content files, and the `/public/data/ascii.txt` particle source. Paths are the binding contract — components reference these exact locations, and all assets are assumed present at the documented paths during development.

## Path conventions

- **`/public/assets/**`** — files served verbatim by Next.js at the root URL (`/assets/...`). Fonts, icons, images, audio, resume PDF.
- **`/src/data/**`** — JSON content, imported at module scope (typed against `/src/lib/types.ts`).
- **`/public/data/ascii.txt`** — the single authoritative location for the particle source art. It is authored and served here, and fetched at runtime via `fetch('/data/ascii.txt')` (see [ascii.txt](#publicdatasciitxt)). The JSON files stay under `/src/data` and are imported, not fetched.

---

## `/public` structure

```text
/public
  /data
    ascii.txt     # particle source art; fetched at runtime via fetch('/data/ascii.txt')
  /assets
    /fonts        # self-hosted monospace font (woff2); avoids layout shift + external requests
    /icons        # social + UI SVGs; optional custom cursor svg for the trail
    /backgrounds  # optional static textures (subtle noise/grid) — NO radial-glow images
    /audio        # optional toggle/ambient sfx for Interactive mode
    og-image.png  # Open Graph / Twitter card image referenced by layout.tsx metadata
    resume.pdf    # optional; referenced by Profile.resumeUrl
  favicon.ico     # site favicon (or a documented emoji-free default)
```

| Path | Required | Purpose |
|------|----------|---------|
| `/assets/fonts/*.woff2` | Recommended | Self-hosted monospace (e.g. a JetBrains Mono / IBM Plex Mono subset) loaded via `next/font/local` in `layout.tsx`. Keeps the terminal aesthetic and the type scale stable with zero external calls. A system monospace stack is an acceptable fallback. |
| `/assets/icons/*.svg` | Optional | One SVG per social `platform` key (`github`, `linkedin`, `x`, `email`, `website`). Consumed by `Footer` and `StaticHero`. If absent, render the text `label` only. |
| `/assets/icons/cursor.svg` | Optional | Custom glyph for `CursorTrail` head node. If absent, the trail uses CSS-drawn dots (the default). |
| `/assets/backgrounds/*` | Optional | Flat solid or a very subtle grid/noise texture only. Radial-glow / blob images are banned by the design language. |
| `/assets/audio/*` | Optional | Short sfx for the mode toggle or an ambient loop in Interactive mode. Must be user-triggered (never autoplay). Ships zero bytes to Static mode. |
| `/public/assets/og-image.png` | Recommended | Open Graph / Twitter (`summary_large_image`) card image referenced by the Next.js `Metadata` in `layout.tsx`. |
| `/public/favicon.ico` | Recommended | Site favicon wired via `metadata.icons`. If omitted, document an emoji-free default (no emoji favicons). |
| `/public/assets/resume.pdf` | Optional | Target of `Profile.resumeUrl`. Only required if `resumeUrl` is set in `profile.json`. |

---

## `/src/data` JSON files

All four are typed against `/src/lib/types.ts`; they must parse and type-check with no `any`.

| File | Shape | Consumed by | Notes |
|------|-------|-------------|-------|
| `profile.json` | `Profile` (single object) | `StaticHero`, `InteractiveHero`, `Footer` | Identity: `name`, `initials`, `role`, `location`, `bio`, `email`, optional `resumeUrl`, ordered `socials: SocialLink[]`. `initials` should conceptually match the glyph drawn in `ascii.txt`. |
| `techStack.json` | `TechCategory[]` | `TechStack` | Array of `{ category, items: TechItem[] }`. Optional `level` (`core` \| `proficient` \| `familiar`) for accent weight — no numeric bars. |
| `projects.json` | `Project[]` | `Projects` (static grid), `FloatingProjects` (bubbles) | MUST include **1Stop**, **BlogBubble**, and **E-commerce API**. Each project's `tech[]` should reference names present in `techStack.json`. Optional `bubble: ProjectBubbleMeta` supplies physics hints (`radius`, `seedX`, `seedY`) read only by `FloatingProjects`. `id` doubles as React key and bubble id. |
| `achievements.json` | `Achievement[]` | `Achievements` | Sorted client-side by `date` descending. `date` is ISO or `YYYY-MM`. |

---

## `/public/data/ascii.txt`

### Purpose
Pre-generated ASCII art of the developer's initials/face. Parsed **once at `InteractiveHero` mount** by `parseAscii.ts` into `AsciiPoint[]`, one point per non-whitespace cell, which `AsciiCanvas` turns into physics particles. Never parsed as JSON; never generated from an image at runtime.

### Serving note
`parseAscii.ts` fetches the file over HTTP (`fetch('/data/ascii.txt')`), so the file is authored and served at the single authoritative location `/public/data/ascii.txt`. There is no `/src/data` copy or symlink to keep in sync. The file is client-only — it is requested only after the toggle flips to Interactive, so it never weighs on the Static payload.

### Target dimensions
Monospace grid of **up to ~100 columns × ~50 rows** (`COLS <= 100`, `ROWS <= 50` → max ~5,000 cells). Lines are read verbatim; shorter rows are treated as space-padded to the longest line. Trailing whitespace that maintains alignment is preserved. A well-filled ~100×50 face or initials glyph lands in the canonical **2,000–5,000** particle target with stride 1 — floor **>= 2,000**, hard ceiling **8,000**.

### Charset
Fixed density ramp, dark → light:

```text
 .:-=+*#%@
```

- Space, `\t`, `\r`, `\n` are whitespace → **no particle**.
- Any other printable char is allowed and is drawn literally by its particle. The ramp is an authoring guideline, not enforced at parse time.

### How to generate
Author the grid so non-whitespace density lands in target. Options:

1. **Image → ASCII tool.** Take a high-contrast square headshot or an initials glyph, convert with an image-to-ASCII converter (e.g. `jp2a --width=100 --chars=" .:-=+*#%@" face.png`, or a Python `Pillow`/`ascii-magic` script, or a web converter). Constrain width to ~100 and confirm the output height is ≤ 50 rows (monospace cells are ~2× taller than wide, so a square image maps roughly to 100×50). Trim to the crop that reads well.
2. **By hand.** For pure initials (matching `Profile.initials`), hand-draw the glyph on the ~100×50 grid using the ramp for shading. Cleanest, fully controllable density.

After generating, verify the non-whitespace count (see below) and eyeball that the shape is recognizable at particle scale.

### Sampling rule (target 2k–5k, hard ceiling 8k particles)
`parseAscii.ts` scans row-major and pushes an `AsciiPoint {char, col, row}` for every non-whitespace cell, then thins to cap the array:

```text
MAX_PARTICLES = 8000
nonSpaceCount = count of non-whitespace cells
stride        = max(1, ceil(nonSpaceCount / MAX_PARTICLES))
keep every stride-th non-whitespace cell
```

- If `nonSpaceCount <= 8000`, `stride = 1` (keep all — **no upsampling**; the file is authored dense enough).
- Only denser/larger art trips `stride > 1`, guaranteeing the particle array never exceeds the hard ceiling of 8,000.
- If a full ~100×50 render comes in below the **2,000** floor, add shading/detail (fill more cells with ramp chars) rather than upscaling — there is no interpolation.

Quick density check:

```bash
grep -o '[^[:space:]]' /public/data/ascii.txt | wc -l   # non-whitespace cell count → target 2,000–5,000 (floor >= 2,000, hard ceiling 8,000)
awk '{ if (length > m) m = length } END { print "cols:", m, "rows:", NR }' /public/data/ascii.txt
```

Coordinate mapping (grid → screen), particle physics, and the DPR cap are owned by `AsciiCanvas` / `OPTIMIZATIONS.md`, not this manifest.

---

## Required vs optional by phase

Assets are assumed present at the documented paths during development. Per-phase gating:

### Phase 1 — Setup & Data
**Required:** `profile.json`, `techStack.json`, `projects.json`, `achievements.json`, `ascii.txt` (at target density).
**Optional:** self-hosted font under `/assets/fonts` (system monospace stack is a valid fallback), `resume.pdf`.

### Phase 2 — Static UI & Global Scramble
**Required:** all four JSON files (drive every rendered section); font stack resolved (self-hosted or system).
**Optional:** social `icons/*.svg` (fall back to text labels), `backgrounds/*`, `resume.pdf` (only if `profile.resumeUrl` is set).

### Phase 3 — Interactive Components
**Required:** `ascii.txt` reachable at `/public/data/ascii.txt` (parsed by `parseAscii.ts`), `projects.json` (bubble sources).
**Optional:** `icons/cursor.svg` (CSS dots otherwise), `audio/*`.

### Phase 4 — Toggle & Integration
**Required:** everything above — both trees now mount. No new assets introduced.

### Phase 5 — Optimization
**Required:** none new. Re-verify `ascii.txt` density keeps the parsed particle count in the 2,000–5,000 target (floor >= 2,000, hard ceiling 8,000); retune the source art (not the parser) if it drifts.
