```markdown
# Implementation Plan

Execute the following steps sequentially. Do not move to the next phase until the current one is complete and free of TypeScript errors.

## Phase 1: Setup & Data Modeling

1. Initialize Next.js app with TypeScript, Tailwind, App Router.
2. Create the `/data` directory and generate `profile.json`, `techStack.json`, `projects.json` (1Stop, BlogBubble, E-commerce API), and `achievements.json`.
3. Create `/data/ascii.txt` and populate it with a medium-sized (approx 80x40 chars) ASCII art representation of initials or a face.
4. Define TypeScript interfaces for all JSON structures in `/lib/types.ts`.

## Phase 2: Static UI & Global Scramble

1. Implement `textScramble.ts` class in `/lib` using `requestAnimationFrame`.
2. Build `ScrambleText.tsx`: React wrapper that triggers `setText` on `onMouseEnter`. Apply this to all main headings.
3. Build `StaticHero.tsx`: Clean layout using `ScrambleText` for the name.
4. Build `TechStack.tsx`, `Projects.tsx` (standard grid), and `Achievements.tsx`.
5. Assemble in `page.tsx` in Static Mode.

## Phase 3: Interactive Components

1. Implement `parseAscii.ts`: Reads `ascii.txt`, returns an array of `{ x, y, char }`.
2. Build `AsciiCanvas.tsx`: Takes the parsed array, creates Particles with targetX/Y. Implement mouse repulsion and spring-back physics.
3. Build `CursorTrail.tsx`: A component that tracks mouse movement and renders a fading trail of dots or a glowing line. (Use a Canvas or absolutely positioned DOM nodes).
4. Build `FloatingProjects.tsx`: Renders project titles/links as circular bubbles that gently float around the screen and repel from the mouse.

## Phase 4: The Toggle & Integration

1. Add `isInteractive` state to `page.tsx`.
2. In `Navbar.tsx`, add a physical toggle switch (Static <-> Interactive).
3. Implement conditional rendering based on `isInteractive`.
4. Use `next/dynamic` to import all interactive components with `{ ssr: false }`.

## Phase 5: Optimization (CRITICAL)

1. Apply all constraints from `OPTIMIZATIONS.md` to `AsciiCanvas.tsx` and `CursorTrail.tsx`.
2. Verify that the site loads instantly in Static Mode and that heavy scripts do not hydrate until the toggle is flipped.
```
