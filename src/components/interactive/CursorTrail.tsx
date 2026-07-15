"use client";

import { useEffect, useRef } from "react";
import { useRafLoop } from "@/lib/useRafLoop";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * CursorTrail — a fixed pool of trailing dots that chase the cursor.
 *
 * OPTIMIZATIONS.md invariants honored here:
 * - Fixed pool of N nodes created ONCE; no DOM node is ever appended per move.
 * - Mouse target and node positions live in refs; NO setState on mousemove or
 *   per frame. React only re-renders for the reduced-motion gate.
 * - Movement is applied via `transform: translate3d(x,y,0)` only, with
 *   `will-change: transform` set once. Never top/left/margins-for-motion.
 * - Plain indexed for-loop in the frame; all lerp constants hoisted; zero
 *   per-frame allocations.
 * - prefers-reduced-motion: reduce -> render nothing (no idle trailing motion).
 * - Cleanup removes the exact same listener reference; useRafLoop stops the RAF.
 */

const N = 15;
const EASE = 0.35;

// Per-node visual constants, computed ONCE at module load (hoisted; never
// recomputed per frame). Size and opacity taper down the length of the trail.
const SIZES: number[] = [];
const OPACITIES: number[] = [];
for (let i = 0; i < N; i++) {
  const t = i / (N - 1);
  SIZES.push(10 - t * 7); // 10px head -> 3px tail
  OPACITIES.push(0.6 - t * 0.55); // 0.6 head -> ~0.05 tail
}

export default function CursorTrail() {
  const reducedMotion = usePrefersReducedMotion();

  // Live element handles for the pooled dots.
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Node positions (CSS px). Start off-screen so nothing shows until first move.
  const posRef = useRef<{ x: number; y: number }[]>(
    Array.from({ length: N }, () => ({ x: -100, y: -100 })),
  );
  // Mouse target, updated by a passive listener; starts off-screen.
  const mouseRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });

  // Track the cursor via a single passive listener; cleanup by same reference.
  useEffect(() => {
    if (reducedMotion) return;
    const handleMove = (e: MouseEvent): void => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reducedMotion]);

  // Per-frame: head lerps toward the mouse, each node lerps toward the one
  // ahead of it. Plain for-loop, no allocations, transform-only writes.
  useRafLoop(() => {
    const dots = dotRefs.current;
    const pos = posRef.current;
    let px = mouseRef.current.x;
    let py = mouseRef.current.y;
    for (let i = 0; i < N; i++) {
      const p = pos[i];
      p.x += (px - p.x) * EASE;
      p.y += (py - p.y) * EASE;
      const el = dots[i];
      if (el !== null) {
        // Center the dot on its node position via the transform only (no margins).
        const half = SIZES[i] / 2;
        el.style.transform = `translate3d(${p.x - half}px, ${p.y - half}px, 0)`;
      }
      px = p.x;
      py = p.y;
    }
  }, !reducedMotion);

  // Suppress the idle trailing motion entirely for reduced-motion users.
  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {SIZES.map((size, i) => (
        <span
          key={i}
          ref={(el) => {
            dotRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 rounded-full bg-accent"
          style={{
            width: size,
            height: size,
            opacity: OPACITIES[i],
            willChange: "transform",
            // Centering is folded into the per-frame translate3d (no margins).
            transform: "translate3d(-100px, -100px, 0)",
          }}
        />
      ))}
    </div>
  );
}
