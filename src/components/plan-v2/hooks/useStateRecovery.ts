import { useEffect, useRef } from "react";

export interface UseStateRecoveryOptions<T> {
  /** Unique key for localStorage */
  storageKey: string;
  /** Current state to persist */
  state: T;
  /** Whether to enable recovery */
  enabled?: boolean;
  /** Callback when state is recovered */
  onRecover?: (state: T) => void;
  /** Debounce time in ms before persisting */
  debounceMs?: number;
}

/**
 * useStateRecovery - Persist state to localStorage and recover on refresh
 *
 * Features:
 * - Auto-saves state to localStorage
 * - Recovers state on mount
 * - Debounced saving to avoid excessive writes
 * - Type-safe serialization/deserialization
 * - Clears storage after successful recovery
 *
 * @example
 * ```tsx
 * useStateRecovery({
 *   storageKey: 'plan-session-draft',
 *   state: { messages, personas, itinerary },
 *   enabled: !activeConversationId && messages.length > 0,
 *   onRecover: (state) => {
 *     setMessages(state.messages);
 *     setPersonas(state.personas);
 *     // ...
 *   }
 * });
 * ```
 */
export function useStateRecovery<T>({
  storageKey,
  state,
  enabled = true,
  onRecover,
  debounceMs = 1000,
}: UseStateRecoveryOptions<T>) {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const hasRecovered = useRef(false);

  // Recover state on mount
  useEffect(() => {
    if (!enabled || hasRecovered.current) {
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const recoveredState = JSON.parse(stored) as T;

        // Call recovery callback
        if (onRecover) {
          onRecover(recoveredState);
        }

        // Clear storage after successful recovery
        localStorage.removeItem(storageKey);
        hasRecovered.current = true;
      }
    } catch (error) {
      console.error(`Failed to recover state from ${storageKey}:`, error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, enabled, onRecover]);

  // Persist state on changes (debounced)
  useEffect(() => {
    if (!enabled || !state) {
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Schedule save
    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error(`Failed to persist state to ${storageKey}:`, error);
      }
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [state, storageKey, enabled, debounceMs]);

  // Clear storage on unmount if state is empty/saved
  useEffect(() => {
    return () => {
      if (!enabled) {
        localStorage.removeItem(storageKey);
      }
    };
  }, [storageKey, enabled]);
}

/**
 * Manually clear recovery state from localStorage
 */
export function clearRecoveryState(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Failed to clear recovery state ${storageKey}:`, error);
  }
}









