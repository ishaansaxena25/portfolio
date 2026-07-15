# SKILLS — Technical Patterns & Code Conventions

The binding code-conventions reference for this project. Every pattern here is
vanilla TypeScript + React + Canvas 2D + `requestAnimationFrame`. There is **no
GSAP, no Zustand, no animation library, and no external state library** anywhere
in this repo — the abandoned patterns referenced in `portfolio.md` do not apply.
State is a single `isInteractive` boolean in `app/page.tsx`; animation is hand-rolled.

All snippets are idiomatic for this codebase — copy the shape, not necessarily
the exact constants (tune constants against `OPTIMIZATIONS.md`).

---

## 1. TextScramble — vanilla-TS class (`/src/lib/textScramble.ts`)

Framework-agnostic. No React, no DOM library. Drives per-character
randomize → resolve on a single `requestAnimationFrame` loop and resolves a
`Promise` on completion. Owns its own cleanup.

```ts
const CHARS = "!<>-_\\/[]{}—=+*^?#________";

interface Queue {
  from: string;
  to: string;
  start: number; // frame index this char begins resolving
  end: number;   // frame index this char locks to its final glyph
  char?: string; // currently displayed scramble glyph
}

export class TextScramble {
  private el: HTMLElement;
  private queue: Queue[] = [];
  private frame = 0;
  private rafId = 0;
  private resolve!: () => void;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  setText(newText: string): Promise<void> {
    const oldText = this.el.textContent ?? "";
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((res) => (this.resolve = res));

    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] ?? "";
      const to = newText[i] ?? "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.rafId);
    this.frame = 0;
    this.update();
    return promise;
  }

  private update = (): void => {
    let output = "";
    let complete = 0;

    for (let i = 0; i < this.queue.length; i++) {
      const q = this.queue[i];
      if (this.frame >= q.end) {
        complete++;
        output += q.to;
      } else if (this.frame >= q.start) {
        if (!q.char || Math.random() < 0.28) {
          q.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        output += q.char;
      } else {
        output += q.from;
      }
    }

    this.el.textContent = output;

    if (complete === this.queue.length) {
      this.resolve();
      return; // loop ends — no lingering rAF
    }
    this.frame++;
    this.rafId = requestAnimationFrame(this.update);
  };

  // Called by React on unmount to guarantee no orphaned frame.
  stop(): void {
    cancelAnimationFrame(this.rafId);
  }
}
```

Conventions: bound arrow method (`update`) so `this` survives inside rAF; the
loop **returns** (does not re-request) on completion; `stop()` exists purely for
the React wrapper's cleanup.

---

## 2. ScrambleText — React wrapper (`/src/components/ui/ScrambleText.tsx`)

The one global heading primitive, used in **both** modes. `"use client"`. It
instantiates `TextScramble` once against a ref and triggers on `onMouseEnter`
(and optionally on mount). Renders the tag given by `as`.

```tsx
"use client";
import { useEffect, useRef } from "react";
import { TextScramble } from "@/lib/textScramble";
import type { ScrambleTextProps } from "@/lib/types";

export default function ScrambleText({
  text,
  as: Tag = "span",
  className,
  trigger = "hover",
}: ScrambleTextProps) {
  const ref = useRef<HTMLElement>(null);
  const fx = useRef<TextScramble | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = new TextScramble(ref.current);
    fx.current = instance;
    if (trigger === "mount" || trigger === "both") {
      void instance.setText(text);
    }
    return () => instance.stop(); // cancelAnimationFrame on unmount
  }, [text, trigger]);

  const onEnter =
    trigger === "hover" || trigger === "both"
      ? () => void fx.current?.setText(text)
      : undefined;

  // Tag is a dynamic intrinsic element; suspender-free cast keeps it typed.
  const El = Tag as keyof JSX.IntrinsicElements;
  return (
    // @ts-expect-error dynamic intrinsic tag + ref union is safe here
    <El ref={ref} className={className} onMouseEnter={onEnter}>
      {text}
    </El>
  );
}
```

Conventions: the initial SSR/first paint renders the **plain final `text`** (so
Static Mode is fully SEO-readable and shift-free); scramble only mutates
`textContent` after hydration on hover/mount. Default `trigger` is `"hover"`.

---

## 3. Canvas particle physics (`/src/components/hero/AsciiCanvas.tsx`)

