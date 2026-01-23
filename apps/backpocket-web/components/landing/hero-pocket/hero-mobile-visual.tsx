"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Rss,
  Share,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LogoIcon } from "@/components/logo";

// Faster timing for hero - keeps users engaged
const HERO_MOBILE_TIMING = {
  articleToShareSheet: 1200,
  shareSheetToSaved: 3000,
  savedToComplete: 4200,
  completeToReset: 6000,
  loopInterval: 6400,
} as const;

type HeroMobilePhase = "article" | "share-sheet" | "saved" | "complete";

/**
 * Hero-optimized mobile demo with live site preview.
 * Side-by-side layout: tall iPhone on left, live preview peeking from right edge.
 */
export function HeroMobileVisual() {
  const [phase, setPhase] = useState<HeroMobilePhase>("article");
  const [showNewCard, setShowNewCard] = useState(false);

  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      setPhase("article");
      setShowNewCard(false);

      timeoutIds.push(
        setTimeout(() => setPhase("share-sheet"), HERO_MOBILE_TIMING.articleToShareSheet)
      );
      timeoutIds.push(
        setTimeout(() => {
          setPhase("saved");
          setShowNewCard(true);
        }, HERO_MOBILE_TIMING.shareSheetToSaved)
      );
      timeoutIds.push(
        setTimeout(() => setPhase("complete"), HERO_MOBILE_TIMING.savedToComplete)
      );
      timeoutIds.push(
        setTimeout(() => {
          setPhase("article");
          setShowNewCard(false);
        }, HERO_MOBILE_TIMING.completeToReset)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, HERO_MOBILE_TIMING.loopInterval);

    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  const isSaved = phase === "saved" || phase === "complete";

  return (
    <div className="relative flex items-start justify-center gap-3 sm:gap-4">
      {/* iPhone Frame - Full height */}
      <div className="relative w-[220px] sm:w-[260px] shrink-0">
        <div className="relative rounded-[2.5rem] sm:rounded-[3rem] border-[10px] sm:border-[12px] border-border bg-muted shadow-2xl overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 sm:h-7 bg-foreground rounded-full z-20" />

          {/* Screen Content - Full height */}
          <div className="relative bg-background min-h-[420px] sm:min-h-[480px] overflow-hidden">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-12 sm:pt-14 pb-2 text-foreground text-xs font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-foreground/90 rounded-sm" />
                  <div className="w-1 h-2.5 bg-foreground/90 rounded-sm" />
                  <div className="w-1 h-3 bg-foreground/60 rounded-sm" />
                  <div className="w-1 h-3.5 bg-foreground/40 rounded-sm" />
                </div>
                <div className="w-5 h-2.5 border border-foreground/40 rounded-sm relative ml-1">
                  <div
                    className="absolute inset-0.5 bg-mint rounded-sm"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Article View */}
              {(phase === "article" || phase === "share-sheet") && (
                <motion.div
                  key="article"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0.3 }}
                  className="px-4 sm:px-5 pb-4"
                >
                  {/* Safari header */}
                  <div className="flex items-center gap-2 text-rust text-xs mb-3">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    <span>Safari</span>
                  </div>

                  {/* URL Bar */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50 mb-4">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate">proofofcorn.com</span>
                  </div>

                  {/* Article header image */}
                  <div className="h-24 sm:h-28 rounded-xl bg-linear-to-br from-amber-100 via-orange-100 to-yellow-50 mb-3 flex items-center justify-center">
                    <span className="text-4xl">🌽</span>
                  </div>

                  {/* Article content */}
                  <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight mb-2">
                    Can AI Grow Corn? A Deep Dive Into Agricultural ML
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-3">
                    by Sarah Chen · 8 min read
                  </p>
                  
                  {/* Article text placeholder */}
                  <div className="space-y-1.5 mb-4">
                    <div className="h-2 bg-muted/60 rounded w-full" />
                    <div className="h-2 bg-muted/60 rounded w-11/12" />
                    <div className="h-2 bg-muted/60 rounded w-full" />
                    <div className="h-2 bg-muted/60 rounded w-4/5" />
                  </div>

                  {/* Share button indicator */}
                  <div className="flex justify-center">
                    <div
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-medium transition-all ${
                        phase === "article"
                          ? "border-rust bg-rust/10 text-rust animate-pulse"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <Share className="w-3.5 h-3.5" />
                      <span>Tap to Share</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Success Screen */}
              {(phase === "saved" || phase === "complete") && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-background px-4 sm:px-5 pt-16 sm:pt-20 pb-4"
                >
                  <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-lg">
                        <LogoIcon size="lg" className="w-full h-full" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-base">×</span>
                      </div>
                    </div>

                    {/* Success indicator */}
                    <div className="flex justify-center mb-5">
                      <motion.div
                        className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-mint/20 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.25 }}
                        >
                          <Check className="w-8 sm:w-10 h-8 sm:h-10 text-mint" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    </div>

                    <motion.h3
                      className="text-foreground text-lg sm:text-xl font-semibold text-center mb-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      Saved to Backpocket!
                    </motion.h3>

                    <motion.div
                      className="flex justify-center mb-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs">
                        <Globe className="w-3.5 h-3.5" />
                        proofofcorn.com
                      </div>
                    </motion.div>

                    <motion.div
                      className="space-y-2.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                    >
                      <button
                        type="button"
                        className="w-full py-3 rounded-xl bg-amber text-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Saves
                      </button>
                      <button
                        type="button"
                        className="w-full py-3 rounded-xl bg-muted text-foreground font-medium text-sm"
                      >
                        Done
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* iOS Share Sheet Overlay */}
            <AnimatePresence>
              {phase === "share-sheet" && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute bottom-0 left-0 right-0 bg-card/98 rounded-t-3xl backdrop-blur-xl border-t border-border"
                >
                  {/* Drag indicator */}
                  <div className="flex justify-center pt-2.5 pb-2">
                    <div className="w-9 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>

                  {/* Share preview */}
                  <div className="mx-3 sm:mx-4 mb-3 p-2.5 bg-background rounded-xl flex items-center gap-2.5 border border-border/50">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber/30 to-rust/20 flex items-center justify-center text-lg shrink-0">
                      🌽
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        Can AI Grow Corn?
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">proofofcorn.com</p>
                    </div>
                  </div>

                  {/* App row */}
                  <div className="px-3 sm:px-4 pb-3">
                    <div className="flex gap-3">
                      {/* AirDrop */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                          <Share className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[9px] text-muted-foreground">AirDrop</span>
                      </div>
                      {/* Backpocket - Highlighted */}
                      <motion.div
                        className="flex flex-col items-center gap-1.5"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                      >
                        <motion.div
                          className="w-12 h-12 rounded-xl overflow-hidden shadow-lg"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(var(--rust), 0)",
                              "0 0 0 5px rgba(var(--rust), 0.4)",
                              "0 0 0 0 rgba(var(--rust), 0)",
                            ],
                          }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        >
                          <LogoIcon size="lg" className="w-full h-full" />
                        </motion.div>
                        <span className="text-[9px] text-rust font-medium">Backpocket</span>
                      </motion.div>
                      {/* Messages */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                        </div>
                        <span className="text-[9px] text-muted-foreground">Messages</span>
                      </div>
                      {/* Copy */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          <Copy className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="text-[9px] text-muted-foreground">Copy</span>
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center pb-2 pt-1">
                    <div className="w-28 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Phone reflection */}
        <div className="absolute -inset-4 bg-linear-to-b from-denim/5 to-transparent rounded-[3.5rem] -z-10 blur-xl" />
      </div>

      {/* Live Site Preview - Side panel, partially cut off */}
      <div className="relative w-[160px] sm:w-[180px] -mr-8 sm:-mr-12 self-center">
        <SideSitePreview showNewCard={showNewCard} isSaved={isSaved} />
      </div>
    </div>
  );
}

