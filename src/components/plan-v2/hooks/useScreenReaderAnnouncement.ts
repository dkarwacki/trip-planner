import { useEffect, useRef } from "react";

export interface UseScreenReaderAnnouncementOptions {
  /** Politeness level for announcements */
  politeness?: "polite" | "assertive";
  /** Clear previous announcements */
  clearOnUnmount?: boolean;
}

/**
 * useScreenReaderAnnouncement - Announce messages to screen readers
 *
 * Creates a live region for screen reader announcements.
 * Uses ARIA live regions to announce dynamic content changes.
 *
 * @example
 * ```tsx
 * const announce = useScreenReaderAnnouncement({ politeness: 'polite' });
 *
 * // Announce when a place is added
 * announce('Barcelona added to your itinerary');
 *
 * // Announce save status
 * announce('Your changes have been saved');
 * ```
 */
export function useScreenReaderAnnouncement({
  politeness = "polite",
  clearOnUnmount = true,
}: UseScreenReaderAnnouncementOptions = {}) {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  // Create live region on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if live region already exists
    let liveRegion = document.getElementById(`sr-announcement-${politeness}`) as HTMLDivElement;

    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = `sr-announcement-${politeness}`;
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", politeness);
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only";

      // Visually hidden but accessible to screen readers
      liveRegion.style.position = "absolute";
      liveRegion.style.left = "-10000px";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.overflow = "hidden";

      document.body.appendChild(liveRegion);
    }

    liveRegionRef.current = liveRegion;

    return () => {
      if (clearOnUnmount && liveRegionRef.current) {
        liveRegionRef.current.textContent = "";
      }
    };
  }, [politeness, clearOnUnmount]);

  /**
   * Announce a message to screen readers
   */
  const announce = (message: string) => {
    if (!liveRegionRef.current) return;

    // Clear and re-set to ensure announcement
    liveRegionRef.current.textContent = "";

    // Use setTimeout to ensure the change is announced
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }
    }, 100);
  };

  return announce;
}
