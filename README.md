# Developer Portfolio: Dual-Mode Interactive Experience

## Project Overview

A highly optimized, dual-mode developer portfolio built with Next.js and TypeScript.
The site defaults to a lightning-fast "Static Mode" for recruiters and SEO, featuring a global Text Scramble effect on headings.
Users can toggle to "Interactive Mode", which boots up heavy client-only animations: an ASCII particle-physics canvas (driven by a pre-generated ASCII text file), a custom cursor trail, and floating project bubbles.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Vanilla TypeScript + `requestAnimationFrame` + Canvas 2D (NO GSAP)
- **State:** Single `isInteractive` boolean via React `useState` (NO Zustand / external state lib)
- **Content:** Local JSON files in `/src/data` (No backend / CMS)

## Core Features

1. **Dual-Mode Toggle:** State-based switching between Static UI and Interactive UI, owned by `app/page.tsx`.
2. **Global Text Scramble:** Hover effects on headings in _both_ modes that randomize characters before resolving, driven by a vanilla-TS `TextScramble` class in `/src/lib`.
3. **Pre-generated ASCII Canvas:** A pre-saved ASCII text file (`ascii.txt`) is parsed into coordinates that feed a Canvas 2D particle-physics engine.
4. **Enhanced Interactive Mode:** A fixed-node custom mouse trail and floating, physics-based project bubbles.
5. **JSON-Driven Content:** Projects, tech stack, achievements, and profile stored in `/src/data/*.json`.

## Development Guidelines for AI

- Always use strict TypeScript interfaces for all props and data models (`/src/lib/types.ts`).
- Use Tailwind CSS for all styling; dark terminal/monospace theme with exactly ONE accent color (terminal green).
- Ensure all interactive/canvas components are strictly client-side (`"use client"`) and imported via `next/dynamic` with `{ ssr: false }`.
- Follow the optimization rules in `OPTIMIZATIONS.md` strictly. Performance is non-negotiable.

## Documentation Map

- **README.md** — this file: high-level overview and guidelines.
- **ARCHITECTURE.md** — folder structure, component tree, data flow, mode toggle wiring.
- **PLAN.md** — phased milestone plan and acceptance criteria.
- **IMPLEMENTATION.md** — locked design language (accent, type scale, banned patterns, component-first rule).
- **OPTIMIZATIONS.md** — the binding performance contract for the interactive engine.
- **assets.md** — asset conventions and the ASCII art / data-file inventory.
- **SKILLS.md** — reusable technical patterns (if present).
- **portfolio.md** — ARCHIVED, abandoned alternate vision (Hades 2D platformer). Ignore it entirely.
