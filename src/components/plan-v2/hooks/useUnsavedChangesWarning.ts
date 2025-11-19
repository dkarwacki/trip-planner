import { useEffect } from "react";

export interface UseUnsavedChangesWarningOptions {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Custom warning message */
  message?: string;
}

/**
 * useUnsavedChangesWarning - Warn users before leaving page with unsaved changes
 *
 * Features:
 * - Shows browser confirmation dialog on page unload/refresh
 * - Prevents accidental data loss
 * - Works with browser back/forward navigation
 * - Custom warning message support
 *
 * @example
 * ```tsx
 * useUnsavedChangesWarning({
 *   hasUnsavedChanges: messages.length > 0 && !activeConversationId,
 *   message: "You have unsaved messages. Are you sure you want to leave?"
 * });
 * ```
 */
export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UseUnsavedChangesWarningOptions) {
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    // Handle page unload/refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Modern browsers ignore custom message but still show generic warning
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}



