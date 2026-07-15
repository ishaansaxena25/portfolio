> ARCHIVED — abandoned alternate vision (Hades 2D platformer). Not implemented. The active project is the dual-mode ASCII portfolio; see README.md.

---

> I am building an interactive portfolio website called 'Portfolio'. It is a 2D platformer-style web experience inspired by the game Hades.
>
> I have provided four documents in the root directory: README.md (Architecture), PLAN.md (Milestones), IMPLEMENTATION.md (Styling/Logic Rules), and SKILLS.md (Technical Patterns).
>
> Please read and analyze all five files thoroughly. You will see that the `README` contains the architecture and folder structure, the `PLAN` contains our step-by-step milestones, and the `IMPLEMENTATION` contains strict rules for GSAP animations, Tailwind styling (clip-paths, glows), and state management.
> You must strictly follow the `SKILLS` file for all code generation, especially regarding GSAP's useGSAP hook, Tailwind arbitrary values, and Zustand selectors.
> Also use `assets.md`

> **Your instructions for development:**
>
> 1. Follow the `PLAN.md` phases in exact order. Do not skip ahead to Phase 4 until Phase 2 and 3 are complete.
> 2. Adhere strictly to the `IMPLEMENTATION.md` styling rules. NEVER use standard rounded corners. Always use the specified clip-paths and heavy glowing box-shadows.
> 3. Use GSAP for all animations as specified, using `expo.out` easing.
> 4. Assume all assets (backgrounds, SVGs, audio) are already located in `/public/assets/` as defined in the folder structure. Use the exact paths defined in the docs.
>
> **Let's start with Phase 2: Core Game Systems.**
> Please generate the code for the following files to begin:
>
> 1. `src/store/gameStore.ts` (Using Zustand based on the interface in IMPLEMENTATION.md)
> 2. `src/components/game/CustomCursor.tsx` (Tracking mouse, rendering an SVG from `/assets/icons/sword-cursor.svg`, applying a CSS drop-shadow glow)
> 3. `src/app/globals.css` (Add the custom Tailwind utility classes for `.glow-orange`, `.clip-sharp`, and `.text-glow`)
>
> Please output the code for these three files now. Once I confirm they work, we will move to the BiomeManager and GSAP transitions.
