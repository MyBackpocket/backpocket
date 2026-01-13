import type { SaveVisibility } from "../lib/types";
import { GlobeIcon, LockIcon } from "./Icons";

interface VisibilityToggleProps {
  value: SaveVisibility;
  onChange: (value: SaveVisibility) => void;
  disabled?: boolean;
}

export function VisibilityToggle({ value, onChange, disabled = false }: VisibilityToggleProps) {
  return (
    <div className="flex gap-0.5 rounded-full bg-[var(--bg-muted)] p-1">
      <button
        type="button"
        onClick={() => onChange("private")}
        disabled={disabled}
        aria-pressed={value === "private"}
        className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
          value === "private"
            ? "bg-[var(--bg-input)] text-[var(--text-primary)] shadow-[var(--shadow)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <LockIcon className="size-4" />
        <span>Private</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("public")}
        disabled={disabled}
        aria-pressed={value === "public"}
        className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
          value === "public"
            ? "bg-[var(--bg-input)] text-[var(--text-primary)] shadow-[var(--shadow)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <GlobeIcon className="size-4" />
        <span>Public</span>
      </button>
    </div>
  );
}
