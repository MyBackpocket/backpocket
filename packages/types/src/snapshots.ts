// Snapshot types

export type SnapshotStatus = "pending" | "processing" | "ready" | "blocked" | "failed";

export type SnapshotBlockedReason =
  | "noarchive"
  | "forbidden"
  | "not_html"
  | "too_large"
  | "invalid_url"
  | "timeout"
  | "parse_failed"
  | "ssrf_blocked"
  | "fetch_error";

export interface SaveSnapshot {
  saveId: string;
  spaceId: string;
  status: SnapshotStatus;
  blockedReason: SnapshotBlockedReason | null;
  attempts: number;
  nextAttemptAt: Date | string | null;
  fetchedAt: Date | string | null;
  storagePath: string | null;
  canonicalUrl: string | null;
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  wordCount: number | null;
  language: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Snapshot content returned from storage
export interface SnapshotContent {
  title: string;
  byline: string | null;
  content: string; // Sanitized HTML
  textContent: string; // Plain text version
  excerpt: string;
  siteName: string | null;
  length: number;
  language: string | null;
}

// API input/output types
export interface GetSaveSnapshotInput {
  saveId: string;
  includeContent?: boolean;
}

export interface GetSaveSnapshotResponse {
  snapshot: SaveSnapshot | null;
  content: SnapshotContent | null;
}

