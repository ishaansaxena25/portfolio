import { achievements } from "@/data";
import ScrambleText from "@/components/ui/ScrambleText";

/** Achievements timeline, sorted by date descending. Shared section — both modes. */
export default function Achievements() {
  const sorted = [...achievements].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section
      id="achievements"
      className="mx-auto w-full max-w-4xl border-t border-border px-6 py-16"
    >
      <ScrambleText as="h2" text="Achievements" className="text-h2 text-fg" />
      <ol className="mt-8 flex flex-col">
        {sorted.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 border-b border-border py-5 last:border-b-0 sm:flex-row sm:gap-6"
          >
            <span className="text-small text-fg-muted sm:w-24 sm:shrink-0">
              {item.date}
            </span>
            <div>
              <ScrambleText as="h3" text={item.title} className="text-h3 text-fg" />
              <p className="mt-1 text-small text-fg-muted">
                {item.event}
                {item.placement ? ` · ${item.placement}` : ""}
              </p>
              {item.description ? (
                <p className="mt-2 text-body text-fg-muted">{item.description}</p>
              ) : null}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`View the writeup for ${item.title}`}
                  className="mt-2 inline-block text-small text-accent hover:text-accent-dim"
                >
                  View writeup
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
