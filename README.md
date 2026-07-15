```markdown
# Developer Portfolio: Dual-Mode Interactive Experience

## Project Overview

A highly optimized, dual-mode developer portfolio built with Next.js and TypeScript.
The site defaults to a lightning-fast "Static Mode" for recruiters and SEO, featuring a global Text Scramble effect on headings.
Users can toggle to "Interactive Mode", which boots up heavy animations: an ASCII Particle Physics canvas (driven by a pre-generated ASCII text file), a custom cursor trail, and floating project bubbles.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Content:** Local JSON files (No backend/CMS)

## Core Features

1. **Dual-Mode Toggle:** State-based switching between Static UI and Interactive UI.
2. **Global Text Scramble:** Hover effects on headings in _both_ modes that randomize characters before resolving.
3. **Pre-generated ASCII Canvas:** Instead of dynamic image parsing, a pre-saved ASCII text file (`ascii.txt`) is parsed into coordinates to form a particle physics engine.
4. **Enhanced Interactive Mode:** Features a custom mouse trail (DOM/Canvas based) and floating, physics-based project bubbles.
5. **JSON-Driven Content:** Projects, tech stack, and achievements stored in `/data/*.json`.

## Development Guidelines for AI

- Always use strict TypeScript interfaces for all props and data models.
- Use Tailwind CSS for all styling.
- Ensure all interactive/canvas components are strictly client-side (`"use client"`).
- Follow the optimization rules in `OPTIMIZATIONS.md` strictly. Performance is non-negotiable.
```
