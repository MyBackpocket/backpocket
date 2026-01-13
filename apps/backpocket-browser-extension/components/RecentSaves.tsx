import { useEffect, useState } from "react";
import { ApiError, listRecentSaves } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Save } from "../lib/types";
import { ExternalLinkIcon } from "./Icons";

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function RecentSaves() {
  const { getToken } = useAuth();
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent saves on mount
  useEffect(() => {
    async function fetchSaves() {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const recentSaves = await listRecentSaves(token, 5);
        setSaves(recentSaves);
      } catch (err) {
        console.error("Failed to fetch recent saves:", err);
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load saves");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSaves();
  }, [getToken]);

  const webAppUrl = import.meta.env.VITE_WEB_APP_URL || "https://backpocket.my";

  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-[var(--bg-tertiary)] p-4">
            <div className="h-3 w-[70%] animate-[pulse_1.5s_ease-in-out_infinite] rounded bg-[var(--border)]" />
            <div className="mt-2 h-2.5 w-[45%] animate-[pulse_1.5s_ease-in-out_infinite_0.15s] rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
      </div>
    );
  }

  if (saves.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">No saves yet</p>
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          Save your first link to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        {saves.map((save) => (
          <a
            key={save.id}
            href={`${webAppUrl}/app/saves/${save.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl bg-[var(--bg-tertiary)] p-4 transition-colors hover:bg-[var(--bg-muted)]"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                {save.title || extractDomain(save.url)}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="truncate text-xs text-[var(--text-muted)]">
                  {save.siteName || extractDomain(save.url)}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">·</span>
                <span className="shrink-0 text-xs text-[var(--text-muted)]">
                  {formatRelativeTime(save.savedAt)}
                </span>
              </div>
            </div>
            <ExternalLinkIcon className="size-4 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-60" />
          </a>
        ))}
      </div>
      <a
        href={`${webAppUrl}/saves`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
      >
        View all saves
        <ExternalLinkIcon className="size-3.5" />
      </a>
    </div>
  );
}
