import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiError,
  checkDuplicate,
  createSave,
  deleteSave,
  ensureSpace,
  getMySpace,
  listCollections,
  listTags,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Collection, DuplicateSaveInfo, Save, SaveVisibility, Tag } from "../lib/types";

/**
 * Prefill data stored by background script (context menu / keyboard shortcut)
 */
interface PrefillData {
  url: string;
  title?: string;
  timestamp: number;
}

/**
 * Get and clear prefill data from storage (if valid and recent)
 */
async function consumePrefillData(): Promise<PrefillData | null> {
  try {
    const result = await browser.storage.local.get("backpocket_prefill");
    const prefill = result.backpocket_prefill as PrefillData | undefined;

    // Only use prefill if it's less than 5 minutes old
    if (prefill && Date.now() - prefill.timestamp < 5 * 60 * 1000) {
      // Clear it so it's not used again
      await browser.storage.local.remove("backpocket_prefill");
      // Notify background to clear badge
      browser.runtime.sendMessage({ type: "POPUP_OPENED" }).catch(() => {});
      return prefill;
    }
  } catch {
    // Storage access failed
  }
  return null;
}
import {
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RotateCcwIcon,
  TrashIcon,
} from "./Icons";
import { QuickCollectionSection } from "./QuickCollectionSection";
import { QuickNoteSection } from "./QuickNoteSection";
import { QuickTagSection } from "./QuickTagSection";
import { VisibilityToggle } from "./VisibilityToggle";

