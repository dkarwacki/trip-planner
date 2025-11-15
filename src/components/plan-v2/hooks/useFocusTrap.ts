import { useEffect, useRef } from "react";

export interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean;
  /** Restore focus to trigger element on deactivate */
  restoreFocus?: boolean;
  /** Initial focus element selector */
  initialFocusSelector?: string;
}

/**
 * useFocusTrap - Trap focus within a container (for dialogs/modals)
 *
 * Features:
 * - Traps tab navigation within container
 * - Restores focus to trigger element on close
 * - Sets initial focus to specified element
 * - Handles Escape key to close
 *
 * @example
 * ```tsx
 * const dialogRef = useFocusTrap({
 *   isActive: isOpen,
 *   restoreFocus: true,
 *   initialFocusSelector: 'h2' // Focus dialog title
 * });
 *
 * return <div ref={dialogRef}>...</div>
 * ```
 */
export function useFocusTrap({
  isActive,
  restoreFocus = true,
  initialFocusSelector,
}: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Set initial focus
    if (initialFocusSelector) {
      const initialElement = containerRef.current.querySelector(
        initialFocusSelector
      ) as HTMLElement;
      if (initialElement) {
        initialElement.focus();
      }
    } else {
      // Focus first focusable element
      const firstFocusable = getFocusableElements(containerRef.current)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, initialFocusSelector, restoreFocus]);

  return containerRef;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

