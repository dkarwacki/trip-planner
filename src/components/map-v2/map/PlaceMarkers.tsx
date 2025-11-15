/**
 * Place markers component
 * Renders hub markers (places in itinerary) on the map
 */

import { useEffect, useRef } from 'react';
import { useMapInstance } from './MapCanvas';
import type { Place } from '@/domain/common/models';

interface PlaceMarkersProps {
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceClick: (place: Place) => void;
}

export function PlaceMarkers({ places, selectedPlaceId, onPlaceClick }: PlaceMarkersProps) {
  const { map, markerLibrary, isReady } = useMapInstance();
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  useEffect(() => {
    if (!isReady || !map || !markerLibrary) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();

    // Guard against undefined places array
    if (!places || !Array.isArray(places)) {
      return;
    }

    // Create new markers for each place
    places.forEach((place, index) => {
      const isSelected = place.id === selectedPlaceId;

      // Create marker element
      const element = document.createElement('div');
      element.className = 'relative cursor-pointer transition-all duration-200';
      element.style.width = isSelected ? '40px' : '32px';
      element.style.height = isSelected ? '40px' : '32px';

      // Circular marker with number badge
      element.innerHTML = `
        <div class="w-full h-full rounded-full bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center ${
          isSelected ? 'ring-2 ring-blue-400' : ''
        }">
          <span class="text-white font-bold text-sm">${index + 1}</span>
        </div>
      `;

      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: place.lat, lng: place.lng },
        content: element,
        title: place.name,
      });

      // Click handler
      marker.addListener('click', () => {
        onPlaceClick(place);
      });

      markersRef.current.set(place.id, marker);
    });

    // Fit bounds if multiple places
    if (places.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        bounds.extend({ lat: place.lat, lng: place.lng });
      });
      map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 400 });
    } else if (places.length === 1) {
      map.panTo({ lat: places[0].lat, lng: places[0].lng });
      map.setZoom(14);
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current.clear();
    };
  }, [places, selectedPlaceId, map, markerLibrary, isReady, onPlaceClick]);

  return null; // This component doesn't render DOM directly
}

