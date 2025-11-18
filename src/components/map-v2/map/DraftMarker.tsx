import React from "react";
import { AdvancedMarker, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";

interface DraftMarkerProps {
  position: google.maps.LatLngLiteral;
}

export function DraftMarker({ position }: DraftMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker ref={markerRef} position={position}>
      <div className="relative -mt-7">
        <div className="drop-shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="white"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" fill="#3B82F6" />
          </svg>
        </div>
        <div className="w-1.5 h-1.5 bg-black/20 rounded-full absolute left-1/2 -translate-x-1/2 top-full blur-sm" />
      </div>
    </AdvancedMarker>
  );
}
