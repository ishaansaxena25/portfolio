import type { AsciiPoint } from "@/lib/types";

/**
 * Parse a raw ASCII-art string into a flat list of grid points.
 *
 * Contract:
 * - Output is in GRID space: each point carries its integer `col`/`row`
 *   index. It is NOT scaled to any viewport — the consumer (AsciiCanvas)
 *   owns layout/scaling.
 * - Line endings are normalized (CRLF / CR -> LF) before splitting.
 * - `rows` is the number of lines; `cols` is the widest line's length.
 * - Only NON-whitespace cells emit a point. Spaces (" ") and tabs ("\t")
 *   are skipped entirely.
 * - Stride sampling caps the result: with `nonSpaceCount` glyph cells,
 *   `stride = max(1, ceil(nonSpaceCount / maxParticles))` and every
 *   stride-th glyph is kept, so `points.length <= maxParticles`. When the
 *   art already fits (stride === 1) every glyph is kept — never upsampled.
 *
 * @param raw           Raw ASCII-art text.
 * @param maxParticles  Upper bound on emitted points (default 8000).
 */
export function parseAscii(
  raw: string,
  maxParticles = 8000,
): { points: AsciiPoint[]; cols: number; rows: number } {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const rows = lines.length;

  let cols = 0;
  let nonSpaceCount = 0;
  for (let r = 0; r < rows; r++) {
    const line = lines[r];
    const len = line.length;
    if (len > cols) cols = len;
    for (let c = 0; c < len; c++) {
      const ch = line[c];
      if (ch !== " " && ch !== "\t") nonSpaceCount++;
    }
  }

  const stride = Math.max(1, Math.ceil(nonSpaceCount / maxParticles));

  const points: AsciiPoint[] = [];
  let seen = 0;
  for (let r = 0; r < rows; r++) {
    const line = lines[r];
    const len = line.length;
    for (let c = 0; c < len; c++) {
      const ch = line[c];
      if (ch === " " || ch === "\t") continue;
      if (seen % stride === 0) {
        points.push({ char: ch, col: c, row: r });
      }
      seen++;
    }
  }

  return { points, cols, rows };
}
