import { useState, useCallback, useMemo } from "react";
import { useMapStore } from "../../stores/mapStore";
import { useNearbyPlaces } from "../../hooks/useNearbyPlaces";
import { useReverseGeocoding } from "../../hooks/useReverseGeocoding";
import { useMapPanDetection } from "../../hooks/useMapPanDetection";
import { calculateDistance } from "@/lib/map/map-utils";
import {
  NEARBY_SEARCH_RADIUS_METERS,
  SEARCH_AREA_BUTTON_SHOW_THRESHOLD_METERS,
  NEW_TRIP_POINT_THRESHOLD_METERS,
} from "@/lib/map-v2/search-constants";
import type { PlannedPlaceViewModel } from "@/lib/map-v2/types";

interface UseMapSearchProps {
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number;
}

export function useMapSearch({ mapCenter, mapZoom }: UseMapSearchProps) {
  const places = useMapStore((state) => state.places);
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const searchCenters = useMapStore((state) => state.searchCenters);
  const activeMode = useMapStore((state) => state.activeMode);
  const addPlace = useMapStore((state) => state.addPlace);

  const [isSearching, setIsSearching] = useState(false);
  const [draftPlace, setDraftPlace] = useState<{
    place: PlannedPlaceViewModel;
    lat: number;
    lng: number;
    country?: string;
  } | null>(null);
  const [isAdjustingLocation, setIsAdjustingLocation] = useState(false);

  const { fetchNearbyPlaces } = useNearbyPlaces();
  const { findPlace } = useReverseGeocoding();

  const SEARCH_BUTTON_SHOW_THRESHOLD_KM = SEARCH_AREA_BUTTON_SHOW_THRESHOLD_METERS / 1000;

  // Memoize to prevent array search on every render
  const selectedPlace = useMemo(
    () => (selectedPlaceId ? places.find((p) => p.id === selectedPlaceId) : null),
    [selectedPlaceId, places]
  );

  const fallbackLocation = useMemo(
    () => (selectedPlace ? { lat: selectedPlace.latitude, lng: selectedPlace.longitude } : null),
    [selectedPlace]
  );

  const { shouldShowButton } = useMapPanDetection(searchCenters, mapCenter, fallbackLocation, {
    thresholdKm: SEARCH_BUTTON_SHOW_THRESHOLD_KM,
    debounceMs: 100,
  });

  const handleSearchArea = useCallback(async () => {
    if (!mapCenter) return;

    setIsSearching(true);

    try {
      let shouldStartNewPoint = places.length === 0;

      if (!shouldStartNewPoint && selectedPlace) {
        const distance = calculateDistance(
          { lat: mapCenter.lat, lng: mapCenter.lng },
          { lat: selectedPlace.latitude, lng: selectedPlace.longitude }
        );
        shouldStartNewPoint = distance > NEW_TRIP_POINT_THRESHOLD_METERS;
      }

      if (shouldStartNewPoint) {
        const geocodingResult = await findPlace(mapCenter.lat, mapCenter.lng);
        if (geocodingResult) {
          const [cityName, countryName] = geocodingResult.name.split("||");
          // Convert GeocodingResult to PlannedPlaceViewModel
          const plannedPlace: PlannedPlaceViewModel = {
            id: geocodingResult.id,
            name: cityName,
            latitude: geocodingResult.lat,
            longitude: geocodingResult.lng,
            photos: geocodingResult.photos?.map((p) => ({
              photoReference: p.photoReference,
              width: p.width,
              height: p.height,
              attributions: p.attributions,
            })),
            plannedAttractions: [],
            plannedRestaurants: [],
          };
          setDraftPlace({
            place: plannedPlace,
            lat: mapCenter.lat,
            lng: mapCenter.lng,
            country: countryName,
          });
        }
        return;
      }

      await fetchNearbyPlaces({
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        radius: NEARBY_SEARCH_RADIUS_METERS,
        append: true,
      });
    } catch {
      // Failed to fetch nearby places or find place
    } finally {
      setIsSearching(false);
    }
  }, [mapCenter, fetchNearbyPlaces, selectedPlace, findPlace, places.length]);

  const handleConfirmDraft = useCallback(() => {
    if (!draftPlace) return;
    addPlace(draftPlace.place);
    setDraftPlace(null);
  }, [draftPlace, addPlace]);

  const handleAdjustDraft = useCallback(() => {
    setIsAdjustingLocation(true);
  }, []);

  const handleCancelDraft = useCallback(() => {
    setDraftPlace(null);
    setIsAdjustingLocation(false);
  }, []);

  const handleFinishAdjustment = useCallback(async () => {
    if (!mapCenter) return;
    setIsSearching(true);
    try {
      const geocodingResult = await findPlace(mapCenter.lat, mapCenter.lng);
      if (geocodingResult) {
        const [cityName, countryName] = geocodingResult.name.split("||");
        // Convert GeocodingResult to PlannedPlaceViewModel
        const plannedPlace: PlannedPlaceViewModel = {
          id: geocodingResult.id,
          name: cityName,
          latitude: geocodingResult.lat,
          longitude: geocodingResult.lng,
          photos: geocodingResult.photos?.map((p) => ({
            photoReference: p.photoReference,
            width: p.width,
            height: p.height,
            attributions: p.attributions,
          })),
          plannedAttractions: [],
          plannedRestaurants: [],
        };
        setDraftPlace({
          place: plannedPlace,
          lat: mapCenter.lat,
          lng: mapCenter.lng,
          country: countryName,
        });
        setIsAdjustingLocation(false);
      }
    } catch {
      // Failed to find place
    } finally {
      setIsSearching(false);
    }
  }, [mapCenter, findPlace]);

  const isTooFar =
    places.length === 0 ||
    (!!selectedPlace &&
      !!mapCenter &&
      calculateDistance(
        { lat: mapCenter.lat, lng: mapCenter.lng },
        { lat: selectedPlace.latitude, lng: selectedPlace.longitude }
      ) > NEW_TRIP_POINT_THRESHOLD_METERS);

  const showSearchButton =
    !draftPlace &&
    !isAdjustingLocation &&
    shouldShowButton &&
    mapZoom >= 10 &&
    (activeMode === "discover" || activeMode === "ai");

  return {
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
  };
}