type SaveStatus = "loading" | "saving" | "success" | "duplicate" | "error" | "deleted";

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const QuickSaveView = memo(function QuickSaveView() {
  const { getToken } = useAuth();

  // Tab info
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  // Status and saved data
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [savedItem, setSavedItem] = useState<Save | null>(null);
  const [duplicateSave, setDuplicateSave] = useState<DuplicateSaveInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Settings and data
  const [visibility, setVisibility] = useState<SaveVisibility>("private");
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // Prevent double saves
  const saveInitiatedRef = useRef(false);

  // Fetch URL/title - prioritize prefill data, fallback to current tab
  useEffect(() => {
    async function loadUrlAndTitle() {
      // First, check for prefill data (from context menu or keyboard shortcut)
      const prefill = await consumePrefillData();
      if (prefill) {
        setCurrentUrl(prefill.url);
        setCurrentTitle(prefill.title || null);
        return;
      }

      // Fallback to current tab
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          setCurrentUrl(tabs[0].url || null);
          setCurrentTitle(tabs[0].title || null);
        }
      } catch (err) {
        console.error("Failed to get tab info:", err);
      }
    }

    loadUrlAndTitle();
  }, []);

  // Auto-save flow - runs once when we have URL and auth
  useEffect(() => {
    if (saveInitiatedRef.current || !currentUrl) return;

    async function initiateSave() {
      try {
        const token = await getToken();
        if (!token) {
          setStatus("error");
          setErrorMessage("Not authenticated");
          return;
        }

        // Mark as initiated immediately
        saveInitiatedRef.current = true;

        // Fetch user settings and check for duplicate in parallel
        const [spaceResult, tagsResult, collectionsResult, duplicateResult] = await Promise.all([
          getMySpace(token).catch(() => null),
          listTags(token).catch(() => [] as Tag[]),
          listCollections(token).catch(() => [] as Collection[]),
          checkDuplicate(currentUrl!, token).catch(() => null),
        ]);

        // Store fetched data
        setExistingTags(tagsResult);
        setCollections(collectionsResult);

        // Get default visibility from space or ensure space exists
        let defaultVisibility: SaveVisibility = "private";
        if (spaceResult) {
          defaultVisibility = spaceResult.defaultSaveVisibility;
        } else {
          try {
            const newSpace = await ensureSpace(token);
            defaultVisibility = newSpace.defaultSaveVisibility;
          } catch {
            // Continue with default
          }
        }
        setVisibility(defaultVisibility);

        // Check for duplicate
        if (duplicateResult) {
          setDuplicateSave(duplicateResult);
          setStatus("duplicate");
          return;
        }

        // Proceed to save
        setStatus("saving");

        const saved = await createSave(
          {
            url: currentUrl!,
            title: currentTitle || undefined,
            visibility: defaultVisibility,
          },
          token
        );

        setSavedItem(saved);
        setStatus("success");

        // Notify background script with URL for icon update
        browser.runtime.sendMessage({ type: "SAVE_SUCCESS", url: currentUrl }).catch(() => {});
      } catch (err) {
        console.error("Save failed:", err);
        setStatus("error");
        if (err instanceof ApiError) {
          // Check for duplicate error from API
          if (err.code === "CONFLICT") {
            // Refetch duplicate info
            try {
              const token = await getToken();
              if (token && currentUrl) {
                const duplicate = await checkDuplicate(currentUrl, token);
                if (duplicate) {
                  setDuplicateSave(duplicate);
                  setStatus("duplicate");
                  return;
                }
              }
            } catch {
              // Fall through to error
            }
          }
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Failed to save link");
        }
      }
    }

    initiateSave();
  }, [currentUrl, currentTitle, getToken]);

  // Handle delete/undo
  const handleDelete = useCallback(async () => {
    if (!savedItem || isDeleting) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsDeleting(false);
        return;
      }

      await deleteSave(savedItem.id, token);
      setStatus("deleted");
      setSavedItem(null);

      // Notify background script with URL for icon update
      if (currentUrl) {
        browser.runtime.sendMessage({ type: "DELETE_SUCCESS", url: currentUrl }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      setIsDeleting(false);
    }
  }, [savedItem, isDeleting, getToken, currentUrl]);

  // Retry save after error or deletion
  const handleRetry = useCallback(() => {
    saveInitiatedRef.current = false;
    setStatus("loading");
    setErrorMessage("");
    setSavedItem(null);
    setIsDeleting(false);
    // Trigger refetch by resetting URL
    const url = currentUrl;
    setCurrentUrl(null);
    setTimeout(() => setCurrentUrl(url), 0);
  }, [currentUrl]);

  // Handle visibility change (update saved item)
  const handleVisibilityChange = useCallback(
    async (newVisibility: SaveVisibility) => {
      setVisibility(newVisibility);

      // If already saved, update the visibility
      if (savedItem) {
        try {
          const token = await getToken();
          if (!token) return;

          const { updateSave } = await import("../lib/api");
          await updateSave(savedItem.id, { visibility: newVisibility }, token);
        } catch (err) {
          console.error("Failed to update visibility:", err);
          // Rollback
          setVisibility(visibility);
        }
      }
    },
    [savedItem, visibility, getToken]
  );

  // Handle escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        window.close();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Memoize domain extraction
  const domain = useMemo(() => (currentUrl ? extractDomain(currentUrl) : null), [currentUrl]);
  const webAppUrl = import.meta.env.VITE_WEB_APP_URL || "https://backpocket.my";

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* Loading State */}
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-muted)]">
            <Loader2Icon className="size-6 animate-spin" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Getting ready...</p>
        </div>
      )}

      {/* Saving State */}
      {status === "saving" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-muted)] animate-[pop_0.3s_ease]">
            <Loader2Icon className="size-6 animate-spin" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Saving...</p>
          {domain && <p className="text-sm text-[var(--text-muted)]">{domain}</p>}
        </div>
      )}

      {/* Success State */}
      {status === "success" && savedItem && (
        <div className="flex w-full flex-col items-center gap-2.5 py-2 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--success-bg)] text-[var(--success)] animate-[pop_0.3s_ease]">
            <CheckIcon className="size-7" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Saved to Backpocket!</p>

          {/* Quick Actions */}
          <div className="mt-1 flex w-full flex-col gap-2.5">
            {/* Visibility Toggle */}
            <div className="flex justify-center">
              <VisibilityToggle value={visibility} onChange={handleVisibilityChange} />
            </div>

            {/* Quick Tags */}
            <QuickTagSection
              savedItem={savedItem}
              existingTags={existingTags}
              getToken={getToken}
            />

            {/* Quick Collections */}
            <QuickCollectionSection
              savedItem={savedItem}
              collections={collections}
              getToken={getToken}
            />

            {/* Quick Note */}
            <QuickNoteSection savedItem={savedItem} getToken={getToken} />
          </div>

          {/* Bottom actions */}
          <div className="mt-2 flex items-center gap-3">
            {/* Delete/Undo button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all hover:border-[var(--error)] hover:bg-[var(--error-bg)] hover:text-[var(--error)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                <TrashIcon className="size-3" />
              )}
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>

            {/* View in library link */}
            <a
              href={`${webAppUrl}/app/saves/${savedItem.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-all hover:text-[var(--accent)]"
            >
              <ExternalLinkIcon className="size-3.5" />
              View in library
            </a>
          </div>
        </div>
      )}

      {/* Deleted State */}
      {status === "deleted" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-muted)]">
            <TrashIcon className="size-6" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Deleted</p>
          <p className="text-sm text-[var(--text-muted)]">Link was removed from your library</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-1 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-hover)]"
          >
            Save again
          </button>
        </div>
      )}

      {/* Duplicate State */}
      {status === "duplicate" && duplicateSave && (
        <div className="flex flex-col items-center gap-3 py-6 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--warning-bg)] text-[var(--warning)] animate-[pop_0.3s_ease]">
            <AlertCircleIcon className="size-6" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Already saved</p>
          {domain && <p className="text-sm text-[var(--text-muted)]">{domain}</p>}
          <p className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <ClockIcon className="size-3.5" />
            Saved {formatRelativeTime(duplicateSave.savedAt)}
          </p>
          <a
            href={`${webAppUrl}/app/saves/${duplicateSave.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all hover:border-[var(--text-muted)]"
          >
            <ExternalLinkIcon className="size-3.5" />
            View existing save
          </a>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--error-bg)] text-[var(--error)] animate-[pop_0.3s_ease]">
            <AlertCircleIcon className="size-6" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Couldn't save</p>
          {errorMessage && <p className="text-sm text-[var(--text-secondary)]">{errorMessage}</p>}
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all hover:border-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          >
            <RotateCcwIcon className="size-3.5" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
});

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
