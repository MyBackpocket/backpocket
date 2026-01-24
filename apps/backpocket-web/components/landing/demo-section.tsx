"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TRANSITIONS } from "@/lib/constants/animations";
import { IntegrationsComingSoon } from "./integrations-coming-soon";
import { MultiPlatformDemo } from "./multi-platform-demo";
import { NotesCurationDemo } from "./notes-curation-demo";

export function DemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Once visible, stay visible (prevents unmounting)
  // Using ref to avoid re-triggering when hasBeenVisible state changes
  useEffect(() => {
    if (isInView && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setHasBeenVisible(true);
    }
  }, [isInView]);

  return (
    <section ref={sectionRef} className="py-20 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ ...TRANSITIONS.normal, delay: TRANSITIONS.staggerDelay }}
            className="font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl"
          >
            Save, annotate,{" "}
            <span className="text-mint italic">organize</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ ...TRANSITIONS.normal, delay: TRANSITIONS.staggerDelay * 2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Watch how backpocket handles content from any platform.
          </motion.p>
        </div>

        {/* Demo grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          {/* Demo 1: Multi-platform */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 3 }}
            className="w-full max-w-sm sm:max-w-md lg:max-w-none lg:flex-1"
          >
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold">Multi-Platform Magic</h3>
              <p className="text-sm text-muted-foreground">
                Paste any URL and get rich previews instantly
              </p>
            </div>
            {/* Fixed height without overflow-hidden to show borders */}
            <div className="h-[440px] sm:h-[470px]">
              {hasBeenVisible && <MultiPlatformDemo />}
            </div>
          </motion.div>

          {/* Demo 2: Notes and curation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 4 }}
            className="w-full max-w-sm sm:max-w-md lg:max-w-none lg:flex-1"
          >
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold">Notes & Curation</h3>
              <p className="text-sm text-muted-foreground">
                Add personal notes and organize with tags
              </p>
            </div>
            {/* Fixed height without overflow-hidden to show borders */}
            <div className="h-[500px] sm:h-[510px]">
              {hasBeenVisible && <NotesCurationDemo />}
            </div>
          </motion.div>
        </div>

        {/* Integrations Coming Soon - centered below demos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 6 }}
          className="mt-12 flex justify-center"
        >
          <div className="w-full max-w-md">
            {hasBeenVisible && <IntegrationsComingSoon />}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
