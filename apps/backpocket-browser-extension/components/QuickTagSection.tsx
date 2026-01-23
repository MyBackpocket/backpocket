import { useState } from "react";
import { updateSave } from "../lib/api";
import type { Save, Tag } from "../lib/types";
import { CheckIcon, Loader2Icon, PlusIcon, TagIcon, XIcon } from "./Icons";

interface QuickTagSectionProps {
  savedItem: Save;
  existingTags: Tag[];
  getToken: () => Promise<string | null>;
}

export function QuickTagSection({ savedItem, existingTags, getToken }: QuickTagSectionProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    savedItem.tags?.map((t) => t.name) || []
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Get suggested tags (not already selected), limit to 5
  const suggestedTags = existingTags.filter((tag) => !selectedTags.includes(tag.name)).slice(0, 5);

  async function handleToggleTag(tagName: string) {
    if (isUpdating) return;

    const isSelected = selectedTags.includes(tagName);
    const newTags = isSelected
      ? selectedTags.filter((t) => t !== tagName)
      : [...selectedTags, tagName];

    const previousTags = [...selectedTags];
    setSelectedTags(newTags);
    setIsUpdating(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await updateSave(savedItem.id, { tagNames: newTags }, token);
    } catch (err) {
      console.error("Failed to update tags:", err);
      // Rollback
      setSelectedTags(previousTags);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAddNewTag() {
    const tagName = newTagInput.trim().toLowerCase();
    if (!tagName || selectedTags.includes(tagName) || isUpdating) return;

    const newTags = [...selectedTags, tagName];
    setSelectedTags(newTags);
    setNewTagInput("");
    setIsAddingTag(false);
    setIsUpdating(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await updateSave(savedItem.id, { tagNames: newTags }, token);
    } catch (err) {
      console.error("Failed to add tag:", err);
      // Rollback
      setSelectedTags(selectedTags);
    } finally {
      setIsUpdating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNewTag();
    } else if (e.key === "Escape") {
      setIsAddingTag(false);
      setNewTagInput("");
    }
  }

  return (
    <div className="w-full rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        <TagIcon className="size-3.5" />
        <span>Tags</span>
        {isUpdating && <Loader2Icon className="ml-auto size-3.5 animate-spin" />}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {/* Selected tags */}
        {selectedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleToggleTag(tag)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--accent-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{tag}</span>
            <XIcon className="size-3" />
          </button>
        ))}

        {/* Suggested tags */}
        {suggestedTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleToggleTag(tag.name)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon className="size-3" />
            <span>{tag.name}</span>
          </button>
        ))}

        {/* Add new tag input */}
        {isAddingTag ? (
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--border-focus)] bg-[var(--bg-input)] py-1 pl-3 pr-1.5 shadow-[0_0_0_2px_var(--accent-subtle)]">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newTagInput.trim()) {
                  setIsAddingTag(false);
                }
              }}
              placeholder="tag name"
              className="w-20 border-none bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              // biome-ignore lint/a11y/noAutofocus: intentional UX for new tag input
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              disabled={!newTagInput.trim()}
              className="flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)]"
            >
              <CheckIcon className="size-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingTag(true)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-dashed border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <PlusIcon className="size-3" />
            <span>New</span>
          </button>
        )}
      </div>
    </div>
  );
}
