"use client";

import { useEffect, useRef } from "react";
import type { ElementType, Ref } from "react";
import { TextScramble } from "@/lib/textScramble";

export interface ScrambleTextProps {
  /** The resolved final string (also the SSR/accessible content). */
  text: string;
  /** Element tag; default "span". */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  /** When the scramble runs. Default "hover". */
  trigger?: "hover" | "mount" | "both";
}

/**
 * Renders `text` as its resolved string (so SSR/SEO/view-source always contain the
 * real text) and layers the scramble effect on top per `trigger`. Honors
 * prefers-reduced-motion by skipping the animation entirely (IMPLEMENTATION.md §5, §9).
 */
export default function ScrambleText({
  text,
  as,
  className,
  trigger = "hover",
}: ScrambleTextProps) {
  const ref = useRef<HTMLElement>(null);
  const fxRef = useRef<TextScramble | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduced;
    if (reduced) {
      // Reduced motion: show the exact string, no scramble, no auto-trigger.
      el.textContent = text;
      return;
    }

    const fx = new TextScramble(el);
    fxRef.current = fx;
    if (trigger === "mount" || trigger === "both") {
      void fx.setText(text);
    }
    return () => {
      fx.stop();
      fxRef.current = null;
    };
  }, [text, trigger]);

  const handleEnter = () => {
    if (reducedRef.current) return;
    if (trigger === "hover" || trigger === "both") {
      void fxRef.current?.setText(text);
    }
  };

  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag ref={ref as Ref<HTMLElement>} className={className} onMouseEnter={handleEnter}>
      {text}
    </Tag>
  );
}
