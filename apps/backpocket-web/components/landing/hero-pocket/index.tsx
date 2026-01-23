"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthLoading, SignedIn, SignedOut } from "@/components/auth-components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { AnimatedDomain } from "./animated-domain";
import { DOMAINS } from "./constants";
import { PocketLink } from "./pocket-link";
import { PocketVisual } from "./pocket-visual";

export function HeroPocket() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {/* Gradient accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-rust/3 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-linear-to-tr from-denim/4 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-12 lg:gap-20 xl:gap-24">
          {/* Left: Editorial content */}
          <div className="flex-1 max-w-2xl">
            {/* Main headline - Editorial oversized style */}
            <h1 className="font-serif">
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-medium leading-[0.9] tracking-tight text-foreground">
                Your finds.
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-medium leading-[0.9] tracking-tight mt-2 text-foreground">
                Your space.
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight mt-4 text-rust italic">
                Shared only if you want.
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              A modern <PocketLink /> alternative: save articles, videos, and links privately.{" "}
              <span className="text-foreground font-medium">Optionally share select saves</span> at
              your own URL — if and when you choose.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <AuthLoading>
                <Skeleton className="h-14 w-[180px] rounded-xl" />
                <Skeleton className="h-14 w-[140px] rounded-xl" />
              </AuthLoading>
              <SignedOut>
                <Link href={routes.signUp}>
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base rounded-xl shadow-lg shadow-rust/20 hover:shadow-xl hover:shadow-rust/30 transition-all"
                  >
                    Start your collection
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 text-base rounded-xl border-2"
                  >
                    See how it works
                  </Button>
                </a>
              </SignedOut>
              <SignedIn>
                <Link href={routes.app.root}>
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base rounded-xl shadow-lg shadow-rust/20"
                  >
                    Open your library
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
            </div>

            {/* Domain preview */}
            <div className="mt-12">
              <p className="text-sm text-muted-foreground mb-3">
                If you choose to share, get your own URL:
              </p>
              <AnimatedDomain domains={DOMAINS} />
            </div>
          </div>

          {/* Right: Pocket visual */}
          <div className="relative w-full max-w-md lg:w-[420px] xl:w-[480px] 2xl:w-[540px] lg:shrink-0 mx-auto lg:mx-0">
            <PocketVisual />
          </div>
        </div>
      </div>

      {/* Decorative stitching line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="h-full w-full border-b-2 border-dashed border-rust/20" />
      </div>
    </section>
  );
}
