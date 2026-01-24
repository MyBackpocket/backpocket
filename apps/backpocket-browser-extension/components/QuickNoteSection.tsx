import { memo, useCallback, useState } from "react";
import { updateSave } from "../lib/api";
import type { Save } from "../lib/types";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, FileTextIcon, Loader2Icon } from "./Icons";

interface QuickNoteSectionProps {
  savedItem: Save;
  getToken: () => Promise<string | null>;
}

export const QuickNoteSection = memo(function QuickNoteSection({
  savedItem,
  getToken,
}: QuickNoteSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteText, setNoteText] = useState(savedItem.note || "");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleNoteChange = useCallback(
    (text: string) => {
      setNoteText(text);
      setHasUnsavedChanges(text !== (savedItem.note || ""));
    },
    [savedItem.note]
  );

  const handleSaveNote = useCallback(async () => {
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
  }, [isUpdating, hasUnsavedChanges, getToken, savedItem.id, noteText]);

  // Auto-save on blur
  const handleBlur = useCallback(() => {
    if (hasUnsavedChanges) {
      handleSaveNote();
    }
  }, [hasUnsavedChanges, handleSaveNote]);

  // Handle Cmd+Enter keyboard shortcut
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && hasUnsavedChanges) {
        e.preventDefault();
        handleSaveNote();
      }
    },
    [hasUnsavedChanges, handleSaveNote]
  );

  const hasNote = noteText.trim().length > 0;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border bg-[var(--bg-tertiary)] px-3 py-2.5 text-xs transition-all ${
          isExpanded
            ? "rounded-b-none border-[var(--border-focus)] shadow-[0_0_0_2px_var(--accent-subtle)]"
            : "border-[var(--border)] hover:border-[var(--text-muted)]"
        } ${hasNote ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}
      >
        <FileTextIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left font-medium">{hasNote ? "Edit note" : "Add a note"}</span>
        {isUpdating ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin" />
        ) : isExpanded ? (
          <ChevronUpIcon className="size-4 shrink-0" />
        ) : (
          <ChevronDownIcon className="size-4 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="rounded-b-[var(--radius-md)] border border-t-0 border-[var(--border-focus)] bg-[var(--bg-input)] p-3 shadow-[0_0_0_2px_var(--accent-subtle)] animate-[slideDown_0.15s_ease]">
          <textarea
            value={noteText}
            onChange={(e) => handleNoteChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Add a quick note..."
            rows={2}
            className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-tertiary)] p-2.5 text-xs leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)]"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)]">Markdown supported</span>
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <CheckIcon className="size-3" />
                )}
                Save
                <kbd className="ml-1 rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[9px] font-normal">
                  ⌘↵
                </kbd>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
