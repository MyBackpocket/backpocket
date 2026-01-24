"use client";

import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
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
      <div className="absolute bottom-20 left-[10%] w-16 h-16 border-2 border-dashed border-denim/15 rotate-12 hidden lg:block" />
      
      <div className="relative mx-auto max-w-6xl px-6">
        {/* Main editorial layout */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left column - The "obituary" card */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Stacked paper effect */}
              <div className="absolute -bottom-2 -right-2 w-full h-full bg-parchment/50 border border-border/50 rounded-2xl rotate-1 hidden sm:block" />
              <div className="absolute -bottom-1 -right-1 w-full h-full bg-card/70 border border-border/50 rounded-2xl rotate-[0.5deg] hidden sm:block" />
              
              {/* Main card */}
              <div className="relative bg-card border-2 border-border rounded-2xl p-6 sm:p-8 shadow-denim-lg">
                {/* Decorative corner fold */}
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden rounded-tr-2xl">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-muted via-muted to-transparent transform rotate-0 origin-top-right" />
                  <div className="absolute top-1 right-1 w-10 h-10 border-b border-l border-border/30 transform -rotate-45 translate-x-5 -translate-y-1" />
                </div>

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
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20">
              <Sparkles className="w-3.5 h-3.5 text-mint" />
              <span className="text-xs font-medium text-mint uppercase tracking-wider">The successor</span>
            </div>

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
              Backpocket picks up where Pocket left off — with a focus on{" "}
              <span className="text-foreground font-medium">privacy</span>,{" "}
              <span className="text-foreground font-medium">simplicity</span>, and the option to{" "}
              <span className="text-foreground font-medium">share your curated finds</span> at your own URL.
            </p>

            {/* Feature comparison - editorial style */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { label: "Save articles & links", icon: "✓" },
                { label: "Read without distractions", icon: "✓" },
                { label: "Tags & collections", icon: "✓" },
                { label: "Optional public sharing", icon: "★" },
                { label: "Your own subdomain", icon: "★" },
                { label: "Privacy by default", icon: "✓" },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    feature.icon === "★" 
                      ? "bg-rust/15 text-rust" 
                      : "bg-mint/15 text-mint"
                  }`}>
                    {feature.icon}
                  </span>
                  <span className="text-foreground">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={routes.signUp}>
                <Button
                  size="lg"
                  className="h-12 px-6 text-sm rounded-xl shadow-lg shadow-rust/15 hover:shadow-xl hover:shadow-rust/25 transition-all"
                >
                  Start your collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-sm rounded-xl border-2"
                >
                  See all features
                </Button>
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
