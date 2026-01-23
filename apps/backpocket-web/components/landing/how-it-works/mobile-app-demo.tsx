"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Bookmark,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  MoreHorizontal,
  Share,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoIcon } from "@/components/logo";
import type { MobilePhase } from "./constants";

export function MobileAppDemo() {
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
        {/* Device Frame - uses CSS variables for theme responsiveness */}
        <div className="relative rounded-[2.5rem] sm:rounded-[3rem] border-10 sm:border-12 border-border bg-muted shadow-2xl shadow-black/20 overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 sm:h-7 bg-foreground rounded-full z-20" />

          {/* Screen Content */}
          <div className="relative bg-background min-h-[460px] sm:min-h-[520px] overflow-hidden">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-14 sm:pt-16 pb-2 text-foreground text-xs font-medium">
              <span>15:16</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-foreground/90 rounded-sm" />
                  <div className="w-1 h-2.5 bg-foreground/90 rounded-sm" />
                  <div className="w-1 h-3 bg-foreground/60 rounded-sm" />
                  <div className="w-1 h-3.5 bg-foreground/40 rounded-sm" />
                </div>
                <svg
                  className="w-4 h-4 text-foreground"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
                </svg>
                <div className="flex items-center">
                  <div className="w-6 h-3 border border-foreground/40 rounded-sm relative">
                    <div
                      className="absolute inset-0.5 bg-mint rounded-sm"
                      style={{ width: "80%" }}
                    />
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
                  <div className="text-rust text-base sm:text-lg font-medium italic mb-3">
                    Nikola Balic
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    <div className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground text-xs flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      MD
                    </div>
                    <div
                      className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-muted-foreground text-xs flex items-center gap-1 transition-colors duration-500 ${
                        phase === "article"
                          ? "border-rust animate-pulse"
                          : "border-border"
                      }`}
                    >
                      <Share className="w-3 h-3" />
                      Share
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-muted-foreground text-xs mb-3">Published on January 15, 2026</div>

                  {/* Title */}
                  <h2 className="text-foreground text-xl sm:text-2xl font-serif font-medium leading-tight tracking-tight mb-3">
                    The Agentic AI Handbook: Production-Ready Patterns
                  </h2>

                  {/* Author byline */}
                  <div className="text-muted-foreground text-sm mb-4">
                    by <span className="text-rust">Nikola Balić</span>
                  </div>

                  {/* Description */}
                  <div className="text-rust/80 text-sm italic">
                    TL;DR {">"}
                    {">"} 113 patterns collected from public
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
                  className="absolute inset-0 bg-background px-4 pt-20 pb-6"
                >
                  {/* Modal Card */}
                  <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                      <LogoIcon size="md" className="shadow-lg" />
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                      >
                        <span className="text-muted-foreground text-lg">×</span>
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
                      className="text-foreground text-lg sm:text-xl font-semibold text-center mb-3"
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
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
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
                      <button
                        type="button"
                        className="w-full py-3 sm:py-4 rounded-xl bg-amber text-foreground font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <ExternalLink className="w-4 sm:w-5 h-4 sm:h-5" />
                        View Saves
                      </button>
                      <button
                        type="button"
                        className="w-full py-3 sm:py-4 rounded-xl bg-muted text-foreground font-semibold text-sm sm:text-base"
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
                  {/* Share sheet header */}
                  <div className="p-3 sm:p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs sm:text-sm font-medium truncate">
                          The Agentic AI Handbook: Produc...
                        </p>
                        <p className="text-muted-foreground text-[10px] sm:text-xs">nibzard.com</p>
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
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground">AirDrop</span>
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
                        <span className="text-[8px] sm:text-[9px] text-rust font-medium">
                          Backpocket
                        </span>
                      </motion.div>
                      {/* Messages */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-md">
                          <svg
                            className="w-5 sm:w-6 h-5 sm:h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground">Messages</span>
                      </div>
                      {/* Mail */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-blue-400 flex items-center justify-center shadow-md">
                          <svg
                            className="w-5 sm:w-6 h-5 sm:h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground">Mail</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="px-3 sm:px-4 py-3 border-t border-border">
                    <div className="flex gap-2 sm:gap-3">
                      {[
                        { name: "Copy", Icon: Copy },
                        { name: "Bookmark", Icon: Bookmark },
                        { name: "More", Icon: MoreHorizontal },
                      ].map((action) => (
                        <div
                          key={action.name}
                          className="flex flex-col items-center gap-1.5 min-w-[44px] sm:min-w-[50px]"
                        >
                          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-muted flex items-center justify-center">
                            <action.Icon className="w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-muted-foreground text-center">
                            {action.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center pb-2 pt-1">
                    <div className="w-28 sm:w-32 h-1 rounded-full bg-muted-foreground/30" />
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
