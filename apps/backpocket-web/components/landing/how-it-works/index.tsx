"use client";

import { motion, useInView } from "framer-motion";
import { Bookmark, Globe, Rss, Smartphone } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import AndroidLogo from "@/assets/img/Android-Logo.svg";
import AppleLogo from "@/assets/img/Apple-Logo.svg";
import ChromeLogo from "@/assets/img/Chrome-Logo.svg";
import FirefoxLogo from "@/assets/img/Firefox-Logo.svg";
import { HOW_IT_WORKS, TRANSITIONS } from "@/lib/constants/animations";
import { externalLinks } from "@/lib/constants/links";
import { routes } from "@/lib/constants/routes";
import { BrowserExtensionDemo } from "./browser-extension-demo";
import { MobileAppDemo } from "./mobile-app-demo";
import { PlatformCard } from "./platform-card";
import { RssFeedDemo } from "./rss-feed-demo";
import { WebAppDemo } from "./web-app-demo";

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-16 md:py-24 overflow-hidden bg-linear-to-b from-background via-card/30 to-background"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rust/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-denim/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-mint/5 rounded-full blur-3xl" />
      </div>

      {/* Decorative stitching at top */}
      <div className="absolute top-8 inset-x-0 border-t-2 border-dashed border-rust/15" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={TRANSITIONS.normal}
            className="inline-flex items-center gap-2 rounded-full border border-rust/25 bg-rust/5 px-5 py-2 text-sm mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: HOW_IT_WORKS.globeRotation, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Globe className="h-4 w-4 text-rust" />
            </motion.div>
            <span className="text-rust font-medium">How it works</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ ...TRANSITIONS.normal, delay: TRANSITIONS.staggerDelay }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6"
          >
            Save from <span className="text-rust italic">anywhere</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ ...TRANSITIONS.normal, delay: TRANSITIONS.staggerDelay * 2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            One click from your browser. One tap from your phone. Paste in the app. Your collection
            grows effortlessly.
          </motion.p>
        </div>

        {/* Demos - Vertically Stacked */}
        <div className="space-y-20 md:space-y-28">
          {/* Browser Extension Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 3 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-denim/10 text-denim text-sm font-medium mb-4">
                <Bookmark className="w-4 h-4" />
                Browser Extension
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">Click to save</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Save any article with one click. Works on Chrome, Firefox, and Safari.
              </p>
            </div>
            <BrowserExtensionDemo />
          </motion.div>

          {/* Mobile App Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 4 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint text-sm font-medium mb-4">
                <Smartphone className="w-4 h-4" />
                Mobile App
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">Share to save</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Use the native share sheet on iOS and Android to save on the go.
              </p>
            </div>
            <MobileAppDemo />
          </motion.div>

          {/* Web App Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 5 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber/10 text-amber text-sm font-medium mb-4">
                <Globe className="w-4 h-4" />
                Web App
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">Paste to save</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Just paste any URL directly in the web app. No extension needed.
              </p>
            </div>
            <WebAppDemo />
          </motion.div>

          {/* RSS Feed Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 6 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rust/10 text-rust text-sm font-medium mb-4">
                <Rss className="w-4 h-4" />
                RSS Feed
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-2">Subscribe anywhere</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your public collection auto-generates an RSS feed. Share it with anyone or use it in your favorite reader.
              </p>
            </div>
            <RssFeedDemo />
          </motion.div>
        </div>

        {/* Platform Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ ...TRANSITIONS.section, delay: TRANSITIONS.staggerDelay * 7 }}
          className="mt-20 md:mt-28"
        >
          <div className="text-center mb-10">
            <h3 className="text-xl md:text-2xl font-semibold mb-2">Available platforms</h3>
            <p className="text-muted-foreground">Choose how you want to save</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Chrome */}
            <PlatformCard
              name="Chrome"
              description="Extension"
              logo={<Image src={ChromeLogo} alt="Chrome" className="h-8 w-8 sm:h-9 sm:w-9" />}
              gradient="from-amber/20 via-rust/10 to-mint/20"
              status="development"
              repoHref={externalLinks.browserExtensionRepo}
            />

            {/* Firefox */}
            <PlatformCard
              name="Firefox"
              description="Extension"
              logo={<Image src={FirefoxLogo} alt="Firefox" className="h-8 w-8 sm:h-9 sm:w-9" />}
              gradient="from-rust/25 to-amber/20"
              status="development"
              repoHref={externalLinks.browserExtensionRepo}
            />

            {/* iOS */}
            <PlatformCard
              name="iOS"
              description="iPhone & iPad"
              logo={
                <Image
                  src={AppleLogo}
                  alt="Apple"
                  className="h-7 w-auto sm:h-8 dark:invert-0 invert"
                />
              }
              gradient="from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700"
              status="development"
              repoHref={externalLinks.mobileAppRepo}
            />

            {/* Android */}
            <PlatformCard
              name="Android"
              description="Phone & Tablet"
              logo={<Image src={AndroidLogo} alt="Android" className="h-5 w-auto sm:h-6" />}
              gradient="from-mint/25 to-teal/20"
              status="development"
              repoHref={externalLinks.mobileAppRepo}
            />

            {/* Web - centered when alone on mobile */}
            <div className="col-span-2 sm:col-span-1 flex justify-center">
              <div className="w-[calc(50%-0.5rem)] sm:w-full">
                <PlatformCard
                  name="Web"
                  description="Any browser"
                  logo={<Globe className="h-7 w-7 sm:h-8 sm:w-8 text-denim" />}
                  gradient="from-denim/20 to-teal/15"
                  status="available"
                  href={routes.signUp}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative stitching at bottom */}
      <div className="absolute bottom-8 inset-x-0 border-b-2 border-dashed border-rust/15" />
    </section>
  );
}
