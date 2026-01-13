import type { DuplicateSaveInfo } from "../lib/types";
import { AlertCircleIcon, ExternalLinkIcon, XIcon } from "./Icons";

interface DuplicateWarningProps {
  duplicate: DuplicateSaveInfo;
  onDismiss?: () => void;
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

export function DuplicateWarning({ duplicate, onDismiss }: DuplicateWarningProps) {
  const webAppUrl = import.meta.env.VITE_WEB_APP_URL || "https://backpocket.my";
  const saveUrl = `${webAppUrl}/app/saves/${duplicate.id}`;

  return (
    <div className="duplicate-warning">
      <div className="duplicate-warning-header">
        <AlertCircleIcon className="w-4 h-4 text-amber" />
        <span className="duplicate-warning-title">Already saved</span>
        {onDismiss && (
          <button
            type="button"
            className="duplicate-warning-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="duplicate-warning-content">
        <p className="duplicate-warning-text">
          You saved this link {formatRelativeTime(duplicate.savedAt)}
        </p>
        {duplicate.title && <p className="duplicate-warning-save-title">{duplicate.title}</p>}
      </div>
      <a
        href={saveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="duplicate-warning-link"
      >
        <ExternalLinkIcon className="w-3.5 h-3.5" />
        View existing save
      </a>
    </div>
  );
}