Typed `Particle`, plain indexed `for`-loops, **squared-distance** repulsion
(never `Math.sqrt`, never trig in the hot loop), zero allocations per frame, all
constants hoisted. `fillStyle` set once. Prefer `fillRect` over `arc`.

```ts
interface Particle {
  x: number; y: number;     // current CSS-px position (ctx pre-scaled by DPR)
  tx: number; ty: number;   // home target from parsed ascii coord
  vx: number; vy: number;   // velocity
  char: string;             // source glyph (optional to draw)
}

// Hoisted constants — never read/allocate these inside the loop.
const REPEL = 0.35;
const SPRING = 0.045;
const FRICTION = 0.88;
const MOUSE_RADIUS = 120;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const SIZE = 2; // px square

function frame(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  mx: number,
  my: number,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);        // CSS-px dims; context is pre-scaled
  ctx.fillStyle = "#4ade80";        // single accent, set ONCE outside loop

  const len = particles.length;
  for (let i = 0; i < len; i++) {   // plain indexed for-loop, no forEach
    const p = particles[i];

    // (1) repulsion — squared distance only
    const dx = p.x - mx;
    const dy = p.y - my;
    const distSq = dx * dx + dy * dy;
    if (distSq < MOUSE_RADIUS_SQ && distSq > 0) {
      const force = (MOUSE_RADIUS_SQ - distSq) / MOUSE_RADIUS_SQ;
      p.vx += dx * force * REPEL;    // raw dx/dy give direction; no normalize
      p.vy += dy * force * REPEL;
    }

    // (2) spring back toward home target
    p.vx += (p.tx - p.x) * SPRING;
    p.vy += (p.ty - p.y) * SPRING;

    // (3) friction, then (4) integrate
    p.vx *= FRICTION;
    p.vy *= FRICTION;
    p.x += p.vx;
    p.y += p.vy;

    // fused render — cheapest primitive, no beginPath per particle
    ctx.fillRect(p.x, p.y, SIZE, SIZE);
  }
}
```

Conventions: mouse lives in a **ref** written by a passive `mousemove` listener
(never `setState` per move); when the pointer leaves, park `mx/my` far
offscreen so nothing sits inside the radius. Update + render are fused into one
traversal.

---

## 4. parseAscii — utility contract (`/src/lib/parseAscii.ts`)

Isomorphic pure function, no DOM. Scans the raw text row-major, emits an
`AsciiPoint` for every **non-whitespace** cell, and applies an integer stride so
the result never exceeds `maxParticles` (target particle count **2,000–5,000**,
acceptance floor **≥ 2,000**, hard ceiling **8,000** — stride-sample denser
sources down to ≤ 8,000). The source grid is up to ~100 columns × ~50 rows.
Coordinate → screen mapping is **not** done here — it belongs to `AsciiCanvas`
on mount/resize.

```ts
import type { AsciiPoint } from "@/lib/types";

interface ParseResult {
  points: AsciiPoint[];
  cols: number; // measured max line length
  rows: number; // measured line count
}

export function parseAscii(raw: string, maxParticles = 8000): ParseResult {
  const lines = raw.replace(/\r/g, "").split("\n");
  const rows = lines.length;
  let cols = 0;

  // First pass: measure width + count non-whitespace for the stride.
  let nonSpace = 0;
  for (let r = 0; r < rows; r++) {
    const line = lines[r];
    if (line.length > cols) cols = line.length;
    for (let c = 0; c < line.length; c++) {
      if (line[c].trim() !== "") nonSpace++;
    }
  }

  const stride = Math.max(1, Math.ceil(nonSpace / maxParticles));

  // Second pass: keep every stride-th non-space cell.
  const points: AsciiPoint[] = [];
  let seen = 0;
  for (let r = 0; r < rows; r++) {
    const line = lines[r];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch.trim() === "") continue;
      if (seen++ % stride === 0) points.push({ char: ch, col: c, row: r });
    }
  }

  return { points, cols, rows };
}
```

