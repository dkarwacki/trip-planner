/**
 * Responsive platform detection hook
 * Provides semantic breakpoints aligned with Tailwind CSS
 */

import { useMediaQuery } from './useMediaQuery';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: 'mobile' | 'tablet' | 'desktop';
}

export function useResponsive(): ResponsiveState {
  // Tailwind breakpoints:
  // sm: 640px
  // md: 768px
  // lg: 1024px
  
  // Mobile: max-width 639px
  const isMobile = useMediaQuery('(max-width: 639px)');
  
  // Tablet: 640px - 1023px
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  
  // Desktop: 1024px and up
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Determine platform (priority: desktop > tablet > mobile)
  let platform: 'mobile' | 'tablet' | 'desktop';
  if (isDesktop) {
    platform = 'desktop';
  } else if (isTablet) {
    platform = 'tablet';
  } else {
    platform = 'mobile';
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    platform,
  };
}

