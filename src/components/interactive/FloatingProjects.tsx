"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { projects } from "@/data";
import { useRafLoop } from "@/lib/useRafLoop";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * FloatingProjects — one gently drifting bubble per project (interactive mode).
 *
 * Perf invariants (OPTIMIZATIONS.md §7):
 * - Exactly ONE DOM node per project; no pooling, no per-frame node creation.
 * - Positioned only with `transform: translate3d(x, y, 0)` (never top/left).
 * - Mouse read from a ref via a passive listener; squared-distance repulsion
 *   compared to a hoisted radius² — NO Math.sqrt, NO setState per frame.
 * - Honors prefers-reduced-motion: reduce (static seed placement, loop off).
 * - Full listener/observer cleanup on unmount.
 */

const DEFAULT_RADIUS = 56; // CSS px
const DRIFT = 0.12; // baseline drift speed (px/frame)
const RETURN = 0.02; // steer velocity back toward drift baseline (also damps)
const REPEL = 0.4; // mouse repulsion strength
const MOUSE_RADIUS = 130; // CSS px
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS; // hoisted, no sqrt
const MAX_SPEED = 3; // per-axis velocity clamp (px/frame)
const BOUNCE = 0.6; // edge restitution
const PARKED = -99999; // mouse position when cursor is outside the container
const GOLDEN_ANGLE = 2.399963229728653; // spreads drift directions evenly

interface BubbleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Drift {
  dvx: number;
  dvy: number;
}

