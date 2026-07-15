import { techStack } from "@/data";
import ScrambleText from "@/components/ui/ScrambleText";

/** Tech stack grouped by category. Shared section — renders in both modes. */
export default function TechStack() {
  return (
    <section
      id="tech"
      className="mx-auto w-full max-w-4xl border-t border-border px-6 py-16"
    >
      <ScrambleText as="h2" text="Tech stack" className="text-h2 text-fg" />
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {techStack.map((cat) => (
          <div key={cat.category}>
            <h3 className="text-small text-fg-muted">{cat.category}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {cat.items.map((item) => (
                <li
                  key={item.name}
                  className={`rounded-[4px] border border-border bg-bg-elevated px-2.5 py-1 text-small ${
                    item.level === "core" ? "text-accent" : "text-fg"
                  }`}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
