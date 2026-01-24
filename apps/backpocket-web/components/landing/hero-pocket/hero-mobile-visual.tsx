"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
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
    <div className="relative flex flex-col items-center gap-4 overflow-visible">
      {/* Main row: iPhone + Web sync indicator */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* iPhone Frame */}
        <div className="relative w-[220px] sm:w-[260px] shrink-0">
        <div className="relative rounded-[2.5rem] sm:rounded-[3rem] border-[10px] sm:border-[12px] border-border bg-muted shadow-2xl overflow-hidden">
          {/* Dynamic Island with camera details */}
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 sm:h-7 bg-black rounded-full z-20 flex items-center justify-end pr-1.5 sm:pr-2 gap-1">
            {/* Face ID sensor */}
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
            {/* Front camera */}
            <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800 flex items-center justify-center">
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-zinc-700" />
            </div>
          </div>

{/* Screen Content - Fixed height to prevent layout shifts */}
            <div className="relative bg-background h-[460px] sm:h-[540px] overflow-hidden">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-12 sm:pt-14 pb-2 text-foreground text-xs font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex items-end gap-0.5">
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
                  className="px-4 sm:px-5 pb-2"
                >
                  {/* Safari header */}
                  <div className="flex items-center gap-2 text-rust text-[11px] mb-1.5">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    <span>Safari</span>
                  </div>

                  {/* URL Bar */}
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/50 mb-2">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate">proofofcorn.com</span>
                  </div>

                  {/* Article header image */}
                  <div className="h-16 sm:h-20 rounded-lg bg-linear-to-br from-amber-100 via-orange-100 to-yellow-50 mb-2 flex items-center justify-center">
                    <span className="text-2xl">🌽</span>
                  </div>

                  {/* Article content */}
                  <h3 className="text-[13px] sm:text-sm font-bold text-foreground leading-tight mb-1">
                    Can AI Grow Corn? A Deep Dive Into Agricultural ML
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-2">
                    by Sarah Chen · 8 min read
                  </p>

                  {/* Share button indicator */}
                  <div className="flex justify-center mb-2">
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
                  
                  {/* Article text placeholder - extends off screen */}
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-muted/60 rounded w-full" />
                    <div className="h-1.5 bg-muted/60 rounded w-11/12" />
                    <div className="h-1.5 bg-muted/60 rounded w-full" />
                    <div className="h-1.5 bg-muted/60 rounded w-4/5" />
                    <div className="h-1.5 bg-muted/60 rounded w-full" />
                    <div className="h-1.5 bg-muted/60 rounded w-10/12" />
                    <div className="h-1.5 bg-muted/60 rounded w-full" />
                    <div className="h-1.5 bg-muted/60 rounded w-3/4" />
                    <div className="h-1.5 bg-muted/60 rounded w-full" />
                    <div className="h-1.5 bg-muted/60 rounded w-11/12" />
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
                  className="absolute inset-0 bg-background px-4 sm:px-5 flex items-center justify-center"
                >
                  <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg">
                        <LogoIcon size="lg" className="w-full h-full" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">×</span>
                      </div>
                    </div>

                    {/* Success indicator */}
                    <div className="flex justify-center mb-3">
                      <motion.div
                        className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-mint/20 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.25 }}
                        >
                          <Check className="w-7 sm:w-8 h-7 sm:h-8 text-mint" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    </div>

                    <motion.h3
                      className="text-foreground text-base sm:text-lg font-semibold text-center mb-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      Saved to Backpocket!
                    </motion.h3>

                    <motion.div
                      className="flex justify-center mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px]">
                        <Globe className="w-3 h-3" />
                        proofofcorn.com
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                    >
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl bg-amber text-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Saves
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

        {/* Web sync panel - right side, fully visible */}
        <div className="w-[140px] sm:w-[160px] shrink-0">
          <WebSyncPanel showNewCard={showNewCard} isSaved={isSaved} />
        </div>
      </div>
    </div>
  );
}

interface WebSyncPanelProps {
  showNewCard: boolean;
  isSaved: boolean;
}

/**
 * Compact web sync panel showing saves syncing to the web.
 * Fully visible on the right side of the iPhone.
 */
function WebSyncPanel({ showNewCard, isSaved }: WebSyncPanelProps) {
  return (
    <div className="relative">
      {/* Connection line from phone to web */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center">
        <motion.div
          className="w-3 h-0.5 bg-gradient-to-r from-transparent to-mint"
          animate={{ opacity: isSaved ? 1 : 0.3 }}
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-lg">
        {/* Header */}
        <div className="px-3 py-2 bg-muted/40 border-b border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Globe className="w-3 h-3 text-denim" />
            <span className="text-[9px] font-medium text-foreground">Web</span>
          </div>
          <p className="text-[8px] text-muted-foreground">mario.backpocket.my</p>
        </div>

        {/* Sync status */}
        <div className="px-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-1.5">
            <motion.div
              className={`w-2 h-2 rounded-full ${isSaved ? "bg-mint" : "bg-muted-foreground/30"}`}
              animate={isSaved ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            />
            <span className={`text-[9px] font-medium ${isSaved ? "text-mint" : "text-muted-foreground"}`}>
              {isSaved ? "Synced!" : "Waiting..."}
            </span>
          </div>
        </div>

        {/* Saved items list */}
        <div className="p-2 space-y-1.5">
          {/* New save - appears when saved */}
          <motion.div
            initial={false}
            animate={{
              height: showNewCard ? "auto" : 0,
              opacity: showNewCard ? 1 : 0,
              marginBottom: showNewCard ? 6 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rust/10 border border-rust/30">
              <div className="w-6 h-6 rounded bg-amber/20 flex items-center justify-center shrink-0">
                <span className="text-xs">🌽</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-semibold text-rust truncate">AI Corn</p>
                <p className="text-[7px] text-muted-foreground">Just now</p>
              </div>
            </div>
          </motion.div>

          {/* Existing saves */}
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30">
            <div className="w-6 h-6 rounded bg-slate-800 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-medium text-foreground truncate">AGENTS.md</p>
              <p className="text-[7px] text-muted-foreground">2h ago</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30">
            <div className="w-6 h-6 rounded bg-denim/20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-medium text-foreground truncate">AWS Tips</p>
              <p className="text-[7px] text-muted-foreground">1d ago</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 bg-muted/20 border-t border-border/30">
          <p className="text-[7px] text-muted-foreground text-center">
            {isSaved ? "3 saves" : "2 saves"} synced
          </p>
        </div>
      </div>
    </div>
  );
}
