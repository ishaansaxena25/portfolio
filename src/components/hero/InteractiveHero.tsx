"use client";

import { useEffect, useState } from "react";
import { profile } from "@/data";
import { parseAscii } from "@/lib/parseAscii";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import ScrambleText from "@/components/ui/ScrambleText";
import AsciiCanvas from "@/components/hero/AsciiCanvas";
import type { AsciiPoint } from "@/lib/types";

interface AsciiData {
  points: AsciiPoint[];
  cols: number;
  rows: number;
}

/**
 * Interactive Mode hero. Client-only (dynamic-imported with `ssr: false` in
 * page.tsx). Fetches the ASCII art at mount, parses it to grid-space points,
 * and renders the physics canvas BEHIND the scrambled name. Never throws: on
 * fetch/parse failure it degrades to the plain heading (same content as the
 * static hero, minus the canvas). Honors `prefers-reduced-motion: reduce` by
 * suppressing the auto-running particle canvas entirely.
 */
export default function InteractiveHero() {
  const [data, setData] = useState<AsciiData | null>(null);
  const [errored, setErrored] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  // Load + parse ascii.txt on mount. Guard against setState after unmount.
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/data/ascii.txt");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const parsed = parseAscii(text);
        if (mounted) setData(parsed);
      } catch (err) {
        console.error("[InteractiveHero] failed to load ascii.txt", err);
        if (mounted) setErrored(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="relative mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col justify-center px-6 py-24 md:py-32">
      {data !== null && !errored && !reducedMotion ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <AsciiCanvas points={data.points} cols={data.cols} rows={data.rows} />
        </div>
      ) : null}

      <p className="relative z-10 text-small text-fg-muted">
        {profile.role} · {profile.location}
      </p>
      <ScrambleText
        as="h1"
        text={profile.name}
        trigger="both"
        className="relative z-10 mt-4 text-display text-fg"
      />
    </section>
  );
}
