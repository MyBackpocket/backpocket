"use client";

import { useEffect, useRef, useState } from "react";
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
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const clearAllTimeouts = () => {
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };

    const runAnimation = () => {
      // Clear any existing timeouts from previous cycle
      clearAllTimeouts();

      // Step 1: Click button + "Saving..." indicator
      timeoutIdsRef.current.push(
        setTimeout(() => {
          setPhase("saving");
        }, HERO_POCKET.idleToSaving)
      );

      // Step 2: "Saved!" confirmation + card appears
      timeoutIdsRef.current.push(
        setTimeout(() => {
          setPhase("saved");
          setSaveCount(5);
          setShowNewCard(true);
        }, HERO_POCKET.savingToSaved)
      );

      // Step 3: Start fade out
      timeoutIdsRef.current.push(
        setTimeout(() => {
          setPhase("fading");
          setIsFadingOut(true);
        }, HERO_POCKET.savedToFading)
      );

      // Step 4: Reset for next loop - smooth transition back to idle
      timeoutIdsRef.current.push(
        setTimeout(() => {
          setShowNewCard(false);
          setIsFadingOut(false);
          setSaveCount(4);
          setPhase("idle");
        }, HERO_POCKET.fadingToReset)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, HERO_POCKET.loopInterval);

    return () => {
      clearInterval(interval);
      clearAllTimeouts();
    };
  }, []);

  return { phase, saveCount, showNewCard, isFadingOut };
}
