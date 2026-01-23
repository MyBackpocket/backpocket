"use client";

import { ArrowRight, Bookmark, Check, Eye, ExternalLink, Rss, Search, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthLoading, SignedIn, SignedOut } from "@/components/auth-components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_ROOT_DOMAIN } from "@/lib/config/public";
import { externalLinks } from "@/lib/constants/links";
import { routes } from "@/lib/constants/routes";

const SAVE_CARDS = [
  { 
    title: "A Complete Guide To AGENTS.md",
    source: "aihero.dev",
    hasImage: true,
    imageColor: "from-slate-800 to-slate-900",
  },
  { 
    title: "Design Systems at Scale",
    source: "figma.com",
    hasImage: false,
  },
  { 
    title: "AWS Cost Optimization",
    source: "github.com",
    hasImage: true,
    imageColor: "from-denim/20 to-teal/10",
  },
  { 
    title: "React 19 Features",
    source: "react.dev",
    hasImage: true,
    imageColor: "from-sky-400/20 to-blue-500/10",
  },
] as const;

const domains = [
  { url: `mario.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
  { url: "links.yoursite.com", isCustom: true },
  { url: `jackie.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
  { url: `your-name.${DEFAULT_ROOT_DOMAIN}`, isCustom: false },
];

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
              A modern <PocketLink /> alternative: save articles, videos, and links privately. <span className="text-foreground font-medium">Optionally share select saves</span> at your own URL — if and when you choose. No followers, no likes, no algorithms.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <AuthLoading>
                <Skeleton className="h-14 w-[180px] rounded-xl" />
                <Skeleton className="h-14 w-[140px] rounded-xl" />
              </AuthLoading>
              <SignedOut>
                <Link href={routes.signUp}>
                  <Button size="lg" className="h-14 px-8 text-base rounded-xl shadow-lg shadow-rust/20 hover:shadow-xl hover:shadow-rust/30 transition-all">
                    Start your collection
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-xl border-2">
                    See how it works
                  </Button>
                </a>
              </SignedOut>
              <SignedIn>
                <Link href={routes.app.root}>
                  <Button size="lg" className="h-14 px-8 text-base rounded-xl shadow-lg shadow-rust/20">
                    Open your library
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
            </div>

            {/* Domain preview */}
            <div className="mt-12">
              <p className="text-sm text-muted-foreground mb-3">If you choose to share, get your own URL:</p>
              <AnimatedDomain domains={domains} />
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

// Animation phases for the save demo
type AnimationPhase = "idle" | "clicking" | "saving" | "saved" | "appearing";

function PocketVisual() {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [saveCount, setSaveCount] = useState(4);
  const [showNewCard, setShowNewCard] = useState(false);

  // Animation sequence loop with proper cleanup
  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      // Phase 1: Idle (show current state)
      setPhase("idle");
      setShowNewCard(false);
      
      timeoutIds.push(
        setTimeout(() => {
          // Phase 2: Click extension
          setPhase("clicking");
        }, 2000)
      );

      timeoutIds.push(
        setTimeout(() => {
          // Phase 3: Saving indicator
          setPhase("saving");
        }, 2500)
      );

      timeoutIds.push(
        setTimeout(() => {
          // Phase 4: Saved confirmation
          setPhase("saved");
          setSaveCount(5);
        }, 3200)
      );

      timeoutIds.push(
        setTimeout(() => {
          // Phase 5: Card appears
          setPhase("appearing");
          setShowNewCard(true);
        }, 3800)
      );

      timeoutIds.push(
        setTimeout(() => {
          // Reset for next loop
          setSaveCount(4);
          setShowNewCard(false);
          setPhase("idle");
        }, 6500)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, 7000);
    
    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative">
      {/* Browser chrome simulation at top */}
      <div className="relative mb-3">
        <div className="rounded-xl border border-denim/20 bg-card overflow-hidden shadow-sm">
          {/* Browser tab bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b border-border/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rust/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-mint/60" />
            </div>
            <div className="flex-1 mx-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/60 text-[10px] text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">proofofcorn.com/can-ai-grow-corn</span>
              </div>
            </div>
            {/* Extension icon */}
            <button
              type="button"
              className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                phase === "clicking" 
                  ? "bg-rust scale-110 shadow-lg shadow-rust/30" 
                  : phase === "saving" || phase === "saved"
                    ? "bg-rust"
                    : "bg-denim/20 hover:bg-denim/30"
              }`}
            >
              {phase === "saved" ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Bookmark className={`w-4 h-4 transition-colors ${phase === "clicking" || phase === "saving" ? "text-white" : "text-denim"}`} />
              )}
              {/* Click ripple effect */}
              {phase === "clicking" && (
                <span className="absolute inset-0 rounded-lg bg-white/30 animate-ping" />
              )}
            </button>
          </div>
        </div>
        
        {/* Saving toast notification - outside overflow-hidden container */}
        <div className={`absolute top-10 right-3 z-50 transition-all duration-300 ${
          phase === "saving" || phase === "saved" 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-xl text-xs font-medium ${
            phase === "saved" 
              ? "bg-mint text-white" 
              : "bg-card border border-border text-foreground"
          }`}>
            {phase === "saved" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to collection!</span>
              </>
            ) : (
              <>
                <div className="w-3.5 h-3.5 border-2 border-denim border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Collection panel */}
      <div className="relative rounded-2xl overflow-hidden shadow-denim-lg border border-denim/30">
        {/* Stitching borders */}
        <div className="absolute inset-x-0 top-2 border-t-2 border-dashed border-denim/30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-2 border-b-2 border-dashed border-denim/30 pointer-events-none" />

        <div className="relative bg-card overflow-hidden">
          {/* Public space header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-denim to-denim-deep flex items-center justify-center text-white text-xs font-bold shadow-sm">
                M
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">My Cool Collection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-all duration-300 ${
                phase === "saved" || phase === "appearing" 
                  ? "bg-mint/20 text-mint" 
                  : "bg-denim/10 text-muted-foreground"
              }`}>
                <Eye className="w-3 h-3" />
                <span className={phase === "saved" || phase === "appearing" ? "font-bold" : ""}>{saveCount}</span>
              </span>
              <Rss className="w-3.5 h-3.5 text-muted-foreground" />
              <Sun className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Search saves...</span>
            </div>
          </div>

          {/* Cards grid */}
          <div className="px-4 pb-4 grid grid-cols-2 gap-2.5">
            {/* New card that appears */}
            {showNewCard && (
              <div className="rounded-lg border-2 border-rust bg-background overflow-hidden shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-16 relative bg-linear-to-br from-amber/30 to-rust/20">
                  <div className="absolute top-1.5 right-1.5 text-rust">
                    <Bookmark className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-medium text-rust line-clamp-2 leading-tight">Can AI grow corn?</p>
                  <p className="text-[9px] text-muted-foreground mt-1">proofofcorn.com</p>
                </div>
              </div>
            )}
            {/* Existing cards - show fewer when new card appears */}
            {(showNewCard ? SAVE_CARDS.slice(1) : SAVE_CARDS).map((card, index) => (
              <SaveCard 
                key={card.title} 
                card={card} 
                isActive={false}
                index={index}
                onHover={() => {}}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SaveCardProps {
  card: {
    title: string;
    source: string;
    hasImage: boolean;
    imageColor?: string;
  };
  isActive: boolean;
  index: number;
  onHover: () => void;
}

function SaveCard({ card, isActive, index, onHover }: SaveCardProps) {
  return (
    <div 
      className={`rounded-lg border bg-background overflow-hidden transition-all duration-300 cursor-pointer ${
        isActive 
          ? "border-rust/50 shadow-md scale-[1.02] -translate-y-0.5" 
          : "border-border/60 hover:border-border"
      }`}
      style={{ 
        animationDelay: `${index * 100}ms`,
      }}
      onMouseEnter={onHover}
    >
      {/* Image area */}
      <div className={`h-16 relative ${card.hasImage ? `bg-linear-to-br ${card.imageColor}` : "bg-muted/30"}`}>
        {!card.hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-muted-foreground/40" />
          </div>
        )}
        <div className={`absolute top-1.5 right-1.5 transition-colors ${isActive ? "text-rust" : "text-muted-foreground/60"}`}>
          <Bookmark className="w-3 h-3" />
        </div>
      </div>
      {/* Card content */}
      <div className="p-2">
        <p className={`text-[10px] font-medium line-clamp-2 leading-tight transition-colors ${isActive ? "text-rust" : "text-foreground"}`}>
          {card.title}
        </p>
        <p className="text-[9px] text-muted-foreground mt-1 truncate">{card.source}</p>
      </div>
    </div>
  );
}


function AnimatedDomain({ domains }: { domains: { url: string; isCustom: boolean }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let transitionTimeout: NodeJS.Timeout;
    
    const interval = setInterval(() => {
      setIsVisible(false);
      transitionTimeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % domains.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(transitionTimeout);
    };
  }, [domains.length]);

  const currentDomain = domains[currentIndex];

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span className="shrink-0">Your URL</span>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
        currentDomain.isCustom 
          ? "bg-mint/10 border border-mint/20" 
          : "bg-denim/8 border border-denim/15"
      }`}>
        <span className={`w-2 h-2 shrink-0 rounded-full transition-colors duration-300 ${
          currentDomain.isCustom ? "bg-mint" : "bg-rust"
        }`} />
        <code
          className={`font-mono font-medium whitespace-nowrap transition-all duration-300 ${
            currentDomain.isCustom ? "text-mint" : "text-rust"
          } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
        >
          {currentDomain.url}
        </code>
      </div>
      <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-mint/10 text-mint font-medium border-2 border-dashed border-mint/40 transition-all duration-300 ${
        currentDomain.isCustom && isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
      }`}>
        <Sparkles className="w-3.5 h-3.5" />
        fully custom domain
      </span>
    </div>
  );
}

function PocketLink() {
  return (
    <a 
      href={externalLinks.pocketShutdown}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground font-medium decoration-2 decoration-dashed decoration-rust/50 underline underline-offset-4 hover:decoration-rust hover:text-rust transition-colors"
    >
      Pocket
    </a>
  );
}

