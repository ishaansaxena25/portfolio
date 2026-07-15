import { useEffect, useRef, type RefObject } from "react";

/**
 * Drives a requestAnimationFrame loop that calls `onFrame(now)` every frame
 * while it is running. The callback is stored in a ref, so changing its identity
 * between renders never restarts the loop — only `enabled` (or unmount) does.
 *
 * Performance (OPTIMIZATIONS.md §3): if `targetRef` is given, an
 * IntersectionObserver gates the loop on visibility — the RAF is cancelled while
 * the element is off-screen and restarted when it scrolls back in, so an idle or
 * scrolled-away canvas burns zero CPU. Without `targetRef` the loop runs whenever
 * `enabled` (used by CursorTrail, which is viewport-fixed and always visible).
 *
 * Cleanup on unmount/disable cancels the RAF and disconnects the observer, so
 * nothing leaks across a mode toggle.
 */
export function useRafLoop(
  onFrame: (now: number) => void,
  enabled = true,
  targetRef?: RefObject<Element | null>,
): void {
  const onFrameRef = useRef(onFrame);
  // Keep the ref pointing at the latest callback without restarting the loop.
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;
    let running = false;

    const tick = (now: number): void => {
      if (!running) return;
      onFrameRef.current(now);
      rafId = requestAnimationFrame(tick);
    };
    const start = (): void => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
    };

    const el = targetRef?.current;
    let observer: IntersectionObserver | undefined;

    if (targetRef && el && typeof IntersectionObserver !== "undefined") {
      // Pause offscreen: start only when the element intersects the viewport.
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) start();
          else stop();
        },
        { threshold: 0 },
      );
      observer.observe(el);
    } else {
      // No target (or no IO support): run whenever enabled.
      start();
    }

    return () => {
      stop();
      observer?.disconnect();
    };
  }, [enabled, targetRef]);
}
