# Performance & Optimization Constraints

The Interactive Mode canvas and animations must be flawlessly optimized. Static Mode ships zero interactive JS until the toggle flips. These rules are binding for `AsciiCanvas`, `CursorTrail`, `FloatingProjects`, and `InteractiveHero`. Follow them strictly.

## 1. ASCII Parsing & Particle Count

- Do NOT parse images at runtime. `parseAscii.ts` operates on the raw text fetched from `/public/data/ascii.txt` (via `fetch("/data/ascii.txt")`).
- Scan the grid row-major and push an `AsciiPoint {char, col, row}` for every non-whitespace cell only. Space, `\t`, `\r`, and `\n` produce no particle.
- Target particle count is **2,000-5,000** (hard ceiling **8,000**, acceptance floor **>= 2,000**). Apply a sampling stride so the array never exceeds the ceiling: `stride = max(1, ceil(nonSpaceCount / MAX_PARTICLES))` with `MAX_PARTICLES = 8000`, then keep only every `stride`-th non-space cell. If the count is already at or below the target band keep `stride = 1` (never upsample).
- Grid-to-screen mapping runs once per resize in `AsciiCanvas`, in CSS px (before DPR scale). Monospace cells are ~0.5 as wide as tall, so:
  - `cellH = min((canvasCssW / COLS) / 0.5, canvasCssH / ROWS)`; `cellW = cellH * 0.5`.
  - `artW = COLS * cellW`; `artH = ROWS * cellH`; center via `offsetX = (canvasCssW - artW)/2`, `offsetY = (canvasCssH - artH)/2`.
  - Per point: `tx = offsetX + col*cellW + cellW/2`; `ty = offsetY + row*cellH + cellH/2` (stored on the `Particle` as fields `tx`/`ty`).
- Parsing is mount-time only. Each kept `AsciiPoint` becomes exactly one `Particle` (fields `{ x, y, tx, ty, vx, vy, char }`).

## 2. Dynamic Import & SSR Disabling

- `InteractiveHero` (which renders `AsciiCanvas`), `CursorTrail`, and `FloatingProjects` must NEVER render or hydrate on the server.
- All interactive components are default-exported and imported at module scope in the client shell `src/components/layout/InteractiveShell.tsx` via `next/dynamic` with `{ ssr: false, loading: () => null }`. (`dynamic(..., { ssr: false })` cannot run in a Server Component, so it lives in the `"use client"` shell — NOT in `page.tsx`, which stays a Server Component and passes the static/shared server subtrees to the shell as slot props.)
  ```ts
  const DynamicInteractiveHero = dynamic(() => import('@/components/hero/InteractiveHero'), { ssr: false, loading: () => null });
  const CursorTrail = dynamic(() => import('@/components/interactive/CursorTrail'), { ssr: false, loading: () => null });
  const FloatingProjects = dynamic(() => import('@/components/interactive/FloatingProjects'), { ssr: false, loading: () => null });
  ```
- Reference the dynamic versions ONLY inside the `isInteractive === true` branch so the bundles are code-split and fetched on first toggle-on. Static Mode's first paint ships none of this JS.

## 3. Intersection Observer (Pause Offscreen)

- An `IntersectionObserver` (threshold ~0) watches the canvas element to gate the RAF loop on visibility.
- When `entry.isIntersecting` flips FALSE: `cancelAnimationFrame(rafId)` and null the id to freeze physics at zero CPU while scrolled away.
- When it flips TRUE and no loop is running: restart via `rafId = requestAnimationFrame(loop)`. Guard against double-starting by checking the stored `rafId` / an `isRunning` flag first.
- This is IN ADDITION to full teardown on toggle-off (see §8). Pausing on `document` `visibilitychange:hidden` is optional; the observer is the mandated mechanism.
- The RAF start/stop plumbing for both `AsciiCanvas` and `FloatingProjects` is the shared `useRafLoop` hook shipped at `/src/lib/useRafLoop.ts`; the Phase 5 IntersectionObserver pause commit touches that file to wire visibility gating through it.

## 4. Device Pixel Ratio (DPR) Cap

- Hard-cap DPR at **1.5** to protect high-DPI machines: `const dpr = Math.min(window.devicePixelRatio || 1, 1.5)`.
- Backing store: `canvas.width = Math.floor(innerWidth * dpr)`; `canvas.height = Math.floor(innerHeight * dpr)`.
- CSS size: `canvas.style.width = innerWidth + 'px'`; `canvas.style.height = innerHeight + 'px'`.
- Apply `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` (or `ctx.scale(dpr, dpr)` on a fresh context) ONCE after each resize so all physics/render math stays in CSS px.
- Never read `devicePixelRatio` inside the RAF loop. Recompute DPR, backing store, transform, AND particle targets in the debounced resize handler only.

