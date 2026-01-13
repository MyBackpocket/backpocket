import { useCallback, useEffect, useState } from "react";
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
import type { Collection, DuplicateSaveInfo, SaveVisibility, Tag } from "../lib/types";
import { CollectionSelect } from "./CollectionSelect";
import { DuplicateWarning } from "./DuplicateWarning";
import { CheckIcon, Loader2Icon } from "./Icons";
import { TagInput } from "./TagInput";
import { VisibilityToggle } from "./VisibilityToggle";

type SaveState = "idle" | "loading" | "success" | "error";

export function SaveForm() {
  const { getToken } = useAuth();

  // Form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<SaveVisibility>("private");

  // Data state
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [duplicate, setDuplicate] = useState<DuplicateSaveInfo | null>(null);

  // Loading states
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [tagsLoading, setTagsLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [spaceLoading, setSpaceLoading] = useState(true);

  // Fetch current tab info and all initial data on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional run-once on mount
  useEffect(() => {
    // Get current tab URL and title
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        if (tabs[0]) {
          const tabUrl = tabs[0].url || "";
          const tabTitle = tabs[0].title || "";
          setUrl(tabUrl);
          setTitle(tabTitle);

          // Check for duplicate once we have the URL
          if (tabUrl) {
            checkForDuplicate(tabUrl);
          }
        }
      })
      .catch(console.error);

    // Fetch all initial data
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const token = await getToken();
      if (!token) {
        setTagsLoading(false);
        setCollectionsLoading(false);
        setSpaceLoading(false);
        return;
      }

      // Fetch tags, collections, and space in parallel
      const [tagsResult, collectionsResult, spaceResult] = await Promise.all([
        listTags(token).catch((err) => {
          console.error("Failed to fetch tags:", err);
          return [] as Tag[];
        }),
        listCollections(token).catch((err) => {
          console.error("Failed to fetch collections:", err);
          return [] as Collection[];
        }),
        getMySpace(token).catch((err) => {
          console.error("Failed to fetch space:", err);
          return null;
        }),
      ]);

      setExistingTags(tagsResult);
      setCollections(collectionsResult);

      // If user has no space yet, create one
      if (!spaceResult) {
        try {
          const newSpace = await ensureSpace(token);
          setVisibility(newSpace.defaultSaveVisibility);
        } catch (err) {
          console.error("Failed to create space:", err);
        }
      } else {
        setVisibility(spaceResult.defaultSaveVisibility);
      }
    } finally {
      setTagsLoading(false);
      setCollectionsLoading(false);
      setSpaceLoading(false);
    }
  }

  async function checkForDuplicate(urlToCheck: string) {
    setDuplicateChecking(true);
    try {
      const token = await getToken();
      if (!token) return;

      const existingSave = await checkDuplicate(urlToCheck, token);
      setDuplicate(existingSave);
    } catch (err) {
      console.error("Failed to check duplicate:", err);
    } finally {
      setDuplicateChecking(false);
    }
  }

  const handleSave = useCallback(async () => {
    if (!url || duplicate) return;

    setSaveState("loading");
    setErrorMessage("");

    try {
      const token = await getToken();
      if (!token) {
        throw new ApiError("Not authenticated", "UNAUTHORIZED");
      }

      await createSave(
        {
          url,
          title: title || undefined,
          tagNames: tags.length > 0 ? tags : undefined,
          collectionIds: selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined,
          visibility,
        },
        token
      );

      setSaveState("success");

      // Notify background script of successful save (for badge update)
      browser.runtime.sendMessage({ type: "SAVE_SUCCESS" }).catch(() => {
        // Ignore error if background script not ready
      });

      // Auto-close popup after success
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveState("error");
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to save link");
      }
    }
  }, [url, title, tags, selectedCollectionIds, visibility, duplicate, getToken]);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !duplicate) {
        e.preventDefault();
        handleSave();
      }
      // Escape to close
      if (e.key === "Escape") {
        window.close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [duplicate, handleSave]);

  // Success state
  if (saveState === "success") {
    return (
      <div className="save-success">
        <div className="success-icon">
          <CheckIcon className="w-7 h-7" />
        </div>
        <p>Saved to Backpocket!</p>
      </div>
    );
  }

  const isLoading = saveState === "loading";
  const isInitializing = spaceLoading && tagsLoading && collectionsLoading;

  return (
    <div className="save-form">
      {/* Duplicate Warning */}
      {duplicate && <DuplicateWarning duplicate={duplicate} onDismiss={() => setDuplicate(null)} />}

      {/* Duplicate checking indicator */}
      {duplicateChecking && !duplicate && (
        <div className="duplicate-checking">
          <Loader2Icon className="w-3.5 h-3.5" />
          <span>Checking...</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="url">URL</label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled
          className="input-url"
        />
      </div>

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Optional title"
          disabled={isLoading}
          className="input-title"
        />
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <TagInput
          id="tags"
          value={tags}
          onChange={setTags}
          suggestions={existingTags.map((t) => t.name)}
          placeholder={tagsLoading ? "Loading tags..." : "Add tags..."}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="collections">Collections</label>
        <CollectionSelect
          collections={collections}
          selectedIds={selectedCollectionIds}
          onChange={setSelectedCollectionIds}
          loading={collectionsLoading}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <span className="form-label">Visibility</span>
        <VisibilityToggle
          value={visibility}
          onChange={setVisibility}
          disabled={isLoading || spaceLoading}
        />
      </div>

      {saveState === "error" && <div className="error-message">{errorMessage}</div>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isLoading || !url || !!duplicate || isInitializing}
        className="save-button"
      >
        {isLoading && <Loader2Icon className="w-4 h-4" />}
        {isLoading ? "Saving..." : duplicate ? "Already saved" : "Save"}
      </button>

      <p className="keyboard-hint">
        Press <kbd>⌘</kbd>+<kbd>Enter</kbd> to save, <kbd>Esc</kbd> to close
      </p>
    </div>
  );
}
