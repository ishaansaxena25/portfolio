/**
 * Typed data-access boundary. Local JSON is imported once here and exported
 * with its canonical type from `@/lib/types`. Components import from `@/data`
 * and never touch the raw JSON. This is the single trusted typing boundary
 * (JSON module imports widen string literals, so the narrow unions in
 * types.ts are asserted here rather than inferred).
 */
import type { Profile, TechCategory, Project, Achievement } from "@/lib/types";
import profileJson from "./profile.json";
import techStackJson from "./techStack.json";
import projectsJson from "./projects.json";
import achievementsJson from "./achievements.json";

export const profile = profileJson as Profile;
export const techStack = techStackJson as TechCategory[];
export const projects = projectsJson as Project[];
export const achievements = achievementsJson as Achievement[];
