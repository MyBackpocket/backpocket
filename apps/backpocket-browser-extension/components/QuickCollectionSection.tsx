import { useState } from "react";
import { updateSave } from "../lib/api";
import type { Collection, Save } from "../lib/types";
import { CheckIcon, ChevronDownIcon, ExternalLinkIcon, FolderIcon, Loader2Icon } from "./Icons";

interface QuickCollectionSectionProps {
  savedItem: Save;
  collections: Collection[];
  getToken: () => Promise<string | null>;
}

export function QuickCollectionSection({
  savedItem,
  collections,
  getToken,
}: QuickCollectionSectionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    savedItem.collections?.map((c) => c.id) || []
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const webAppUrl = import.meta.env.VITE_WEB_APP_URL || "https://backpocket.my";

  async function handleToggleCollection(collectionId: string) {
    if (isUpdating) return;

    const isSelected = selectedIds.includes(collectionId);
    const newIds = isSelected
      ? selectedIds.filter((id) => id !== collectionId)
      : [...selectedIds, collectionId];

    const previousIds = [...selectedIds];
    setSelectedIds(newIds);
    setIsUpdating(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await updateSave(savedItem.id, { collectionIds: newIds }, token);
    } catch (err) {
      console.error("Failed to update collections:", err);
      // Rollback
      setSelectedIds(previousIds);
    } finally {
      setIsUpdating(false);
    }
  }

  // Empty state - show link to create collections
  if (collections.length === 0) {
    return (
      <div className="w-full">
        <a
          href={`${webAppUrl}/app/collections`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <FolderIcon className="size-4 shrink-0" />
          <span className="flex-1 text-left">Create a collection</span>
          <ExternalLinkIcon className="size-3.5 shrink-0" />
        </a>
      </div>
    );
  }

  const selectedCollections = collections.filter((c) => selectedIds.includes(c.id));
  const displayText =
    selectedCollections.length === 0
      ? "Add to collection"
      : selectedCollections.map((c) => c.name).join(", ");

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm transition-all ${
          isOpen
            ? "border-[var(--border-focus)] shadow-[0_0_0_2px_var(--accent-subtle)]"
            : "hover:border-[var(--text-muted)]"
        } ${isUpdating ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <FolderIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
        <span
          className={`flex-1 truncate text-left ${
            selectedIds.length === 0 ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
          }`}
        >
          {displayText}
        </span>
        {isUpdating ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin text-[var(--text-muted)]" />
        ) : (
          <ChevronDownIcon
            className={`size-4 shrink-0 text-[var(--text-muted)] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-input)] shadow-[var(--shadow-lg)]">
          {collections.map((collection) => {
            const isSelected = selectedIds.includes(collection.id);
            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => handleToggleCollection(collection.id)}
                disabled={isUpdating}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  isSelected ? "bg-[var(--accent-subtle)]" : "hover:bg-[var(--bg-muted)]"
                } ${isUpdating ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {isSelected && <CheckIcon className="size-3.5" />}
                </span>
                <span className="flex-1 text-[var(--text-primary)]">{collection.name}</span>
                {collection._count?.saves !== undefined && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {collection._count.saves}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
