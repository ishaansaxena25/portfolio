"use client";

import { profile } from "@/data";

export interface NavbarProps {
  /** Current mode. Controlled by page.tsx (wired in Phase 4). */
  isInteractive?: boolean;
  /** Setter from page.tsx. Absent in Static-only Phase 2 (toggle is a no-op placeholder). */
  onToggle?: (next: boolean) => void;
}

/**
 * Sticky top nav with the Static <-> Interactive mode toggle.
 * Pure controlled component: holds no mode state of its own (IMPLEMENTATION.md §6).
 * The toggle is a keyboard-operable role="switch"; the accent focus ring comes from
 * the global :focus-visible rule (IMPLEMENTATION.md §9).
 */
export default function Navbar({ isInteractive = false, onToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg">
      <nav className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
        <a href="#" className="text-body text-fg">
          {profile.name}
        </a>
        <div className="flex items-center gap-3 text-small text-fg-muted">
          <span id="mode-label">{isInteractive ? "Interactive" : "Static"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={isInteractive}
            aria-labelledby="mode-label"
            onClick={() => onToggle?.(!isInteractive)}
            className="relative h-6 w-11 rounded-[4px] border border-border bg-bg-elevated"
          >
            <span
              className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-[3px] transition-[left] duration-200 ${
                isInteractive ? "left-6 bg-accent" : "left-1 bg-fg-muted"
              }`}
            />
          </button>
        </div>
      </nav>
    </header>
  );
}
