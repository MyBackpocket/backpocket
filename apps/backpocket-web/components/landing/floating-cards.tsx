"use client";

import { Bookmark, FileText, Hash, Link2, Play, Quote } from "lucide-react";

/**
 * Floating content cards for the hero section.
 * Uses CSS animations for optimal mobile performance.
 * Cards are hidden on small screens to reduce visual noise.
 */
export function FloatingCards() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Left side cards */}
      <div className="hidden md:block">
        {/* Article card - top left */}
        <div className="absolute -left-4 top-32 animate-float-slow">
          <ContentCard
            type="article"
            color="denim"
            title="How to Build Better Products"
            meta="paulgraham.com"
            rotation={-12}
          />
        </div>

        {/* Tweet card - mid left */}
        <div className="absolute left-8 top-[55%] animate-float-medium">
          <ContentCard
            type="tweet"
            color="rust"
            title="The best ideas come from..."
            meta="@naval"
            rotation={8}
          />
        </div>

        {/* Link card - bottom left */}
        <div className="absolute -left-8 bottom-24 animate-float-fast hidden lg:block">
          <ContentCard
            type="link"
            color="teal"
            title="Design Systems"
            meta="figma.com"
            rotation={-6}
          />
        </div>
      </div>

      {/* Right side cards */}
      <div className="hidden md:block">
        {/* Video card - top right */}
        <div className="absolute -right-4 top-40 animate-float-medium">
          <ContentCard
            type="video"
            color="amber"
            title="Building in Public"
            meta="youtube.com"
            rotation={15}
          />
        </div>

        {/* Quote card - mid right */}
        <div className="absolute right-12 top-[50%] animate-float-slow">
          <ContentCard
            type="quote"
            color="mint"
            title="Stay hungry, stay foolish"
            meta="Steve Jobs"
            rotation={-10}
          />
        </div>

        {/* Bookmark card - bottom right */}
        <div className="absolute -right-6 bottom-32 animate-float-fast hidden lg:block">
          <ContentCard
            type="bookmark"
            color="denim"
            title="React 19 Features"
            meta="react.dev"
            rotation={5}
          />
        </div>
      </div>

      {/* Mobile: Show fewer, simpler cards */}
      <div className="md:hidden">
        <div className="absolute -left-16 top-24 animate-float-slow opacity-40">
          <ContentCard
            type="article"
            color="denim"
            title="Great Article"
            meta="blog.com"
            rotation={-15}
            size="sm"
          />
        </div>
        <div className="absolute -right-16 top-32 animate-float-medium opacity-40">
          <ContentCard
            type="tweet"
            color="rust"
            title="Cool thread"
            meta="@user"
            rotation={12}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}

type CardType = "article" | "tweet" | "video" | "link" | "quote" | "bookmark";
type CardColor = "denim" | "rust" | "mint" | "amber" | "teal";

interface ContentCardProps {
  type: CardType;
  color: CardColor;
  title: string;
  meta: string;
  rotation: number;
  size?: "sm" | "md";
}

function ContentCard({ type, color, title, meta, rotation, size = "md" }: ContentCardProps) {
  const Icon = getIcon(type);
  const colorClasses = getColorClasses(color);
  const sizeClasses = size === "sm" ? "w-36 p-2.5" : "w-48 p-3";

  return (
    <div
      className={`${sizeClasses} rounded-xl border bg-card/90 backdrop-blur-sm shadow-lg ${colorClasses.border}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Card header with icon */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses.bg}`}>
          <Icon className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} ${colorClasses.text}`} />
        </div>
        <span className={`text-[10px] font-medium ${colorClasses.text}`}>{getTypeLabel(type)}</span>
      </div>

      {/* Card content */}
      <div
        className={`${size === "sm" ? "text-xs" : "text-sm"} font-medium text-foreground/90 line-clamp-2 leading-tight`}
      >
        {title}
      </div>

      {/* Card meta */}
      <div
        className={`${size === "sm" ? "text-[9px]" : "text-[10px]"} text-muted-foreground mt-1.5 truncate`}
      >
        {meta}
      </div>

      {/* Decorative bottom bar */}
      <div className={`h-1 rounded-full mt-2.5 ${colorClasses.bar}`} />
    </div>
  );
}

function getIcon(type: CardType) {
  switch (type) {
    case "article":
      return FileText;
    case "tweet":
      return Hash;
    case "video":
      return Play;
    case "link":
      return Link2;
    case "quote":
      return Quote;
    case "bookmark":
      return Bookmark;
  }
}

function getTypeLabel(type: CardType) {
  switch (type) {
    case "article":
      return "Article";
    case "tweet":
      return "Thread";
    case "video":
      return "Video";
    case "link":
      return "Link";
    case "quote":
      return "Quote";
    case "bookmark":
      return "Saved";
  }
}

function getColorClasses(color: CardColor) {
  switch (color) {
    case "denim":
      return {
        bg: "bg-denim/15",
        text: "text-denim",
        border: "border-denim/20",
        bar: "bg-gradient-to-r from-denim/40 to-denim/10",
      };
    case "rust":
      return {
        bg: "bg-rust/15",
        text: "text-rust",
        border: "border-rust/20",
        bar: "bg-gradient-to-r from-rust/40 to-rust/10",
      };
    case "mint":
      return {
        bg: "bg-mint/15",
        text: "text-mint",
        border: "border-mint/20",
        bar: "bg-gradient-to-r from-mint/40 to-mint/10",
      };
    case "amber":
      return {
        bg: "bg-amber/15",
        text: "text-amber",
        border: "border-amber/20",
        bar: "bg-gradient-to-r from-amber/40 to-amber/10",
      };
    case "teal":
      return {
        bg: "bg-teal/15",
        text: "text-teal",
        border: "border-teal/20",
        bar: "bg-gradient-to-r from-teal/40 to-teal/10",
      };
  }
}
