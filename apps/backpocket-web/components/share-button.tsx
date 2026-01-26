"use client";

import { useState, useCallback } from "react";
import { Check, Link2, Lock } from "lucide-react";
import { getShareUrl } from "@backpocket/utils";
import { Button } from "@/components/ui/button";
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
 * Simple copy link button.
 * Shows a confirmation dialog when trying to share a private save.
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

  const handleClick = useCallback(() => {
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

  const isPrivate = save.visibility === "private";

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        title={isPrivate ? "Make public to share" : copied ? "Copied!" : "Copy link"}
      >
        {isPrivate ? (
          <Lock className="h-4 w-4" />
        ) : copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
      </Button>

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
 * Simple copy link button (no dialog) for inline use.
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
        <Link2 className="h-4 w-4" />
      )}
    </Button>
  );
}
