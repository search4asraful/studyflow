import { Navbar } from '../components/layout/Navbar';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LandingFooter } from '../components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col selection:bg-accent selection:text-accent-contrast transition-colors duration-200">
      <Navbar variant="frontend" />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <HowItWorks />
      </main>
      <LandingFooter />
    </div>
  );
}
