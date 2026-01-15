/**
 * Offline Auth Cache
 * Caches user profile information for offline access
 */

import * as SecureStore from "expo-secure-store";

const AUTH_CACHE_KEY = "backpocket_auth_cache";

export interface CachedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  imageUrl: string | null;
  cachedAt: number;
}

/**
 * Cache the current user's profile for offline access
 */
export async function cacheUser(user: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  imageUrl?: string | null;
}): Promise<void> {
  const cachedUser: CachedUser = {
    id: user.id,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    fullName: user.fullName ?? null,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    imageUrl: user.imageUrl ?? null,
    cachedAt: Date.now(),
  };

  try {
    await SecureStore.setItemAsync(AUTH_CACHE_KEY, JSON.stringify(cachedUser));
    console.log("[auth-cache] User cached successfully");
  } catch (error) {
    console.error("[auth-cache] Failed to cache user:", error);
  }
}

/**
 * Get the cached user profile
 * Returns null if no cached user exists
 */
export async function getCachedUser(): Promise<CachedUser | null> {
  try {
    const cached = await SecureStore.getItemAsync(AUTH_CACHE_KEY);
    if (!cached) return null;

    const user = JSON.parse(cached) as CachedUser;
    console.log("[auth-cache] Retrieved cached user:", user.id);
    return user;
  } catch (error) {
    console.error("[auth-cache] Failed to get cached user:", error);
    return null;
  }
}

/**
 * Clear the cached user (e.g., on sign out)
 */
export async function clearCachedUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_CACHE_KEY);
    console.log("[auth-cache] Cached user cleared");
  } catch (error) {
    console.error("[auth-cache] Failed to clear cached user:", error);
  }
}

/**
 * Check if a cached user exists
 */
export async function hasCachedUser(): Promise<boolean> {
  try {
    const cached = await SecureStore.getItemAsync(AUTH_CACHE_KEY);
    return cached !== null;
  } catch (error) {
    console.error("[auth-cache] Failed to check cached user:", error);
    return false;
  }
}

/**
 * Check if the cached user is still valid (not too old)
 * Default max age is 30 days
 */
export async function isCachedUserValid(
  maxAgeMs: number = 30 * 24 * 60 * 60 * 1000
): Promise<boolean> {
  const user = await getCachedUser();
  if (!user) return false;

  const age = Date.now() - user.cachedAt;
  return age < maxAgeMs;
}
