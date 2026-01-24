"use client";

import { motion, useInView } from "framer-motion";
import { Bookmark, Check, Globe, Link as LinkIcon, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoIcon } from "@/components/logo";
import { WEB_APP_DEMO } from "@/lib/constants/animations";
import { WEB_ARTICLE, type WebPhase } from "./constants";

export function WebAppDemo() {
  const [phase, setPhase] = useState<WebPhase>("empty");
  const [inputText, setInputText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.5 });

  useEffect(() => {
    if (!isInView) {
      setPhase("empty");
      setInputText("");
      return;
    }

    const timeoutIds: NodeJS.Timeout[] = [];
    let typeIntervalId: NodeJS.Timeout | null = null;

    const runAnimation = () => {
      setPhase("empty");
      setInputText("");

      // Start pasting
      timeoutIds.push(
        setTimeout(() => {
          setPhase("pasting");
          // Type out the URL character by character
          const url = WEB_ARTICLE.url;
          let i = 0;
          typeIntervalId = setInterval(() => {
            if (i < url.length) {
              setInputText(url.slice(0, i + 1));
              i++;
            } else {
              if (typeIntervalId) clearInterval(typeIntervalId);
            }
          }, WEB_APP_DEMO.typingSpeed);
        }, WEB_APP_DEMO.emptyToPasting)
      );

      timeoutIds.push(setTimeout(() => setPhase("processing"), WEB_APP_DEMO.pastingToProcessing));
      timeoutIds.push(setTimeout(() => setPhase("saved"), WEB_APP_DEMO.processingToSaved));
      timeoutIds.push(setTimeout(() => setPhase("complete"), WEB_APP_DEMO.savedToComplete));
      timeoutIds.push(
        setTimeout(() => {
          setPhase("empty");
          setInputText("");
        }, WEB_APP_DEMO.completeToReset)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, WEB_APP_DEMO.loopInterval);

    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
      if (typeIntervalId) clearInterval(typeIntervalId);
    };
  }, [isInView]);

  return (
    <div ref={containerRef} className="relative max-w-lg mx-auto">
      {/* Web App Window */}
      <div className="rounded-2xl border border-denim/25 bg-card shadow-2xl shadow-denim/10 overflow-hidden">
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-linear-to-b from-muted/60 to-muted/30 border-b border-border/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rust/70 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-amber/70 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-mint/70 shadow-inner" />
          </div>
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 border border-border/50">
              <Lock className="w-4 h-4 text-mint" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                backpocket.my/app
              </span>
            </div>
          </div>
        </div>

        {/* App Content - fixed height to prevent layout shifts */}
        <div className="p-6 bg-linear-to-b from-background to-card h-[340px] sm:h-[360px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LogoIcon size="sm" />
              <span className="font-semibold text-lg">My Saves</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-denim to-denim-deep flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
            </div>
          </div>

          {/* Add URL Input */}
          <div className="mb-6">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                phase === "pasting" || phase === "processing"
                  ? "border-rust bg-rust/5"
                  : phase === "saved"
                    ? "border-mint bg-mint/5"
                    : "border-border bg-muted/30"
              }`}
            >
              <LinkIcon
                className={`w-5 h-5 transition-colors ${
                  phase === "pasting" || phase === "processing"
                    ? "text-rust"
                    : phase === "saved"
                      ? "text-mint"
                      : "text-muted-foreground"
                }`}
              />
              <div className="flex-1 min-w-0">
                {inputText ? (
                  <span className="text-sm text-foreground truncate block">{inputText}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Paste a URL to save...</span>
                )}
              </div>
              {phase === "processing" && (
                <motion.div
                  className="w-5 h-5 border-2 border-rust border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              )}
              {phase === "saved" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="w-5 h-5 text-mint" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Recent Saves Grid */}
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Recent Saves
            </div>

            {/* New save card - smooth transition */}
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border-2 border-mint/30 bg-mint/5 transition-all duration-500 ease-out overflow-hidden ${
                phase === "saved" || phase === "complete"
                  ? "opacity-100 max-h-24 translate-y-0"
                  : "opacity-0 max-h-0 -translate-y-2"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-denim" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{WEB_ARTICLE.title}</p>
                <p className="text-xs text-muted-foreground">{WEB_ARTICLE.siteName}</p>
              </div>
              <div className="px-2 py-1 rounded-full bg-mint/20 text-mint text-xs font-medium">
                New
              </div>
            </div>

            {/* Existing saves */}
            {[
              {
                title: "The Soffritto Foundation",
                source: "bolognese.mariolopez.org",
                gradient: "from-orange-500/15 to-red-600/10",
              },
              {
                title: "Red Bull RB21 Technical Analysis",
                source: "the-race.com",
                gradient: "from-blue-500/15 to-sky-500/10",
              },
            ].map((save) => (
              <div
                key={save.title}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background"
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-linear-to-br ${save.gradient} flex items-center justify-center shrink-0`}
                >
                  <Bookmark className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{save.title}</p>
                  <p className="text-xs text-muted-foreground">{save.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
