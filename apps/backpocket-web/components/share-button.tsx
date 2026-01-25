"use client";

import { useState, useCallback } from "react";
import {
  Check,
  Copy,
  Facebook,
  Globe,
  Linkedin,
  Lock,
  Mail,
  Share2,
  Twitter,
} from "lucide-react";
import { getShareUrl, socialShareUrls } from "@backpocket/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SaveInfo {
  id: string;
  title?: string | null;
  visibility: "public" | "private";
  note?: string | null;
}

interface SpaceInfo {
  slug: string;
  defaultDomain: string | null;
}

interface ShareButtonProps {
  save: SaveInfo;
  space: SpaceInfo;
  /** Callback to update save visibility. Return true if successful. */
  onMakePublic?: (saveId: string) => Promise<boolean>;
  /** Button variant */
  variant?: "default" | "ghost" | "outline";
  /** Button size */
  size?: "default" | "sm" | "icon";
  /** Additional class names */
  className?: string;
}

/**
 * Share button with dropdown for copying link and sharing to social platforms.
 * Shows a confirmation dialog when trying to share a private save.
 *
 * Following React best practices:
 * - Uses useCallback for stable callbacks
 * - Uses functional setState for stable updates
 * - Defers state reads to usage point (no unnecessary subscriptions)
 */
export function ShareButton({
  save,
  space,
  onMakePublic,
  variant = "ghost",
  size = "icon",
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMakePublicDialog, setShowMakePublicDialog] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const shareUrl = getShareUrl({
    saveId: save.id,
    spaceSlug: space.slug,
    defaultDomain: space.defaultDomain,
  });

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [shareUrl]);

  const handleShare = useCallback(() => {
    if (save.visibility === "private") {
      setShowMakePublicDialog(true);
      return;
    }
    copyToClipboard();
  }, [save.visibility, copyToClipboard]);

  const handleMakePublicAndShare = useCallback(async () => {
    if (!onMakePublic) return;

    setIsPending(true);
    try {
      const success = await onMakePublic(save.id);
      if (success) {
        await copyToClipboard();
        setShowMakePublicDialog(false);
      }
    } finally {
      setIsPending(false);
    }
  }, [onMakePublic, save.id, copyToClipboard]);

  const openInNewTab = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  }, []);

  // For private saves, show a simpler share icon with lock indicator
  const isPrivate = save.visibility === "private";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            title={isPrivate ? "Make public to share" : "Share"}
          >
            {isPrivate ? (
              <Lock className="h-4 w-4" />
            ) : copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isPrivate ? (
            <>
              <DropdownMenuItem
                onClick={handleShare}
                className="text-muted-foreground"
              >
                <Lock className="mr-2 h-4 w-4" />
                Make public to share
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleShare}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy link"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  openInNewTab(
                    socialShareUrls.twitter(shareUrl, save.title || undefined)
                  )
                }
              >
                <Twitter className="mr-2 h-4 w-4" />
                Share on X
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openInNewTab(socialShareUrls.facebook(shareUrl))}
              >
                <Facebook className="mr-2 h-4 w-4" />
                Share on Facebook
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openInNewTab(socialShareUrls.linkedin(shareUrl))}
              >
                <Linkedin className="mr-2 h-4 w-4" />
                Share on LinkedIn
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = socialShareUrls.email(
                    shareUrl,
                    save.title || "Check this out",
                    undefined
                  );
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </DropdownMenuItem>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.share({
                        title: save.title || "Check this out",
                        url: shareUrl,
                      });
                    }}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    More options...
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Make Public Dialog */}
      <Dialog open={showMakePublicDialog} onOpenChange={setShowMakePublicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>This save is private</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>Make it public to share with others?</span>
              {save.note && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  Your note will also be visible in the link preview.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowMakePublicDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleMakePublicAndShare} disabled={isPending}>
              {isPending ? "Updating..." : "Make Public & Copy Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Simple copy link button (no dropdown) for inline use.
 * Shows checkmark feedback after copying.
 */
export function CopyLinkButton({
  saveId,
  spaceSlug,
  defaultDomain,
  className,
}: {
  saveId: string;
  spaceSlug: string;
  defaultDomain: string | null;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = getShareUrl({
    saveId,
    spaceSlug,
    defaultDomain,
  });

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [shareUrl]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={className}
      title={copied ? "Copied!" : "Copy share link"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
