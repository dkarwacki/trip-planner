/**
 * Map canvas component
 * Wrapper for Google Maps with markers and controls
 */

import React from 'react';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { PlaceMarkers } from './PlaceMarkers';
import { useMapState } from '../context';

interface MapCanvasProps {
  mapId?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

export function MapCanvas({ 
  mapId,
  defaultCenter = { lat: 0, lng: 0 },
  defaultZoom = 2,
}: MapCanvasProps) {
  return (
    <div className="relative h-full w-full bg-gray-100">
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId={mapId}
        className="h-full w-full"
      />
      
      {/* Place Markers */}
      <MapMarkersLayer />
    </div>
  );
}

/**
 * Layer component for rendering markers
 * Separated to use context hooks
 */
function MapMarkersLayer() {
  const { places, selectedPlaceId, setSelectedPlace } = useMapState();

  const handlePlaceClick = (place: any) => {
    setSelectedPlace(place.id);
  };

  return (
    <PlaceMarkers
      places={places}
      selectedPlaceId={selectedPlaceId}
      onPlaceClick={handlePlaceClick}
    />
  );
}

/**
 * Hook to access the Google Maps instance
 * Must be used within a Map component
 */
export function useMapInstance() {
  const map = useMap();
  const markerLibrary = useMapsLibrary('marker');
  const placesLibrary = useMapsLibrary('places');

  return {
    map,
    markerLibrary,
    placesLibrary,
    isReady: !!map && !!markerLibrary,
  };
}

