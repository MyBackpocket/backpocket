import {
  ArrowRight,
  Bookmark,
  Eye,
  FolderOpen,
  Globe,
  Lock,
  Rss,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AuthLoading, SignedIn, SignedOut } from "@/components/auth-components";
import { HeroPocket } from "@/components/landing";

// Dynamic imports for heavy below-the-fold components (framer-motion heavy)
const HowItWorksSection = dynamic(
  () => import("@/components/landing/how-it-works/index").then((m) => m.HowItWorksSection),
  { ssr: true }
);
const DemoSection = dynamic(
  () => import("@/components/landing/demo-section").then((m) => m.DemoSection),
  { ssr: true }
);
import { Logo } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { externalLinks } from "@/lib/constants/links";
import { routes } from "@/lib/constants/routes";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-denim">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href={routes.home} className="flex items-center gap-2">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
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

      {/* Hero Section */}
      <HeroPocket />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
              Everything you need,{" "}
              <span className="text-rust italic">nothing you don&apos;t</span>
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

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Interactive Demo Section */}
      <DemoSection />

      {/* No Social Section - with stitching detail */}
      <section className="relative border-y border-denim/20 bg-card/50 py-20 md:py-32">
        {/* Decorative stitching lines */}
        <div className="absolute inset-x-0 top-4 border-t-2 border-dashed border-rust/20" />
        <div className="absolute inset-x-0 bottom-4 border-b-2 border-dashed border-rust/20" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
              Intentionally{" "}
              <span className="text-denim italic">non-social</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Most people use backpocket as a private library — and that&apos;s perfect. If you choose
              to share, there are no followers, likes, comments, or discovery feeds. No user
              directory or algorithmic recommendations. People find your space only via the URL you
              share — in your bio, email signature, or conversation.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {[
                { label: "No followers", color: "tag-denim" },
                { label: "No likes", color: "tag-rust" },
                { label: "No comments", color: "tag-mint" },
                { label: "No feed", color: "tag-teal" },
                { label: "No algorithms", color: "tag-amber" },
              ].map((item) => (
                <span
                  key={item.label}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${item.color}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <span className="inline-block rounded-full bg-rust/10 px-4 py-1.5 text-sm font-medium text-rust">
                The backstory
              </span>
            </div>

            <h2 className="text-center font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
              Why{" "}
              <span className="text-rust italic">backpocket</span>?
            </h2>

            <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                On July 8, 2025,{" "}
                <a
                  href={externalLinks.pocketShutdown}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-denim underline decoration-denim/30 underline-offset-4 transition-colors hover:text-denim-deep hover:decoration-denim"
                >
                  Mozilla shut down Pocket
                </a>
                — the beloved read-it-later app that millions of people used to save articles,
                videos, and links for later. By November 2025, all user data was permanently
                deleted.
              </p>

              <p>
                For many of us, Pocket wasn&apos;t just an app. It was a personal library, a
                collection of ideas worth revisiting, a quiet corner of the internet where we could
                save things that mattered without the noise of social media.
              </p>

              <p>
                <span className="font-medium text-foreground">backpocket</span> is our answer. Built
                for the people who miss what Pocket offered — and for anyone who wants a calm,
                focused way to save their finds. No social features, no algorithms. Just your
                collection, beautifully organized and completely private by default. If you ever
                want to share select saves publicly, that option is there — but it&apos;s entirely up to
                you.
              </p>
            </div>

            <div className="mt-10 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-xl border border-denim/20 bg-card/50 px-5 py-3 text-sm">
                <span className="text-muted-foreground">Pocket, 2007–2025</span>
                <span className="text-denim/40">→</span>
                <span className="font-medium text-rust">backpocket, 2025–</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Denim pocket inspired */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-denim to-denim-deep px-8 py-16 text-center text-white md:px-16 md:py-24">
            {/* Stitching detail */}
            <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-rust/40 pointer-events-none" />

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
              <div className="absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
            </div>

            {/* Floating mini cards - left side */}
            <div className="absolute left-4 top-1/4 hidden md:block animate-float-slow pointer-events-none">
              <div className="w-28 rounded-lg bg-white/10 backdrop-blur-sm p-2.5 rotate-[-8deg] border border-white/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded bg-rust/30 flex items-center justify-center">
                    <Bookmark className="w-3 h-3 text-rust" />
                  </div>
                  <span className="text-[9px] text-white/70">Article</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded w-full mb-1" />
                <div className="h-1.5 bg-white/15 rounded w-3/4" />
              </div>
            </div>

            <div className="absolute left-12 bottom-1/4 hidden lg:block animate-float-medium pointer-events-none">
              <div className="w-24 rounded-lg bg-white/10 backdrop-blur-sm p-2 rotate-6 border border-white/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded bg-mint/30 flex items-center justify-center">
                    <Globe className="w-2.5 h-2.5 text-mint" />
                  </div>
                  <span className="text-[8px] text-white/70">Link</span>
                </div>
                <div className="h-1 bg-white/20 rounded w-full mb-0.5" />
                <div className="h-1 bg-white/15 rounded w-2/3" />
              </div>
            </div>

            {/* Floating mini cards - right side */}
            <div className="absolute right-4 top-1/3 hidden md:block animate-float-medium pointer-events-none">
              <div className="w-28 rounded-lg bg-white/10 backdrop-blur-sm p-2.5 rotate-10 border border-white/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded bg-amber/30 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-amber" />
                  </div>
                  <span className="text-[9px] text-white/70">Thread</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded w-full mb-1" />
                <div className="h-1.5 bg-white/15 rounded w-4/5" />
              </div>
            </div>

            <div className="absolute right-8 bottom-1/3 hidden lg:block animate-float-fast pointer-events-none">
              <div className="w-24 rounded-lg bg-white/10 backdrop-blur-sm p-2 rotate-[-5deg] border border-white/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded bg-teal/30 flex items-center justify-center">
                    <FolderOpen className="w-2.5 h-2.5 text-teal" />
                  </div>
                  <span className="text-[8px] text-white/70">Collection</span>
                </div>
                <div className="h-1 bg-white/20 rounded w-full mb-0.5" />
                <div className="h-1 bg-white/15 rounded w-1/2" />
              </div>
            </div>

            {/* Animated accent shapes */}
            <div className="absolute top-8 left-1/4 w-2 h-2 rounded-full bg-amber/40 animate-pulse" />
            <div className="absolute bottom-12 right-1/4 w-3 h-3 rounded-full bg-mint/30 animate-pulse delay-300" />
            <div className="absolute top-1/2 right-8 w-1.5 h-1.5 rounded-full bg-rust/50 animate-pulse delay-150 hidden md:block" />

            {/* Content */}
            <div className="relative z-10">
              <h2 className="font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
                Start building{" "}
                <span className="italic opacity-90">your collection</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
                Free to start. Save unlimited private links. If you ever want to share, get your own
                subdomain with up to 100 public saves.
              </p>
              <div className="mt-10">
                {/* Skeleton while Clerk loads */}
                <AuthLoading>
                  <Skeleton className="h-12 w-[180px] rounded-md mx-auto bg-white/20" />
                </AuthLoading>
                <SignedOut>
                  <Link href={routes.signUp}>
                    <Button
                      size="lg"
                      className="h-12 px-8 text-base bg-rust hover:bg-rust/90 text-white shadow-lg shadow-rust/30 hover:shadow-xl hover:shadow-rust/40 transition-all hover:scale-105"
                    >
                      Create your space
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href={routes.app.root}>
                    <Button
                      size="lg"
                      className="h-12 px-8 text-base bg-rust hover:bg-rust/90 text-white shadow-lg shadow-rust/30 hover:shadow-xl hover:shadow-rust/40 transition-all hover:scale-105"
                    >
                      Open your library
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </SignedIn>
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
