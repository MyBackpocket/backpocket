"use client";

import { Check, Link2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Simple copy link button for public pages.
 * Copies the current page URL to clipboard.
 */
export function PublicShareButton() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      // Read URL at click time (not during render) to avoid hydration issues
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copyToClipboard}
      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          <span>Copy link</span>
        </>
      )}
    </Button>
  );
}
