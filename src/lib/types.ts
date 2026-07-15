/**
 * Canonical data models for the dual-mode portfolio.
 * Every /src/data/*.json file is typed against these. No `any`.
 * See ARCHITECTURE.md (interfaces) and IMPLEMENTATION.md §7 (data rules).
 */

/** Known social platforms. Extend the union rather than widening to `string`. */
export type SocialPlatform =
  | "github"
  | "linkedin"
  | "x"
  | "email"
  | "website";

export interface SocialLink {
  /** Machine key used for icon/label lookup. */
  platform: SocialPlatform;
  /** Human label, e.g. "GitHub". */
  label: string;
  /** Full href (`mailto:` for email). */
  url: string;
  /** Optional display handle, e.g. "@ishaan". */
  handle?: string;
}

/** Single identity object (profile.json). Not an array. */
export interface Profile {
  /** Full display name; rendered via ScrambleText in both heroes. */
  name: string;
  /** 1-3 chars; conceptually matches the glyph rendered in ascii.txt. */
  initials: string;
  /** Headline title, e.g. "Full-stack developer". */
  role: string;
  location: string;
  /** 1-3 sentence intro for the hero/footer. */
  bio: string;
  email: string;
  /** Absolute or /public path to a resume PDF. */
  resumeUrl?: string;
  /** Ordered; rendered in Footer and StaticHero. */
  socials: SocialLink[];
}

export type TechLevel = "core" | "proficient" | "familiar";

export interface TechItem {
  /** Display name, e.g. "TypeScript". */
  name: string;
  /** Optional emphasis; `core` items may get stronger accent weight. No numeric bars. */
  level?: TechLevel;
}

/** One entry of techStack.json (an array of these). */
export interface TechCategory {
  /** Group heading, e.g. "Languages", "Frameworks", "Tools". */
  category: string;
  items: TechItem[];
}

/** Optional physics hints consumed only by FloatingProjects (interactive mode). */
export interface ProjectBubbleMeta {
  /** Base bubble radius in CSS px; derived from title length if omitted. */
  radius?: number;
  /** 0-1 normalized initial X position; randomized if omitted. */
  seedX?: number;
  /** 0-1 normalized initial Y position; randomized if omitted. */
  seedY?: number;
}

/** One entry of projects.json (an array of these). */
export interface Project {
  /** Stable unique key; also the React key and FloatingProjects bubble id. */
  id: string;
  /** URL-safe slug, e.g. "1stop". */
  slug: string;
  /** Rendered via ScrambleText on card headings. */
  title: string;
  /** One-line summary; shown on the card and as the floating bubble caption. */
  tagline: string;
  /** Longer paragraph for the static card body. */
  description: string;
  /** Stack tags; should reference names present in techStack.json. */
  tech: string[];
  /** e.g. "Solo", "Backend", "Frontend". */
  role?: string;
  year?: number;
  repoUrl?: string;
  liveUrl?: string;
  /** Featured projects may render larger in the static grid. */
  featured?: boolean;
  bubble?: ProjectBubbleMeta;
}

/** One entry of achievements.json (sorted client-side by date descending). */
export interface Achievement {
  /** Stable unique key. */
  id: string;
  /** e.g. "1st place — Realtime track". Rendered via ScrambleText. */
  title: string;
  /** Hackathon / program name. */
  event: string;
  /** e.g. "Winner", "Finalist", "Top 10". */
  placement?: string;
  /** ISO date or "YYYY-MM"; used to sort the timeline descending. */
  date: string;
  description?: string;
  /** Link to writeup / devpost / repo. */
  url?: string;
}

/**
 * A single non-space glyph from ascii.txt in GRID space.
 * Output of parseAscii.ts (Phase 3). Grid->screen mapping is done by AsciiCanvas,
 * NOT here — see OPTIMIZATIONS.md §1.
 */
export interface AsciiPoint {
  char: string;
  /** 0-based column index in the source grid. */
  col: number;
  /** 0-based row index in the source grid. */
  row: number;
}
