/**
 * Framework-agnostic text scramble effect (IMPLEMENTATION.md §5).
 *
 * Drives per-character randomize -> resolve through a SINGLE requestAnimationFrame
 * loop, resolves the returned promise on completion, and cleans up its own frame.
 * Client-only usage (instantiated inside ScrambleText's effect). It ALWAYS resolves
 * to the exact target string; with a monospace font the character count stays constant
 * so there is no layout shift.
 */

interface ScrambleEntry {
  from: string;
  to: string;
  start: number;
  end: number;
  char: string;
}

/** Noise charset, consistent with the terminal aesthetic. */
const CHARS = "!<>-_\\/[]{}—=+*^?#";

/** Escape the few characters that would otherwise be parsed as HTML in innerHTML. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export class TextScramble {
  private readonly el: HTMLElement;
  private queue: ScrambleEntry[] = [];
  private frame = 0;
  private frameRequest = 0;
  private resolve: () => void = () => {};

  constructor(el: HTMLElement) {
    this.el = el;
    this.update = this.update.bind(this);
  }

  /** Animate the element's text to `newText`. Resolves when fully settled. */
  setText(newText: string): Promise<void> {
    const oldText = this.el.textContent ?? "";
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] ?? "";
      const to = newText[i] ?? "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end, char: "" });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  /** Cancel any in-flight frame. Call on unmount to avoid a leaked RAF. */
  stop(): void {
    cancelAnimationFrame(this.frameRequest);
  }

  private update(): void {
    let output = "";
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const entry = this.queue[i];
      if (this.frame >= entry.end) {
        complete++;
        output += escapeHtml(entry.to);
      } else if (this.frame >= entry.start) {
        if (!entry.char || Math.random() < 0.28) {
          entry.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        output += `<span style="opacity:.55">${escapeHtml(entry.char)}</span>`;
      } else {
        output += escapeHtml(entry.from);
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      // Guarantee the exact resolved string as the final DOM content.
      this.el.textContent = this.queue.map((q) => q.to).join("");
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}
