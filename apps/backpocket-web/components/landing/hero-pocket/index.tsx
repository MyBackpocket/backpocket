"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthLoading, SignedIn, SignedOut } from "@/components/auth-components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { HeroMobileVisual } from "./hero-mobile-visual";
import { PocketLink } from "./pocket-link";
import { PocketVisual } from "./pocket-visual";

export function HeroPocket() {
  return (
    <section className="relative min-h-screen pt-28 sm:pt-16 flex items-center w-full">
      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Gradient accents - simplified */}
      <div className="absolute top-0 right-0 w-1/3 h-2/3 bg-linear-to-bl from-rust/4 to-transparent pointer-events-none" />

      <div className="w-full mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-center gap-10 lg:gap-16 xl:gap-20">
          {/* Left: Editorial content - tighter */}
          <div className="w-full lg:flex-1 lg:max-w-xl">
            {/* Main headline - slightly smaller for cleaner feel */}
            <h1 className="font-serif">
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[0.95] tracking-tight text-foreground">
                Your finds.
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[0.95] tracking-tight mt-1 text-foreground">
                Your space.
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.15] tracking-tight mt-3 text-rust italic">
                Share with the world.
              </span>
            </h1>

            {/* Subhead - more concise */}
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              A modern <PocketLink /> alternative. Save articles and links privately, or{" "}
              <span className="text-foreground font-medium">share at your own URL</span> if you want
              to.
            </p>

            {/* CTA buttons - tighter spacing */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <AuthLoading>
                <Skeleton className="h-12 w-[160px] rounded-xl" />
                <Skeleton className="h-12 w-[130px] rounded-xl" />
              </AuthLoading>
              <SignedOut>
                <Link href={routes.signUp}>
                  <Button
                    size="lg"
                    className="h-12 px-6 text-sm rounded-xl shadow-lg shadow-rust/20 hover:shadow-xl hover:shadow-rust/30 transition-all"
                  >
                    Start your collection
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-6 text-sm rounded-xl border-2"
                  >
                    See how it works
                  </Button>
                </a>
              </SignedOut>
              <SignedIn>
                <Link href={routes.app.root}>
                  <Button
                    size="lg"
                    className="h-12 px-6 text-sm rounded-xl shadow-lg shadow-rust/20"
                  >
                    Open your library
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* Right: Visual - iPhone on mobile, Browser on desktop */}
          <div className="relative w-full max-w-sm lg:w-[380px] xl:w-[420px] lg:shrink-0 mx-auto lg:mx-0">
            {/* Mobile share animation with live site preview for mobile */}
            <div className="lg:hidden">
              <HeroMobileVisual />
            </div>
            {/* Browser extension animation for desktop */}
            <div className="hidden lg:block">
              <PocketVisual />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
