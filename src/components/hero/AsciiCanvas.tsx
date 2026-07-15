"use client";

/**
 * AsciiCanvas — the interactive-mode ASCII particle field.
 *
 * Renders one <canvas> filling its (positioned) parent. Each incoming
 * AsciiPoint (grid space) becomes one physics Particle whose target (tx/ty)
 * is the centre of its monospace cell in CSS px. Particles spring toward
 * their targets and are pushed away from the cursor.
 *
 * All per-frame state (particles, mouse, ctx, dpr, css size) lives in refs so
 * the RAF loop and the passive mousemove listener never trigger a React render.
 * The physics loop obeys the binding perf invariants in OPTIMIZATIONS.md §4/§5:
 * squared-distance repulsion (no Math.sqrt), plain indexed for-loop, all
 * constants hoisted, zero per-frame allocations, single accent fillStyle, DPR
 * capped at 1.5. prefers-reduced-motion draws one static frame and never loops.
 */

import { useCallback, useEffect, useRef } from "react";
import type { AsciiPoint } from "@/lib/types";
import { useRafLoop } from "@/lib/useRafLoop";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Runtime physics particle. Declared locally per the locked shared signature. */
interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  char: string;
}

interface AsciiCanvasProps {
  points: AsciiPoint[];
  cols: number;
  rows: number;
}

// --- Hoisted physics/render constants (never touched per particle) ----------
const SPRING = 0.08;
const FRICTION = 0.86;
const REPEL = 0.6;
const MOUSE_RADIUS = 90;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const SIZE = 1.6;
const ACCENT = "#4ade80";
/** Monospace cell aspect: a cell is ~0.5 as wide as it is tall. */
const CELL_ASPECT = 0.5;
/** Parked-cursor sentinel — far enough that no particle is ever in range. */
const MOUSE_PARKED = -9999;
const RESIZE_DEBOUNCE_MS = 150;

export default function AsciiCanvas({ points, cols, rows }: AsciiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({
    x: MOUSE_PARKED,
    y: MOUSE_PARKED,
  });
  // CSS-px dimensions of the canvas; used for clearRect (all math in CSS px).
  const cssWRef = useRef(0);
  const cssHRef = useRef(0);

  // Correct on the first client render (no flash), so a reduced-motion user
  // gets the static frame immediately and the loop never starts.
  const reducedMotion = usePrefersReducedMotion();

  /** Clear + paint every particle once at its resting target (static path). */
  const drawStatic = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const ps = particlesRef.current;
    const len = ps.length;
    ctx.clearRect(0, 0, cssWRef.current, cssHRef.current);
    ctx.fillStyle = ACCENT;
    for (let i = 0; i < len; i++) {
      const p = ps[i];
      ctx.fillRect(p.tx, p.ty, SIZE, SIZE);
    }
  }, []);

  /**
   * Recompute backing store, transform, and grid->screen targets. Called on
   * mount and (debounced) whenever the parent resizes. Builds the particle
   * array on first run; on later runs it only updates tx/ty so existing
   * particles spring smoothly to their new targets.
   */
  const sizeAndMap = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = containerRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !parent || !ctx) return;

    const cssW = parent.clientWidth;
    const cssH = parent.clientHeight;
    if (cssW === 0 || cssH === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cssWRef.current = cssW;
    cssHRef.current = cssH;

    // Grid -> screen mapping (CSS px). Cells are CELL_ASPECT as wide as tall.
    const cellH = Math.min(cssW / cols / CELL_ASPECT, cssH / rows);
    const cellW = cellH * CELL_ASPECT;
    const artW = cols * cellW;
    const artH = rows * cellH;
    const offsetX = (cssW - artW) / 2;
    const offsetY = (cssH - artH) / 2;

    const ps = particlesRef.current;
    const rebuild = ps.length !== points.length;

    if (rebuild) {
      const next: Particle[] = new Array(points.length);
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const tx = offsetX + pt.col * cellW + cellW / 2;
        const ty = offsetY + pt.row * cellH + cellH / 2;
        next[i] = { x: tx, y: ty, tx, ty, vx: 0, vy: 0, char: pt.char };
      }
      particlesRef.current = next;
    } else {
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const p = ps[i];
        p.tx = offsetX + pt.col * cellW + cellW / 2;
        p.ty = offsetY + pt.row * cellH + cellH / 2;
      }
    }

    // Reduced motion: no loop runs, so paint the resting frame ourselves.
    if (reducedMotion) drawStatic();
  }, [points, cols, rows, drawStatic, reducedMotion]);

  /** One RAF tick: repulsion -> spring -> friction -> integrate -> draw. */
  const frame = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const ps = particlesRef.current;
    const len = ps.length;
    const m = mouseRef.current;
    const mx = m.x;
    const my = m.y;

    ctx.clearRect(0, 0, cssWRef.current, cssHRef.current);
    ctx.fillStyle = ACCENT;

    for (let i = 0; i < len; i++) {
      const p = ps[i];

      // 1. Repulsion — squared distance only, no Math.sqrt.
      const dx = p.x - mx;
      const dy = p.y - my;
      const distSq = dx * dx + dy * dy;
      if (distSq < MOUSE_RADIUS_SQ && distSq > 0) {
        const force = (MOUSE_RADIUS_SQ - distSq) / MOUSE_RADIUS_SQ;
        p.vx += dx * force * REPEL;
        p.vy += dy * force * REPEL;
      }

      // 2. Spring back to target.
      p.vx += (p.tx - p.x) * SPRING;
      p.vy += (p.ty - p.y) * SPRING;

      // 3. Friction.
      p.vx *= FRICTION;
      p.vy *= FRICTION;

      // 4. Integrate.
      p.x += p.vx;
      p.y += p.vy;

      ctx.fillRect(p.x, p.y, SIZE, SIZE);
    }
  }, []);

  // Gate the loop on visibility: idle when the canvas is scrolled off-screen.
  useRafLoop(frame, !reducedMotion, containerRef);

  // Setup: context, initial map, resize observation, mouse listeners.
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = containerRef.current;
    if (!canvas || !parent) return;

    ctxRef.current = canvas.getContext("2d");

    sizeAndMap();

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      if (resizeTimer !== undefined) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sizeAndMap, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(parent);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouseRef.current.x = MOUSE_PARKED;
      mouseRef.current.y = MOUSE_PARKED;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      observer.disconnect();
      if (resizeTimer !== undefined) clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      // useRafLoop tears down its own RAF. Drop particles for the GC.
      particlesRef.current = [];
    };
  }, [sizeAndMap]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
