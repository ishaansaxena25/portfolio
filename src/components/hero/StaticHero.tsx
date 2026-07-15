import { profile } from "@/data";
import ScrambleText from "@/components/ui/ScrambleText";

/** Default (Static Mode) hero. Server-rendered; scrambled name works without heavy JS. */
export default function StaticHero() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-24 md:py-32">
      <p className="text-small text-fg-muted">
        {profile.role} · {profile.location}
      </p>
      <ScrambleText
        as="h1"
        text={profile.name}
        trigger="both"
        className="mt-4 text-display text-fg"
      />
      <p className="mt-6 max-w-2xl text-body-lg text-fg-muted">{profile.bio}</p>
      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-small">
        {profile.socials.map((s) => (
          <a
            key={s.platform}
            href={s.url}
            target={s.platform === "email" ? undefined : "_blank"}
            rel="noreferrer noopener"
            className="text-accent hover:text-accent-dim"
          >
            {s.label}
            {s.handle ? ` ${s.handle}` : ""}
          </a>
        ))}
        {profile.resumeUrl ? (
          <a
            href={profile.resumeUrl}
            className="text-fg-muted hover:text-fg"
            target="_blank"
            rel="noreferrer noopener"
          >
            Résumé
          </a>
        ) : null}
      </div>
    </section>
  );
}