## 5. Physics Loop Optimization

- One `update` function per RAF tick. Iterate with a plain indexed `for (let i = 0; i < len; i++)` loop — never `forEach`/`map`/`reduce` in the frame.
- Read the mouse from a ref (`{mx, my}`) written by a **passive** `mousemove` listener. Never call React `setState` on mousemove.
- Per particle, in order:
  1. **Repulsion (squared distance, no `Math.sqrt`):** `dx = x - mx; dy = y - my; distSq = dx*dx + dy*dy`. Compare to a hoisted `mouseRadiusSq = mouseRadius*mouseRadius` (radius ~100-140 CSS px). If `distSq < mouseRadiusSq && distSq > 0`: `force = (mouseRadiusSq - distSq) / mouseRadiusSq`, then `vx += dx*force*REPEL; vy += dy*force*REPEL` (raw `dx,dy` give direction; magnitude tapers naturally, no normalization). Guard `distSq > 0` to avoid NaN. Park `mx,my` far offscreen when the cursor leaves the window.
  2. **Spring-back:** `sx = tx - x; sy = ty - y; vx += sx*SPRING; vy += sy*SPRING` with `SPRING` ~0.02-0.08 (`tx`/`ty` are the particle's target fields).
  3. **Friction:** `vx *= FRICTION; vy *= FRICTION` with `FRICTION` ~0.85-0.92 (applied once, after both forces).
  4. **Integrate:** `x += vx; y += vy`.
- Zero allocations in the loop: no new objects/arrays, no per-frame closures, no boxing/destructuring. Hoist every constant (`mouseRadiusSq`, `SPRING`, `FRICTION`, `REPEL`, `fillStyle`) above the loop. No `Math.sqrt`, no trig in this hot loop.
- **Render:** `ctx.clearRect(0, 0, cssWidth, cssHeight)` once per frame. Set `ctx.fillStyle` to the single accent color ONCE outside the loop. Draw the cheapest primitive — `ctx.fillRect(x, y, size, size)` (2-3px squares) over `ctx.arc()`. No `beginPath` per particle, no `shadowBlur`, no gradients, no per-particle `globalAlpha` (also enforces the no-glow design rule). Prefer fusing update + render into ONE for-loop pass for cache locality.
- Prefer parallel `Float32Array`s for `x/y/tx/ty/vx/vy` when pushing toward the 8,000 ceiling; a flat object array of `{ x, y, tx, ty, vx, vy, char }` is acceptable at the 2,000-5,000 target band.

## 6. Cursor Trail Optimization

- Fixed pool of ~15 nodes (`TRAIL_LENGTH = 15`) created ONCE — 15 fixed-position DOM divs held in a ref array. NEVER append a DOM node per mousemove.
- Head (index 0) follows the ref-stored `{mx, my}`. Each subsequent node lerps toward the one ahead in the RAF loop:
  ```ts
  for (let i = 1; i < TRAIL_LENGTH; i++) {
    positions[i].x += (positions[i - 1].x - positions[i].x) * EASE;
    positions[i].y += (positions[i - 1].y - positions[i].y) * EASE;
  }
  ```
  with `EASE` ~0.3-0.5. Plain indexed for-loop, no allocations, no sqrt.
- Position every node with `element.style.transform = translate3d(${x}px, ${y}px, 0)` — GPU-composited, no layout/reflow. NEVER animate `top`/`left`/margins. Set `will-change: transform` once in CSS.
- Any size/opacity taper by index is a static per-node style set at creation, not recomputed per frame. Batch all transform writes inside the single RAF tick.

## 7. FloatingProjects Optimization

- Render exactly ONE DOM node per project — the node count is bounded by `projects.json` length (no pooling beyond the project list, no per-frame node creation).
- Position every node with `element.style.transform = translate3d(${x}px, ${y}px, 0)`. NEVER animate `top`/`left`/margins.
- Motion is a gentle drift plus squared-distance mouse repulsion read from a mouse ref (same `{mx, my}` ref pattern as §5 — no `Math.sqrt`, compare `distSq` to a hoisted `radiusSq`, `setState` never called on mousemove).
- The §3 `IntersectionObserver` pause applies: freeze the RAF when the section scrolls offscreen and restart once (guarded) when it returns. RAF plumbing goes through the shared `/src/lib/useRafLoop.ts` hook.
- Full cleanup on unmount / toggle-off: `cancelAnimationFrame(rafId)`, `observer.disconnect()`, and `removeEventListener` for every listener by the exact same reference.

## 8. Cleanup

- All setup lives in one `useEffect`. Its cleanup MUST:
  - `cancelAnimationFrame(rafId)`;
  - `observer.disconnect()` (AsciiCanvas);
  - `window.removeEventListener('mousemove', onMove)` by the exact same reference;
  - `window.removeEventListener('resize', onResize)` by the same reference, and clear any resize debounce timeout;
  - drop the particle array ref (null/empty) so the GC reclaims the objects/typed-arrays.
- Because each component is `next/dynamic { ssr: false }` and conditionally rendered, flipping the toggle back to Static Mode unmounts it and fires this cleanup. No RAF may keep ticking and no listener may leak after toggle-off.

## Verification (Phase 5)

Confirm each rule group before tagging `v1.0`:

1. **ASCII & particle count** — Log `points.length` after `parseAscii`; assert it lands in the 2,000-5,000 target band, never below the 2,000 floor, and never above the 8,000 hard ceiling. Confirm only non-whitespace cells produce points (spot-check a known blank region yields none).
2. **Dynamic import & SSR** — Load Static Mode with JS disabled (view-source): all content present, zero canvas. In DevTools Network, confirm the interactive chunks are fetched only on first toggle-on, not on initial load.
3. **IntersectionObserver** — Scroll the canvas offscreen; confirm the RAF stops (Performance profiler shows no frame work / flat CPU). Scroll back; confirm exactly one loop restarts (no double-start).
4. **DPR cap** — On a high-DPI display, log the computed `dpr`; assert `<= 1.5`. Confirm `devicePixelRatio` is never read inside the loop (code audit) and that resize recomputes backing store + transform + targets.
5. **Physics loop** — Code-audit the RAF path for zero `Math.sqrt` and zero trig in `AsciiCanvas`, plain indexed for-loops only, hoisted constants, and no per-frame allocations. Verify a smooth frame rate at target particle count.
6. **Cursor trail** — Inspect the DOM: exactly `TRAIL_LENGTH` nodes exist and the count never grows on mousemove. Confirm positioning uses `translate3d` (no `top`/`left` in the Layout panel).
7. **FloatingProjects** — Inspect the DOM: exactly one node per `projects.json` entry exists and the count never grows on mousemove. Confirm positioning uses `translate3d` (no `top`/`left`), that repulsion uses squared distance (no `Math.sqrt`, code audit), and that the §3 IntersectionObserver pause freezes/restarts its RAF via `/src/lib/useRafLoop.ts`.
8. **Cleanup / no leaks** — Toggle Interactive on/off repeatedly (~10x); confirm listener count and active RAF count return to baseline and the JS heap shows no monotonic growth (Chrome Memory timeline). Confirm toggling to Static and scrolling offscreen both stop all RAFs (zero idle animation CPU).
9. **Static Mode budget** — Record a Lighthouse run; Performance must be `>= 95` (SEO/Accessibility likewise per Phase 2 baseline). `next build` and `tsc --noEmit` pass with 0 TypeScript errors.

### Results — v1.0 (recorded 2026-07-16)

Verified against the production build (`bun run build` + `next start`):

- **Lighthouse, Static Mode:** Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100** (all ≥ 95). FCP 0.8s, LCP 1.8s, TBT 50ms, CLS 0.
- **Compliance audit — all 9 rule groups PASS** (adversarial, file:line evidence): non-whitespace-only parsing + stride sampling (`ascii.txt` → 2,616 points, in band); dynamic `ssr:false` in the client shell, referenced only in the interactive branch, `page.tsx` stays a Server Component; DPR capped at 1.5 with `setTransform` once per resize; zero `Math.sqrt`/trig in any per-frame loop, plain for-loops, hoisted constants, single `fillStyle`, `fillRect` squares, no glow; fixed 15-node trail + one bubble per project, all `translate3d`; full teardown (RAF + listeners-by-ref + `observer.disconnect`) on unmount/toggle-off.
- **Dynamic import & SSR (DevTools Network):** on initial `/` load `/data/ascii.txt` is **not** requested (interactive tree unmounted); it loads (GET 200) only on first toggle-on.
- **Toggle cycle:** static ↔ interactive both directions with 0 app console errors; the interactive tree unmounts cleanly on toggle-off (canvas removed).
- **IntersectionObserver pause:** reviewed — cancels the RAF offscreen, restarts exactly one loop on re-entry (guarded against double-start), disconnects on unmount; `CursorTrail` (no target) keeps running while interactive.

Two low-severity, non-triggered robustness notes on `useRafLoop` were accepted as-is: the container refs are stable and populated before the effect runs, so neither the stale-node nor the null-at-effect case can occur in this codebase.
