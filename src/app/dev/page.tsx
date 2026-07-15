"use client";

import InteractiveHero from "@/components/hero/InteractiveHero";
import CursorTrail from "@/components/interactive/CursorTrail";
import FloatingProjects from "@/components/interactive/FloatingProjects";

/**
 * TEMPORARY Phase 3 dev harness.
 * Exercises the heavy client-only interactive components in isolation
 * before they are wired into interactive mode in Phase 4.
 * This route is standalone — it is intentionally NOT linked from page.tsx
 * and will be removed / gated in Phase 4.
 */
export default function DevHarnessPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <CursorTrail />

      <div className="border-b border-border bg-bg-elevated px-6 py-3 font-mono text-sm text-accent">
        TEMPORARY DEV HARNESS — removed in Phase 4
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12">
        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-lg text-fg">
            InteractiveHero (ASCII canvas + scramble)
          </h2>
          <InteractiveHero />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-lg text-fg">FloatingProjects</h2>
          <div className="relative h-96 border border-border">
            <FloatingProjects />
          </div>
        </section>
      </div>
    </main>
  );
}
