/**
 * Expanded Place Card
 *
 * Features:
 * - Detailed view of a place
 * - Photos, score, breakdown
 * - Collapsible editorial summary
 * - Add to plan action
 */

import React, { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import type { DiscoveryItemViewModel, PlannedPOIViewModel } from "@/lib/map-v2/types";
import PhotoLightbox from "@/components/PhotoLightbox";
import { BasePlaceCard } from "../shared/BasePlaceCard";
import { getGoogleMapsUrl } from "@/lib/common/google-maps";

interface ExpandedPlaceCardProps {
  attraction: DiscoveryItemViewModel | PlannedPOIViewModel;
  markerPosition: { x: number; y: number } | null;
  viewportSize: { width: number; height: number };
  score?: number;
  breakdown?: {
    qualityScore: number;
    personaScore?: number;
    diversityScore?: number;
    confidenceScore: number;
  };
  isAddedToPlan: boolean;
  isAddingToPlan: boolean;
  onClose: () => void;
  onAddToPlan: (place: DiscoveryItemViewModel | PlannedPOIViewModel) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const ExpandedPlaceCard = React.memo(
  function ExpandedPlaceCard({
    attraction,
    markerPosition,
    viewportSize,
    score,
    breakdown,
    isAddedToPlan,
    isAddingToPlan,
    onClose,
    onAddToPlan,
    onMouseEnter,
    onMouseLeave,
  }: ExpandedPlaceCardProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Mobile detection
    const isMobile = viewportSize.width < 768;

    // Animation on mount
    useEffect(() => {
      requestAnimationFrame(() => setIsVisible(true));
    }, []);

    // Close on ESC
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Calculate position
    const getCardPosition = () => {
      if (isMobile) {
        return {
          bottom: "0",
          left: "0",
          right: "0",
          maxHeight: "80vh",
          borderRadius: "1.5rem 1.5rem 0 0",
        };
      }

      if (!markerPosition) return { display: "none" };

      const CARD_WIDTH = 320;
      const CARD_HEIGHT = 400; // Approximate
      const MARGIN = 20;
      const POINTER_OFFSET = 16; // Space for the visual pointer

      // Try to position card to the right of marker first
      let left = markerPosition.x + MARGIN + POINTER_OFFSET;
      let top = markerPosition.y - CARD_HEIGHT / 2;
      let placement: "left" | "right" | "top" | "bottom" = "right";

      // Check if card fits on the right
      if (left + CARD_WIDTH > viewportSize.width - MARGIN) {
        // Try left side
        left = markerPosition.x - CARD_WIDTH - MARGIN - POINTER_OFFSET;
        placement = "left";

        // If still doesn't fit, try top or bottom
        if (left < MARGIN) {
          left = markerPosition.x - CARD_WIDTH / 2;
          top = markerPosition.y - CARD_HEIGHT - MARGIN - POINTER_OFFSET;
          placement = "top";

          // If doesn't fit on top, place at bottom
          if (top < MARGIN) {
            top = markerPosition.y + MARGIN + POINTER_OFFSET;
            placement = "bottom";
          }
        }
      }

      // Adjust vertical position to keep in view (for left/right placement)
      if (placement === "left" || placement === "right") {
        if (top < MARGIN) top = MARGIN;
        if (top + CARD_HEIGHT > viewportSize.height - MARGIN) {
          top = viewportSize.height - CARD_HEIGHT - MARGIN;
        }
      }

      // Adjust horizontal position to keep in view (for top/bottom placement)
      if (placement === "top" || placement === "bottom") {
        if (left < MARGIN) left = MARGIN;
        if (left + CARD_WIDTH > viewportSize.width - MARGIN) {
          left = viewportSize.width - CARD_WIDTH - MARGIN;
        }
      }

      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${CARD_WIDTH}px`,
        maxHeight: "calc(100vh - 40px)",
        "--pointer-placement": placement,
      } as React.CSSProperties & { "--pointer-placement": string };
    };

    const handleAddToPlan = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddToPlan(attraction);
    };

    const handlePhotoClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (attraction.photos && attraction.photos.length > 0) {
        setIsLightboxOpen(true);
      }
    };

    return (
      <>
        {/* Backdrop for mobile */}
        {isMobile && (
          <div
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onClose();
            }}
            role="button"
            tabIndex={0}
            aria-label="Close details"
          />
        )}

        <div
          ref={cardRef}
          className={`
            fixed bg-white shadow-2xl z-50 overflow-hidden flex flex-col
            transition-all duration-50 ease-out
            ${isMobile ? "transform translate-y-full" : "rounded-xl border border-gray-200 opacity-0 scale-95"}
            ${isVisible ? (isMobile ? "translate-y-0" : "opacity-100 scale-100") : ""}
          `}
          style={getCardPosition()}
          role="dialog"
          aria-label={`Details for ${attraction.name}`}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="overflow-y-auto custom-scrollbar">
            <BasePlaceCard
              place={attraction}
              score={score}
              breakdown={breakdown}
              isAdded={isAddedToPlan}
              isAdding={isAddingToPlan}
              onAddClick={handleAddToPlan}
              onPhotoClick={handlePhotoClick}
              onClose={onClose}
              className="border-0 shadow-none rounded-none"
              showActions={true}
            >
              {/* View on Google Maps */}
              <div className="border-t border-gray-100 pt-3 mt-2">
                <a
                  href={getGoogleMapsUrl({
                    name: attraction.name,
                    placeId: attraction.id,
                    location: {
                      lat: attraction.latitude,
                      lng: attraction.longitude,
                    },
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  View on Google Maps
                </a>
              </div>
            </BasePlaceCard>
          </div>
        </div>

        {/* Photo Lightbox */}
        {attraction.photos && attraction.photos.length > 0 && (
          <PhotoLightbox
            photos={attraction.photos}
            initialIndex={0}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            placeName={attraction.name}
            lat={attraction.latitude}
            lng={attraction.longitude}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.attraction.id === nextProps.attraction.id &&
      prevProps.markerPosition?.x === nextProps.markerPosition?.x &&
      prevProps.markerPosition?.y === nextProps.markerPosition?.y &&
      prevProps.isAddedToPlan === nextProps.isAddedToPlan &&
      prevProps.isAddingToPlan === nextProps.isAddingToPlan &&
      prevProps.score === nextProps.score
    );
  }
);
