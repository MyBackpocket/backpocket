import type { SaveVisibility } from "../lib/types";
import { GlobeIcon, LockIcon } from "./Icons";

interface VisibilityToggleProps {
  value: SaveVisibility;
  onChange: (value: SaveVisibility) => void;
  disabled?: boolean;
}

export function VisibilityToggle({ value, onChange, disabled = false }: VisibilityToggleProps) {
  return (
    <div className="flex gap-0.5 rounded-[var(--radius-full)] bg-[var(--bg-muted)] p-1">
      <button
        type="button"
        onClick={() => onChange("private")}
        disabled={disabled}
        aria-pressed={value === "private"}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-full)] px-3.5 py-1.5 text-xs font-semibold transition-all ${
          value === "private"
            ? "bg-[var(--bg-input)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <LockIcon className="size-3.5" />
        <span>Private</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("public")}
        disabled={disabled}
        aria-pressed={value === "public"}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-full)] px-3.5 py-1.5 text-xs font-semibold transition-all ${
          value === "public"
            ? "bg-[var(--bg-input)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <GlobeIcon className="size-3.5" />
        <span>Public</span>
      </button>
    </div>
  );
}
