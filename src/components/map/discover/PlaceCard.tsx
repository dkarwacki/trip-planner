/**
 * Place card - large photo card with details
 */

import React, { useState, useCallback, useRef } from "react";
import type { DiscoveryItemViewModel } from "@/lib/map/types";
import PhotoLightbox from "@/components/map/shared/PhotoLightbox";
import { BasePlaceCard } from "../shared/BasePlaceCard";
import { getGoogleMapsUrl } from "@/lib/common/google-maps";
import { MapPin } from "lucide-react";
import { useMapStore } from "../stores/mapStore";
import { useOptimisticPlanned } from "./useOptimisticPlanned";

interface PlaceCardProps {
  place: DiscoveryItemViewModel;
  score: number;
  isHighlighted?: boolean;
  onNavigateToMap?: (attractionId: string, lat: number, lng: number) => void;
}

export const PlaceCard = React.memo(
  function PlaceCard({ place, score, isHighlighted, onNavigateToMap }: PlaceCardProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Each card manages its own optimistic state
    const { isAdded, isAdding, addOptimistic } = useOptimisticPlanned();

    // Get store actions (these are stable references)
    const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
    const addAttractionToPlace = useMapStore((state) => state.addAttractionToPlace);
    const addRestaurantToPlace = useMapStore((state) => state.addRestaurantToPlace);
    const setHoveredMarker = useMapStore((state) => state.setHoveredMarker);
    const setExpandedCard = useMapStore((state) => state.setExpandedCard);

    // Keep stable reference to place for async operations
    const placeRef = useRef(place);
    placeRef.current = place;

    // Handle mouse hover - directly update store
    const handleMouseEnter = useCallback(() => {
      setHoveredMarker(place.id);
    }, [setHoveredMarker, place.id]);

    const handleMouseLeave = useCallback(() => {
      setHoveredMarker(null);
    }, [setHoveredMarker]);

    // Handle card click - directly update store
    const handleCardClick = useCallback(() => {
      // If onNavigateToMap is provided (mobile), navigate to map with attraction
      if (onNavigateToMap) {
        onNavigateToMap(place.id, place.latitude, place.longitude);
        return;
      }

      // Otherwise use desktop behavior (expand card in sidebar)
      setExpandedCard(place.id);
    }, [setExpandedCard, onNavigateToMap, place.id, place.latitude, place.longitude]);

    // Handle Add to Plan directly in the card
    const handleAddButtonClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!selectedPlaceId) {
          return;
        }

        const currentPlace = placeRef.current;

        // Set optimistic state for instant button UI feedback
        const clearOptimistic = addOptimistic(currentPlace.id);

        // Check if it's a restaurant based on types
        const isRestaurant = currentPlace.types?.some((t: string) =>
          ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
        );

        try {
          // Add to the selected place's appropriate array
          if (isRestaurant) {
            addRestaurantToPlace(selectedPlaceId, currentPlace);
          } else {
            addAttractionToPlace(selectedPlaceId, currentPlace);
          }
        } finally {
          // Clear optimistic state immediately after update completes
          clearOptimistic();
        }
      },
      [selectedPlaceId, addRestaurantToPlace, addAttractionToPlace, addOptimistic]
    );

    const handlePhotoClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (place.photos && place.photos.length > 0) {
          setIsLightboxOpen(true);
        }
      },
      [place.photos]
    );

    const handleCardKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      },
      [handleCardClick]
    );

    return (
      <>
        <div
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${place.name}`}
          className={`transition-all duration-200 hover:scale-[1.01] ${
            isHighlighted ? "ring-2 ring-blue-200 rounded-xl" : ""
          }`}
        >
          <BasePlaceCard
            place={place}
            score={score}
            isAdded={isAdded(place.id)}
            isAdding={isAdding(place.id)}
            onAddClick={handleAddButtonClick}
            onPhotoClick={handlePhotoClick}
            showScoreTooltip={false}
            className={isHighlighted ? "border-blue-600 border-2" : "border-gray-200"}
          >
            <div className="border-t border-gray-100 pt-3 mt-2">
              <a
                href={getGoogleMapsUrl({
                  name: place.name,
                  placeId: place.id,
                  location: { lat: place.latitude, lng: place.longitude },
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                View on Google Maps
              </a>
            </div>
          </BasePlaceCard>
        </div>

        {/* Photo Lightbox */}
        {place.photos && place.photos.length > 0 && (
          <PhotoLightbox
            photos={place.photos}
            initialIndex={0}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            placeName={place.name}
            lat={place.latitude}
            lng={place.longitude}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if these primitive values change
    return (
      prevProps.place.id === nextProps.place.id &&
      prevProps.score === nextProps.score &&
      prevProps.isHighlighted === nextProps.isHighlighted
    );
  }
);
