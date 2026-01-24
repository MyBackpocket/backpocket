"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bold, Italic, MessageSquare, StickyNote, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { NOTES_DEMO } from "@/lib/constants/animations";
import { AnimatedBrowserFrame } from "./animated-browser-frame";

const NOTE_TEXT =
  "This build is insane for mapping. The Delirium scaling with the new atlas passives creates ridiculous density — definitely crafting this helmet next league.";
const TAGS = ["poe2", "builds", "endgame"];

const {
  typingSpeed: TYPING_SPEED,
  phaseDelay: PHASE_DELAY,
  tagStagger: TAG_STAGGER,
  loopPause: LOOP_PAUSE,
} = NOTES_DEMO;

type Phase = "typing" | "formatting" | "tagging" | "resetting";

export function NotesCurationDemo() {
  const [typedNote, setTypedNote] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [visibleTags, setVisibleTags] = useState<string[]>([]);

  // Typing animation
  useEffect(() => {
    if (phase !== "typing") return;

    if (typedNote.length < NOTE_TEXT.length) {
      const timeout = setTimeout(() => {
        setTypedNote(NOTE_TEXT.slice(0, typedNote.length + 1));
      }, TYPING_SPEED);
      return () => clearTimeout(timeout);
    }

    // Typing complete, move to formatting
    const nextPhase = setTimeout(() => setPhase("formatting"), PHASE_DELAY);
    return () => clearTimeout(nextPhase);
  }, [typedNote, phase]);

  // Formatting phase
  useEffect(() => {
    if (phase !== "formatting") return;

    const nextPhase = setTimeout(() => setPhase("tagging"), PHASE_DELAY * 1.5);
    return () => clearTimeout(nextPhase);
  }, [phase]);

  // Tagging phase
  useEffect(() => {
    if (phase !== "tagging") return;

    if (visibleTags.length < TAGS.length) {
      const timeout = setTimeout(() => {
        setVisibleTags(TAGS.slice(0, visibleTags.length + 1));
      }, TAG_STAGGER);
      return () => clearTimeout(timeout);
    }

    // All tags shown, pause then reset
    const nextPhase = setTimeout(() => setPhase("resetting"), LOOP_PAUSE);
    return () => clearTimeout(nextPhase);
  }, [visibleTags, phase]);

  // Reset phase
  useEffect(() => {
    if (phase !== "resetting") return;

    const resetTimeout = setTimeout(() => {
      setTypedNote("");
      setVisibleTags([]);
      setPhase("typing");
    }, NOTES_DEMO.resetDelay);

    return () => clearTimeout(resetTimeout);
  }, [phase]);

  return (
    <AnimatedBrowserFrame url="backpocket.my/app/saves/poe2-delirium-build">
      <div className="space-y-4 h-[400px] sm:h-[410px] w-full">
        {/* Back button */}
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Tweet preview card */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-denim/10">
              <MessageSquare className="h-5 w-5 text-denim" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">X post by @pathofexile</span>
                <span className="text-xs text-muted-foreground">· Jan 18</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                Patch 0.2.0 introduces the new Delirium endgame content with mirror rewards...
              </p>
            </div>
          </div>
        </div>

        {/* Notes section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Notes
            </span>
          </div>

          <div className="relative rounded-lg border border-denim/20 bg-background">
            {/* Toolbar - always visible, fixed height */}
            <div className="flex items-center gap-1 border-b border-border/50 px-3 py-2 h-[41px]">
              <motion.button
                type="button"
                className="rounded p-1.5 hover:bg-muted transition-colors"
                animate={
                  phase === "formatting"
                    ? {
                        scale: [1, 1.1, 1],
                        backgroundColor: ["transparent", "#3b507f20", "transparent"],
                      }
                    : {}
                }
                transition={{ duration: NOTES_DEMO.toolbarButtonDuration }}
              >
                <Bold className="h-4 w-4" />
              </motion.button>
              <motion.button
                type="button"
                className="rounded p-1.5 hover:bg-muted transition-colors"
                animate={
                  phase === "formatting"
                    ? {
                        scale: [1, 1.1, 1],
                        backgroundColor: ["transparent", "#3b507f20", "transparent"],
                      }
                    : {}
                }
                transition={{ duration: NOTES_DEMO.toolbarButtonDuration, delay: NOTES_DEMO.toolbarButtonDuration / 2 }}
              >
                <Italic className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Text area */}
            <div className="min-h-[80px] p-3">
              <p className="text-sm leading-relaxed">
                {phase === "formatting" || phase === "tagging" ? (
                  <>
                    This build is insane for mapping.{" "}
                    <span className="font-semibold">The Delirium scaling with the new atlas passives creates ridiculous density</span> — definitely crafting this helmet next league.
                  </>
                ) : (
                  <>
                    {typedNote}
                    {phase === "typing" && <span className="animate-pulse text-rust">|</span>}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tags section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-mint" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tags
            </span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[32px]">
            <AnimatePresence>
              {visibleTags.map((tag, index) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: NOTES_DEMO.tagEntranceDuration, delay: index * (NOTES_DEMO.tagEntranceDuration / 4) }}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    index === 0 ? "tag-denim" : index === 1 ? "tag-rust" : "tag-mint"
                  }`}
                >
                  #{tag}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AnimatedBrowserFrame>
  );
}
