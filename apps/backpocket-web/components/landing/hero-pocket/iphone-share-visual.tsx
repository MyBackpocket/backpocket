"use client";

import { Bookmark, Check, Globe, Share, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { MOBILE_APP_DEMO } from "@/lib/constants/animations";

type SharePhase = "browsing" | "share-sheet" | "saving" | "saved";

export function IPhoneShareVisual() {
  const [phase, setPhase] = useState<SharePhase>("browsing");

  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      setPhase("browsing");

      // Step 1: Show share sheet
      timeoutIds.push(
        setTimeout(() => {
          setPhase("share-sheet");
        }, MOBILE_APP_DEMO.articleToShareSheet)
      );

      // Step 2: Tap Backpocket → saving
      timeoutIds.push(
        setTimeout(() => {
          setPhase("saving");
        }, MOBILE_APP_DEMO.shareSheetToAppOpening)
      );

      // Step 3: Saved confirmation
      timeoutIds.push(
        setTimeout(() => {
          setPhase("saved");
        }, MOBILE_APP_DEMO.appOpeningToSaved)
      );

      // Step 4: Reset
      timeoutIds.push(
        setTimeout(() => {
          setPhase("browsing");
        }, MOBILE_APP_DEMO.completeToReset)
      );
    };

    runAnimation();
    const interval = setInterval(runAnimation, MOBILE_APP_DEMO.loopInterval);

    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  const showShareSheet = phase === "share-sheet" || phase === "saving";
  const isSaving = phase === "saving";
  const isSaved = phase === "saved";

  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* iPhone Frame */}
      <div className="relative rounded-[40px] bg-[#1a1a1a] p-2 shadow-2xl">
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-24 w-[3px] h-8 bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-[#2a2a2a] rounded-r-sm" />

        {/* Screen */}
        <div className="relative rounded-[32px] bg-white overflow-hidden">
          {/* Status bar */}
          <div className="relative h-12 bg-[#f5f5f7] flex items-end justify-between px-6 pb-1">
            {/* Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-24 h-7 bg-black rounded-full" />
            <span className="text-[10px] font-semibold text-black">9:41</span>
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-black" />
              <div className="w-6 h-2.5 rounded-sm border border-black/80 relative">
                <div className="absolute inset-[2px] right-1 bg-black rounded-[1px]" />
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-1.5 bg-black/80 rounded-r-sm" />
              </div>
            </div>
          </div>

          {/* Safari URL bar */}
          <div className="px-3 py-2 bg-[#f5f5f7] border-b border-gray-200">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
              <Globe className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-600 truncate flex-1">proofofcorn.com</span>
            </div>
          </div>

          {/* Article content */}
          <div className="h-[340px] sm:h-[380px] bg-white relative overflow-hidden">
            {/* Article header image */}
            <div className="h-28 bg-linear-to-br from-amber-100 via-orange-100 to-yellow-50 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🌽</span>
              </div>
            </div>

            {/* Article text */}
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Can AI Grow Corn? A Deep Dive Into Agricultural ML
              </h3>
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded w-full" />
                <div className="h-2 bg-gray-100 rounded w-11/12" />
                <div className="h-2 bg-gray-100 rounded w-full" />
                <div className="h-2 bg-gray-100 rounded w-4/5" />
              </div>
              <div className="pt-2 space-y-2">
                <div className="h-2 bg-gray-100 rounded w-full" />
                <div className="h-2 bg-gray-100 rounded w-3/4" />
              </div>
            </div>

            {/* Safari bottom toolbar */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f5f5f7] border-t border-gray-200 flex items-center justify-around px-4">
              <button type="button" className="p-2" aria-label="Go back">
                <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button type="button" className="p-2" aria-label="Go forward">
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Share"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  phase === "browsing" ? "bg-blue-50 scale-110" : ""
                }`}
              >
                <Share
                  className={`w-5 h-5 transition-colors ${
                    phase === "browsing" ? "text-[#007AFF]" : "text-[#007AFF]"
                  }`}
                />
              </button>
              <button type="button" className="p-2" aria-label="Bookmark">
                <Bookmark className="w-5 h-5 text-[#007AFF]" />
              </button>
              <button type="button" className="p-2" aria-label="Tabs">
                <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* iOS Share Sheet */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-[#f2f2f7] rounded-t-2xl transition-transform duration-500 ease-out ${
                showShareSheet ? "translate-y-0" : "translate-y-full"
              }`}
              style={{ height: "75%" }}
            >
              {/* Drag indicator */}
              <div className="flex justify-center pt-2 pb-3">
                <div className="w-9 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Share preview */}
              <div className="mx-3 mb-3 p-3 bg-white rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center text-lg shrink-0">
                  🌽
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-900 truncate">Can AI Grow Corn?</p>
                  <p className="text-[10px] text-gray-500 truncate">proofofcorn.com</p>
                </div>
              </div>

              {/* App row */}
              <div className="px-3 overflow-x-auto">
                <div className="flex gap-3 pb-3">
                  {/* AirDrop */}
                  <ShareAppIcon
                    icon={
                      <div className="w-full h-full bg-linear-to-b from-[#1a8cff] to-[#007AFF] rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                      </div>
                    }
                    label="AirDrop"
                    isActive={false}
                  />

                  {/* Messages */}
                  <ShareAppIcon
                    icon={
                      <div className="w-full h-full bg-linear-to-b from-[#5ac94d] to-[#34c759] rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                      </div>
                    }
                    label="Messages"
                    isActive={false}
                  />

                  {/* Backpocket - THE STAR */}
                  <ShareAppIcon
                    icon={
                      <div
                        className={`w-full h-full bg-linear-to-br from-rust to-rust-deep rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isSaving ? "scale-90 ring-4 ring-rust/30" : ""
                        }`}
                      >
                        {isSaving ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Bookmark className="w-6 h-6 text-white fill-white" />
                        )}
                      </div>
                    }
                    label="Backpocket"
                    isActive={phase === "share-sheet"}
                    highlight
                  />

                  {/* Notes */}
                  <ShareAppIcon
                    icon={
                      <div className="w-full h-full bg-linear-to-b from-[#ffcc00] to-[#ffb800] rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                      </div>
                    }
                    label="Notes"
                    isActive={false}
                  />

                  {/* Reminders */}
                  <ShareAppIcon
                    icon={
                      <div className="w-full h-full bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 border-[#ff9500] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#ff9500]" />
                        </div>
                      </div>
                    }
                    label="Reminders"
                    isActive={false}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mx-3 mt-1 bg-white rounded-xl overflow-hidden">
                <ActionRow icon="copy" label="Copy" />
                <ActionRow icon="reading" label="Add to Reading List" />
                <ActionRow icon="bookmark" label="Add Bookmark" />
              </div>

              {/* Cancel button */}
              <div className="mx-3 mt-3">
                <div className="bg-white rounded-xl">
                  <button type="button" className="w-full py-3 text-center text-[#007AFF] font-semibold text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Saved toast */}
            <div
              className={`absolute top-20 left-1/2 -translate-x-1/2 transition-all duration-300 ${
                isSaved ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-mint text-white shadow-lg shadow-mint/30">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold whitespace-nowrap">Saved to Backpocket!</span>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="h-5 bg-white flex items-center justify-center">
            <div className="w-28 h-1 bg-black rounded-full" />
          </div>
        </div>
      </div>

      {/* Tap indicator */}
      <div
        className={`absolute bottom-32 right-16 transition-all duration-300 ${
          phase === "browsing" ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        <div className="relative">
          <div className="absolute inset-0 animate-ping bg-blue-400/30 rounded-full" />
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShareAppIconProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  highlight?: boolean;
}

function ShareAppIcon({ icon, label, isActive, highlight }: ShareAppIconProps) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className={`w-14 h-14 rounded-xl transition-all duration-300 ${
          isActive && highlight ? "ring-2 ring-rust ring-offset-2" : ""
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] transition-colors ${
          highlight ? "text-rust font-medium" : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

interface ActionRowProps {
  icon: "copy" | "reading" | "bookmark";
  label: string;
}

function ActionRow({ icon, label }: ActionRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
        {icon === "copy" && (
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        {icon === "reading" && (
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )}
        {icon === "bookmark" && (
          <Bookmark className="w-4 h-4 text-gray-600" />
        )}
      </div>
      <span className="text-sm text-gray-900">{label}</span>
    </div>
  );
}
