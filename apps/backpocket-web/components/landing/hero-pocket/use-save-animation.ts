"use client";

import { useEffect, useState } from "react";
import { HERO_POCKET } from "@/lib/constants/animations";
import type { AnimationPhase } from "./constants";

interface SaveAnimationState {
  phase: AnimationPhase;
  saveCount: number;
  showNewCard: boolean;
  isFadingOut: boolean;
}

/**
 * Shared hook for the hero save animation.
 * Used by both browser extension and iPhone share visuals.
 */
export function useSaveAnimation(): SaveAnimationState {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [saveCount, setSaveCount] = useState(4);
  const [showNewCard, setShowNewCard] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      // Reset state
      setPhase("idle");
      setShowNewCard(false);
      setIsFadingOut(false);

      // Step 1: Click button + "Saving..." indicator
      timeoutIds.push(
        setTimeout(() => {
          setPhase("saving");
        }, HERO_POCKET.idleToSaving)
      );

      // Step 2: "Saved!" confirmation + card appears
      timeoutIds.push(
        setTimeout(() => {
          setPhase("saved");
          setSaveCount(5);
          setShowNewCard(true);
        }, HERO_POCKET.savingToSaved)
      );

      // Step 3: Start fade out
      timeoutIds.push(
        setTimeout(() => {
          setPhase("fading");
          setIsFadingOut(true);
        }, HERO_POCKET.savedToFading)
      );

      // Step 4: Reset for next loop
      timeoutIds.push(
        setTimeout(() => {
          setSaveCount(4);
          setShowNewCard(false);
          setIsFadingOut(false);
          setPhase("idle");
        }, HERO_POCKET.fadingToReset)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, HERO_POCKET.loopInterval);

    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  return { phase, saveCount, showNewCard, isFadingOut };
}
