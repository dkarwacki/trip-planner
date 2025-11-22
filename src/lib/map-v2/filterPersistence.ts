/**
 * Utilities for persisting filter state per place
 * Stores filter preferences in localStorage
 */

import type { FilterState } from "@/components/map-v2/types";

const STORAGE_KEY_PREFIX = "map-v2-filters";

/**
 * Get persisted filters for a specific place
 */
export function getPersistedFilters(placeId: string): FilterState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${placeId}`);
    if (!stored) return null;

    return JSON.parse(stored) as FilterState;
  } catch (error) {
    console.error("[filterPersistence] Failed to get persisted filters:", error);
    return null;
  }
}

/**
 * Persist filters for a specific place
 */
export function persistFilters(placeId: string, filters: FilterState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_${placeId}`, JSON.stringify(filters));
  } catch (error) {
    console.error("[filterPersistence] Failed to persist filters:", error);
  }
}

/**
 * Clear persisted filters for a specific place
 */
export function clearPersistedFilters(placeId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_${placeId}`);
  } catch (error) {
    console.error("[filterPersistence] Failed to clear persisted filters:", error);
  }
}

/**
 * Get all persisted filter keys
 * Useful for debugging or cleanup
 */
export function getAllPersistedFilterKeys(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.error("[filterPersistence] Failed to get persisted filter keys:", error);
    return [];
  }
}













