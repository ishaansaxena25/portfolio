import { projects } from "@/data";
import ScrambleText from "@/components/ui/ScrambleText";

/** Static Mode project grid. Real project cards (not the banned icon+blurb feature grid). */
export default function Projects() {
  return (
    <section
      id="projects"
      className="mx-auto w-full max-w-4xl border-t border-border px-6 py-16"
    >
      <ScrambleText as="h2" text="Projects" className="text-h2 text-fg" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="flex flex-col rounded-[4px] border border-border bg-bg-elevated p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <ScrambleText as="h3" text={project.title} className="text-h3 text-fg" />
              {project.year ? (
                <span className="text-small text-fg-muted">{project.year}</span>
              ) : null}
            </div>
            <p className="mt-1 text-body text-accent">{project.tagline}</p>
            <p className="mt-3 text-body text-fg-muted">{project.description}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-[4px] border border-border px-2 py-0.5 text-small text-fg-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-5 text-small">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent hover:text-accent-dim"
                >
                  Live
                </a>
              ) : null}
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent hover:text-accent-dim"
                >
                  Code
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
