"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Bookmark,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  Github,
  Globe,
  Link as LinkIcon,
  Lock,
  MoreHorizontal,
  Rss,
  Search,
  Share,
  Smartphone,
  Sun,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AndroidLogo from "@/assets/img/Android-Logo.svg";
import AppleLogo from "@/assets/img/Apple-Logo.svg";
import ChromeLogo from "@/assets/img/Chrome-Logo.svg";
import FirefoxLogo from "@/assets/img/Firefox-Logo.svg";
import { LogoIcon } from "@/components/logo";
import { externalLinks } from "@/lib/constants/links";
import { routes } from "@/lib/constants/routes";

// ============================================================================
// Browser Extension Animation
// ============================================================================

type BrowserPhase = "browsing" | "clicking" | "saving" | "saved" | "appearing";

const BROWSER_ARTICLE = {
  title: "The Future of AI in Software Development",
  url: "techcrunch.com/2026/01/future-ai-software",
  siteName: "TechCrunch",
};

function BrowserExtensionDemo() {
  const [phase, setPhase] = useState<BrowserPhase>("browsing");
  const [showNewCard, setShowNewCard] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.5 });

  useEffect(() => {
    if (!isInView) {
      setPhase("browsing");
      setShowNewCard(false);
      return;
    }

    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      setPhase("browsing");
      setShowNewCard(false);

      timeoutIds.push(setTimeout(() => setPhase("clicking"), 3000));
      timeoutIds.push(setTimeout(() => setPhase("saving"), 3600));
      timeoutIds.push(setTimeout(() => setPhase("saved"), 4500));
      timeoutIds.push(
        setTimeout(() => {
          setPhase("appearing");
          setShowNewCard(true);
        }, 5500)
      );
      timeoutIds.push(
        setTimeout(() => {
          setShowNewCard(false);
          setPhase("browsing");
        }, 10000)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, 10500);
    
    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative max-w-lg mx-auto">
      {/* Browser Window */}
      <div className="rounded-2xl border border-denim/25 bg-card shadow-2xl shadow-denim/10 overflow-hidden">
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-linear-to-b from-muted/60 to-muted/30 border-b border-border/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rust/70 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-amber/70 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-mint/70 shadow-inner" />
          </div>
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 border border-border/50">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                {BROWSER_ARTICLE.url}
              </span>
              {/* Extension Icon */}
              <motion.button
                type="button"
                className={`relative ml-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  phase === "clicking"
                    ? "bg-rust scale-110 shadow-lg shadow-rust/40"
                    : phase === "saving" || phase === "saved"
                      ? "bg-rust"
                      : "bg-denim/15 hover:bg-denim/25"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {phase === "saved" ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div key="bookmark">
                      <Bookmark
                        className={`w-4 h-4 transition-colors ${
                          phase === "clicking" || phase === "saving" ? "text-white" : "text-denim"
                        }`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {phase === "clicking" && (
                  <motion.span
                    className="absolute inset-0 rounded-lg bg-white/40"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Article Content Preview - Compact */}
        <div className="relative p-5 bg-linear-to-b from-background to-card">
          {/* Article hero */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-rust">{BROWSER_ARTICLE.siteName}</span>
              <span>·</span>
              <span>January 23, 2026</span>
            </div>
            <h3 className="text-xl font-serif font-medium leading-tight tracking-tight">{BROWSER_ARTICLE.title}</h3>
            <div className="h-20 rounded-lg bg-linear-to-br from-denim/10 via-rust/5 to-mint/10" />
            <div className="space-y-1.5">
              <div className="h-2.5 bg-muted/60 rounded-full w-full" />
              <div className="h-2.5 bg-muted/60 rounded-full w-5/6" />
            </div>
          </div>

          {/* Saving Toast - Positioned inside the article area */}
          <AnimatePresence>
            {(phase === "saving" || phase === "saved" || phase === "appearing") && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute top-4 right-4 z-10"
              >
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm border ${
                    phase === "saved" || phase === "appearing"
                      ? "bg-mint/95 text-white border-mint/50"
                      : "bg-card/95 border-border text-foreground"
                  }`}
                >
                  {phase === "saved" || phase === "appearing" ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                      <div className="text-sm font-medium">Saved to backpocket!</div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-denim border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      <div className="text-sm font-medium">Saving article...</div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collection Panel Below */}
      <motion.div
        className="mt-4 rounded-xl border border-denim/30 bg-card shadow-xl overflow-hidden"
        animate={{
          borderColor: showNewCard ? "rgb(var(--rust) / 0.4)" : "rgb(var(--denim) / 0.3)",
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-denim to-denim-deep flex items-center justify-center text-white text-sm font-bold shadow-md">
              M
            </div>
            <div>
              <p className="text-sm font-semibold">My Collection</p>
              <p className="text-[10px] text-muted-foreground">backpocket.my/mario</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-denim/10 text-muted-foreground"
              animate={{
                backgroundColor: showNewCard ? "rgb(var(--mint) / 0.2)" : "rgb(var(--denim) / 0.1)",
                color: showNewCard ? "rgb(var(--mint))" : undefined,
              }}
            >
              <Eye className="w-3 h-3" />
              <motion.span
                key={showNewCard ? "5" : "4"}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-semibold"
              >
                {showNewCard ? "5" : "4"}
              </motion.span>
            </motion.span>
            <Rss className="w-3.5 h-3.5 text-muted-foreground" />
            <Sun className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search saves...</span>
          </div>
        </div>

        {/* Cards Grid - Fixed 4 cards, first one transitions */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          {/* First card - transitions between new and placeholder */}
          <motion.div
            className={`rounded-xl overflow-hidden transition-all duration-300 ${
              showNewCard 
                ? "border-2 border-rust bg-background shadow-lg" 
                : "border border-border/60 bg-background"
            }`}
            animate={{ scale: showNewCard ? [0.95, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`h-16 relative transition-colors duration-300 ${
              showNewCard 
                ? "bg-linear-to-br from-rust/20 via-amber/10 to-denim/10" 
                : "bg-linear-to-br from-mint/15 to-emerald-500/10"
            }`}>
              <div className="absolute top-2 right-2">
                <Bookmark className={`w-3.5 h-3.5 transition-colors ${showNewCard ? "text-rust fill-current" : "text-muted-foreground/50"}`} />
              </div>
            </div>
            <div className="p-2.5">
              <p className={`text-[11px] font-medium line-clamp-2 leading-snug transition-colors ${showNewCard ? "text-rust" : "text-foreground"}`}>
                {showNewCard ? BROWSER_ARTICLE.title : "Building LLM Apps"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{showNewCard ? BROWSER_ARTICLE.siteName : "openai.com"}</p>
            </div>
          </motion.div>
          {/* Remaining 3 static cards */}
          {[
            { title: "Design Systems at Scale", source: "figma.com", gradient: "from-purple-500/15 to-pink-500/10" },
            { title: "React 19 Features", source: "react.dev", gradient: "from-sky-400/15 to-blue-500/10" },
            { title: "AWS Cost Optimization", source: "github.com", gradient: "from-denim/15 to-teal/10" },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-border/60 bg-background overflow-hidden"
            >
              <div className={`h-16 relative bg-linear-to-br ${card.gradient}`}>
                <div className="absolute top-2 right-2">
                  <Bookmark className="w-3.5 h-3.5 text-muted-foreground/50" />
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-medium line-clamp-2 leading-snug">{card.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{card.source}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Mobile App Animation (iOS Share Sheet Flow)
// ============================================================================

type MobilePhase = "article" | "share-sheet" | "app-opening" | "saved" | "complete";

function MobileAppDemo() {
  const [phase, setPhase] = useState<MobilePhase>("article");
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.5 });

  useEffect(() => {
    if (!isInView) {
      setPhase("article");
      return;
    }

    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      setPhase("article");

      timeoutIds.push(setTimeout(() => setPhase("share-sheet"), 2500));
      timeoutIds.push(setTimeout(() => setPhase("app-opening"), 6500));
      timeoutIds.push(setTimeout(() => setPhase("saved"), 7500));
      timeoutIds.push(setTimeout(() => setPhase("complete"), 9000));
      timeoutIds.push(setTimeout(() => setPhase("article"), 13000));
    };

    runAnimation();
    const interval = setInterval(runAnimation, 13500);
    
    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative flex justify-center">
      {/* iPhone Frame */}
      <div className="relative w-[280px] sm:w-[320px]">
        {/* Device Frame */}
        <div className="relative rounded-[2.5rem] sm:rounded-[3rem] border-10 sm:border-12 border-zinc-900 dark:border-zinc-800 bg-black shadow-2xl shadow-black/30 overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 sm:h-7 bg-black rounded-full z-20" />

          {/* Screen Content */}
          <div className="relative bg-zinc-950 min-h-[460px] sm:min-h-[520px] overflow-hidden">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-14 sm:pt-16 pb-2 text-white text-xs font-medium">
              <span>15:16</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-white/90 rounded-sm" />
                  <div className="w-1 h-2.5 bg-white/90 rounded-sm" />
                  <div className="w-1 h-3 bg-white/60 rounded-sm" />
                  <div className="w-1 h-3.5 bg-white/40 rounded-sm" />
                </div>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
                </svg>
                <div className="flex items-center">
                  <div className="w-6 h-3 border border-white/40 rounded-sm relative">
                    <div className="absolute inset-0.5 bg-mint rounded-sm" style={{ width: "80%" }} />
                  </div>
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
                  className="px-4 sm:px-5 pb-6"
                >
                  {/* Back button */}
                  <div className="flex items-center gap-2 text-rust text-sm mb-4">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>Safari</span>
                  </div>

                  {/* Author */}
                  <div className="text-rust text-base sm:text-lg font-medium italic mb-3">Nikola Balic</div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    <div className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      MD
                    </div>
                    <motion.div
                      className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs flex items-center gap-1"
                      animate={
                        phase === "article"
                          ? {
                              borderColor: ["rgb(63 63 70)", "rgb(var(--rust))", "rgb(63 63 70)"],
                            }
                          : {}
                      }
                      transition={{ duration: 1.5, repeat: phase === "article" ? Number.POSITIVE_INFINITY : 0 }}
                    >
                      <Share className="w-3 h-3" />
                      Share
                    </motion.div>
                  </div>

                  {/* Date */}
                  <div className="text-zinc-500 text-xs mb-3">Published on January 15, 2026</div>

                  {/* Title */}
                  <h2 className="text-white text-xl sm:text-2xl font-serif font-medium leading-tight tracking-tight mb-3">
                    The Agentic AI Handbook: Production-Ready Patterns
                  </h2>

                  {/* Author byline */}
                  <div className="text-zinc-400 text-sm mb-4">
                    by <span className="text-rust">Nikola Balić</span>
                  </div>

                  {/* Description */}
                  <div className="text-rust/80 text-sm italic">
                    TL;DR {">"}{">"}  113 patterns collected from public
                  </div>
                </motion.div>
              )}

              {/* App Success Screen */}
              {(phase === "app-opening" || phase === "saved" || phase === "complete") && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-zinc-950 px-4 pt-20 pb-6"
                >
                  {/* Modal Card */}
                  <div className="bg-zinc-900/95 rounded-3xl p-5 sm:p-6 border border-zinc-800 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                      <LogoIcon size="md" className="shadow-lg" />
                      <button type="button" className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-zinc-400 text-lg">×</span>
                      </button>
                    </div>

                    {/* Success Animation */}
                    <div className="flex justify-center mb-5 sm:mb-6">
                      <motion.div
                        className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-mint/20 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.4 }}
                        >
                          <Check className="w-8 sm:w-10 h-8 sm:h-10 text-mint" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    </div>

                    <motion.h3
                      className="text-white text-lg sm:text-xl font-semibold text-center mb-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      Saved to Backpocket!
                    </motion.h3>

                    {/* Domain badge */}
                    <motion.div
                      className="flex justify-center mb-5 sm:mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 text-sm">
                        <Globe className="w-4 h-4" />
                        nibzard.com
                      </div>
                    </motion.div>

                    {/* Action buttons */}
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <button type="button" className="w-full py-3 sm:py-4 rounded-xl bg-amber/90 text-zinc-900 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base">
                        <ExternalLink className="w-4 sm:w-5 h-4 sm:h-5" />
                        View Saves
                      </button>
                      <button type="button" className="w-full py-3 sm:py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm sm:text-base">
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
                  className="absolute bottom-0 left-0 right-0 bg-zinc-900/98 rounded-t-3xl backdrop-blur-xl border-t border-zinc-700"
                >
                  {/* Share sheet header */}
                  <div className="p-3 sm:p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-linear-to-br from-zinc-700 to-zinc-800 flex items-center justify-center overflow-hidden">
                        <Globe className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs sm:text-sm font-medium truncate">The Agentic AI Handbook: Produc...</p>
                        <p className="text-zinc-500 text-[10px] sm:text-xs">nibzard.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Apps row */}
                  <div className="px-3 sm:px-4 py-3">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto">
                      {/* AirDrop */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                          <Share className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-zinc-400">AirDrop</span>
                      </div>
                      {/* Backpocket - Highlighted */}
                      <motion.div
                        className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                      >
                        <motion.div
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl overflow-hidden shadow-lg"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(var(--rust), 0)",
                              "0 0 0 6px rgba(var(--rust), 0.4)",
                              "0 0 0 0 rgba(var(--rust), 0)",
                            ],
                          }}
                          transition={{ duration: 1.2, delay: 0.5 }}
                        >
                          <LogoIcon size="lg" className="w-full h-full" />
                        </motion.div>
                        <span className="text-[8px] sm:text-[9px] text-rust font-medium">Backpocket</span>
                      </motion.div>
                      {/* Messages */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-md">
                          <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-zinc-400">Messages</span>
                      </div>
                      {/* Mail */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-blue-400 flex items-center justify-center shadow-md">
                          <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-zinc-400">Mail</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="px-3 sm:px-4 py-3 border-t border-zinc-800">
                    <div className="flex gap-2 sm:gap-3">
                      {[
                        { name: "Copy", Icon: Copy },
                        { name: "Bookmark", Icon: Bookmark },
                        { name: "More", Icon: MoreHorizontal },
                      ].map((action) => (
                        <div key={action.name} className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]">
                          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <action.Icon className="w-4 sm:w-5 h-4 sm:h-5 text-zinc-400" />
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-zinc-400 text-center">{action.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center pb-2 pt-1">
                    <div className="w-28 sm:w-32 h-1 rounded-full bg-zinc-600" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Phone reflection/glow */}
        <div className="absolute -inset-4 bg-linear-to-b from-denim/5 to-transparent rounded-[4rem] -z-10 blur-2xl" />
      </div>
    </div>
  );
}

// ============================================================================
// Web App Animation (Paste URL Flow)
// ============================================================================

type WebPhase = "empty" | "pasting" | "processing" | "saved" | "complete";

const WEB_ARTICLE = {
  title: "Understanding React Server Components",
  url: "https://vercel.com/blog/react-server-components",
  siteName: "Vercel Blog",
};

function WebAppDemo() {
  const [phase, setPhase] = useState<WebPhase>("empty");
  const [inputText, setInputText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.5 });

  useEffect(() => {
    if (!isInView) {
      setPhase("empty");
      setInputText("");
      return;
    }

    const timeoutIds: NodeJS.Timeout[] = [];
    let typeIntervalId: NodeJS.Timeout | null = null;

    const runAnimation = () => {
      setPhase("empty");
      setInputText("");

      // Start pasting
      timeoutIds.push(
        setTimeout(() => {
          setPhase("pasting");
          // Type out the URL character by character
          const url = WEB_ARTICLE.url;
          let i = 0;
          typeIntervalId = setInterval(() => {
            if (i < url.length) {
              setInputText(url.slice(0, i + 1));
              i++;
            } else {
              if (typeIntervalId) clearInterval(typeIntervalId);
            }
          }, 30);
        }, 1500)
      );

      timeoutIds.push(setTimeout(() => setPhase("processing"), 3500));
      timeoutIds.push(setTimeout(() => setPhase("saved"), 4500));
      timeoutIds.push(setTimeout(() => setPhase("complete"), 6000));
      timeoutIds.push(
        setTimeout(() => {
          setPhase("empty");
          setInputText("");
        }, 9000)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, 9500);
    
    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
      if (typeIntervalId) clearInterval(typeIntervalId);
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative max-w-lg mx-auto">
      {/* Web App Window */}
      <div className="rounded-2xl border border-denim/25 bg-card shadow-2xl shadow-denim/10 overflow-hidden">
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-linear-to-b from-muted/60 to-muted/30 border-b border-border/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rust/70 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-amber/70 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-mint/70 shadow-inner" />
          </div>
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 border border-border/50">
              <Lock className="w-4 h-4 text-mint" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                backpocket.my/app
              </span>
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="p-6 bg-linear-to-b from-background to-card min-h-[300px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LogoIcon size="sm" />
              <span className="font-semibold text-lg">My Saves</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-denim to-denim-deep flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
            </div>
          </div>

          {/* Add URL Input */}
          <div className="mb-6">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
              phase === "pasting" || phase === "processing"
                ? "border-rust bg-rust/5"
                : phase === "saved"
                  ? "border-mint bg-mint/5"
                  : "border-border bg-muted/30"
            }`}>
              <LinkIcon className={`w-5 h-5 transition-colors ${
                phase === "pasting" || phase === "processing"
                  ? "text-rust"
                  : phase === "saved"
                    ? "text-mint"
                    : "text-muted-foreground"
              }`} />
              <div className="flex-1 min-w-0">
                {inputText ? (
                  <span className="text-sm text-foreground truncate block">{inputText}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Paste a URL to save...</span>
                )}
              </div>
              {phase === "processing" && (
                <motion.div
                  className="w-5 h-5 border-2 border-rust border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              )}
              {phase === "saved" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="w-5 h-5 text-mint" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Recent Saves Grid */}
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recent Saves</div>
            
            <AnimatePresence>
              {(phase === "saved" || phase === "complete") && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-mint/30 bg-mint/5"
                >
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-denim" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{WEB_ARTICLE.title}</p>
                    <p className="text-xs text-muted-foreground">{WEB_ARTICLE.siteName}</p>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-mint/20 text-mint text-xs font-medium">New</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Existing saves */}
            {[
              { title: "Building with Next.js 15", source: "nextjs.org", gradient: "from-zinc-500/15 to-zinc-600/10" },
              { title: "TypeScript Best Practices", source: "typescript.org", gradient: "from-blue-500/15 to-sky-500/10" },
            ].map((save) => (
              <div
                key={save.title}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background"
              >
                <div className={`w-12 h-12 rounded-lg bg-linear-to-br ${save.gradient} flex items-center justify-center shrink-0`}>
                  <Bookmark className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{save.title}</p>
                  <p className="text-xs text-muted-foreground">{save.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Platform Cards Component
// ============================================================================

interface PlatformCardProps {
  name: string;
  description: string;
  logo: React.ReactNode;
  gradient: string;
  status: "available" | "development";
  href?: string;
  repoHref?: string;
}

function PlatformCard({ name, description, logo, gradient, status, href, repoHref }: PlatformCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-dashed border-denim/30 bg-card/50 p-5 sm:p-6 text-center transition-all hover:border-denim/50 hover:bg-card">
      <div className="absolute inset-0 bg-linear-to-br from-denim/5 via-transparent to-rust/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className={`mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-linear-to-br ${gradient}`}>
          {logo}
        </div>
        <h3 className="mb-1 text-base sm:text-lg font-semibold">{name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-col items-center gap-2">
          {status === "available" ? (
            <Link
              href={href || "#"}
              className="inline-flex items-center rounded-full bg-mint/15 px-3 py-1 text-xs font-medium text-mint hover:bg-mint/25 transition-colors"
            >
              Available Now
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-full bg-denim/10 px-3 py-1 text-xs font-medium text-denim">
              In Development
            </span>
          )}
          {repoHref && (
            <a
              href={repoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              View source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Section Component
// ============================================================================

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-16 md:py-24 overflow-hidden bg-linear-to-b from-background via-card/30 to-background"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rust/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-denim/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-mint/5 rounded-full blur-3xl" />
      </div>

      {/* Decorative stitching at top */}
      <div className="absolute top-8 inset-x-0 border-t-2 border-dashed border-rust/15" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-rust/25 bg-rust/5 px-5 py-2 text-sm mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Globe className="h-4 w-4 text-rust" />
            </motion.div>
            <span className="text-rust font-medium">How it works</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6"
          >
            Save from <span className="text-rust italic">anywhere</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            One click from your browser. One tap from your phone. Paste in the app. Your collection grows effortlessly.
          </motion.p>
        </div>

        {/* Demos - Vertically Stacked */}
        <div className="space-y-20 md:space-y-28">
          {/* Browser Extension Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-denim/10 text-denim text-sm font-medium mb-4">
                <Bookmark className="w-4 h-4" />
                Browser Extension
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">Click to save</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Save any article with one click. Works on Chrome, Firefox, and Safari.
              </p>
            </div>
            <BrowserExtensionDemo />
          </motion.div>

          {/* Mobile App Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint text-sm font-medium mb-4">
                <Smartphone className="w-4 h-4" />
                Mobile App
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">Share to save</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Use the native share sheet on iOS and Android to save on the go.
              </p>
            </div>
            <MobileAppDemo />
          </motion.div>

          {/* Web App Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber/10 text-amber text-sm font-medium mb-4">
                <Globe className="w-4 h-4" />
                Web App
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">Paste to save</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Just paste any URL directly in the web app. No extension needed.
              </p>
            </div>
            <WebAppDemo />
          </motion.div>
        </div>

        {/* Platform Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 md:mt-28"
        >
          <div className="text-center mb-10">
            <h3 className="text-xl md:text-2xl font-semibold mb-2">Available platforms</h3>
            <p className="text-muted-foreground">Choose how you want to save</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Web */}
            <PlatformCard
              name="Web"
              description="Any browser"
              logo={<Globe className="h-7 w-7 sm:h-8 sm:w-8 text-denim" />}
              gradient="from-denim/20 to-teal/15"
              status="available"
              href={routes.signUp}
            />
            
            {/* Chrome */}
            <PlatformCard
              name="Chrome"
              description="Extension"
              logo={<Image src={ChromeLogo} alt="Chrome" className="h-8 w-8 sm:h-9 sm:w-9" />}
              gradient="from-amber/20 via-rust/10 to-mint/20"
              status="development"
              repoHref={externalLinks.browserExtensionRepo}
            />

            {/* Firefox */}
            <PlatformCard
              name="Firefox"
              description="Extension"
              logo={<Image src={FirefoxLogo} alt="Firefox" className="h-8 w-8 sm:h-9 sm:w-9" />}
              gradient="from-rust/25 to-amber/20"
              status="development"
              repoHref={externalLinks.browserExtensionRepo}
            />

            {/* iOS */}
            <PlatformCard
              name="iOS"
              description="iPhone & iPad"
              logo={<Image src={AppleLogo} alt="Apple" className="h-7 w-auto sm:h-8 dark:invert-0 invert" />}
              gradient="from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700"
              status="development"
              repoHref={externalLinks.mobileAppRepo}
            />

            {/* Android */}
            <PlatformCard
              name="Android"
              description="Phone & Tablet"
              logo={<Image src={AndroidLogo} alt="Android" className="h-5 w-auto sm:h-6" />}
              gradient="from-mint/25 to-teal/20"
              status="development"
              repoHref={externalLinks.mobileAppRepo}
            />
          </div>
        </motion.div>
      </div>

      {/* Decorative stitching at bottom */}
      <div className="absolute bottom-8 inset-x-0 border-b-2 border-dashed border-rust/15" />
    </section>
  );
}
