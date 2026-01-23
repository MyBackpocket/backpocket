import { memo, useCallback, useMemo, useState } from "react";
import { updateSave } from "../lib/api";
import type { Collection, Save } from "../lib/types";
import { CheckIcon, ChevronDownIcon, ExternalLinkIcon, FolderIcon, Loader2Icon } from "./Icons";

interface QuickCollectionSectionProps {
  savedItem: Save;
  collections: Collection[];
  getToken: () => Promise<string | null>;
}

export const QuickCollectionSection = memo(function QuickCollectionSection({
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

  // Memoize computed display values - must be before any early returns
  const displayText = useMemo(() => {
    const selected = collections.filter((c) => selectedIds.includes(c.id));
    return selected.length === 0 ? "Add to collection" : selected.map((c) => c.name).join(", ");
  }, [collections, selectedIds]);

  const handleToggleCollection = useCallback(
    async (collectionId: string) => {
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
    },
    [isUpdating, selectedIds, getToken, savedItem.id]
  );

  // Empty state - show link to create collections
  if (collections.length === 0) {
    return (
      <div className="w-full">
        <a
          href={`${webAppUrl}/app/collections`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2.5 text-xs text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <FolderIcon className="size-4 shrink-0" />
          <span className="flex-1 text-left font-medium">Create a collection</span>
          <ExternalLinkIcon className="size-3.5 shrink-0" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border bg-[var(--bg-tertiary)] px-3 py-2.5 text-xs transition-all ${
          isOpen
            ? "border-[var(--border-focus)] shadow-[0_0_0_2px_var(--accent-subtle)]"
            : "border-[var(--border)] hover:border-[var(--text-muted)]"
        } ${isUpdating ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <FolderIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
        <span
          className={`flex-1 truncate text-left font-medium ${
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
        <div className="mt-1.5 max-h-36 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] shadow-[var(--shadow-lg)] animate-[slideDown_0.15s_ease]">
          {collections.map((collection) => {
            const isSelected = selectedIds.includes(collection.id);
            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => handleToggleCollection(collection.id)}
                disabled={isUpdating}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                  isSelected ? "bg-[var(--accent-subtle)]" : "hover:bg-[var(--bg-muted)]"
                } ${isUpdating ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded border transition-all ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {isSelected && <CheckIcon className="size-2.5" />}
                </span>
                <span className="flex-1 font-medium text-[var(--text-primary)]">{collection.name}</span>
                {collection._count?.saves !== undefined && (
                  <span className="text-[10px] text-[var(--text-muted)]">
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
});
