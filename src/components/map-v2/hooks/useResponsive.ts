/**
 * Responsive platform detection hook
 * Provides semantic breakpoints aligned with Tailwind CSS
 * Optimized to use a single resize listener instead of multiple media queries
 */

import { useState, useEffect } from "react";

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: "mobile" | "tablet" | "desktop";
}

function getResponsiveState(width: number): ResponsiveState {
  // Tailwind breakpoints:
  // sm: 640px
  // md: 768px
  // lg: 1024px

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  // Determine platform (priority: desktop > tablet > mobile)
  let platform: "mobile" | "tablet" | "desktop";
  if (isDesktop) {
    platform = "desktop";
  } else if (isTablet) {
    platform = "tablet";
  } else {
    platform = "mobile";
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    platform,
  };
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => getResponsiveState(window.innerWidth));

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState(window.innerWidth));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}