Contract: `parseAscii(raw: string, maxParticles = 8000): { points: AsciiPoint[];
cols: number; rows: number }`, where `AsciiPoint = { char; col; row }` in **grid
space** for non-whitespace cells only, and there is **no viewport scaling**.
Input is the fetched `ascii.txt` string; output is grid-space points plus grid
extent. `stride = 1` when the art is under the cap (no upsampling). The file is
authored/served at `/public/data/ascii.txt`; fetch happens client-side only, in
`InteractiveHero`'s mount effect:
`const raw = await fetch("/data/ascii.txt").then((r) => r.text());`

---

## 5. next/dynamic with `ssr: false` (`/src/app/page.tsx`)

Every heavy client component is **default-exported** and imported at module
scope via `next/dynamic` with `{ ssr: false }`, then referenced only inside the
`isInteractive === true` branch. This keeps all canvas/physics JS out of the
Static Mode payload until the toggle flips.

```tsx
"use client";
import dynamic from "next/dynamic";

const DynamicInteractiveHero = dynamic(
  () => import("@/components/hero/InteractiveHero"),
  {
    ssr: false,
    // Explicit lightweight fallback (or pass a documented `loading: () => null`).
    loading: () => <div aria-hidden className="h-screen" />,
  },
);
const CursorTrail = dynamic(
  () => import("@/components/interactive/CursorTrail"),
  { ssr: false },
);
const FloatingProjects = dynamic(
  () => import("@/components/interactive/FloatingProjects"),
  { ssr: false },
);
```

Conventions: `ssr: false` requires the consuming file be `"use client"`.
Interactive components use `export default`. Do not reference the dynamic names
outside the interactive branch, or their chunks get pulled into the first load.

---

## 6. useRafLoop / IntersectionObserver pause hook

Reusable hook gating a rAF loop on element visibility. `cancelAnimationFrame`
the instant the element leaves the viewport; restart on re-entry, guarded
against double-start. This is the mandated pause mechanism (in addition to full
teardown on toggle-off).

```ts
import { useEffect, type RefObject } from "react";

export function useRafLoop(
  ref: RefObject<Element>,
  loop: (dt: number) => void,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let last = performance.now();
    let running = false;

    const tick = (now: number) => {
      loop(now - last);
      last = now;
      rafId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return; // guard double-start
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(el);

    return () => {
      stop();
      io.disconnect();
    };
  }, [ref, loop]);
}
```

Conventions: pass a **stable** `loop` (memoize with `useCallback` or a ref) so
the effect does not re-subscribe every render. Never read `devicePixelRatio`
inside `loop`.

---

## 7. DPR-aware canvas sizing

Cap DPR at `1.5`. Size the backing store to `inner*×dpr`, set CSS size back to
CSS px, and apply the transform **once** per resize so all physics/render math
stays in CSS pixels. Recompute in a debounced resize handler alongside particle
targets — never per frame.

```ts
function sizeCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // hard cap
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS px; DPR handled here
  return ctx;
}
```

Debounced resize skeleton (recomputes DPR + targets, clears its own timer on
cleanup):

```ts
let t: ReturnType<typeof setTimeout>;
const onResize = () => {
  clearTimeout(t);
  t = setTimeout(() => {
    const ctx = sizeCanvas(canvas);
    recomputeTargets(ctx); // remap grid → screen for every particle
  }, 150);
};
```

---

## 8. Strict RAF + listener cleanup in `useEffect`

Every animated component does all setup in one effect whose cleanup cancels the
frame, removes each listener **by the same reference**, disconnects observers,
clears debounce timers, and releases the particle array so the GC can reclaim
thousands of objects. Toggling to Static Mode unmounts the component and must
leave zero lingering loops or listeners.

```ts
useEffect(() => {
  const ctx = sizeCanvas(canvas);
  let particles: Particle[] = buildParticles(points);
  let rafId = 0;

  const mouse = { x: -9999, y: -9999 }; // parked offscreen
  const onMove = (e: MouseEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  let resizeTimer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => recomputeTargets(sizeCanvas(canvas)), 150);
  };

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("resize", onResize);

  const loop = () => {
    frame(ctx, particles, mouse.x, mouse.y, window.innerWidth, window.innerHeight);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);                       // stop the loop
    window.removeEventListener("mousemove", onMove);   // same reference
    window.removeEventListener("resize", onResize);    // same reference
    clearTimeout(resizeTimer);                         // clear debounce
    particles = [];                                    // release for GC
  };
}, [points]);
```

Rule: named handler functions (not inline arrows in `addEventListener`) so
`removeEventListener` targets the same reference. One effect owns one loop.

