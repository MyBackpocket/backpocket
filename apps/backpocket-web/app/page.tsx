import { ArrowRight, Bookmark, Eye, FolderOpen, Globe, Lock, Rss } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatedLogo } from "@/components/animated-logo";
import { AuthLoading, SignedIn, SignedOut } from "@/components/auth-components";
import { HeroPocket } from "@/components/landing";
import { MobileDomainBanner } from "@/components/mobile-domain-banner";

// Dynamic imports for heavy below-the-fold components (framer-motion heavy)
const HowItWorksSection = dynamic(
  () => import("@/components/landing/how-it-works/index").then((m) => m.HowItWorksSection),
  { ssr: true }
);
const DemoSection = dynamic(
  () => import("@/components/landing/demo-section").then((m) => m.DemoSection),
  { ssr: true }
);
const PocketSuccessorSection = dynamic(
  () => import("@/components/landing/pocket-successor-section").then((m) => m.PocketSuccessorSection),
  { ssr: true }
);

import { Logo } from "@/components/logo";
import { ThemeSwitcher, ThemeSwitcherFloating } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-denim overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md overflow-hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <AnimatedLogo className="min-w-0 shrink" />

          <div className="flex items-center gap-4 shrink-0">
            <ThemeSwitcher className="hidden sm:flex" />
            {/* Skeleton while Clerk loads */}
            <AuthLoading>
              <Skeleton className="h-8 w-[60px] rounded-md" />
              <Skeleton className="h-8 w-[92px] rounded-md" />
            </AuthLoading>
            <SignedOut>
              <Link href={routes.signIn}>
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href={routes.signUp}>
                <Button size="sm">Get Started</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href={routes.app.root}>
                <Button size="sm">
                  Open App
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Floating theme switcher for mobile */}
      <ThemeSwitcherFloating />

      {/* Mobile Domain Banner - shows subdomain/custom domain feature on mobile */}
      <MobileDomainBanner />

      {/* Hero Section */}
      <HeroPocket />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
              Everything you need, <span className="text-rust italic">nothing you don&apos;t</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A calm, focused space for your reading and curation.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border bg-card p-8 shadow-denim transition-all hover:shadow-denim-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rust/10 text-rust transition-colors group-hover:bg-rust group-hover:text-white">
                <Bookmark className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Save anything</h3>
              <p className="text-muted-foreground">
                Articles, videos, PDFs, images, threads — save any URL worth keeping. We&apos;ll
                preserve it for you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border bg-card p-8 shadow-denim transition-all hover:shadow-denim-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-mint/15 text-mint transition-colors group-hover:bg-[hsl(100_35%_38%)] group-hover:text-white">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Stay organized</h3>
              <p className="text-muted-foreground">
                Collections, tags, favorites, and archive. Find what you need with powerful search
                and filters.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border bg-card p-8 shadow-denim transition-all hover:shadow-denim-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-denim/12 text-denim transition-colors group-hover:bg-denim group-hover:text-white">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Your public backpocket</h3>
              <p className="text-muted-foreground">
                Curate and share your finds at your own subdomain or custom domain. Build a public
                reading list that reflects your taste.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border bg-card p-8 shadow-denim transition-all hover:shadow-denim-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber/15 text-amber transition-colors group-hover:bg-amber group-hover:text-white">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">You control visibility</h3>
              <p className="text-muted-foreground">
                Every save is private until you decide otherwise. Share individual saves, entire
                collections, or keep everything to yourself.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border bg-card p-8 shadow-denim transition-all hover:shadow-denim-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal/15 text-teal transition-colors group-hover:bg-teal group-hover:text-white">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">One honest metric</h3>
              <p className="text-muted-foreground">
                A simple visitor counter shows total visits. No cookies, no fingerprinting — just a
                count to help you see your reach.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border bg-card p-8 shadow-denim transition-all hover:shadow-denim-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-denim-faded/20 text-denim-deep transition-colors group-hover:bg-denim-deep group-hover:text-white">
                <Rss className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">RSS if you share</h3>
              <p className="text-muted-foreground">
                If you choose to share saves publicly, they get an RSS feed automatically. Let
                people follow your curated finds in their favorite reader.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Interactive Demo Section */}
      <DemoSection />

      {/* Pocket Successor Section - final CTA */}
      <PocketSuccessorSection />

      {/* Footer */}
      <footer className="border-t border-denim/20 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link href={routes.home} className="flex items-center gap-2">
              <Logo size="md" />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href={routes.privacy}
                className="text-sm text-muted-foreground underline decoration-muted-foreground/30 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
              >
                Privacy Policy
              </Link>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()}{" "}
                <a
                  href="https://mariolopez.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-muted-foreground/30 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/50"
                >
                  Mario Lopez Martinez
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
