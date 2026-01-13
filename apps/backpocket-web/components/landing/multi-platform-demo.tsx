"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe, Hash, Link2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatedBrowserFrame } from "./animated-browser-frame";

const demoContent = [
  {
    id: "twitter",
    platform: "X",
    url: "x.com/naval/status/1002103360646823936",
    title: "X post by @naval",
    timestamp: "Jan 10",
    preview: "How to get rich without getting lucky: Own equity in a business...",
    icon: MessageSquare,
    color: "text-denim",
    bgColor: "bg-denim/10",
  },
  {
    id: "reddit",
    platform: "Reddit",
    url: "reddit.com/r/programming/comments/why-ts",
    title: "r/programming",
    timestamp: "3h ago",
    preview: "Why TypeScript is eating JavaScript — and why that's a good thing",
    icon: Hash,
    color: "text-rust",
    bgColor: "bg-rust/10",
  },
  {
    id: "article",
    platform: "Article",
    url: "paulgraham.com/startupideas.html",
    title: "How to Get Startup Ideas",
    timestamp: "paulgraham.com",
    preview:
      "The way to get startup ideas is not to try to think of startup ideas. It's to look for problems...",
    icon: Globe,
    color: "text-mint",
    bgColor: "bg-mint/15",
  },
];

const TYPING_SPEED = 40;
const CARD_DISPLAY_TIME = 3500;
const TRANSITION_DELAY = 300;

export function MultiPlatformDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedUrl, setTypedUrl] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showCard, setShowCard] = useState(false);

  const currentContent = demoContent[currentIndex];

  // Typing animation
  useEffect(() => {
    if (!isTyping) return;

    if (typedUrl.length < currentContent.url.length) {
      const timeout = setTimeout(() => {
        setTypedUrl(currentContent.url.slice(0, typedUrl.length + 1));
      }, TYPING_SPEED);
      return () => clearTimeout(timeout);
    }

    // Typing complete, show card
    const showCardTimeout = setTimeout(() => {
      setShowCard(true);
      setIsTyping(false);
    }, TRANSITION_DELAY);

    return () => clearTimeout(showCardTimeout);
  }, [typedUrl, isTyping, currentContent.url]);

  // Card display timer
  useEffect(() => {
    if (!showCard) return;

    const nextTimeout = setTimeout(() => {
      setShowCard(false);

      // Wait for exit animation, then move to next
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % demoContent.length);
        setTypedUrl("");
        setIsTyping(true);
      }, TRANSITION_DELAY);
    }, CARD_DISPLAY_TIME);

    return () => clearTimeout(nextTimeout);
  }, [showCard]);

  const Icon = currentContent.icon;

  return (
    <AnimatedBrowserFrame url="backpocket.my/app">
      <div className="space-y-4">
        {/* Quick Add input */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Add
          </span>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="flex h-11 w-full items-center rounded-lg border border-denim/20 bg-background pl-10 pr-4">
              <span className="text-sm text-foreground">
                {typedUrl}
                {isTyping && <span className="animate-pulse text-rust">|</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Preview card */}
        <div className="min-h-[140px]">
          <AnimatePresence mode="wait">
            {showCard && (
              <motion.div
                key={currentContent.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="rounded-lg border border-border bg-card/50 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${currentContent.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${currentContent.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{currentContent.title}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {currentContent.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {currentContent.preview}
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <motion.div
                  className="mt-4 flex justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    className="rounded-lg bg-denim px-4 py-2 text-sm font-medium text-white"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(59, 80, 127, 0)",
                        "0 0 0 8px rgba(59, 80, 127, 0.2)",
                        "0 0 0 0 rgba(59, 80, 127, 0)",
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 0.5,
                    }}
                  >
                    Save to Library
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Platform indicators */}
        <div className="flex justify-center gap-2 pt-2">
          {demoContent.map((content, index) => (
            <motion.div
              key={content.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-6 bg-denim" : "w-1.5 bg-denim/30"
              }`}
            />
          ))}
        </div>
      </div>
    </AnimatedBrowserFrame>
  );
}
