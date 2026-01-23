"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import logo64 from "@/assets/img/Backpocket-Logo-64.webp";
import { ANIMATED_LOGO } from "@/lib/constants/animations";
import { cn } from "@/lib/utils";

const CYCLE_DOMAINS = [
  { text: "backpocket", isProduct: true, isCustom: false, href: "/" },
  {
    text: "mario.backpocket.my",
    isProduct: false,
    isCustom: false,
    href: "https://mario.backpocket.my",
  },
  {
    text: "backpocket.mariolopez.org",
    isProduct: false,
    isCustom: true,
    href: "https://backpocket.mariolopez.org",
  },
] as const;

// Tailwind sm breakpoint
const SM_BREAKPOINT = 640;

interface AnimatedLogoProps {
  className?: string;
  paused?: boolean;
}

export function AnimatedLogo({ className, paused = false }: AnimatedLogoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"visible" | "morphing">("visible");
  const [isPaused, setIsPaused] = useState(paused);
  const [isMobile, setIsMobile] = useState(false);

  const current = CYCLE_DOMAINS[currentIndex];

  // Detect mobile viewport - disable animation on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < SM_BREAKPOINT);
    };

    // Check on mount
    checkMobile();

    // Listen for resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const advanceToNext = useCallback(() => {
    setPhase("morphing");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % CYCLE_DOMAINS.length);
      setPhase("visible");
    }, ANIMATED_LOGO.morphDuration);
  }, []);

  useEffect(() => {
    // Don't animate on mobile or when paused
    if (isPaused || isMobile) return;

    const delay =
      currentIndex === 0 ? ANIMATED_LOGO.initialDelay : ANIMATED_LOGO.cycleDelay;
    const timeout = setTimeout(advanceToNext, delay);
    return () => clearTimeout(timeout);
  }, [currentIndex, isPaused, isMobile, advanceToNext]);

  const isExternal = !current.isProduct;
  const LinkComponent = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { href: current.href, target: "_blank", rel: "noopener noreferrer" }
    : { href: current.href };

  return (
    <LinkComponent
      {...linkProps}
      className={cn(
        "inline-flex items-center gap-2 group select-none transition-opacity hover:opacity-80 overflow-hidden",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(paused)}
    >
      {/* Logo icon - always visible */}
      <span className="relative shrink-0">
        <Image
          src={logo64}
          alt="backpocket"
          width={32}
          height={32}
          className={cn(
            "rounded-lg transition-all duration-300",
            !current.isProduct && "scale-90 opacity-80"
          )}
          priority
        />
        {/* Custom domain sparkle indicator */}
        {current.isCustom && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-mint animate-pulse" />
          </span>
        )}
      </span>

      {/* Animated text container */}
      <span className="relative overflow-hidden min-w-0 truncate">
        {/* Main text with morphing animation */}
        <span
          className={cn(
            "inline-flex items-baseline font-mono text-base tracking-tight transition-all duration-300 ease-out",
            phase === "morphing" && "opacity-0 translate-y-2 blur-[2px]",
            phase === "visible" && "opacity-100 translate-y-0 blur-0"
          )}
        >
          {current.isProduct ? (
            // Product name styling
            <span className="font-semibold font-sans text-lg text-foreground">backpocket</span>
          ) : (
            // Domain styling with visual treatment
            <>
              <span
                className={cn(
                  "font-semibold transition-colors",
                  current.isCustom ? "text-mint" : "text-rust"
                )}
              >
                {current.text.split(".")[0]}
              </span>
              <span className="font-semibold text-muted-foreground/60">.</span>
              <span className="font-semibold text-muted-foreground">
                {current.text.split(".").slice(1).join(".")}
              </span>
            </>
          )}
        </span>

        {/* Dashed underline that appears for domains - matches denim stitching aesthetic */}
        <span
          className="absolute bottom-0 left-0 border-b-2 border-dashed transition-all duration-500 ease-out"
          style={{
            width: current.isProduct ? 0 : "100%",
            borderBottomColor: current.isProduct
              ? "transparent"
              : current.isCustom
                ? "hsl(100 30% 65%)" // mint
                : "hsl(21 58% 51%)", // rust
          }}
        />
      </span>

      {/* "Your domain" badge that fades in for custom domains - hidden on mobile */}
      <span
        className={cn(
          "hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full transition-all duration-300 whitespace-nowrap shrink-0",
          current.isCustom && phase === "visible"
            ? "opacity-100 translate-x-0 bg-mint/15 text-mint border border-mint/30"
            : "opacity-0 -translate-x-2 pointer-events-none"
        )}
      >
        <Sparkles className="w-2.5 h-2.5" />
        your domain
      </span>
    </LinkComponent>
  );
}
