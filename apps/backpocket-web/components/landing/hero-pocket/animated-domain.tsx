"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface AnimatedDomainProps {
  domains: { url: string; isCustom: boolean }[];
}

export function AnimatedDomain({ domains }: AnimatedDomainProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let transitionTimeout: NodeJS.Timeout;

    const interval = setInterval(() => {
      setIsVisible(false);
      transitionTimeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % domains.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(transitionTimeout);
    };
  }, [domains.length]);

  const currentDomain = domains[currentIndex];

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span className="shrink-0">Your URL</span>
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
          currentDomain.isCustom
            ? "bg-mint/10 border border-mint/20"
            : "bg-denim/8 border border-denim/15"
        }`}
      >
        <span
          className={`w-2 h-2 shrink-0 rounded-full transition-colors duration-300 ${
            currentDomain.isCustom ? "bg-mint" : "bg-rust"
          }`}
        />
        <code
          className={`font-mono font-medium whitespace-nowrap transition-all duration-300 ${
            currentDomain.isCustom ? "text-mint" : "text-rust"
          } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
        >
          {currentDomain.url}
        </code>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-mint/10 text-mint font-medium border-2 border-dashed border-mint/40 transition-all duration-300 ${
          currentDomain.isCustom && isVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        fully custom domain
      </span>
    </div>
  );
}
