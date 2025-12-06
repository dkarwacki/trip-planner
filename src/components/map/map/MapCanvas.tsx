import React from "react";
import { Map } from "@vis.gl/react-google-maps";
import { MapInteractiveLayer } from "./MapInteractiveLayer";

interface MapCanvasProps {
  mapId?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  onMapLoad?: (map: google.maps.Map) => void;
}

export function MapCanvas({ mapId, defaultCenter = { lat: 0, lng: 0 }, defaultZoom = 2, onMapLoad }: MapCanvasProps) {
  return (
    <div className="relative h-full w-full bg-gray-100" data-testid="map-canvas">
      <div className="relative h-full w-full" style={{ zIndex: 10 }}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={mapId}
          className="h-full w-full"
        />
      </div>

      {/* Place Markers, Map Instance Callback, and Search Area Button */}
      <MapInteractiveLayer onMapLoad={onMapLoad} />
    </div>
  );
}
