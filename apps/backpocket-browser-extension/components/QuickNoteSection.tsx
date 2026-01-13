import { useState } from "react";
import { updateSave } from "../lib/api";
import type { Save } from "../lib/types";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, FileTextIcon, Loader2Icon } from "./Icons";

interface QuickNoteSectionProps {
  savedItem: Save;
  getToken: () => Promise<string | null>;
}

export function QuickNoteSection({ savedItem, getToken }: QuickNoteSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteText, setNoteText] = useState(savedItem.note || "");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  function handleNoteChange(text: string) {
    setNoteText(text);
    setHasUnsavedChanges(text !== (savedItem.note || ""));
  }

  async function handleSaveNote() {
    if (isUpdating || !hasUnsavedChanges) return;

    setIsUpdating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await updateSave(savedItem.id, { note: noteText || undefined }, token);
      setHasUnsavedChanges(false);

      // Collapse if note is empty
      if (!noteText.trim()) {
        setIsExpanded(false);
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsUpdating(false);
    }
  }

  // Auto-save on blur
  function handleBlur() {
    if (hasUnsavedChanges) {
      handleSaveNote();
    }
  }

  const hasNote = noteText.trim().length > 0;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm transition-all ${
          isExpanded
            ? "rounded-b-none border-[var(--border-focus)] shadow-[0_0_0_2px_var(--accent-subtle)]"
            : "hover:border-[var(--text-muted)]"
        } ${hasNote ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}
      >
        <FileTextIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{hasNote ? "Edit note" : "Add a note"}</span>
        {isUpdating ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin" />
        ) : isExpanded ? (
          <ChevronUpIcon className="size-4 shrink-0" />
        ) : (
          <ChevronDownIcon className="size-4 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="rounded-b-xl border border-t-0 border-[var(--border-focus)] bg-[var(--bg-input)] p-3.5 shadow-[0_0_0_2px_var(--accent-subtle)] animate-[slideDown_0.15s_ease]">
          <textarea
            value={noteText}
            onChange={(e) => handleNoteChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="Add a quick note..."
            rows={3}
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)]"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)]">Supports Markdown</span>
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )}
                Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
