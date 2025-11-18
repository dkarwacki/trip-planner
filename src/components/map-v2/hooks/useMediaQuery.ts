/**
 * Low-level media query hook
 * Safely handles SSR and provides reactive media query matching
 */

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Initialize with false for SSR safety
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") {
      return;
    }

    // Create media query list
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (using deprecated method for broader compatibility)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}


