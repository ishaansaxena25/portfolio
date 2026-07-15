import { profile } from "@/data";

/** Terminal-style footer. Shared section — renders in both modes. */
export default function Footer() {
  const links = profile.socials.filter((s) => s.platform !== "email");

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto w-full max-w-4xl px-6 py-10 text-small text-fg-muted">
        <p className="text-fg">
          <span className="text-accent">~ $</span> contact
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <a href={`mailto:${profile.email}`} className="hover:text-accent">
            {profile.email}
          </a>
          {links.map((s) => (
            <a
              key={s.platform}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-accent"
            >
              {s.label}
            </a>
          ))}
        </div>
        <p className="mt-6">© {profile.name}</p>
      </div>
    </footer>
  );
}
