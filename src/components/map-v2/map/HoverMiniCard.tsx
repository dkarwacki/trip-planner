/**
 * Hover mini card component
 * Shows on marker hover after 300ms delay (desktop only)
 */

import React, { useEffect, useState } from "react";
import type { Attraction } from "@/domain/map/models";
import { calculateCardPosition } from "./CardPositioning";
import { LazyImage } from "../shared/LazyImage";

interface HoverMiniCardProps {
  attraction: Attraction;
  markerPosition: { x: number; y: number };
  viewportSize: { width: number; height: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

const CARD_WIDTH = 200;
const CARD_HEIGHT = 120;
// Google Maps marker is ~40px tall, anchored at bottom center (pin tip)
// We need to account for the full marker height when positioning above
const MARKER_HEIGHT = 40;
const SPACING = 20; // Spacing between marker and card

export const HoverMiniCard = React.memo(
  function HoverMiniCard({
    attraction,
    markerPosition,
    viewportSize,
    onMouseEnter,
    onMouseLeave,
    onClick,
  }: HoverMiniCardProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Fade-in animation
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }, []);

    // Calculate position with proper clearance
    const totalOffset = MARKER_HEIGHT + SPACING;

    const position = calculateCardPosition({
      markerPosition,
      cardSize: { width: CARD_WIDTH, height: CARD_HEIGHT },
      viewportSize,
      offset: totalOffset,
      preferredSide: "top",
    });

    // Get first photo reference (if available)
    const photoReference = attraction.photos?.[0]?.photoReference;

    // Format rating
    const rating = attraction.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div
        className={`fixed z-48 transition-all duration-200 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${CARD_WIDTH}px`,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <div className="relative">
          {/* Content Card */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden cursor-pointer">
            {/* Photo Thumbnail */}
            {photoReference ? (
              <div className="w-full h-20 bg-gray-200 overflow-hidden">
                <LazyImage
                  photoReference={photoReference}
                  alt={attraction.name}
                  lat={attraction.location.lat}
                  lng={attraction.location.lng}
                  placeName={attraction.name}
                  size="small"
                  eager={true}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No photo</span>
              </div>
            )}

            {/* Content */}
            <div className="p-2">
              <h3 className="font-bold text-sm text-gray-900 truncate mb-1">{attraction.name}</h3>
              <div className="flex items-center gap-1 text-xs">
                {/* Rating Stars */}
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => {
                    if (i < fullStars) {
                      return <span key={i}>★</span>;
                    }
                    if (i === fullStars && hasHalfStar) {
                      return <span key={i}>☆</span>;
                    }
                    return (
                      <span key={i} className="text-gray-300">
                        ☆
                      </span>
                    );
                  })}
                </div>
                <span className="text-gray-600 font-medium">{rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if attraction ID or position changes
    return (
      prevProps.attraction.id === nextProps.attraction.id &&
      prevProps.markerPosition.x === nextProps.markerPosition.x &&
      prevProps.markerPosition.y === nextProps.markerPosition.y
    );
  }
);
