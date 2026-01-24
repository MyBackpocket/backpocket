"use client";

import { useInView } from "framer-motion";
import { Bookmark, ChevronRight, Eye, Rss } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RSS_FEED_DEMO } from "@/lib/constants/animations";
import { NEW_RSS_ITEM, RSS_ITEMS, type RssPhase } from "./constants";

export function RssFeedDemo() {
  const [phase, setPhase] = useState<RssPhase>("idle");
  const [showNewItem, setShowNewItem] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.5 });

  useEffect(() => {
    if (!isInView) {
      setPhase("idle");
      setShowNewItem(false);
      return;
    }

    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      setPhase("idle");
      setShowNewItem(false);

      // Step 1: Show "saving" indicator
      timeoutIds.push(setTimeout(() => setPhase("saving"), RSS_FEED_DEMO.idleToSaving));

      // Step 2: New item appears in feed
      timeoutIds.push(
        setTimeout(() => {
          setPhase("updating");
          setShowNewItem(true);
        }, RSS_FEED_DEMO.savingToUpdating)
      );

      // Step 3: Complete
      timeoutIds.push(setTimeout(() => setPhase("complete"), RSS_FEED_DEMO.updatingToComplete));

      // Step 4: Reset
      timeoutIds.push(
        setTimeout(() => {
          setPhase("idle");
          setShowNewItem(false);
        }, RSS_FEED_DEMO.completeToReset)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, RSS_FEED_DEMO.loopInterval);

    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Mini Collection Card */}
        <div className="w-full md:w-64 shrink-0">
          <div className="rounded-xl border border-denim/25 bg-card shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-denim to-denim-deep flex items-center justify-center text-white text-[10px] font-bold">
                  M
                </div>
                <span className="text-xs font-medium">My Collection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{showNewItem ? "4" : "3"}</span>
              </div>
            </div>

            {/* Save cards - fixed height container to prevent layout shift */}
            <div className="p-2 space-y-1.5 h-[180px] overflow-hidden">
              {/* New item that appears - fixed height slot */}
              <div className="h-[52px] overflow-hidden">
                <div
                  className={`transition-all duration-500 ease-out ${
                    showNewItem ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  }`}
                >
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-rust/10 border border-rust/30">
                    <div className="w-8 h-8 rounded bg-linear-to-br from-amber/40 to-rust/30 flex items-center justify-center">
                      <Bookmark className="w-3 h-3 text-rust" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-rust truncate">{NEW_RSS_ITEM.title}</p>
                      <p className="text-[9px] text-muted-foreground">{NEW_RSS_ITEM.source}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing items */}
              {RSS_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                >
                  <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
                    <Bookmark className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium truncate">{item.title}</p>
                    <p className="text-[9px] text-muted-foreground">{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saving indicator - fixed height container */}
          <div className="h-[28px] mt-3 overflow-hidden">
            <div
              className={`flex items-center justify-center gap-2 transition-all duration-300 ${
                phase === "saving" ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="w-3 h-3 border-2 border-denim border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-denim font-medium">Saving new link...</span>
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="hidden md:flex items-center justify-center py-8">
          <div
            className={`transition-all duration-500 ${
              phase === "updating" || phase === "complete"
                ? "opacity-100 translate-x-0"
                : "opacity-30 -translate-x-2"
            }`}
          >
            <ChevronRight className="w-6 h-6 text-rust" />
          </div>
        </div>

        {/* RSS Feed Window */}
        <div className="flex-1 w-full">
          <div className="rounded-xl bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/10">
            {/* Window Title Bar */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <Rss className="w-3 h-3 text-rust" />
                <span className="text-[10px] font-medium text-slate-300">rss.xml</span>
              </div>
              <span
                className={`text-[8px] px-1.5 py-0.5 rounded transition-all duration-300 ${
                  phase === "updating"
                    ? "bg-mint/20 text-mint"
                    : "bg-transparent text-slate-500"
                }`}
              >
                {phase === "updating" ? "Updated!" : "Auto-generated"}
              </span>
            </div>

            {/* RSS Content Preview - Code Editor Style */}
            <div className="p-3 bg-slate-900 font-mono text-[10px] leading-relaxed">
              <p className="text-slate-500">&lt;?xml version=&quot;1.0&quot;?&gt;</p>
              <p className="text-slate-400">&lt;rss version=&quot;2.0&quot;&gt;</p>
              <p className="text-slate-400 pl-2">&lt;channel&gt;</p>
              <p className="pl-4">
                <span className="text-slate-400">&lt;title&gt;</span>
                <span className="text-amber-400">My Collection</span>
                <span className="text-slate-400">&lt;/title&gt;</span>
              </p>

              {/* New item that slides in - fixed height container */}
              <div className="h-[72px] overflow-hidden">
                <div
                  className={`transition-all duration-500 ease-out ${
                    showNewItem ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  }`}
                >
                  <div className="pl-4 py-0.5 bg-rust/10 rounded my-1 border-l-2 border-rust">
                    <p className="text-slate-400">&lt;item&gt;</p>
                    <p className="pl-4">
                      <span className="text-slate-400">&lt;title&gt;</span>
                      <span className="text-rust font-medium">{NEW_RSS_ITEM.title}</span>
                      <span className="text-slate-400">&lt;/title&gt;</span>
                    </p>
                    <p className="pl-4">
                      <span className="text-slate-400">&lt;link&gt;</span>
                      <span className="text-denim">https://{NEW_RSS_ITEM.source}/</span>
                      <span className="text-slate-400">&lt;/link&gt;</span>
                    </p>
                    <p className="text-slate-400">&lt;/item&gt;</p>
                  </div>
                </div>
              </div>

              {/* Existing items */}
              {RSS_ITEMS.slice(0, 2).map((item) => (
                <div key={item.title} className="pl-4">
                  <p className="text-slate-400">&lt;item&gt;</p>
                  <p className="pl-4">
                    <span className="text-slate-400">&lt;title&gt;</span>
                    <span className="text-slate-300">{item.title}</span>
                    <span className="text-slate-400">&lt;/title&gt;</span>
                  </p>
                  <p className="text-slate-400">&lt;/item&gt;</p>
                </div>
              ))}
              <p className="pl-4 text-slate-600">...</p>
              <p className="text-slate-400 pl-2">&lt;/channel&gt;</p>
              <p className="text-slate-400">&lt;/rss&gt;</p>
            </div>

            {/* RSS Footer */}
            <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700/50">
              <p className="text-[9px] text-slate-400">
                <span className="text-slate-500">Subscribe:</span>{" "}
                <span className="text-denim font-medium">yourspace.backpocket.my/rss.xml</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
