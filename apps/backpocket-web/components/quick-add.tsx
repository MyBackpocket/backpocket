"use client";

import {
  Check,
  ChevronDown,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type DuplicateSaveInfo, DuplicateSaveModal } from "@/components/duplicate-save-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCreateSave, useGetMySpace, useListCollections } from "@/lib/convex";
import type { SaveVisibility } from "@/lib/types";

type QuickAddState = "idle" | "fetching" | "preview" | "saving" | "success";

interface FetchedMetadata {
  title: string;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  favicon: string | null;
}

function EnrichmentIndicator() {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      {/* Animated dots that wave */}
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-primary/60"
            style={{
              animation: "wave 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground/50">
        enriching
      </span>
    </div>
  );
}

export function QuickAdd() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [state, setState] = useState<QuickAddState>("idle");
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null);
  const [visibility, setVisibility] = useState<SaveVisibility | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [duplicateSave, setDuplicateSave] = useState<DuplicateSaveInfo | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Get user's default save visibility from settings
  const space = useGetMySpace();
  const defaultVisibility = (space?.defaultSaveVisibility as SaveVisibility) ?? "private";
  const effectiveVisibility = visibility ?? defaultVisibility;

  // Prevent hydration mismatch with Radix UI components
  useEffect(() => {
    setMounted(true);
  }, []);

  const collections = useListCollections(open ? {} : undefined);

  const createSave = useCreateSave();

  const resetAndClose = useCallback(() => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    setOpen(false);
    setUrl("");
    setState("idle");
    setMetadata(null);
    setVisibility(null);
    setSelectedCollection(null);
    setDuplicateSave(null);
    setShowDuplicateModal(false);
    setAutoCloseTimer(null);
  }, [autoCloseTimer]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Fetch actual metadata from URL via API
  const fetchMetadata = useCallback(async (inputUrl: string) => {
    // Extract domain for fallback
    let domain = "example.com";
    try {
      domain = new URL(inputUrl).hostname.replace("www.", "");
    } catch {
      // Invalid URL, use default
    }

    // Show immediate preview with basic info while fetching
    const fallbackMetadata: FetchedMetadata = {
      title: generateTitleFromUrl(inputUrl),
      description: null,
      siteName: domain.charAt(0).toUpperCase() + domain.slice(1).split(".")[0],
      imageUrl: null,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    };

    setMetadata(fallbackMetadata);
    setState("fetching");

    // Fetch real metadata from API
    try {
      const response = await fetch("/api/unfurl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setMetadata({
          title: data.title || fallbackMetadata.title,
          description: data.description,
          siteName: data.siteName || fallbackMetadata.siteName,
          imageUrl: data.imageUrl,
          favicon: data.favicon || fallbackMetadata.favicon,
        });
      }
    } catch {
      // Keep fallback metadata on error
    }

    setState("preview");
  }, []);

  // Handle paste event for instant URL detection
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text");
      if (isValidUrl(pastedText) && state === "idle") {
        e.preventDefault();
        setUrl(pastedText);
        fetchMetadata(pastedText);
      }
    },
    [state, fetchMetadata]
  );

  // Handle manual submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (url && isValidUrl(url) && state === "idle") {
        fetchMetadata(url);
      }
    },
    [url, state, fetchMetadata]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!metadata) return;

    setState("saving");
    try {
      await createSave({
        url,
        title: metadata.title,
        visibility: effectiveVisibility,
        collectionIds: selectedCollection ? [selectedCollection as any] : undefined,
      });
      setState("success");
      // Auto-close after success
      const timer = setTimeout(() => {
        resetAndClose();
      }, 1500);
      setAutoCloseTimer(timer);
    } catch (error: any) {
      // Check if this is a duplicate error
      if (error?.message?.includes("already have this link saved") || error?.data?.existingSave) {
        const existingSave = error?.data?.existingSave;
        if (existingSave) {
          setDuplicateSave(existingSave);
          setShowDuplicateModal(true);
        }
        setState("idle");
      } else {
        setState("preview");
      }
    }
  }, [url, metadata, effectiveVisibility, selectedCollection, createSave, resetAndClose]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.metaKey && state === "preview") {
        handleSave();
      }
      if (e.key === "Escape") {
        if (state === "preview") {
          setState("idle");
          setMetadata(null);
          setUrl("");
          inputRef.current?.focus();
        } else {
          resetAndClose();
        }
      }
    },
    [state, handleSave, resetAndClose]
  );

  const selectedCollectionName = collections?.find((c) => c.id === selectedCollection)?.name;

  const handleDuplicateDismiss = useCallback(() => {
    setDuplicateSave(null);
    setUrl("");
    setMetadata(null);
    setState("idle");
    // Re-focus input after dismissing duplicate modal
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Render a static button during SSR to prevent hydration mismatch with Radix UI
  if (!mounted) {
    return (
      <Button className="w-full gap-2" disabled>
        <Plus className="h-4 w-4" />
        Quick Add
      </Button>
    );
  }

  return (
    <>
      <DuplicateSaveModal
        open={showDuplicateModal}
        onOpenChange={(open) => {
          setShowDuplicateModal(open);
          if (!open) {
            resetAndClose();
          }
        }}
        duplicateSave={duplicateSave}
        onDismiss={handleDuplicateDismiss}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Quick Add
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-lg"
          onKeyDown={handleKeyDown}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              {state === "success" ? "Saved!" : "Quick Add"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL Input - visible in idle state */}
            {state === "idle" && (
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="url"
                    placeholder="Paste any URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={handlePaste}
                    className="pr-10 h-12 text-base"
                    autoComplete="off"
                  />
                  {url && isValidUrl(url) && (
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3"
                    >
                      Go
                    </Button>
                  )}
                </div>
              </form>
            )}

            {/* Preview Card */}
            {(state === "fetching" || state === "preview" || state === "saving" || state === "success") && metadata && (
              <div className="space-y-4">
                {/* Fetched Content Preview */}
                <div 
                  className={`
                    relative rounded-xl border bg-card overflow-hidden
                    transition-all duration-500
                    ${state === "fetching" ? "ring-1 ring-primary/20" : ""}
                  `}
                >
                  {/* Subtle shimmer overlay when fetching */}
                  {state === "fetching" && (
                    <div 
                      className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
                      aria-hidden="true"
                    >
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.04), transparent)",
                          animation: "shimmer 2.5s ease-in-out infinite",
                        }}
                      />
                    </div>
                  )}
                  
                  {metadata.imageUrl && (
                    <div className="relative aspect-video bg-muted">
                      <Image src={metadata.imageUrl} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {metadata.favicon && (
                        <div className="relative w-6 h-6 shrink-0 mt-0.5 rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                          <Image
                            src={metadata.favicon}
                            alt=""
                            fill
                            className="object-contain p-0.5"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight line-clamp-2">
                          {metadata.title}
                        </h3>
                        {metadata.description ? (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                            {metadata.description}
                          </p>
                        ) : state === "fetching" ? (
                          <EnrichmentIndicator />
                        ) : null}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {metadata.siteName || new URL(url).hostname}
                          </span>
                          {state === "fetching" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full">
                              <Sparkles className="w-2.5 h-2.5" />
                              fetching
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Options */}
                {state !== "success" && state !== "fetching" && (
                  <div className="flex items-center gap-2">
                    {/* Visibility Toggle */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={state === "saving"}
                        >
                          {effectiveVisibility === "private" ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Globe className="h-3.5 w-3.5" />
                          )}
                          {effectiveVisibility === "private" ? "Private" : "Public"}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setVisibility("private")}>
                          <Lock className="h-4 w-4 mr-2" />
                          Private
                          {effectiveVisibility === "private" && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVisibility("public")}>
                          <Globe className="h-4 w-4 mr-2" />
                          Public
                          {effectiveVisibility === "public" && (
                            <Check className="h-4 w-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Collection Picker */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={state === "saving"}
                        >
                          {selectedCollectionName || "No collection"}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setSelectedCollection(null)}>
                          No collection
                          {!selectedCollection && <Check className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                        {collections && collections.length > 0 && <DropdownMenuSeparator />}
                        {collections?.map((col) => (
                          <DropdownMenuItem
                            key={col.id}
                            onClick={() => setSelectedCollection(col.id)}
                          >
                            {col.name}
                            {selectedCollection === col.id && <Check className="h-4 w-4 ml-auto" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex-1" />

                    {/* Edit link */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Navigate to full form with pre-filled data
                        const params = new URLSearchParams({
                          url,
                          title: metadata.title,
                          visibility: effectiveVisibility,
                        });
                        if (selectedCollection) {
                          params.set("collection", selectedCollection);
                        }
                        router.push(`/app/saves/new?${params.toString()}`);
                        resetAndClose();
                      }}
                      disabled={state === "saving"}
                    >
                      More options
                    </Button>
                  </div>
                )}

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={state === "fetching" || state === "saving" || state === "success"}
                  className="w-full h-11"
                >
                  {state === "fetching" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {state === "saving" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {state === "success" && <Check className="mr-2 h-4 w-4 text-green-500" />}
                  {state === "success" ? "Saved!" : state === "saving" ? "Saving..." : state === "fetching" ? "Fetching..." : "Save"}
                  {state === "preview" && <span className="ml-2 text-xs opacity-70">⌘↵</span>}
                </Button>

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper functions
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function generateTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Common patterns
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "YouTube Video";
    }
    if (url.includes("twitter.com") || url.includes("x.com")) {
      return "Tweet";
    }
    if (url.includes("github.com")) {
      const parts = path.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]} - GitHub`;
      }
    }

    // Extract from path
    const lastSegment = path.split("/").filter(Boolean).pop();
    if (lastSegment) {
      return lastSegment
        .replace(/[-_]/g, " ")
        .replace(/\.\w+$/, "")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return urlObj.hostname;
  } catch {
    return "Untitled";
  }
}
