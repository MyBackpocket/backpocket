import { ArrowRight, Bookmark, Eye, FolderOpen, Globe, Lock, Rss, Sparkles } from "lucide-react";
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
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-mint/15 text-mint transition-colors group-hover:bg-mint group-hover:text-white">
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
              <h3 className="mb-2 text-xl font-semibold">Share if you want</h3>
              <p className="text-muted-foreground">
                Optionally publish select saves at your own subdomain or custom domain. Sharing is
                always your choice — most people keep everything private.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border bg-card p-8 shadow-denim transition-all hover:shadow-denim-lg hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber/15 text-amber transition-colors group-hover:bg-amber group-hover:text-white">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Privacy by default</h3>
              <p className="text-muted-foreground">
                Everything starts private. You choose what to share. Notes and annotations are
                always yours alone.
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

      {/* Pocket Successor Section - editorial style */}
      <PocketSuccessorSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Interactive Demo Section */}
      <DemoSection />

      {/* CTA Section - Clean, focused */}
      <section className="relative py-24 md:py-40 overflow-hidden bg-background">
        {/* Simple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/20" />

        {/* Subtle accent orbs - desktop only */}
        <div className="hidden md:block">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-rust/8 to-amber/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-denim/8 to-teal/5 blur-3xl pointer-events-none" />
        </div>

        {/* Decorative ring - desktop only */}
        <div className="absolute top-20 right-32 pointer-events-none opacity-30 hidden lg:block">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-rust/20" />
        </div>

        {/* Decorative book spines on the left - editorial feel (desktop only) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-row gap-1.5 -translate-x-1/3 rotate-12 opacity-20">
          {[
            { h: "h-48", bg: "bg-rust" },
            { h: "h-52", bg: "bg-denim" },
            { h: "h-44", bg: "bg-amber" },
            { h: "h-56", bg: "bg-teal" },
            { h: "h-40", bg: "bg-mint" },
            { h: "h-[12.5rem]", bg: "bg-denim-deep" },
          ].map((book, i) => (
            <div
              key={book.bg + i}
              className={`w-4 ${book.h} ${book.bg} rounded-sm shadow-md`}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* Decorative floating cards - right side (desktop only) */}
        <div className="absolute right-8 top-20 hidden lg:block animate-float-slow pointer-events-none opacity-60">
          <div className="w-32 rounded-xl bg-card/80 backdrop-blur-sm p-3 rotate-6 border border-border shadow-denim-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-rust/15 flex items-center justify-center">
                <Bookmark className="w-3.5 h-3.5 text-rust" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Design Guide</span>
            </div>
            <div className="h-1.5 bg-foreground/10 rounded-full w-full mb-1.5" />
            <div className="h-1.5 bg-foreground/5 rounded-full w-3/4" />
          </div>
        </div>

        <div className="absolute right-20 bottom-32 hidden lg:block animate-float-medium pointer-events-none opacity-50">
          <div className="w-28 rounded-xl bg-card/80 backdrop-blur-sm p-2.5 -rotate-3 border border-border shadow-denim">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-mint/15 flex items-center justify-center">
                <FolderOpen className="w-3 h-3 text-mint" />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground">Archive</span>
            </div>
            <div className="h-1 bg-foreground/8 rounded-full w-full mb-1" />
            <div className="h-1 bg-foreground/5 rounded-full w-2/3" />
          </div>
        </div>

        {/* Main content */}
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Typography heavy */}
            <div className="text-center lg:text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-rust/10 border border-rust/20">
                <Sparkles className="w-4 h-4 text-rust" />
                <span className="text-sm font-medium text-rust">Free to start</span>
              </div>

              {/* Giant headline */}
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1]">
                Your
                <br />
                <span className="relative inline-block">
                  <span className="text-rust">collection</span>
                  {/* Hand-drawn underline effect */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-rust/40"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 8 C 30 3, 70 11, 100 6 S 160 2, 198 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
                <br />
                <span className="italic text-denim">awaits.</span>
              </h2>

              {/* Subtext */}
              <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed">
                Save unlimited private links. Share your favorites at your own subdomain. No algorithms, no noise — just your curated corner of the web.
              </p>

              {/* CTA buttons - with glow effect */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <AuthLoading>
                  <Skeleton className="h-14 w-48 rounded-xl" />
                </AuthLoading>
                <SignedOut>
                  <Link href={routes.signUp} className="relative group">
                    {/* Animated glow behind button */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-rust via-amber to-rust rounded-xl opacity-40 group-hover:opacity-70 blur-lg transition-all duration-500 group-hover:blur-xl animate-pulse" />
                    <Button
                      size="lg"
                      className="relative h-14 px-8 text-base font-medium bg-rust hover:bg-rust/90 text-white rounded-xl shadow-lg shadow-rust/25 hover:shadow-xl hover:shadow-rust/35 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Start collecting
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href={routes.app.root} className="relative group">
                    {/* Animated glow behind button */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-rust via-amber to-rust rounded-xl opacity-40 group-hover:opacity-70 blur-lg transition-all duration-500 group-hover:blur-xl animate-pulse" />
                    <Button
                      size="lg"
                      className="relative h-14 px-8 text-base font-medium bg-rust hover:bg-rust/90 text-white rounded-xl shadow-lg shadow-rust/25 hover:shadow-xl hover:shadow-rust/35 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Open your library
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>

            {/* Right - Visual card stack */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Stacked cards visual - like a curated pile of saves */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Bottom card */}
                  <div className="absolute w-72 h-44 rounded-2xl bg-card border border-border shadow-denim-lg rotate-[-8deg] translate-x-4 translate-y-8 opacity-60">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-teal" />
                        </div>
                        <div>
                          <div className="h-2.5 bg-foreground/15 rounded-full w-28 mb-1.5" />
                          <div className="h-2 bg-foreground/8 rounded-full w-20" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-foreground/8 rounded-full w-full" />
                        <div className="h-2 bg-foreground/5 rounded-full w-4/5" />
                      </div>
                    </div>
                  </div>

                  {/* Middle card */}
                  <div className="absolute w-72 h-44 rounded-2xl bg-card border border-border shadow-denim-lg rotate-3 -translate-x-2 translate-y-2 opacity-80">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber/15 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-amber" />
                        </div>
                        <div>
                          <div className="h-2.5 bg-foreground/15 rounded-full w-32 mb-1.5" />
                          <div className="h-2 bg-foreground/8 rounded-full w-24" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-foreground/8 rounded-full w-full" />
                        <div className="h-2 bg-foreground/5 rounded-full w-3/4" />
                      </div>
                    </div>
                  </div>

                  {/* Top card - featured */}
                  <div className="absolute w-72 h-44 rounded-2xl bg-card border-2 border-rust/20 shadow-denim-lg rotate-[-2deg] -translate-x-4 -translate-y-4">
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rust flex items-center justify-center shadow-md">
                      <Bookmark className="w-4 h-4 text-white" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-rust/15 flex items-center justify-center">
                          <Bookmark className="w-5 h-5 text-rust" />
                        </div>
                        <div>
                          <div className="h-3 bg-foreground/20 rounded-full w-36 mb-1.5" />
                          <div className="h-2 bg-rust/30 rounded-full w-28" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 bg-foreground/12 rounded-full w-full" />
                        <div className="h-2.5 bg-foreground/8 rounded-full w-5/6" />
                        <div className="h-2.5 bg-foreground/5 rounded-full w-2/3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative dots */}
                <div className="absolute top-4 right-8 w-2 h-2 rounded-full bg-rust/40 animate-pulse" />
                <div className="absolute bottom-12 left-4 w-3 h-3 rounded-full bg-mint/30 animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full bg-amber/50 animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          </div>

          {/* Bottom trust elements */}
          <div className="mt-16 pt-10 border-t border-border/50">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-denim" />
                <span>Private by default</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-mint" />
                <span>Your own subdomain</span>
              </div>
              <div className="flex items-center gap-2">
                <Rss className="w-4 h-4 text-amber" />
                <span>RSS if you share</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
