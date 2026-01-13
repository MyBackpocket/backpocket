"use client";

import type { ReactNode } from "react";

interface AnimatedBrowserFrameProps {
  url: string;
  children: ReactNode;
}

export function AnimatedBrowserFrame({ url, children }: AnimatedBrowserFrameProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-denim/20 bg-card shadow-denim">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-rust/60" />
          <div className="h-3 w-3 rounded-full bg-amber/60" />
          <div className="h-3 w-3 rounded-full bg-mint/60" />
        </div>
        {/* URL bar */}
        <div className="ml-2 flex-1">
          <div className="flex items-center gap-2 rounded-md bg-background/60 px-3 py-1.5">
            <div className="h-3 w-3 rounded-full border border-denim/30" />
            <span className="text-xs text-muted-foreground truncate">{url}</span>
          </div>
        </div>
      </div>
      {/* Browser content */}
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
