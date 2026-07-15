import InteractiveShell from "@/components/layout/InteractiveShell";
import StaticHero from "@/components/hero/StaticHero";
import Projects from "@/components/sections/Projects";
import TechStack from "@/components/sections/TechStack";
import Achievements from "@/components/sections/Achievements";
import Footer from "@/components/layout/Footer";

/**
 * Server component. The static and shared subtrees are server-rendered here and
 * handed to the client InteractiveShell as slots, so they stay in the SSR/SEO
 * surface while the shell owns the client-only mode toggle. Static Mode is the
 * default; the interactive tree loads lazily on first toggle.
 */
export default function Home() {
  return (
    <InteractiveShell
      staticContent={
        <>
          <StaticHero />
          <Projects />
        </>
      }
      sharedContent={
        <>
          <TechStack />
          <Achievements />
        </>
      }
      footer={<Footer />}
    />
  );
}
