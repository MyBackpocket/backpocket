/**
 * Image Cache Manager
 * Handles downloading and caching images for offline use
 * 
 * Uses the new expo-file-system File/Directory API (SDK 52+)
 * https://docs.expo.dev/versions/latest/sdk/filesystem/
 */

import { Directory, File, Paths } from "expo-file-system";

const CACHE_FOLDER_NAME = "offline_images";

/**
 * Get the cache directory for offline images
 */
function getCacheDirectory(): Directory {
  return new Directory(Paths.cache, CACHE_FOLDER_NAME);
}

/**
 * Ensure the cache directory exists
 */
function ensureCacheDirectory(): void {
  const cacheDir = getCacheDirectory();
  if (!cacheDir.exists) {
    cacheDir.create();
    console.log("[image-cache] Created cache directory");
  }
}

/**
 * Generate a local filename for a cached image
 */
function getLocalFilename(saveId: string, imageUrl: string): string {
  // Extract extension from URL or default to jpg
  const urlParts = imageUrl.split(".");
  let extension = urlParts[urlParts.length - 1].split("?")[0];
  if (!["jpg", "jpeg", "png", "gif", "webp"].includes(extension.toLowerCase())) {
    extension = "jpg";
  }
  return `${saveId}.${extension.toLowerCase()}`;
}

/**
 * Get the full local path for a cached image
 */
export function getLocalImagePath(saveId: string, imageUrl: string): string {
  const cacheDir = getCacheDirectory();
  return `${cacheDir.uri}/${getLocalFilename(saveId, imageUrl)}`;
}

/**
 * Get a File instance for a cached image
 */
function getCachedImageFile(saveId: string, imageUrl: string): File {
  const cacheDir = getCacheDirectory();
  const filename = getLocalFilename(saveId, imageUrl);
  return new File(cacheDir, filename);
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url: string): string {
  const urlPath = url.split("?")[0];
  const parts = urlPath.split("/");
  return parts[parts.length - 1] || "image";
}

/**
 * Download and cache an image
 * @returns The local file path if successful, null if failed
 */
export async function cacheImage(
  saveId: string,
  imageUrl: string
): Promise<string | null> {
  if (!saveId || !imageUrl) {
    console.warn(`[image-cache] Invalid params - saveId: ${saveId}, imageUrl: ${imageUrl?.slice(0, 50)}`);
    return null;
  }

  try {
    ensureCacheDirectory();
    
    const cachedFile = getCachedImageFile(saveId, imageUrl);
    
    // Check if already cached
    if (cachedFile.exists) {
      console.log(`[image-cache] Already cached: ${saveId}`);
      return cachedFile.uri;
    }

    const cacheDir = getCacheDirectory();
    
    // File.downloadFileAsync uses the URL's filename, which can cause collisions
    // when multiple images have the same filename (e.g., "og-image.png").
    // We need to clean up any existing file with that name before downloading.
    const urlFilename = getFilenameFromUrl(imageUrl);
    const potentialConflict = new File(cacheDir, urlFilename);
    if (potentialConflict.exists) {
      potentialConflict.delete();
    }

    // Download the image
    const downloadedFile = await File.downloadFileAsync(imageUrl, cacheDir);
    
    if (downloadedFile.exists) {
      // Move to our final filename (saveId.extension)
      const targetFile = getCachedImageFile(saveId, imageUrl);
      
      // If target already exists (race condition), delete it first
      if (targetFile.exists) {
        targetFile.delete();
      }
      
      downloadedFile.move(targetFile);
      console.log(`[image-cache] Cached: ${saveId}`);
      return targetFile.uri;
    } else {
      console.warn(`[image-cache] Download failed: ${imageUrl.slice(0, 80)}`);
      return null;
    }
  } catch (error) {
    console.error(`[image-cache] Error caching ${saveId}: ${error}`);
    return null;
  }
}

/**
 * Download and cache multiple images in parallel
 * @returns Map of saveId to local path (null if failed)
 */
export async function cacheImages(
  images: Array<{ saveId: string; imageUrl: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  const total = images.length;
  let current = 0;

  // Process in batches of 5 to avoid overwhelming the network
  const batchSize = 5;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async ({ saveId, imageUrl }) => {
        const localPath = await cacheImage(saveId, imageUrl);
        current++;
        onProgress?.(current, total);
        return { saveId, localPath };
      })
    );
    
    for (const { saveId, localPath } of batchResults) {
      results.set(saveId, localPath);
    }
  }

  return results;
}

/**
 * Delete a cached image
 */
export async function deleteCachedImage(saveId: string, imageUrl: string): Promise<void> {
  try {
    const cachedFile = getCachedImageFile(saveId, imageUrl);
    if (cachedFile.exists) {
      cachedFile.delete();
      console.log(`[image-cache] Deleted cached image: ${saveId}`);
    }
  } catch (error) {
    console.error(`[image-cache] Error deleting cached image: ${error}`);
  }
}

/**
 * Delete all cached images
 */
export async function clearImageCache(): Promise<void> {
  try {
    const cacheDir = getCacheDirectory();
    if (cacheDir.exists) {
      cacheDir.delete();
      console.log("[image-cache] Cleared all cached images");
    }
  } catch (error) {
    console.error(`[image-cache] Error clearing image cache: ${error}`);
  }
}

/**
 * Get the total size of cached images in bytes
 */
export async function getImageCacheSize(): Promise<number> {
  try {
    const cacheDir = getCacheDirectory();
    if (!cacheDir.exists) return 0;

    const contents = cacheDir.list();
    let totalSize = 0;

    for (const item of contents) {
      if (item instanceof File) {
        totalSize += item.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error(`[image-cache] Error getting cache size: ${error}`);
    return 0;
  }
}

/**
 * Get the number of cached images
 */
export async function getImageCacheCount(): Promise<number> {
  try {
    const cacheDir = getCacheDirectory();
    if (!cacheDir.exists) return 0;

    const contents = cacheDir.list();
    // Only count files, not directories
    return contents.filter(item => item instanceof File).length;
  } catch (error) {
    console.error(`[image-cache] Error getting cache count: ${error}`);
    return 0;
  }
}

/**
 * Check if an image is cached locally
 */
export async function isImageCached(saveId: string, imageUrl: string): Promise<boolean> {
  try {
    const cachedFile = getCachedImageFile(saveId, imageUrl);
    return cachedFile.exists;
  } catch {
    return false;
  }
}

/**
 * Get a cached image URI if available, otherwise return the remote URL
 */
export async function getImageUri(
  saveId: string,
  imageUrl: string | null
): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    const cachedFile = getCachedImageFile(saveId, imageUrl);
    if (cachedFile.exists) {
      return cachedFile.uri;
    }
  } catch {}

  return imageUrl;
}

/**
 * Prune old images that are no longer referenced
 */
export async function pruneOrphanedImages(activeSaveIds: Set<string>): Promise<number> {
  try {
    const cacheDir = getCacheDirectory();
    if (!cacheDir.exists) return 0;

    const contents = cacheDir.list();
    let deletedCount = 0;

    for (const item of contents) {
      if (item instanceof File) {
        // Extract saveId from filename (format: saveId.extension)
        const saveId = item.name.split(".")[0];
        if (!activeSaveIds.has(saveId)) {
          item.delete();
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[image-cache] Pruned ${deletedCount} orphaned images`);
    }

    return deletedCount;
  } catch (error) {
    console.error(`[image-cache] Error pruning orphaned images: ${error}`);
    return 0;
  }
}
