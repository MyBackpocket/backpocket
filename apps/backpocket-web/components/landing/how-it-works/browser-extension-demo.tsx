"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { Bookmark, Check, Eye, Globe, Rss, Search, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BROWSER_ARTICLE, type BrowserPhase } from "./constants";

export function BrowserExtensionDemo() {
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
            <h3 className="text-xl font-serif font-medium leading-tight tracking-tight">
              {BROWSER_ARTICLE.title}
            </h3>
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
                        transition={{
                          duration: 0.8,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
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
              <p className="text-[10px] text-muted-foreground">mario.backpocket.my</p>
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
          {/* First card - smooth transition between states */}
          <div
            className={`rounded-xl overflow-hidden transition-all duration-500 ease-out ${
              showNewCard
                ? "border-2 border-rust bg-background shadow-lg"
                : "border border-border/60 bg-background"
            }`}
          >
            <div
              className={`h-16 relative transition-all duration-500 ease-out ${
                showNewCard
                  ? "bg-linear-to-br from-rust/20 via-amber/10 to-denim/10"
                  : "bg-linear-to-br from-mint/15 to-emerald-500/10"
              }`}
            >
              <div className="absolute top-2 right-2">
                <Bookmark
                  className={`w-3.5 h-3.5 transition-colors duration-500 ${showNewCard ? "text-rust fill-current" : "text-muted-foreground/50"}`}
                />
              </div>
            </div>
            <div className="p-2.5">
              <p
                className={`text-[11px] font-medium line-clamp-2 leading-snug transition-colors duration-500 ${showNewCard ? "text-rust" : "text-foreground"}`}
              >
                {showNewCard ? BROWSER_ARTICLE.title : "Building LLM Apps"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 transition-opacity duration-500">
                {showNewCard ? BROWSER_ARTICLE.siteName : "openai.com"}
              </p>
            </div>
          </div>
          {/* Remaining 3 static cards */}
          {[
            {
              title: "Design Systems at Scale",
              source: "figma.com",
              gradient: "from-purple-500/15 to-pink-500/10",
            },
            {
              title: "React 19 Features",
              source: "react.dev",
              gradient: "from-sky-400/15 to-blue-500/10",
            },
            {
              title: "AWS Cost Optimization",
              source: "github.com",
              gradient: "from-denim/15 to-teal/10",
            },
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
