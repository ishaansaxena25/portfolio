import { useEffect, useRef } from "react";

/**
 * Drives a requestAnimationFrame loop that calls `onFrame(now)` every frame
 * while `enabled` is true. The callback is stored in a ref, so changing its
 * identity between renders never restarts the loop — only toggling `enabled`
 * (or unmount) starts/stops it.
 *
 * Phase 5 will extend this hook with IntersectionObserver-based pausing so the
 * loop idles when the host element is scrolled off-screen.
 */
export function useRafLoop(onFrame: (now: number) => void, enabled = true): void {
  const onFrameRef = useRef(onFrame);
  // Keep the ref pointing at the latest callback without restarting the loop.
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) return;

    let running = true;
    let rafId = 0;

    const tick = (now: number): void => {
      if (!running) return;
      onFrameRef.current(now);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);
}
