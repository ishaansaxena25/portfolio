"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import ScrambleText from "@/components/ui/ScrambleText";

/**
 * Client shell that owns the single `isInteractive` boolean and swaps between
 * the Static and Interactive trees (IMPLEMENTATION.md §6/§7).
 *
 * page.tsx stays a SERVER component and passes the static/shared subtrees in as
 * props, so StaticHero / Projects / TechStack / Achievements / Footer remain
 * server-rendered (the SEO surface, §8). The heavy interactive components are
 * imported via next/dynamic { ssr: false } and are referenced ONLY inside the
 * `isInteractive === true` branch, so their code never ships or hydrates until
 * the user flips the toggle. Toggling back unmounts them, firing their cleanup.
 */

const DynamicInteractiveHero = dynamic(
  () => import("@/components/hero/InteractiveHero"),
  { ssr: false, loading: () => null },
);
const CursorTrail = dynamic(
  () => import("@/components/interactive/CursorTrail"),
  { ssr: false, loading: () => null },
);
const FloatingProjects = dynamic(
  () => import("@/components/interactive/FloatingProjects"),
  { ssr: false, loading: () => null },
);

interface InteractiveShellProps {
  /** Static Mode tree (server-rendered): StaticHero + Projects. */
  staticContent: ReactNode;
  /** Shared sections rendered in both modes (server-rendered): TechStack + Achievements. */
  sharedContent: ReactNode;
  /** Terminal footer (server-rendered), always last. */
  footer: ReactNode;
}

export default function InteractiveShell({
  staticContent,
  sharedContent,
  footer,
}: InteractiveShellProps) {
  const [isInteractive, setIsInteractive] = useState(false);

  return (
    <>
      <Navbar isInteractive={isInteractive} onToggle={setIsInteractive} />
      <main className="flex-1">
        {isInteractive ? (
          <>
            <CursorTrail />
            <DynamicInteractiveHero />
            <section className="mx-auto w-full max-w-4xl px-6 py-16">
              <ScrambleText as="h2" text="Projects" className="text-h2 text-fg" />
              <div className="relative mt-8 min-h-[60vh]">
                <FloatingProjects />
              </div>
            </section>
          </>
        ) : (
          staticContent
        )}
        {sharedContent}
      </main>
      {footer}
    </>
  );
}