export default function FloatingProjects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const stateRef = useRef<BubbleState[]>([]);
  const driftRef = useRef<Drift[]>([]);
  const mouseRef = useRef<{ mx: number; my: number }>({
    mx: PARKED,
    my: PARKED,
  });
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const seededRef = useRef(false);

  const reducedMotion = usePrefersReducedMotion();

  // Per-bubble radius resolved once (projects is a stable import).
  const radii = useMemo(
    () => projects.map((p) => p.bubble?.radius ?? DEFAULT_RADIUS),
    [],
  );

  // ---- Physics tick (runs only while the loop is enabled) -----------------
  const onFrame = useCallback(() => {
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;

    const st = stateRef.current;
    const dr = driftRef.current;
    const els = bubbleRefs.current;
    const mx = mouseRef.current.mx;
    const my = mouseRef.current.my;
    const len = projects.length;

    for (let i = 0; i < len; i++) {
      const s = st[i];
      const d = dr[i];
      if (!s || !d) continue;

      const r = radii[i];
      const dia = r + r;
      const maxX = w - dia > 0 ? w - dia : 0;
      const maxY = h - dia > 0 ? h - dia : 0;

      let x = s.x;
      let y = s.y;
      let vx = s.vx;
      let vy = s.vy;
      let dvx = d.dvx;
      let dvy = d.dvy;

      // Soft steering: relax velocity back toward the drift baseline. This
      // sustains gentle drift and also damps any repulsion impulse over time.
      vx += (dvx - vx) * RETURN;
      vy += (dvy - vy) * RETURN;

      // Mouse repulsion — squared distance from bubble center, no Math.sqrt.
      const cx = x + r;
      const cy = y + r;
      const ddx = cx - mx;
      const ddy = cy - my;
      const distSq = ddx * ddx + ddy * ddy;
      if (distSq < MOUSE_RADIUS_SQ && distSq > 0) {
        const force = (MOUSE_RADIUS_SQ - distSq) / MOUSE_RADIUS_SQ;
        vx += ddx * force * REPEL;
        vy += ddy * force * REPEL;
      }

      // Per-axis speed clamp (avoids a magnitude sqrt).
      if (vx > MAX_SPEED) vx = MAX_SPEED;
      else if (vx < -MAX_SPEED) vx = -MAX_SPEED;
      if (vy > MAX_SPEED) vy = MAX_SPEED;
      else if (vy < -MAX_SPEED) vy = -MAX_SPEED;

      // Integrate.
      x += vx;
      y += vy;

      // Soft bounce off container edges; flip drift so it eases away.
      if (x < 0) {
        x = 0;
        vx = -vx * BOUNCE;
        dvx = -dvx;
      } else if (x > maxX) {
        x = maxX;
        vx = -vx * BOUNCE;
        dvx = -dvx;
      }
      if (y < 0) {
        y = 0;
        vy = -vy * BOUNCE;
        dvy = -dvy;
      } else if (y > maxY) {
        y = maxY;
        vy = -vy * BOUNCE;
        dvy = -dvy;
      }

      s.x = x;
      s.y = y;
      s.vx = vx;
      s.vy = vy;
      d.dvx = dvx;
      d.dvy = dvy;

      const el = els[i];
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [radii]);

  useRafLoop(onFrame, !reducedMotion);

  // ---- Setup: measure, seed, listeners (layout effect avoids a flash) -----
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const writeTransforms = (): void => {
      const st = stateRef.current;
      const els = bubbleRefs.current;
      for (let i = 0; i < st.length; i++) {
        const s = st[i];
        const node = els[i];
        if (s && node)
          node.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      }
    };

    const clampAll = (): void => {
      const { w, h } = sizeRef.current;
      const st = stateRef.current;
      for (let i = 0; i < st.length; i++) {
        const s = st[i];
        if (!s) continue;
        const dia = radii[i] + radii[i];
        const maxX = w - dia > 0 ? w - dia : 0;
        const maxY = h - dia > 0 ? h - dia : 0;
        if (s.x < 0) s.x = 0;
        else if (s.x > maxX) s.x = maxX;
        if (s.y < 0) s.y = 0;
        else if (s.y > maxY) s.y = maxY;
      }
    };

    const seed = (): void => {
      const { w, h } = sizeRef.current;
      const st = stateRef.current;
      const dr = driftRef.current;
      const len = projects.length;
      const cols = Math.max(1, Math.ceil(Math.sqrt(len)));
      const rows = Math.max(1, Math.ceil(len / cols));

      for (let i = 0; i < len; i++) {
        const r = radii[i];
        const dia = r + r;
        const maxX = w - dia > 0 ? w - dia : 0;
        const maxY = h - dia > 0 ? h - dia : 0;
        const b = projects[i].bubble;

        let cx: number;
        let cy: number;
        if (
          b &&
          typeof b.seedX === "number" &&
          typeof b.seedY === "number"
        ) {
          cx = b.seedX * w;
          cy = b.seedY * h;
        } else {
          // Deterministic grid spread when no seed hint is given.
          const col = i % cols;
          const row = Math.floor(i / cols);
          cx = ((col + 0.5) / cols) * w;
          cy = ((row + 0.5) / rows) * h;
        }

        let x = cx - r;
        let y = cy - r;
        if (x < 0) x = 0;
        else if (x > maxX) x = maxX;
        if (y < 0) y = 0;
        else if (y > maxY) y = maxY;

        st[i] = { x, y, vx: 0, vy: 0 };
        const angle = i * GOLDEN_ANGLE;
        dr[i] = { dvx: Math.cos(angle) * DRIFT, dvy: Math.sin(angle) * DRIFT };
      }
    };

    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      if (!seededRef.current) {
        if (rect.width > 0 && rect.height > 0) {
          seed();
          seededRef.current = true;
          writeTransforms();
        }
      } else {
        clampAll();
        // While the loop is off, keep static placement in sync on resize.
        if (reducedMotion) writeTransforms();
      }
    };

    // Mouse position in container-local coords; park it when outside bounds.
    const onMove = (e: MouseEvent): void => {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) {
        mouseRef.current.mx = PARKED;
        mouseRef.current.my = PARKED;
      } else {
        mouseRef.current.mx = mx;
        mouseRef.current.my = my;
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // Measure now (pre-paint) and on resize.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
    };
  }, [radii, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden={false}
    >
      {projects.map((p, i) => {
        const dia = radii[i] + radii[i];
        return (
          <a
            key={p.id}
            ref={(node) => {
              bubbleRefs.current[i] = node;
            }}
            href={p.liveUrl ?? p.repoUrl ?? "#"}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={p.title}
            title={p.title}
            style={{ width: dia, height: dia, willChange: "transform" }}
            className="pointer-events-auto absolute left-0 top-0 flex select-none items-center justify-center rounded-full border border-border bg-bg-elevated px-2 text-center text-[11px] font-medium leading-tight text-accent no-underline transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none"
          >
            {p.title}
          </a>
        );
      })}
    </div>
  );
}
