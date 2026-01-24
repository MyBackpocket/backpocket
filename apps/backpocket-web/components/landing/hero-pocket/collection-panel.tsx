"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Eye, Rss, Search, Sun } from "lucide-react";
import type { AnimationPhase } from "./constants";
import { SAVE_CARDS } from "./constants";

// Cards that are always shown (3 cards)
const ALWAYS_VISIBLE_CARDS = SAVE_CARDS.slice(1, 4);
// The 4th card that only shows when new card is NOT visible
const FOURTH_CARD = SAVE_CARDS[4];

interface CollectionPanelProps {
  phase: AnimationPhase;
  saveCount: number;
  showNewCard: boolean;
  isFadingOut: boolean;
  /** Optional: render without the stitching border decorations */
  minimal?: boolean;
}

/**
 * Shared collection panel showing saved cards with animation.
 * Used by both browser extension and iPhone share visuals.
 */
export function CollectionPanel({
  phase: _phase,
  saveCount,
  showNewCard,
  isFadingOut: _isFadingOut,
  minimal = false,
}: CollectionPanelProps) {
  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden ${
        minimal ? "border border-border/50" : "shadow-denim-lg border border-denim/30"
      }`}
      animate={{
        borderColor: showNewCard ? "rgb(var(--rust) / 0.4)" : minimal ? "rgb(var(--border) / 0.5)" : "rgb(var(--denim) / 0.3)",
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Stitching borders - only show if not minimal */}
      {!minimal && (
        <>
          <div className="absolute inset-x-0 top-2 border-t-2 border-dashed border-denim/30 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-2 border-b-2 border-dashed border-denim/30 pointer-events-none" />
        </>
      )}

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
            <motion.span
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
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
                {saveCount}
              </motion.span>
            </motion.span>
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

        {/* Cards grid - Animated card insertion */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2.5">
          <AnimatePresence mode="popLayout">
            {/* New card - slides in from top when saved */}
            {showNewCard && (
              <motion.div
                key="new-card"
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  layout: { type: "spring", stiffness: 400, damping: 30 },
                }}
                className="rounded-lg overflow-hidden border-2 border-rust bg-background shadow-xl shadow-rust/40 ring-4 ring-rust/20"
              >
                <div className="h-16 relative bg-linear-to-br from-amber/30 to-rust/20">
                  <div className="absolute top-1.5 right-1.5 text-rust">
                    <Bookmark className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-medium text-rust line-clamp-2 leading-tight">
                    PoE2 Mercenary Build Tier List
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">poe2.wiki</p>
                </div>
              </motion.div>
            )}
            {/* Existing cards - shift positions when new card appears */}
            {[
              ...ALWAYS_VISIBLE_CARDS,
              ...(!showNewCard ? [FOURTH_CARD] : []),
            ].map((card, index) => (
              <motion.div
                key={card.id}
                layout
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: showNewCard ? index * 0.05 : 0,
                }}
                className="rounded-lg border border-border/60 bg-background overflow-hidden"
              >
                {/* Image area */}
                <div
                  className={`h-16 relative ${card.hasImage ? `bg-linear-to-br ${card.imageColor}` : "bg-muted/30"}`}
                >
                  {!card.hasImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Bookmark className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5 text-muted-foreground/60">
                    <Bookmark className="w-3 h-3" />
                  </div>
                </div>
                {/* Card content */}
                <div className="p-2">
                  <p className="text-[10px] font-medium line-clamp-2 leading-tight text-foreground">
                    {card.title}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1 truncate">{card.source}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