---

## 8b. FloatingProjects pattern (`/src/components/interactive/FloatingProjects.tsx`)

**DOM** nodes — exactly **one per project** (count bounded by `projects.json`
length), not a canvas. Each node is positioned with `transform: translate3d`
(**never** `top`/`left`). Gentle idle drift plus **squared-distance** mouse
repulsion read from a **mouse ref** (written by a passive `mousemove`, never
`setState` per move). The `useRafLoop` IntersectionObserver pause applies. Full
cleanup on unmount / toggle-off: `cancelAnimationFrame` + `removeEventListener`
by the same reference.

```ts
// one node per project; positions/velocities in parallel arrays or a ref
const nodes: { el: HTMLElement; x: number; y: number; vx: number; vy: number }[];
const mouse = { x: -9999, y: -9999 }; // parked offscreen, written by passive move

function driftFrame() {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    n.vx += (Math.random() - 0.5) * DRIFT; // gentle wander
    n.vy += (Math.random() - 0.5) * DRIFT;

    const dx = n.x - mouse.x;
    const dy = n.y - mouse.y;
    const distSq = dx * dx + dy * dy;      // squared distance — no sqrt/trig
    if (distSq < REPEL_RADIUS_SQ && distSq > 0) {
      const force = (REPEL_RADIUS_SQ - distSq) / REPEL_RADIUS_SQ;
      n.vx += dx * force * REPEL;
      n.vy += dy * force * REPEL;
    }

    n.vx *= FRICTION;
    n.vy *= FRICTION;
    n.x += n.vx;
    n.y += n.vy;
    n.el.style.transform = `translate3d(${n.x}px, ${n.y}px, 0)`; // never top/left
  }
}
```

---

## 9. TypeScript interface discipline

- All data-model and prop interfaces live in `/src/lib/types.ts` (`Profile`,
  `SocialLink`, `TechCategory`, `TechItem`, `Project`, `ProjectBubbleMeta`,
  `Achievement`, `AsciiPoint`, `Particle`, `TrailNode`, `ScrambleTextProps`).
- **No `any`.** JSON imports are typed at the boundary; components receive typed
  props, never raw `unknown`/`any`.
- Type JSON on import:

```ts
import raw from "@/data/projects.json";
import type { Project } from "@/lib/types";

const projects = raw as Project[]; // single assertion at the data boundary
```

- Use string-literal unions for closed sets (`level: "core" | "proficient" |
  "familiar"`, `trigger: "hover" | "mount" | "both"`), not loose `string`.
- Mark genuinely optional fields with `?` (`year?`, `repoUrl?`, `bubble?`) —
  match the canonical spec exactly.
- Prefer `interface` for object shapes; runtime-only types (`Particle`,
  `TrailNode`) are declared in `types.ts` but never serialized.
- Component prop types are explicit interfaces or the shared `*Props` types —
  no inline anonymous prop objects for anything reused.

---

## 10. Tailwind arbitrary-value guidance

- Consume **theme tokens first** — the single accent color, monospace font
  stack, and modular type scale defined in the Tailwind config (`text-accent`,
  `font-mono`, `text-h1`, etc.). Reach for arbitrary values only when no token
  fits.
- When you must, use arbitrary values for one-off layout/precision numbers, not
  colors: `w-[80ch]`, `leading-[1.15]`, `grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]`.
- **Never** hard-code the accent as an arbitrary hex (`bg-[#4ade80]`) — define
  it once as a token and reference `bg-accent` so the "exactly one accent color"
  rule stays enforceable. The canvas is the only place the raw hex appears
  (`ctx.fillStyle`), ideally read from a CSS custom property.
- Positioned/animated interactive elements use `transform` utilities +
  `will-change-transform`; drive live motion with inline
  `style={{ transform: \`translate3d(${x}px, ${y}px, 0)\` }}` — never animate
  `top`/`left` or Tailwind margin utilities per frame.
- Do not use arbitrary values to reintroduce banned patterns: no
  `bg-[radial-gradient(...)]` glows, no `backdrop-blur`, no gradient text, no
  translucent glass borders, no colored-dot status pills, no
  `uppercase tracking-[0.2em]` micro-labels. Sentence-case headings, flat solid
  backgrounds, 1px borders only.
