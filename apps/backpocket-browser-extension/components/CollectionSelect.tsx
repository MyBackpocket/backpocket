import { useEffect, useRef, useState } from "react";
import type { Collection } from "../lib/types";
import { CheckIcon, ChevronDownIcon, FolderIcon } from "./Icons";

interface CollectionSelectProps {
  collections: Collection[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CollectionSelect({
  collections,
  selectedIds,
  onChange,
  loading = false,
  disabled = false,
}: CollectionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  }

  function toggleCollection(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  const selectedCollections = collections.filter((c) => selectedIds.includes(c.id));
  const displayText =
    selectedCollections.length === 0
      ? "No collection"
      : selectedCollections.map((c) => c.name).join(", ");

  if (loading) {
    return (
      <div className="collection-select collection-select-loading">
        <span className="collection-select-placeholder">Loading...</span>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="collection-select collection-select-empty">
        <FolderIcon className="w-3.5 h-3.5 opacity-50" />
        <span className="collection-select-placeholder">No collections</span>
      </div>
    );
  }

  return (
    <div className="collection-select-container" ref={containerRef}>
      <button
        type="button"
        className={`collection-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <FolderIcon className="w-3.5 h-3.5 opacity-50" />
        <span className={`collection-select-text ${selectedIds.length === 0 ? "placeholder" : ""}`}>
          {displayText}
        </span>
        <ChevronDownIcon
          className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="collection-select-dropdown">
          {collections.map((collection) => {
            const isSelected = selectedIds.includes(collection.id);
            return (
              <button
                type="button"
                key={collection.id}
                className={`collection-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => toggleCollection(collection.id)}
              >
                <span className="collection-select-checkbox">
                  {isSelected && <CheckIcon className="w-3 h-3" />}
                </span>
                <span className="collection-select-name">{collection.name}</span>
                {collection._count && (
                  <span className="collection-select-count">{collection._count.saves}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
