"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Slower timing for mobile banner - users need time to read
const MOBILE_BANNER_TIMING = {
  initialDelay: 4000, // 3 seconds before first swap
  cycleDelay: 6000, // 4.5 seconds between swaps
} as const;

// Only cycle through the domain examples (skip the product name)
const CYCLE_DOMAINS = [
  {
    text: "mario.backpocket.my",
    isCustom: false,
    href: "https://mario.backpocket.my",
  },
  {
    text: "backpocket.mariolopez.org",
    isCustom: true,
    href: "https://backpocket.mariolopez.org",
  },
] as const;

/**
 * Mobile-only banner that appears below the navbar to showcase
 * the subdomain/custom domain feature.
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
      currentIndex === 0
        ? MOBILE_BANNER_TIMING.initialDelay
        : MOBILE_BANNER_TIMING.cycleDelay;
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
      <a
        href={current.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2",
          // Opaque background with solid border
          "border-b bg-background",
          // Hover/active states for touch feedback
          "active:bg-muted/50 transition-colors",
          current.isCustom ? "border-mint/30" : "border-rust/30"
        )}
      >
        {/* Sparkle icon */}
        <Sparkles
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors duration-700",
            current.isCustom ? "text-mint" : "text-rust"
          )}
        />

        {/* Domain display with dashed underline */}
        <span className="relative font-mono text-sm truncate">
          <span
            className={cn(
              "font-semibold transition-colors duration-700",
              current.isCustom ? "text-mint" : "text-rust"
            )}
          >
            {current.text.split(".")[0]}
          </span>
          <span className="text-muted-foreground/60">.</span>
          <span className="text-muted-foreground">
            {current.text.split(".").slice(1).join(".")}
          </span>
          {/* Dashed underline - matches desktop AnimatedLogo */}
          <span
            className="absolute bottom-0 left-0 w-full border-b-2 border-dashed transition-colors duration-700"
            style={{
              borderBottomColor: current.isCustom
                ? "hsl(100 30% 65%)" // mint
                : "hsl(21 58% 51%)", // rust
            }}
          />
        </span>

        {/* Badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0",
            "transition-colors duration-700",
            current.isCustom
              ? "bg-mint/15 text-mint border border-mint/30"
              : "bg-rust/15 text-rust border border-rust/30"
          )}
        >
          {current.isCustom ? "your domain" : "free subdomain"}
        </span>
      </a>
    </div>
  );
}
