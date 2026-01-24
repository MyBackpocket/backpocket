"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ANIMATED_LOGO } from "@/lib/constants/animations";
import { cn } from "@/lib/utils";

// Only cycle through the domain examples (skip the product name)
const CYCLE_DOMAINS = [
  { text: "mario.backpocket.my", isCustom: false },
  { text: "backpocket.mariolopez.org", isCustom: true },
] as const;

/**
 * Mobile-only banner that appears below the navbar to showcase
 * the subdomain/custom domain feature. Syncs with AnimatedLogo timing.
 * Banner stays fixed and opaque - only the text content swaps.
 */
export function MobileDomainBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = CYCLE_DOMAINS[currentIndex];

  const advanceToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CYCLE_DOMAINS.length);
  }, []);

  useEffect(() => {
    // Start cycling after initial delay, then use cycle delay
    const delay =
      currentIndex === 0 ? ANIMATED_LOGO.initialDelay : ANIMATED_LOGO.cycleDelay;
    const timeout = setTimeout(advanceToNext, delay);
    return () => clearTimeout(timeout);
  }, [currentIndex, advanceToNext]);

  return (
    <div
      className={cn(
        // Mobile only - hidden on lg and above
        "lg:hidden",
        // Fixed positioning below navbar
        "fixed top-16 left-0 right-0 z-40"
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-center gap-2 px-4 py-2",
          // Opaque background with solid border
          "border-b bg-background",
          current.isCustom ? "border-mint/30" : "border-rust/30"
        )}
      >
        {/* Sparkle icon for custom domains */}
        <Sparkles
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors duration-200",
            current.isCustom ? "text-mint" : "text-rust"
          )}
        />

        {/* Domain display */}
        <span className="font-mono text-sm truncate">
          <span
            className={cn(
              "font-semibold transition-colors duration-200",
              current.isCustom ? "text-mint" : "text-rust"
            )}
          >
            {current.text.split(".")[0]}
          </span>
          <span className="text-muted-foreground/60">.</span>
          <span className="text-muted-foreground">
            {current.text.split(".").slice(1).join(".")}
          </span>
        </span>

        {/* Badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0",
            "transition-colors duration-200",
            current.isCustom
              ? "bg-mint/15 text-mint border border-mint/30"
              : "bg-rust/15 text-rust border border-rust/30"
          )}
        >
          {current.isCustom ? "your domain" : "free subdomain"}
        </span>
      </div>
    </div>
  );
}
