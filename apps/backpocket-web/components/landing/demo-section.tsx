"use client";

import { motion, useInView } from "framer-motion";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-4 py-1.5 text-sm"
          >
            <Play className="h-4 w-4 text-mint" />
            <span className="text-mint font-medium">See it in action</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl"
          >
            Save, annotate,{" "}
            <span className="text-mint italic">organize</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Watch how backpocket handles content from any platform.
          </motion.p>
        </div>

        {/* Demo grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Demo 1: Multi-platform */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Multi-Platform Magic</h3>
              <p className="text-sm text-muted-foreground">
                Paste any URL and get rich previews instantly
              </p>
            </div>
            {hasBeenVisible && <MultiPlatformDemo />}
          </motion.div>

          {/* Demo 2: Notes and curation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Notes & Curation</h3>
              <p className="text-sm text-muted-foreground">
                Add personal notes and organize with tags
              </p>
            </div>
            {hasBeenVisible && <NotesCurationDemo />}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
