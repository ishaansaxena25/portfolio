````markdown
# Architecture & Folder Structure

## Directory Structure

```text
/src
  /app
    page.tsx              # Main page, orchestrates sections, holds isInteractive state
    layout.tsx            # Global fonts, metadata
  /components
    /layout
      Navbar.tsx          # Sticky top nav with Toggle switch
      Footer.tsx          # Terminal-style footer
    /ui
      ScrambleText.tsx    # React wrapper for the scramble effect (used globally)
    /hero
      StaticHero.tsx      # Pure HTML/CSS hero (Default)
      InteractiveHero.tsx # Wrapper for AsciiCanvas + Scramble text
      AsciiCanvas.tsx     # Physics engine parsing ascii.txt
    /interactive
      CursorTrail.tsx     # Custom mouse follower trail (Interactive mode only)
      FloatingProjects.tsx# Physics bubbles for projects (Interactive mode only)
    /sections
      TechStack.tsx       # Grid of tech tags
      Projects.tsx        # Static grid of project cards
      Achievements.tsx    # Timeline/Grid of hackathons
  /data
    profile.json          # Name, location, bio, socials
    techStack.json        # Array of technologies by category
    projects.json         # Array of project objects
    achievements.json     # Array of hackathon objects
    ascii.txt             # Pre-generated ASCII art of the developer's face/initials
  /lib
    textScramble.ts       # Vanilla TS class for the scramble effect
    parseAscii.ts         # Utility to parse ascii.txt into X,Y coordinates & chars
```
````

## Data Flow & State

1. **Content:** All text/links stored in `/data/*.json`.
2. **ASCII Parsing:** On mount of `InteractiveHero`, `parseAscii.ts` reads `ascii.txt`. It calculates the X/Y position of every non-space character and feeds this array to `AsciiCanvas.tsx` as target coordinates.
3. **State Management:** Root `page.tsx` holds `isInteractive` boolean.
   - If `false`: Renders `<StaticHero />`, `<Projects />` (standard grid).
   - If `true`: Renders `<InteractiveHero />`, `<CursorTrail />`, `<FloatingProjects />` (bubbles).
4. **Dynamic Loading:** Interactive components are loaded via `next/dynamic` with `ssr: false`.

## Component Tree

```text
<Page isInteractive={isInteractive}>
  <Navbar isInteractive={isInteractive} setIsInteractive={setIsInteractive} />

  {isInteractive ? (
    <>
      <CursorTrail />
      <DynamicInteractiveHero />
      <FloatingProjects data={projects.json} />
    </>
  ) : (
    <>
      <StaticHero />
      <Projects data={projects.json} />
    </>
  )}

  <TechStack data={techStack.json} />
  <Achievements data={achievements.json} />
  <Footer data={profile.json} />
</Page>
```

```

```
