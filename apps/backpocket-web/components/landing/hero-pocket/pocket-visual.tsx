"use client";

import { Bookmark, Check, ExternalLink } from "lucide-react";
import { CollectionPanel } from "./collection-panel";
import { useSaveAnimation } from "./use-save-animation";

/**
 * Browser extension visual for desktop hero.
 * Shows browser chrome with extension button triggering a save.
 */
export function PocketVisual() {
  const { phase, saveCount, showNewCard, isFadingOut } = useSaveAnimation();

  return (
    <div className="relative">
      {/* Browser chrome simulation at top */}
      <div className="relative mb-3">
        <div className="rounded-xl border border-border/20 bg-card overflow-hidden shadow-sm">
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
              aria-label="Save to backpocket"
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
                ? "bg-[hsl(100_35%_38%)] text-white"
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
      <CollectionPanel
        phase={phase}
        saveCount={saveCount}
        showNewCard={showNewCard}
        isFadingOut={isFadingOut}
      />
    </div>
  );
}
