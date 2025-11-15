/**
 * Discovery markers component
 * Renders attraction/restaurant markers on the map
 */

import { useEffect, useRef } from 'react';
import { useMapInstance } from './MapCanvas';
import type { AttractionScore } from '@/domain/map/models';

interface DiscoveryMarkersProps {
  attractions: AttractionScore[];
  category: 'attractions' | 'restaurants';
  onMarkerClick: (attractionId: string) => void;
  onMarkerHover?: (attractionId: string | null) => void;
  hoveredId?: string | null;
}

export function DiscoveryMarkers({
  attractions,
  category,
  onMarkerClick,
  onMarkerHover,
  hoveredId,
}: DiscoveryMarkersProps) {
  const { map, markerLibrary, isReady } = useMapInstance();
  const markersRef = useRef<Map<string, { marker: google.maps.marker.AdvancedMarkerElement; element: HTMLDivElement }>>(
    new Map()
  );

  useEffect(() => {
    if (!isReady || !map || !markerLibrary) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => {
      marker.map = null;
    });
    markersRef.current.clear();

    // Guard against undefined attractions array
    if (!attractions || !Array.isArray(attractions)) {
      return;
    }

    // Color coding
    const markerColor = category === 'attractions' ? '#3B82F6' : '#EF4444'; // blue-600 or red-500

    // Create markers for each attraction
    attractions.forEach(({ attraction, score }) => {
      const isHighScore = score >= 8.0;

      // Create marker element
      const element = document.createElement('div');
      element.className = 'cursor-pointer transition-all duration-200';
      element.style.width = '20px';
      element.style.height = '20px';

      // Circular marker
      element.innerHTML = `
        <div class="w-full h-full rounded-full border-2 border-white shadow-md ${
          isHighScore ? 'ring-1 ring-yellow-400' : ''
        }" style="background-color: ${markerColor};"></div>
      `;

      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        content: element,
        title: attraction.name,
      });

      // Click handler
      marker.addListener('click', () => {
        onMarkerClick(attraction.id);
      });

      // Hover handlers (desktop only)
      if (onMarkerHover) {
        element.addEventListener('mouseenter', () => {
          onMarkerHover(attraction.id);
        });

        element.addEventListener('mouseleave', () => {
          onMarkerHover(null);
        });
      }

      markersRef.current.set(attraction.id, { marker, element });
    });

    // Cleanup
    return () => {
      markersRef.current.forEach(({ marker }) => {
        marker.map = null;
      });
      markersRef.current.clear();
    };
  }, [attractions, category, map, markerLibrary, isReady, onMarkerClick, onMarkerHover]);

  // Update marker styles on hover
  useEffect(() => {
    markersRef.current.forEach(({ element }, id) => {
      if (id === hoveredId) {
        element.style.transform = 'scale(1.3)';
        element.style.zIndex = '1000';
      } else {
        element.style.transform = 'scale(1)';
        element.style.zIndex = 'auto';
      }
    });
  }, [hoveredId]);

  return null;
}

