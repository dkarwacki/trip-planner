import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus } from "../types";

export interface UseAutoSaveOptions<T> {
  /**
   * Function to call when saving data
   * Should throw an error if save fails
   */
  saveFn: (data: T) => Promise<void>;

  /**
   * Debounce delay in milliseconds
   * @default 2000 (2 seconds)
   */
  debounceMs?: number;

  /**
   * Maximum number of retry attempts on failure
   * @default 3
   */
  maxRetries?: number;

  /**
   * Whether auto-save is enabled
   * @default true
   */
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  /** Current save status */
  saveStatus: SaveStatus;

  /** Manually trigger a save (bypasses debounce) */
  triggerSave: () => Promise<void>;

  /** Schedule a debounced save */
  scheduleSave: () => void;

  /** Reset save status to idle */
  resetStatus: () => void;
}

const STORAGE_KEY_PREFIX = "autosave_fallback_";

/**
 * Hook for auto-saving data with debouncing, retry logic, and localStorage fallback
 *
 * @example
 * ```tsx
 * const { saveStatus, scheduleSave } = useAutoSave({
 *   saveFn: async (messages) => {
 *     await saveMessagesToServer(conversationId, messages);
 *   }
 * });
 *
 * // In your useEffect when data changes:
 * useEffect(() => {
 *   scheduleSave();
 * }, [messages]);
 * ```
 */
export function useAutoSave<T>(data: T | null, options: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const { saveFn, debounceMs = 2000, maxRetries = 3, enabled = true } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastDataRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);

  /**
   * Perform the save operation with retry logic
   */
  const performSave = useCallback(
    async (dataToSave: T): Promise<void> => {
      if (isSavingRef.current) {
        return; // Prevent concurrent saves
      }

      isSavingRef.current = true;
      setSaveStatus("saving");

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await saveFn(dataToSave);

          // Success!
          retryCountRef.current = 0;
          setSaveStatus("saved");
          isSavingRef.current = false;

          // Clear localStorage fallback on successful save
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.startsWith(STORAGE_KEY_PREFIX)) {
              localStorage.removeItem(key);
            }
          });

          return;
        } catch (error) {
          console.error(`Save attempt ${attempt + 1} failed:`, error);

          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff: 1s, 2s, 4s)
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            retryCountRef.current = attempt + 1;
          } else {
            // All retries exhausted
            setSaveStatus("error");
            isSavingRef.current = false;

            // Store in localStorage as fallback
            try {
              const fallbackKey = `${STORAGE_KEY_PREFIX}${Date.now()}`;
              localStorage.setItem(fallbackKey, JSON.stringify(dataToSave));
              console.warn("Save failed, data stored in localStorage:", fallbackKey);
            } catch (storageError) {
              console.error("Failed to store in localStorage:", storageError);
            }

            throw error;
          }
        }
      }
    },
    [saveFn, maxRetries]
  );

  /**
   * Manually trigger a save (bypasses debounce)
   */
  const triggerSave = useCallback(async (): Promise<void> => {
    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!data || !enabled) {
      return;
    }

    await performSave(data);
  }, [data, enabled, performSave]);

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback(() => {
    if (!enabled || !data) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule new save
    debounceTimerRef.current = setTimeout(() => {
      lastDataRef.current = data;
      performSave(data).catch((error) => {
        console.error("Auto-save failed:", error);
      });
    }, debounceMs);
  }, [data, enabled, debounceMs, performSave]);

  /**
   * Reset save status to idle
   */
  const resetStatus = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Reset saved status to idle after a delay
   */
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000); // Show "Saved" for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  return {
    saveStatus,
    triggerSave,
    scheduleSave,
    resetStatus,
  };
}

/**
 * Get unsaved data from localStorage fallback
 */
export function getUnsavedDataFromStorage<T>(filter?: (key: string) => boolean): { key: string; data: T }[] {
  const unsavedData: { key: string; data: T }[] = [];

  try {
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        if (filter && !filter(key)) {
          continue;
        }

        const rawData = localStorage.getItem(key);
        if (rawData) {
          try {
            const data = JSON.parse(rawData) as T;
            unsavedData.push({ key, data });
          } catch (parseError) {
            console.error(`Failed to parse localStorage item ${key}:`, parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to retrieve unsaved data from localStorage:", error);
  }

  return unsavedData;
}

/**
 * Clear specific unsaved data from localStorage
 */
export function clearUnsavedDataFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to clear localStorage item ${key}:`, error);
  }
}
