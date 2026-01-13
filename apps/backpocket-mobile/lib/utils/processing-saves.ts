/**
 * Processing Saves Detection Utilities
 *
 * When a save is first created, the backend processes it asynchronously
 * to fetch metadata (title, description, imageUrl, siteName). These utilities
 * detect when a save is still being processed.
 */

import type { Save } from "@/lib/types";

/**
 * Maximum age (in ms) for a save to be considered "processing"
 * Saves older than this are assumed to have failed silently or been manually created
 */
const PROCESSING_MAX_AGE_MS = 60 * 1000; // 60 seconds

/**
 * Check if a save is still processing (metadata not yet fetched)
 *
 * A save is considered "processing" if:
 * 1. It has no title (title is null)
 * 2. It was created recently (within PROCESSING_MAX_AGE_MS)
 *
 * This heuristic avoids treating old saves without titles (e.g., manually created)
 * as processing forever.
 */
export function isSaveProcessing(save: Save): boolean {
  // If we have a title, the save has been processed
  if (save.title !== null) {
    return false;
  }

  // Check if the save is recent enough to still be processing
  const createdAt = new Date(save.createdAt).getTime();
  const now = Date.now();
  const age = now - createdAt;

  return age < PROCESSING_MAX_AGE_MS;
}

/**
 * Check if any saves in a list are processing
 */
export function hasProcessingSaves(saves: Save[]): boolean {
  return saves.some(isSaveProcessing);
}
