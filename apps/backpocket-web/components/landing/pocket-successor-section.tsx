"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";

export function PocketSuccessorSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Editorial paper texture background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      {/* Decorative diagonal lines - newspaper feel */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-foreground" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
      </div>

      {/* Scattered decorative elements */}
      <div className="absolute top-12 right-[15%] w-24 h-24 border border-dashed border-rust/20 rounded-full opacity-40 hidden lg:block" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        {/* Main editorial layout */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left column - The "obituary" card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Stacked paper effect */}
              <div className="absolute -bottom-2 -right-2 w-full h-full bg-parchment/50 border border-border/50 rounded-2xl rotate-1 hidden sm:block" />
              <div className="absolute -bottom-1 -right-1 w-full h-full bg-card/70 border border-border/50 rounded-2xl rotate-[0.5deg] hidden sm:block" />
              
              {/* Main card */}
              <div className="relative bg-card border-2 border-border rounded-2xl p-6 sm:p-8 shadow-denim-lg">
                {/* Obituary-style header */}
                <div className="mb-6 pb-4 border-b-2 border-dashed border-rust/30">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 font-medium">
                    January 2025
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium text-foreground leading-tight">
                    So long, <span className="text-rust italic">Pocket</span>
                  </h3>
                </div>

                {/* Quote block */}
                <blockquote className="relative pl-4 border-l-4 border-rust/40 mb-6">
                  <p className="text-sm sm:text-base text-muted-foreground italic leading-relaxed">
                    &ldquo;After careful consideration, we&apos;ve made the difficult decision to phase out Pocket — our read-it-later and content discovery app.&rdquo;
                  </p>
                  <footer className="mt-3 text-xs text-muted-foreground/70">
                    — Mozilla, January 2025
                  </footer>
                </blockquote>

                {/* Link to source */}
                <a
                  href="https://getpocket.com/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-denim hover:text-denim-deep transition-colors group"
                >
                  <span className="underline decoration-denim/30 underline-offset-4 group-hover:decoration-denim/60">
                    Read the announcement
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>

              </div>
            </div>
          </div>

          {/* Right column - The successor pitch */}
          <div className="lg:col-span-7 lg:pl-4">
            {/* Main headline */}
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] mb-6">
              <span className="text-foreground">Your bookmarks</span>
              <br />
              <span className="text-foreground">deserve a </span>
              <span className="relative inline-block">
                <span className="text-rust">new home</span>
                {/* Hand-drawn underline */}
                <svg
                  className="absolute -bottom-1 left-0 w-full h-2.5 text-rust/50"
                  viewBox="0 0 200 10"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 7 C 40 3, 80 9, 120 5 S 170 2, 198 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Backpocket picks up where Pocket left off — with{" "}
              <span className="text-foreground font-medium">your own public space</span> to share
              curated finds,{" "}
              <span className="text-foreground font-medium">simple organization</span>, and{" "}
              <span className="text-foreground font-medium">full control</span> over what&apos;s
              public or private.
            </p>

            {/* Feature comparison - editorial style */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {/* Unique features - stars (now first!) */}
              {[
                "Your own subdomain",
                "Build a public reading list",
              ].map((label) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-rust/15 text-rust">
                    ★
                  </span>
                  <span className="text-foreground">{label}</span>
                </div>
              ))}
              {/* Core features - checkmarks */}
              {[
                "Save articles & links",
                "Read without distractions",
                "Tags & collections",
                "You control visibility",
              ].map((label) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-mint/15 text-[hsl(100_35%_38%)]">
                    ✓
                  </span>
                  <span className="text-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href={routes.signUp}>
              <Button
                size="lg"
                className="h-12 px-6 text-sm rounded-xl shadow-lg shadow-rust/15 hover:shadow-xl hover:shadow-rust/25 transition-all"
              >
                Start your collection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

          </div>
        </div>
      </div>
    </section>
  );
}
