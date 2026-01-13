import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  checkDuplicate,
  createSave,
  ensureSpace,
  getMySpace,
  listCollections,
  listTags,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Collection, DuplicateSaveInfo, Save, SaveVisibility, Tag } from "../lib/types";
import {
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  GlobeIcon,
  Loader2Icon,
  RotateCcwIcon,
} from "./Icons";
import { QuickCollectionSection } from "./QuickCollectionSection";
import { QuickNoteSection } from "./QuickNoteSection";
import { QuickTagSection } from "./QuickTagSection";
import { VisibilityToggle } from "./VisibilityToggle";

type SaveStatus = "loading" | "saving" | "success" | "duplicate" | "error";

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function QuickSaveView() {
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

  // Prevent double saves
  const saveInitiatedRef = useRef(false);

  // Fetch current tab info
  useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs[0]) {
          setCurrentUrl(tabs[0].url || null);
          setCurrentTitle(tabs[0].title || null);
        }
      })
      .catch(console.error);
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

        // Notify background script
        browser.runtime.sendMessage({ type: "SAVE_SUCCESS" }).catch(() => {});
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

  // Retry save after error
  const handleRetry = useCallback(() => {
    saveInitiatedRef.current = false;
    setStatus("loading");
    setErrorMessage("");
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

  const domain = currentUrl ? extractDomain(currentUrl) : null;
  const webAppUrl = import.meta.env.VITE_WEB_APP_URL || "https://backpocket.my";

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Loading State */}
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
            <Loader2Icon className="size-7 animate-spin" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Getting ready...</p>
        </div>
      )}

      {/* Saving State */}
      {status === "saving" && (
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] animate-[pop_0.3s_ease]">
            <Loader2Icon className="size-7 animate-spin" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Saving...</p>
          {domain && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--bg-muted)] px-4 py-2">
              <GlobeIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-sm text-[var(--text-secondary)]">{domain}</span>
            </div>
          )}
          <div className="mt-1 flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">Saving as:</span>
            <VisibilityToggle value={visibility} onChange={() => {}} disabled />
          </div>
        </div>
      )}

      {/* Success State */}
      {status === "success" && savedItem && (
        <div className="flex w-full flex-col items-center gap-3 px-4 py-5 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success)] animate-[pop_0.3s_ease]">
            <CheckIcon className="size-8" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Saved to Backpocket!</p>
          {domain && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--bg-muted)] px-4 py-2">
              <GlobeIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-sm text-[var(--text-secondary)]">{domain}</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-3 flex w-full flex-col gap-3">
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

          {/* View in web app link */}
          <a
            href={`${webAppUrl}/app/saves/${savedItem.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
          >
            <ExternalLinkIcon className="size-4" />
            View in library
          </a>
        </div>
      )}

      {/* Duplicate State */}
      {status === "duplicate" && duplicateSave && (
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--warning-bg)] text-[var(--warning)] animate-[pop_0.3s_ease]">
            <AlertCircleIcon className="size-7" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Already saved</p>
          {domain && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--bg-muted)] px-4 py-2">
              <GlobeIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-sm text-[var(--text-secondary)]">{domain}</span>
            </div>
          )}
          {duplicateSave.title && (
            <p className="max-w-full truncate text-base font-medium text-[var(--text-primary)]">
              {duplicateSave.title}
            </p>
          )}
          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
            <ClockIcon className="size-3.5" />
            Saved {formatRelativeTime(duplicateSave.savedAt)}
          </p>
          <a
            href={`${webAppUrl}/app/saves/${duplicateSave.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
          >
            <ExternalLinkIcon className="size-4" />
            View existing save
          </a>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="flex flex-col items-center gap-4 px-5 py-8 text-center animate-[fadeIn_0.2s_ease]">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--error-bg)] text-[var(--error)] animate-[pop_0.3s_ease]">
            <AlertCircleIcon className="size-7" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Couldn't save</p>
          {errorMessage && <p className="text-sm text-[var(--text-secondary)]">{errorMessage}</p>}
          <button
            type="button"
            onClick={handleRetry}
            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all hover:border-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          >
            <RotateCcwIcon className="size-4" />
            Try again
          </button>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="mt-1 text-center text-xs text-[var(--text-muted)] opacity-80">
        Press{" "}
        <kbd className="mx-0.5 rounded border border-[var(--border)] bg-[var(--bg-muted)] px-1.5 py-0.5 font-sans text-[10px]">
          Esc
        </kbd>{" "}
        to close
      </p>
    </div>
  );
}

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
