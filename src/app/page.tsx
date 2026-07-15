import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StaticHero from "@/components/hero/StaticHero";
import Projects from "@/components/sections/Projects";
import TechStack from "@/components/sections/TechStack";
import Achievements from "@/components/sections/Achievements";

/**
 * Static Mode composition (Phase 2). The isInteractive toggle and the Interactive
 * tree are wired in Phase 4; for now the Navbar toggle is an accessible no-op.
 */
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <StaticHero />
        <Projects />
        <TechStack />
        <Achievements />
      </main>
      <Footer />
    </>
  );
}
