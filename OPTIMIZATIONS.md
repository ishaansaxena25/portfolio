```markdown
# Performance & Optimization Constraints

The Interactive Canvas and animations must be flawlessly optimized. Follow these rules strictly.

## 1. ASCII Parsing & Particle Count

- Do NOT parse images at runtime. Read `/data/ascii.txt`.
- Parse the text into an array of particles. Only create a particle for non-whitespace characters.
- Scale the X/Y coordinates so the ASCII art fits the screen.
- Target particle count should be between 3,000 and 8,000. If the ASCII file is too dense, skip characters (e.g., sample every 2nd character).

## 2. Dynamic Import & SSR Disabling

- `AsciiCanvas`, `CursorTrail`, and `FloatingProjects` must NEVER render on the server.
- Import them via `next/dynamic`: `const InteractiveHero = dynamic(() => import('@/components/hero/InteractiveHero'), { ssr: false });`

## 3. Intersection Observer (Pause on Scroll)

- Use `IntersectionObserver` on the canvas elements.
- If the canvas is out of the viewport, `cancelAnimationFrame` immediately to save CPU.
- Restart animation when it re-enters the viewport.

## 4. Device Pixel Ratio (DPR) Cap

- High DPI screens will cause severe lag.
- Read `window.devicePixelRatio` and cap it at `1.5`.
- Set `canvas.width = window.innerWidth * dpr` and `canvas.height = window.innerHeight * dpr`.
- Call `ctx.scale(dpr, dpr)` before drawing.

## 5. Physics Loop Optimization

- Inside the Particle `update()` method, avoid `Math.sqrt()` for mouse repulsion. Compare squared distances.
- Use standard `for` loops instead of `forEach` when iterating over particle arrays in the animation frame.

## 6. Cursor Trail Optimization

- Do not create infinite DOM elements for the trail.
- Use a fixed array of N nodes (e.g., 15 dots). On mousemove, update the head node's position. In the animation frame, lerp the remaining nodes to follow the node ahead of them.
- Use CSS `transform: translate3d(x, y, 0)` instead of `top/left` to trigger hardware acceleration.

## 7. Cleanup

- Ensure `cancelAnimationFrame` and `removeEventListener` (for mousemove/resize) are called in the `useEffect` cleanup functions to prevent memory leaks when toggling back to Static Mode.
```
