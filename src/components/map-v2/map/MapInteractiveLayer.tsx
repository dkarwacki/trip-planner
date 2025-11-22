import React, { useEffect, useRef, useCallback } from "react";
import { PlaceMarkers } from "./PlaceMarkers";
import { DiscoveryMarkersLayer } from "./DiscoveryMarkersLayer";
import { PlannedItemMarkers } from "./PlannedItemMarkers";
import { SearchAreaButton } from "./SearchAreaButton";
import { DraftMarker } from "./DraftMarker";
import { PlacePreviewCard } from "./PlacePreviewCard";
import { AdjustLocationCard } from "./AdjustLocationCard";
import { PinModeUI } from "./PinModeUI";
import { MapBackdrop } from "./MapBackdrop";
import { ExpandedPlaceCard } from "./ExpandedPlaceCard";
import { useMapState } from "./hooks/useMapState";
import { useMapSearch } from "./hooks/useMapSearch";
import { useMapSelection } from "./hooks/useMapSelection";

/**
 * Interactive layer component for markers, search button, and map state
 * Separated to use context hooks
 */
export function MapInteractiveLayer({ onMapLoad }: { onMapLoad?: (map: google.maps.Map) => void }) {
  // 1. Map State Hook
  const { map, mapCenter, mapZoom, viewportSize, isDesktop } = useMapState();

  // 2. Search Logic Hook
  const {
    isSearching,
    draftPlace,
    isAdjustingLocation,
    handleSearchArea,
    handleConfirmDraft,
    handleAdjustDraft,
    handleCancelDraft,
    handleFinishAdjustment,
    showSearchButton,
    isTooFar,
  } = useMapSearch({ mapCenter, mapZoom });

  // 3. Selection & Card Logic Hook
  const {
    selectedPlaceId,
    hoveredMarkerId,
    expandedCardPlaceId,
    activeMode,
    discoveryResults,
    places,
    setHoveredMarker,
    setExpandedCard,
    setHighlightedPlace,
    closeCard,
    handlePlaceClick,
    handleAddToPlan,
    handlePlannedItemClick,
    hoveredAttraction,
    expandedAttraction,
    isInPlan,
    getMarkerScreenPosition,
  } = useMapSelection({ map, mapCenter });

  // 4. Hover Delay Logic
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMarkerHover = useCallback(
    (id: string | null) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      if (id) {
        setHoveredMarker(id);
      } else {
        // Add delay before clearing to allow moving to the card
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredMarker(null);
        }, 300); // 300ms grace period
      }
    },
    [setHoveredMarker]
  );

  const handleCardMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMarker(null);
    }, 300);
  }, [setHoveredMarker]);

  // Notify parent when map is loaded
  useEffect(() => {
    if (map && onMapLoad) {
      onMapLoad(map);
    }
  }, [map, onMapLoad]);

  return (
    <>
      {/* Conditional rendering based on active mode */}
      {activeMode === "discover" || activeMode === "ai" ? (
        <>
          {/* Discover & AI Mode: Show hub markers + discovery markers */}
          <PlaceMarkers places={places} selectedPlaceId={selectedPlaceId} onPlaceClick={handlePlaceClick} />
          <DiscoveryMarkersLayer
            places={discoveryResults.map((r) => r.attraction).filter((a): a is NonNullable<typeof a> => !!a)}
            hoveredMarkerId={hoveredMarkerId}
            selectedPlaceId={selectedPlaceId}
            onMarkerClick={(id) => {
              setHighlightedPlace(id);
              setExpandedCard(id);
            }}
            onMarkerHover={handleMarkerHover}
          />
        </>
      ) : (
        <>
          {/* Plan Mode: Show hub place markers + planned item markers */}
          <PlaceMarkers places={places} selectedPlaceId={selectedPlaceId} onPlaceClick={handlePlaceClick} />
          <PlannedItemMarkers
            places={places}
            onMarkerClick={handlePlannedItemClick}
            onMarkerHover={handleMarkerHover}
            hoveredId={hoveredMarkerId}
            expandedCardPlaceId={expandedCardPlaceId}
          />
        </>
      )}

      {/* Search Area Button (Discover & AI mode) */}
      {/* Hides when draft is active or adjusting */}
      {!draftPlace && !isAdjustingLocation && (
        <SearchAreaButton
          isVisible={showSearchButton}
          isTooFar={isTooFar}
          isLoading={isSearching}
          onClick={handleSearchArea}
        />
      )}

      {/* Draft Marker (when draft is active but not adjusting) */}
      {draftPlace && !isAdjustingLocation && <DraftMarker position={{ lat: draftPlace.lat, lng: draftPlace.lng }} />}

      {/* Place Preview Card (when draft is active and NOT adjusting) */}
      {draftPlace && !isAdjustingLocation && (
        <PlacePreviewCard
          place={draftPlace.place}
          country={draftPlace.country}
          onConfirm={handleConfirmDraft}
          onAdjust={handleAdjustDraft}
          onCancel={handleCancelDraft}
        />
      )}

      {/* Pin Mode UI (when adjusting) */}
      {isAdjustingLocation && <PinModeUI onConfirm={handleFinishAdjustment} onCancel={handleCancelDraft} />}

      {/* Adjust Location Card (when adjusting) */}
      {isAdjustingLocation && <AdjustLocationCard onConfirm={handleFinishAdjustment} onCancel={handleCancelDraft} />}

      {/* Map Backdrop (when card is expanded) */}
      <MapBackdrop isVisible={!!expandedCardPlaceId} onClick={closeCard} />

      {/* Hover Preview Card (Desktop only) - Replaces HoverMiniCard with ExpandedPlaceCard logic */}
      {isDesktop && hoveredAttraction && !expandedCardPlaceId && (
        <ExpandedPlaceCard
          attraction={hoveredAttraction.attraction}
          score={hoveredAttraction.score}
          breakdown={hoveredAttraction.breakdown}
          markerPosition={
            getMarkerScreenPosition(
              hoveredAttraction.attraction.location.lat,
              hoveredAttraction.attraction.location.lng
            ) || null
          }
          viewportSize={viewportSize}
          isAddedToPlan={isInPlan(hoveredAttraction.attraction.id)}
          isAddingToPlan={false}
          onClose={() => setHoveredMarker(null)}
          onAddToPlan={(place) => handleAddToPlan(place.id)}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        />
      )}

      {/* Expanded Place Card (Selected) */}
      {expandedAttraction && (
        <ExpandedPlaceCard
          attraction={expandedAttraction.attraction}
          score={expandedAttraction.score}
          breakdown={expandedAttraction.breakdown}
          markerPosition={
            getMarkerScreenPosition(
              expandedAttraction.attraction.location.lat,
              expandedAttraction.attraction.location.lng
            ) || null
          }
          viewportSize={viewportSize}
          isAddedToPlan={isInPlan(expandedAttraction.attraction.id)}
          isAddingToPlan={false}
          onClose={closeCard}
          onAddToPlan={(place) => handleAddToPlan(place.id)}
        />
      )}
    </>
  );
}