interface SideSitePreviewProps {
  showNewCard: boolean;
  isSaved: boolean;
}

/**
 * Vertical side panel showing live site with saves appearing in real-time.
 * Designed to be partially cut off on the right edge for visual effect.
 */
function SideSitePreview({ showNewCard, isSaved }: SideSitePreviewProps) {
  return (
    <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden shadow-lg">
      {/* Browser chrome dots */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 bg-muted/50 border-b border-border/50">
        <div className="w-2 h-2 rounded-full bg-rust/50" />
        <div className="w-2 h-2 rounded-full bg-amber/50" />
        <div className="w-2 h-2 rounded-full bg-mint/50" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-2.5 border-b border-border/50">
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-denim to-denim-deep flex items-center justify-center text-white text-[9px] font-bold shrink-0">
          M
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-foreground truncate">My Collection</p>
          <div className="flex items-center gap-1">
            <span
              className={`flex items-center gap-0.5 text-[8px] transition-all duration-300 ${
                isSaved ? "text-mint font-bold" : "text-muted-foreground"
              }`}
            >
              <Eye className="w-2.5 h-2.5" />
              {isSaved ? 5 : 4}
            </span>
            <Rss className="w-2.5 h-2.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* "Live" indicator */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/30 border-b border-border/30">
        <div className={`w-1.5 h-1.5 rounded-full ${isSaved ? "bg-mint animate-pulse" : "bg-muted-foreground/40"}`} />
        <span className="text-[8px] text-muted-foreground">live updates</span>
      </div>

      {/* Cards column */}
      <div className="p-2 space-y-2">
        {/* New card - animates in */}
        <div
          className={`rounded-lg border bg-background overflow-hidden transition-all duration-500 ${
            showNewCard
              ? "opacity-100 scale-100 translate-y-0 border-rust shadow-md"
              : "opacity-0 scale-95 -translate-y-2 border-transparent"
          }`}
        >
          <div className="h-14 bg-linear-to-br from-amber/30 to-rust/20 relative flex items-center justify-center">
            <span className="text-xl">🌽</span>
            <Bookmark className="absolute top-1.5 right-1.5 w-3 h-3 text-rust fill-current" />
          </div>
          <div className="p-2">
            <p className="text-[9px] font-semibold text-rust line-clamp-2 leading-tight">
              Can AI grow corn?
            </p>
            <p className="text-[8px] text-muted-foreground mt-0.5">proofofcorn.com</p>
          </div>
        </div>

        {/* Existing card 1 */}
        <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
          <div className="h-14 bg-linear-to-br from-slate-800 to-slate-900 relative">
            <Bookmark className="absolute top-1.5 right-1.5 w-3 h-3 text-white/60" />
          </div>
          <div className="p-2">
            <p className="text-[9px] font-medium text-foreground line-clamp-2 leading-tight">
              AGENTS.md Guide
            </p>
            <p className="text-[8px] text-muted-foreground mt-0.5">aihero.dev</p>
          </div>
        </div>

        {/* Existing card 2 */}
        <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
          <div className="h-14 bg-linear-to-br from-denim/20 to-teal/10 relative">
            <Bookmark className="absolute top-1.5 right-1.5 w-3 h-3 text-muted-foreground/60" />
          </div>
          <div className="p-2">
            <p className="text-[9px] font-medium text-foreground line-clamp-2 leading-tight">
              AWS Cost Tips
            </p>
            <p className="text-[8px] text-muted-foreground mt-0.5">github.com</p>
          </div>
        </div>

        {/* Existing card 3 - partially visible at bottom */}
        <div className="rounded-lg border border-border/60 bg-background overflow-hidden">
          <div className="h-14 bg-muted/50 flex items-center justify-center relative">
            <Bookmark className="w-5 h-5 text-muted-foreground/30" />
            <Bookmark className="absolute top-1.5 right-1.5 w-3 h-3 text-muted-foreground/60" />
          </div>
          <div className="p-2">
            <p className="text-[9px] font-medium text-foreground line-clamp-1">Design Systems</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">figma.com</p>
          </div>
        </div>
      </div>

      {/* Gradient fade at bottom to suggest more content */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-card to-transparent pointer-events-none" />
    </div>
  );
}
