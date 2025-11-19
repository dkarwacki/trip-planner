/**
 * useKeyboardHeight hook
 * Detects virtual keyboard appearance and height on mobile devices
 *
 * Features:
 * - Uses visualViewport API for accurate keyboard detection
 * - Fallback to window.innerHeight changes for older browsers
 * - Returns keyboard height for layout adjustments
 * - Handles iOS and Android differences
 */

import { useState, useEffect } from "react";

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // Modern browsers: use visualViewport API
    if (window.visualViewport) {
      const handleViewportResize = () => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        // Calculate keyboard height
        // When keyboard appears, visualViewport.height decreases
        const windowHeight = window.innerHeight;
        const viewportHeight = viewport.height;
        const calculatedKeyboardHeight = windowHeight - viewportHeight;

        // Only consider it keyboard if height > 100px (avoids false positives)
        if (calculatedKeyboardHeight > 100) {
          setKeyboardHeight(calculatedKeyboardHeight);
          setIsKeyboardVisible(true);
        } else {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        }
      };

      window.visualViewport.addEventListener("resize", handleViewportResize);
      window.visualViewport.addEventListener("scroll", handleViewportResize);

      // Initial check
      handleViewportResize();

      return () => {
        window.visualViewport?.removeEventListener("resize", handleViewportResize);
        window.visualViewport?.removeEventListener("scroll", handleViewportResize);
      };
    } else {
      // Fallback for older browsers
      let initialHeight = window.innerHeight;

      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;

        if (heightDifference > 100) {
          setKeyboardHeight(heightDifference);
          setIsKeyboardVisible(true);
        } else {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
          initialHeight = currentHeight; // Update reference when keyboard closes
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
  };
}









