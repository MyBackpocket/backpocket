"use client";

import { Bookmark, Check, ExternalLink, Eye, Rss, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { type AnimationPhase, SAVE_CARDS } from "./constants";

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
      <div
        className={`h-16 relative ${card.hasImage ? `bg-linear-to-br ${card.imageColor}` : "bg-muted/30"}`}
      >
        {!card.hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-muted-foreground/40" />
          </div>
        )}
        <div
          className={`absolute top-1.5 right-1.5 transition-colors ${isActive ? "text-rust" : "text-muted-foreground/60"}`}
        >
          <Bookmark className="w-3 h-3" />
        </div>
      </div>
      {/* Card content */}
      <div className="p-2">
        <p
          className={`text-[10px] font-medium line-clamp-2 leading-tight transition-colors ${isActive ? "text-rust" : "text-foreground"}`}
        >
          {card.title}
        </p>
        <p className="text-[9px] text-muted-foreground mt-1 truncate">{card.source}</p>
      </div>
    </div>
  );
}

export function PocketVisual() {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [saveCount, setSaveCount] = useState(4);
  const [showNewCard, setShowNewCard] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Animation sequence loop with proper cleanup
  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      // Reset state
      setPhase("idle");
      setShowNewCard(false);
      setIsFadingOut(false);

      // Step 1: Click button + "Saving..." indicator
      timeoutIds.push(
        setTimeout(() => {
          setPhase("saving");
        }, 2000)
      );

      // Step 2: "Saved!" confirmation + card appears
      timeoutIds.push(
        setTimeout(() => {
          setPhase("saved");
          setSaveCount(5);
          setShowNewCard(true);
        }, 3000)
      );

      // Step 3: Start fade out
      timeoutIds.push(
        setTimeout(() => {
          setPhase("fading");
          setIsFadingOut(true);
        }, 6000)
      );

      // Step 4: Reset for next loop
      timeoutIds.push(
        setTimeout(() => {
          setSaveCount(4);
          setShowNewCard(false);
          setIsFadingOut(false);
          setPhase("idle");
        }, 7000)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, 7500);

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
                phase === "saving" || phase === "saved"
                  ? "bg-rust"
                  : "bg-denim/20 hover:bg-denim/30"
              }`}
            >
              {phase === "saved" ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Bookmark
                  className={`w-4 h-4 transition-colors ${phase === "saving" ? "text-white" : "text-denim"}`}
                />
              )}
            </button>
          </div>
        </div>

        {/* Saving toast notification - outside overflow-hidden container */}
        <div
          className={`absolute top-10 right-3 z-50 transition-all duration-300 ${
            phase === "saving" || phase === "saved"
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-xl text-xs font-medium ${
              phase === "saved"
                ? "bg-mint text-white"
                : "bg-card border border-border text-foreground"
            }`}
          >
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
              <span
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-all duration-300 ${
                  phase === "saved"
                    ? "bg-mint/20 text-mint"
                    : "bg-denim/10 text-muted-foreground"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span className={phase === "saved" ? "font-bold" : ""}>
                  {saveCount}
                </span>
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
            {/* New card - always rendered, controlled by opacity/transform */}
            <div
              className={`rounded-lg border-2 bg-background overflow-hidden shadow-md transition-all duration-500 ease-out ${
                showNewCard
                  ? isFadingOut
                    ? "opacity-0 scale-95 border-rust"
                    : "opacity-100 scale-100 translate-y-0 border-rust"
                  : "opacity-0 scale-95 -translate-y-2 border-transparent"
              }`}
              style={{ visibility: showNewCard || isFadingOut ? "visible" : "hidden" }}
            >
              <div className="h-16 relative bg-linear-to-br from-amber/30 to-rust/20">
                <div className="absolute top-1.5 right-1.5 text-rust">
                  <Bookmark className="w-3 h-3 fill-current" />
                </div>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-medium text-rust line-clamp-2 leading-tight">
                  Can AI grow corn?
                </p>
                <p className="text-[9px] text-muted-foreground mt-1">proofofcorn.com</p>
              </div>
            </div>
            {/* Existing cards - always show 3 to leave room for new card slot */}
            {SAVE_CARDS.slice(1).map((card, index) => (
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
