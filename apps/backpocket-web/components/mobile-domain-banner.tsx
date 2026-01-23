"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ANIMATED_LOGO } from "@/lib/constants/animations";
import { cn } from "@/lib/utils";

const CYCLE_DOMAINS = [
  { text: "backpocket", isProduct: true, isCustom: false },
  { text: "mario.backpocket.my", isProduct: false, isCustom: false },
  { text: "backpocket.mariolopez.org", isProduct: false, isCustom: true },
] as const;

/**
 * Mobile-only banner that appears below the navbar to showcase
 * the subdomain/custom domain feature. Syncs with AnimatedLogo timing.
 */
export function MobileDomainBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"visible" | "morphing">("visible");

  const current = CYCLE_DOMAINS[currentIndex];

  const advanceToNext = useCallback(() => {
    setPhase("morphing");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % CYCLE_DOMAINS.length);
      setPhase("visible");
    }, ANIMATED_LOGO.morphDuration);
  }, []);

  useEffect(() => {
    const delay =
      currentIndex === 0 ? ANIMATED_LOGO.initialDelay : ANIMATED_LOGO.cycleDelay;
    const timeout = setTimeout(advanceToNext, delay);
    return () => clearTimeout(timeout);
  }, [currentIndex, advanceToNext]);

  // Only show banner for non-product domains (subdomains and custom domains)
  const isVisible = !current.isProduct && phase === "visible";

  return (
    <div
      className={cn(
        // Mobile only - hidden on sm and above
        "sm:hidden",
        // Fixed positioning below navbar
        "fixed top-16 left-0 right-0 z-40",
        // Transitions
        "transition-all duration-300 ease-out",
        // Visibility
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-center gap-2 px-4 py-2",
          "border-b bg-background/95 backdrop-blur-sm",
          // Color based on domain type
          current.isCustom
            ? "border-mint/20 bg-mint/5"
            : "border-rust/20 bg-rust/5"
        )}
      >
        {/* Sparkle icon for custom domains */}
        {current.isCustom && (
          <Sparkles className="w-3.5 h-3.5 text-mint animate-pulse shrink-0" />
        )}

        {/* Domain display */}
        <span className="font-mono text-sm truncate">
          <span
            className={cn(
              "font-semibold",
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
            current.isCustom
              ? "bg-mint/15 text-mint border border-mint/30"
              : "bg-rust/15 text-rust border border-rust/30"
          )}
        >
          {current.isCustom ? (
            <>
              <Sparkles className="w-2.5 h-2.5" />
              your domain
            </>
          ) : (
            "free subdomain"
          )}
        </span>
      </div>
    </div>
  );
}
