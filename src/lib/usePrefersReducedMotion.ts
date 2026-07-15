import { useSyncExternalStore } from "react";

/**
 * Subscribe to the user's `prefers-reduced-motion` setting.
 *
 * Uses `useSyncExternalStore` so the value is correct on the very first client
 * render (no setState-in-effect, no flash of the wrong branch) and updates
 * reactively if the OS setting changes. SSR-safe: the server snapshot is
 * `false` (assume motion is allowed), and React reconciles on hydration.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
