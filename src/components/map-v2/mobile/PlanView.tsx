/**
 * Mobile Plan View
 * Full-screen dedicated view for itinerary (not a drawer)
 * Optimized for touch interactions with larger targets
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMapState } from '../context/MapStateContext';
import { MobileItineraryStats } from './MobileItineraryStats';
import { MobileViewToggle } from './MobileViewToggle';
import { MobileHubCardList } from './MobileHubCardList';
import { MapPin } from 'lucide-react';

export function PlanView() {
  const { planItems, dispatch } = useMapState();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const hasPlaces = planItems.length > 0;

  // Track scroll to add shadow to sticky header
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 10);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Empty state when no places in plan
  if (!hasPlaces) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center bg-background">
        <div className="mb-6 rounded-full bg-muted p-8">
          <MapPin className="h-16 w-16 text-muted-foreground" />
        </div>
        
        <h3 className="mb-3 text-xl font-bold text-foreground">
          Your itinerary is empty
        </h3>
        
        <p className="mb-8 max-w-sm text-base text-muted-foreground">
          Switch to Map to add places to your trip
        </p>
        
        <button
          onClick={() => dispatch({ type: 'SET_MOBILE_TAB', payload: 'map' })}
          className="rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground active:opacity-90 transition-opacity min-h-[48px]"
        >
          Switch to Map
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Sticky header with stats and view toggle */}
      <div 
        className={`sticky top-0 z-10 bg-background border-b border-border transition-shadow ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        {/* Stats */}
        <div className="px-4 py-4">
          <MobileItineraryStats places={planItems} />
        </div>

        {/* View toggle */}
        <div className="px-4 pb-4 flex justify-center">
          <MobileViewToggle />
        </div>
      </div>

      {/* Scrollable hub cards area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-safe"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
        }}
      >
        <div className="py-4">
          <MobileHubCardList places={planItems} />
        </div>
      </div>
    </div>
  );
}
