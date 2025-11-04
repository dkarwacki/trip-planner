import { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Effect } from "effect";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getPlaceDetails } from "@/infrastructure/map/clients";
import { fetchTopAttractions, fetchTopRestaurants } from "@/infrastructure/map/clients";
import { reverseGeocode } from "@/infrastructure/map/clients";
import type { Place } from "@/domain/common/models";
import type { AttractionScore, Attraction } from "@/domain/map/models";
import { scoreAttractions } from "@/domain/map/scoring/attractions";
import { scoreRestaurants } from "@/domain/map/scoring/restaurants";
import { loadTripById } from "@/lib/common/storage";
import { HIGH_SCORE_THRESHOLD } from "@/domain/map/scoring";
import AttractionsPanel from "@/components/map/AttractionsPanel";
import PlaceAutocomplete from "@/components/map/PlaceAutocomplete";
import PlaceListItem from "@/components/map/PlaceListItem";
import AttractionDetailsDialog from "@/components/map/AttractionDetailsDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List, Map as MapIcon, Compass, CheckSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateDistance, SEARCH_NEARBY_DISTANCE_THRESHOLD } from "@/lib/map/map-utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MobileNavigation, type MapTab, type MobileTab } from "@/components/common/MobileNavigation";

type CategoryTab = "attractions" | "restaurants";

interface MapPlannerProps {
  apiKey: string;
  mapId?: string;
  tripId?: string | null;
}

// Marker size constants - larger on mobile for better touch targets
const getMarkerSize = (isMobile: boolean) => ({
  DEFAULT: isMobile ? 24 : 16,
  HOVERED: isMobile ? 32 : 24,
  BORDER: {
    DEFAULT: isMobile ? 3 : 2,
    HOVERED: isMobile ? 4 : 3,
  },
});

const MapContent = ({ mapId, tripId }: { mapId?: string; tripId?: string | null }) => {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Load places from trip history if tripId is provided
  useEffect(() => {
    if (tripId && typeof window !== "undefined") {
      try {
        const trip = loadTripById(tripId);
        if (trip && trip.places) {
          setPlaces(trip.places);
        }
      } catch (error) {
        console.error("Failed to load trip from history:", error);
      }
    }
  }, [tripId]);

  // Helper function to merge API results with planned items
  const mergeWithPlannedItems = useCallback(
    (
      apiResults: AttractionScore[],
      plannedItems: Attraction[],
      scoringFn: (items: Attraction[]) => AttractionScore[]
    ): AttractionScore[] => {
      const apiIds = new Set(apiResults.map((r) => r.attraction.id));
      const missingItems = plannedItems.filter((item) => !apiIds.has(item.id));

      if (missingItems.length === 0) {
        return apiResults;
      }

      const scoredMissing = scoringFn(missingItems);
      return [...apiResults, ...scoredMissing];
    },
    []
  );

  const [attractions, setAttractions] = useState<AttractionScore[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);
  const [attractionsError, setAttractionsError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [restaurants, setRestaurants] = useState<AttractionScore[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);

  const [loadedTabs, setLoadedTabs] = useState<Set<CategoryTab>>(new Set(["attractions"]));
  const [activeTab, setActiveTab] = useState<CategoryTab>("attractions");
  const [hoveredAttractionId, setHoveredAttractionId] = useState<string | null>(null);
  const [scrollToAttractionId, setScrollToAttractionId] = useState<string | null>(null);
  const [highlightedAttractionId, setHighlightedAttractionId] = useState<string | null>(null);
  const [showHighScoresOnly, setShowHighScoresOnly] = useState(false);

  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddPlacePopover, setShowAddPlacePopover] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAttraction, setPendingAttraction] = useState<Attraction | null>(null);
  const [pendingType, setPendingType] = useState<"attraction" | "restaurant" | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  // Search nearby button state
  const [initialSearchCenter, setInitialSearchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showSearchNearbyButton, setShowSearchNearbyButton] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Track if we're on mobile for responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile navigation state
  const [mobileTab, setMobileTab] = useState<MapTab>("places");

  // Sidebar collapse state (for desktop)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  interface MarkerData {
    marker: google.maps.marker.AdvancedMarkerElement;
    element: HTMLDivElement;
  }

  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const attractionMarkersRef = useRef<Map<string, MarkerData> | null>(null);
  const tempMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const handleRemovePlace = useCallback(
    (placeId: string) => {
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
      if (selectedPlaceId === placeId) {
        setSelectedPlaceId(null);
        setSelectedPlace(null);
        setAttractions([]);
        setAttractionsError(null);
        setRestaurants([]);
        setRestaurantsError(null);
        setLoadedTabs(new Set(["attractions"]));
        setActiveTab("attractions");
      }
    },
    [selectedPlaceId]
  );

  const handlePanToPlace = useCallback(
    async (place: Place) => {
      if (!map) return;
      setSelectedPlaceId(place.id);
      setSelectedPlace(place);
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(14);

      // Expand right sidebar when selecting a place
      setRightSidebarCollapsed(false);

      // On mobile, switch to explore tab when a place is selected
      if (isMobile) {
        setMobileTab("explore");
      }

      // Store initial search center for button trigger logic
      setInitialSearchCenter({ lat: place.lat, lng: place.lng });
      setShowSearchNearbyButton(false);

      setAttractions([]);
      setAttractionsError(null);
      setRestaurants([]);
      setRestaurantsError(null);
      setLoadedTabs(new Set(["attractions", "restaurants"]));
      setActiveTab("attractions");
      setShowHighScoresOnly(false);

      setIsLoadingAttractions(true);
      setIsLoadingRestaurants(true);

      const [attractionsResult, restaurantsResult] = await Promise.allSettled([
        fetchTopAttractions(place.lat, place.lng),
        fetchTopRestaurants(place.lat, place.lng),
      ]);

      if (attractionsResult.status === "fulfilled") {
        const merged = mergeWithPlannedItems(attractionsResult.value, place.plannedAttractions, scoreAttractions);
        setAttractions(merged);
      } else {
        setAttractionsError(
          attractionsResult.reason instanceof Error ? attractionsResult.reason.message : "Failed to load attractions"
        );
      }

      if (restaurantsResult.status === "fulfilled") {
        const merged = mergeWithPlannedItems(restaurantsResult.value, place.plannedRestaurants, scoreRestaurants);
        setRestaurants(merged);
      } else {
        setRestaurantsError(
          restaurantsResult.reason instanceof Error ? restaurantsResult.reason.message : "Failed to load restaurants"
        );
      }

      setIsLoadingAttractions(false);
      setIsLoadingRestaurants(false);
    },
    [map, mergeWithPlannedItems, isMobile]
  );

  const handlePlaceSelect = useCallback(
    async (place: google.maps.places.PlaceResult) => {
      if (!place.place_id) return;

      setIsLoading(true);
      setError(null);

      try {
        const placeDetails = await Effect.runPromise(
          getPlaceDetails(place.place_id).pipe(
            Effect.catchAll((error) => {
              if (error._tag === "PlaceNotFoundError") {
                return Effect.fail(`No details found for this place`);
              }
              if (error._tag === "PlacesAPIError") {
                return Effect.fail(error.message);
              }
              return Effect.fail("An unexpected error occurred");
            })
          )
        );

        const isDuplicate = places.some((p) => p.id === placeDetails.id);
        if (isDuplicate) {
          setError("This place has already been added");
          setIsLoading(false);
          return;
        }

        setPlaces((prev) => [...prev, placeDetails]);

        // Automatically select and highlight the newly added place
        await handlePanToPlace(placeDetails);
      } catch (err) {
        setError(typeof err === "string" ? err : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [places, handlePanToPlace]
  );

  /**
   * Triggered when user clicks "Search this area" button.
   * Fetches attractions/restaurants centered on current map view.
   */
  const handleSearchNearby = useCallback(async () => {
    if (!map || !selectedPlace) return;

    const center = map.getCenter();
    if (!center) return;

    const newCenter = { lat: center.lat(), lng: center.lng() };

    // Update initial search center and hide button
    setInitialSearchCenter(newCenter);
    setShowSearchNearbyButton(false);

    // Set consistent zoom level for nearby searches
    map.setZoom(14);

    setIsLoadingAttractions(true);
    setIsLoadingRestaurants(true);
    setAttractionsError(null);
    setRestaurantsError(null);

    // Fetch attractions and restaurants at new center
    const [attractionsResult, restaurantsResult] = await Promise.allSettled([
      fetchTopAttractions(newCenter.lat, newCenter.lng),
      fetchTopRestaurants(newCenter.lat, newCenter.lng),
    ]);

    if (attractionsResult.status === "fulfilled") {
      const merged = mergeWithPlannedItems(attractionsResult.value, selectedPlace.plannedAttractions, scoreAttractions);

      // Filter out duplicates and merge with existing items, sorted by score
      setAttractions((prev) => {
        const existingIds = new Set(prev.map((item) => item.attraction.id));
        const newItems = merged.filter((item) => !existingIds.has(item.attraction.id));
        return [...prev, ...newItems].sort((a, b) => b.score - a.score);
      });
    } else {
      setAttractionsError(
        attractionsResult.reason instanceof Error ? attractionsResult.reason.message : "Failed to load attractions"
      );
    }

    if (restaurantsResult.status === "fulfilled") {
      const merged = mergeWithPlannedItems(restaurantsResult.value, selectedPlace.plannedRestaurants, scoreRestaurants);

      // Filter out duplicates and merge with existing items, sorted by score
      setRestaurants((prev) => {
        const existingIds = new Set(prev.map((item) => item.attraction.id));
        const newItems = merged.filter((item) => !existingIds.has(item.attraction.id));
        return [...prev, ...newItems].sort((a, b) => b.score - a.score);
      });
    } else {
      setRestaurantsError(
        restaurantsResult.reason instanceof Error ? restaurantsResult.reason.message : "Failed to load restaurants"
      );
    }

    setIsLoadingAttractions(false);
    setIsLoadingRestaurants(false);
  }, [map, selectedPlace, mergeWithPlannedItems]);

  const handleCloseAttractions = useCallback(() => {
    setSelectedPlace(null);
    setSelectedPlaceId(null);
    setAttractions([]);
    setAttractionsError(null);
    setRestaurants([]);
    setRestaurantsError(null);
    setLoadedTabs(new Set(["attractions"]));
    setActiveTab("attractions");
    setShowHighScoresOnly(false);

    // Clear search nearby state
    setInitialSearchCenter(null);
    setShowSearchNearbyButton(false);

    // Collapse right sidebar when closing attractions
    setRightSidebarCollapsed(true);
  }, []);

  const handleTabChange = useCallback(
    async (tab: CategoryTab) => {
      if (!selectedPlace) return;

      setActiveTab(tab);
      setShowHighScoresOnly(false);

      if (loadedTabs.has(tab)) return;

      setLoadedTabs((prev) => new Set([...prev, tab]));

      if (tab === "restaurants") {
        setIsLoadingRestaurants(true);
        setRestaurantsError(null);

        try {
          const restaurantsResult = await fetchTopRestaurants(selectedPlace.lat, selectedPlace.lng);
          const merged = mergeWithPlannedItems(restaurantsResult, selectedPlace.plannedRestaurants, scoreRestaurants);

          setRestaurants(merged);
        } catch (err) {
          setRestaurantsError(err instanceof Error ? err.message : "Failed to load restaurants");
        } finally {
          setIsLoadingRestaurants(false);
        }
      }
    },
    [selectedPlace, loadedTabs, mergeWithPlannedItems]
  );

  const handlePlannedItemClick = useCallback(
    async (attraction: Attraction) => {
      if (!map) return;

      // Find which place this attraction belongs to
      const parentPlace = places.find(
        (p) =>
          p.plannedAttractions.some((a) => a.id === attraction.id) ||
          p.plannedRestaurants.some((r) => r.id === attraction.id)
      );

      if (!parentPlace) return;

      // Check if this is a restaurant or attraction
      const isRestaurant = parentPlace.plannedRestaurants.some((r) => r.id === attraction.id);
      const targetTab: CategoryTab = isRestaurant ? "restaurants" : "attractions";

      // If the parent place is not currently selected, select it first
      if (parentPlace.id !== selectedPlaceId) {
        setSelectedPlaceId(parentPlace.id);
        setSelectedPlace(parentPlace);
        map.panTo({ lat: attraction.location.lat, lng: attraction.location.lng });
        map.setZoom(15);

        // Expand right sidebar when selecting a place
        setRightSidebarCollapsed(false);

        // On mobile, switch to explore tab when selecting a place
        if (isMobile) {
          setMobileTab("explore");
        }

        // Load both attractions and restaurants in parallel
        setAttractions([]);
        setAttractionsError(null);
        setRestaurants([]);
        setRestaurantsError(null);
        setLoadedTabs(new Set(["attractions", "restaurants"]));
        setIsLoadingAttractions(true);
        setIsLoadingRestaurants(true);

        const [attractionsResult, restaurantsResult] = await Promise.allSettled([
          fetchTopAttractions(parentPlace.lat, parentPlace.lng),
          fetchTopRestaurants(parentPlace.lat, parentPlace.lng),
        ]);

        if (attractionsResult.status === "fulfilled") {
          const merged = mergeWithPlannedItems(
            attractionsResult.value,
            parentPlace.plannedAttractions,
            scoreAttractions
          );
          setAttractions(merged);
        } else {
          setAttractionsError(
            attractionsResult.reason instanceof Error ? attractionsResult.reason.message : "Failed to load attractions"
          );
        }

        if (restaurantsResult.status === "fulfilled") {
          const merged = mergeWithPlannedItems(
            restaurantsResult.value,
            parentPlace.plannedRestaurants,
            scoreRestaurants
          );
          setRestaurants(merged);
        } else {
          setRestaurantsError(
            restaurantsResult.reason instanceof Error ? restaurantsResult.reason.message : "Failed to load restaurants"
          );
        }

        setIsLoadingAttractions(false);
        setIsLoadingRestaurants(false);

        setActiveTab(targetTab);
      } else {
        // Place is already selected, just switch tabs if needed and expand sidebar
        setRightSidebarCollapsed(false);

        // On mobile, switch to explore tab to show the attraction
        if (isMobile) {
          setMobileTab("explore");
        }

        await handleTabChange(targetTab);
      }

      // Pan to the attraction's location and highlight it
      map.panTo({ lat: attraction.location.lat, lng: attraction.location.lng });
      map.setZoom(15);
      setHighlightedAttractionId(attraction.id);
      setScrollToAttractionId(attraction.id);
    },
    [places, selectedPlaceId, map, handleTabChange, mergeWithPlannedItems, isMobile]
  );

  const handleScrollComplete = useCallback(() => {
    setScrollToAttractionId(null);
  }, []);

  const handleClosePopover = useCallback(() => {
    setClickedLocation(null);
    setShowAddPlacePopover(false);
    setGeocodingError(null);
    setIsReverseGeocoding(false);

    if (tempMarkerRef.current) {
      tempMarkerRef.current.map = null;
      tempMarkerRef.current = null;
    }
  }, []);

  const handleAddPlace = useCallback(async () => {
    if (!clickedLocation) return;

    setIsReverseGeocoding(true);
    setGeocodingError(null);

    try {
      const place = await Effect.runPromise(
        reverseGeocode(clickedLocation.lat, clickedLocation.lng).pipe(
          Effect.catchAll((error) => {
            if (error._tag === "NoResultsError") {
              return Effect.fail("No address found for this location");
            }
            if (error._tag === "GeocodingError") {
              return Effect.fail(error.message);
            }
            return Effect.fail("An unexpected error occurred");
          })
        )
      );

      const isDuplicate = places.some((p) => p.id === place.id);
      if (isDuplicate) {
        setGeocodingError("This place has already been added");
        setIsReverseGeocoding(false);
        return;
      }

      setPlaces((prev) => [...prev, place]);

      handleClosePopover();
    } catch (err) {
      setGeocodingError(typeof err === "string" ? err : "An error occurred");
      setIsReverseGeocoding(false);
    }
  }, [clickedLocation, places, handleClosePopover]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setPlaces((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const handleOpenAddDialog = useCallback(
    async (attractionId: string, type: "attraction" | "restaurant") => {
      // Find the attraction in current data
      const allAttractions = type === "attraction" ? attractions : restaurants;
      const attractionData = allAttractions.find((a) => a.attraction.id === attractionId);

      if (!attractionData) {
        console.error("Attraction not found:", attractionId);
        return;
      }

      // Set initial data and open dialog
      setPendingAttraction(attractionData.attraction);
      setPendingType(type);
      setDialogOpen(true);

      // Fetch photos in the background
      setIsLoadingPhotos(true);
      try {
        const program = getPlaceDetails(attractionId, true);
        const result = await Effect.runPromise(program);

        // Check if the result is an Attraction (has photos) or a Place
        // The API returns a Place, but we need to merge it with attraction data
        if (result.photos && result.photos.length > 0) {
          setPendingAttraction((prev) => {
            if (!prev || prev.id !== attractionId) return prev;
            return {
              ...prev,
              photos: result.photos,
            };
          });
        }
      } catch (error) {
        console.error("Failed to fetch photos:", error);
        // Continue without photos - dialog is already open with basic info
      } finally {
        setIsLoadingPhotos(false);
      }
    },
    [attractions, restaurants]
  );

  const handleConfirmAdd = useCallback(() => {
    if (!pendingAttraction || !pendingType || !selectedPlaceId) {
      return;
    }

    setPlaces((prev) =>
      prev.map((place) => {
        if (place.id !== selectedPlaceId) {
          return place;
        }

        const isDuplicate =
          pendingType === "attraction"
            ? place.plannedAttractions.some((a) => a.id === pendingAttraction.id)
            : place.plannedRestaurants.some((r) => r.id === pendingAttraction.id);

        if (isDuplicate) {
          return place;
        }

        return {
          ...place,
          ...(pendingType === "attraction"
            ? { plannedAttractions: [...place.plannedAttractions, pendingAttraction] }
            : { plannedRestaurants: [...place.plannedRestaurants, pendingAttraction] }),
        };
      })
    );

    setDialogOpen(false);
    setPendingAttraction(null);
    setPendingType(null);
  }, [pendingAttraction, pendingType, selectedPlaceId]);

  const handleCancelAdd = useCallback(() => {
    setDialogOpen(false);
    setPendingAttraction(null);
    setPendingType(null);
  }, []);

  const handleRemoveFromPlan = useCallback(
    (placeId: string, attractionId: string, type: "attraction" | "restaurant") => {
      setPlaces((prev) =>
        prev.map((place) => {
          if (place.id !== placeId) {
            return place;
          }

          return {
            ...place,
            ...(type === "attraction"
              ? { plannedAttractions: place.plannedAttractions.filter((a) => a.id !== attractionId) }
              : { plannedRestaurants: place.plannedRestaurants.filter((r) => r.id !== attractionId) }),
          };
        })
      );
    },
    []
  );

  const handleReorderPlannedItems = useCallback(
    (placeId: string, type: "attraction" | "restaurant", oldIndex: number, newIndex: number) => {
      setPlaces((prev) =>
        prev.map((place) => {
          if (place.id !== placeId) {
            return place;
          }

          return {
            ...place,
            ...(type === "attraction"
              ? { plannedAttractions: arrayMove(place.plannedAttractions, oldIndex, newIndex) }
              : { plannedRestaurants: arrayMove(place.plannedRestaurants, oldIndex, newIndex) }),
          };
        })
      );
    },
    []
  );

  const handlePlaceUpdate = useCallback((placeId: string, updatedPlace: Place) => {
    setPlaces((prev) => prev.map((place) => (place.id === placeId ? updatedPlace : place)));
  }, []);

  const handleAttractionAccepted = useCallback(
    (placeId: string, attraction: Attraction, type: "attraction" | "restaurant") => {
      // Only add to nearby lists if this place is currently selected
      if (placeId !== selectedPlaceId) {
        return;
      }

      if (type === "attraction") {
        // Check if already in the list
        const exists = attractions.some((a) => a.attraction.id === attraction.id);
        if (!exists) {
          // Score the single attraction and add it to the list
          const scored = scoreAttractions([attraction]);
          setAttractions((prev) => [...prev, ...scored]);
        }
      } else {
        // Check if already in the list
        const exists = restaurants.some((r) => r.attraction.id === attraction.id);
        if (!exists) {
          // Score the single restaurant and add it to the list
          const scored = scoreRestaurants([attraction]);
          setRestaurants((prev) => [...prev, ...scored]);
        }
      }
    },
    [attractions, restaurants, selectedPlaceId]
  );

  useEffect(() => {
    if (!map || !markerLibrary || places.length === 0) {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
      return;
    }

    if (!mapId) {
      return;
    }

    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current = [];

    const newMarkers = places.map((place) => {
      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
      });

      marker.addListener("click", () => {
        handlePanToPlace(place);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    return () => {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, [map, markerLibrary, places, mapId, handlePanToPlace]);

  // Separate effect to handle initial map positioning when places are added/removed
  const placesCountRef = useRef(places.length);
  useEffect(() => {
    if (!map || places.length === 0) return;

    // Only adjust map view if the number of places changed (added/removed)
    // Not when places are updated (e.g., adding planned items)
    if (placesCountRef.current !== places.length) {
      placesCountRef.current = places.length;

      if (places.length === 1) {
        map.panTo({ lat: places[0].lat, lng: places[0].lng });
        map.setZoom(14);
      } else {
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          bounds.extend({ lat: place.lat, lng: place.lng });
        });
        map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 400 });
      }
    }
  }, [map, places]);

  useEffect(() => {
    if (!attractionMarkersRef.current) {
      attractionMarkersRef.current = new globalThis.Map();
    }
    const markersMap = attractionMarkersRef.current;

    markersMap.forEach(({ marker }) => (marker.map = null));
    markersMap.clear();

    if (!map || !markerLibrary || !selectedPlace || !mapId) return;

    const data = activeTab === "attractions" ? attractions : restaurants;
    if (data.length === 0) return;

    // Filter data based on high scores filter
    const filteredData = showHighScoresOnly ? data.filter((scored) => scored.score >= HIGH_SCORE_THRESHOLD) : data;

    const MARKER_SIZE = getMarkerSize(isMobile);

    filteredData.forEach((scored) => {
      const { attraction, score } = scored;

      // Use category-specific colors
      const iconColor = activeTab === "attractions" ? "#3B82F6" : "#EF4444";
      const isHighScore = score > HIGH_SCORE_THRESHOLD;

      const pinElement = document.createElement("div");
      pinElement.style.position = "relative";
      pinElement.style.width = `${MARKER_SIZE.DEFAULT}px`;
      pinElement.style.height = `${MARKER_SIZE.DEFAULT}px`;
      pinElement.style.borderRadius = "50%";
      pinElement.style.backgroundColor = iconColor;
      pinElement.style.border = `${MARKER_SIZE.BORDER.DEFAULT}px solid white`;
      pinElement.style.outline = isHighScore ? "1px solid #F59E0B" : "none";
      pinElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      pinElement.style.transition = "all 0.2s ease-in-out";
      pinElement.style.cursor = "pointer";

      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        content: pinElement,
        title: attraction.name,
      });

      marker.addListener("click", () => {
        // Open details dialog
        const attractionType = activeTab === "attractions" ? "attraction" : "restaurant";
        handleOpenAddDialog(attraction.id, attractionType);

        // Also highlight and scroll to it
        setScrollToAttractionId(attraction.id);
        setHighlightedAttractionId(attraction.id);

        // Expand nearby attractions panel
        setRightSidebarCollapsed(false);

        // On mobile, switch to explore tab to show the attraction
        if (isMobile) {
          setMobileTab("explore");
        }
      });

      pinElement.addEventListener("mouseenter", () => {
        setHoveredAttractionId(attraction.id);
      });

      pinElement.addEventListener("mouseleave", () => {
        setHoveredAttractionId(null);
      });

      markersMap.set(attraction.id, { marker, element: pinElement });
    });

    return () => {
      markersMap.forEach(({ marker }) => (marker.map = null));
      markersMap.clear();
    };
  }, [
    map,
    markerLibrary,
    selectedPlace,
    attractions,
    restaurants,
    activeTab,
    mapId,
    isMobile,
    showHighScoresOnly,
    handleOpenAddDialog,
  ]);

  useEffect(() => {
    if (!attractionMarkersRef.current) return;

    const MARKER_SIZE = getMarkerSize(isMobile);

    attractionMarkersRef.current.forEach(({ element }, placeId) => {
      if (placeId === hoveredAttractionId || placeId === highlightedAttractionId) {
        element.style.width = `${MARKER_SIZE.HOVERED}px`;
        element.style.height = `${MARKER_SIZE.HOVERED}px`;
        element.style.borderWidth = `${MARKER_SIZE.BORDER.HOVERED}px`;
        element.style.transform = "scale(1.2)";
        element.style.zIndex = "1000";
      } else {
        element.style.width = `${MARKER_SIZE.DEFAULT}px`;
        element.style.height = `${MARKER_SIZE.DEFAULT}px`;
        element.style.borderWidth = `${MARKER_SIZE.BORDER.DEFAULT}px`;
        element.style.transform = "scale(1)";
        element.style.zIndex = "auto";
      }
    });
  }, [hoveredAttractionId, highlightedAttractionId, isMobile]);

  useEffect(() => {
    if (!map || !markerLibrary || !mapId) return;

    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();

      if (lat === undefined || lng === undefined) return;

      handleClosePopover();

      setClickedLocation({ lat, lng });
      setShowAddPlacePopover(true);

      const tempElement = document.createElement("div");
      tempElement.style.width = "16px";
      tempElement.style.height = "16px";
      tempElement.style.borderRadius = "50%";
      tempElement.style.backgroundColor = "#10B981";
      tempElement.style.border = "3px solid white";
      tempElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";

      const tempMarker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        content: tempElement,
      });

      tempMarkerRef.current = tempMarker;
    });

    return () => {
      if (clickListener) {
        google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, markerLibrary, mapId, handleClosePopover]);

  // Track map panning to show/hide "Search this area" button
  useEffect(() => {
    if (!map || !initialSearchCenter) return;

    const checkDistance = () => {
      const center = map.getCenter();
      if (!center) return;

      const currentCenter = { lat: center.lat(), lng: center.lng() };
      const distance = calculateDistance(initialSearchCenter, currentCenter);

      setShowSearchNearbyButton(distance > SEARCH_NEARBY_DISTANCE_THRESHOLD);
    };

    // Check immediately in case map was already panned
    checkDistance();

    // Use 'idle' event instead of 'center_changed' to only update after map stops moving
    // This prevents button from flickering during programmatic pans and better matches Google Maps behavior
    const listener = map.addListener("idle", checkDistance);

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, initialSearchCenter]);

  // Track current map center for AI suggestions
  useEffect(() => {
    if (!map) return;

    const updateMapCenter = () => {
      const center = map.getCenter();
      if (center) {
        setCurrentMapCenter({ lat: center.lat(), lng: center.lng() });
      }
    };

    // Update immediately
    updateMapCenter();

    // Update on map idle event (after panning/dragging stops)
    const listener = map.addListener("idle", updateMapCenter);

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  // Calculate total planned items across all places
  const totalPlannedItems = places.reduce(
    (sum, place) => sum + place.plannedAttractions.length + place.plannedRestaurants.length,
    0
  );

  // Handle mobile tab navigation
  const handleMobileTabChange = (tab: MobileTab) => {
    // Only handle MapTab types in this component
    if (tab === "places" || tab === "map" || tab === "explore" || tab === "plan") {
      setMobileTab(tab);
    }
  };

  // Mobile tab configurations
  const mobileTabs = [
    {
      id: "places" as MapTab,
      label: "Places",
      icon: List,
      badge: places.length > 0 ? places.length : undefined,
      disabled: false,
    },
    {
      id: "map" as MapTab,
      label: "Map",
      icon: MapIcon,
      disabled: false,
    },
    {
      id: "explore" as MapTab,
      label: "Explore",
      icon: Compass,
      disabled: !selectedPlace,
    },
    {
      id: "plan" as MapTab,
      label: "Plan",
      icon: CheckSquare,
      badge: totalPlannedItems > 0 ? totalPlannedItems : undefined,
      disabled: totalPlannedItems === 0,
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex h-screen relative">
        {/* Left Sidebar - Places (Desktop only) */}
        <div
          className={`${
            leftSidebarCollapsed ? "w-12" : "@container w-full sm:w-72 md:w-80 lg:w-[22rem] xl:w-96"
          } hidden sm:flex flex-shrink-0 flex-col bg-white border-r shadow-sm transition-all duration-300 ease-in-out relative z-20`}
        >
          {leftSidebarCollapsed ? (
            <div className="flex items-center justify-center h-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setLeftSidebarCollapsed(false)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Expand places sidebar"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Show Places</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <>
              <div className="p-4 border-b space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} disabled={isLoading} map={map} />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setLeftSidebarCollapsed(true)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        aria-label="Collapse places sidebar"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Hide Places</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                {isLoading && <p className="text-sm text-muted-foreground mt-1">Loading place details...</p>}
              </div>

              <Card className="flex-1 m-4 flex flex-col rounded-lg min-h-0">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between">
                    <span>Places</span>
                    <Badge variant="secondary">{places.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
                  {places.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground px-6 text-center">
                      <p>No places added yet. Search for a place to get started.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full w-full px-4 sm:px-6 pb-6">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {places.map((place, index) => (
                              <PlaceListItem
                                key={place.id}
                                place={place}
                                index={index}
                                isSelected={selectedPlaceId === place.id}
                                onSelect={handlePanToPlace}
                                onRemove={handleRemovePlace}
                                plannedAttractions={place.plannedAttractions}
                                plannedRestaurants={place.plannedRestaurants}
                                onReorderAttractions={(oldIndex: number, newIndex: number) =>
                                  handleReorderPlannedItems(place.id, "attraction", oldIndex, newIndex)
                                }
                                onReorderRestaurants={(oldIndex: number, newIndex: number) =>
                                  handleReorderPlannedItems(place.id, "restaurant", oldIndex, newIndex)
                                }
                                onRemoveAttraction={(attractionId: string) =>
                                  handleRemoveFromPlan(place.id, attractionId, "attraction")
                                }
                                onRemoveRestaurant={(restaurantId: string) =>
                                  handleRemoveFromPlan(place.id, restaurantId, "restaurant")
                                }
                                onPlannedItemClick={handlePlannedItemClick}
                                isMobile={false}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Map - Center */}
        <div className="flex-1 relative">
          <Map
            defaultCenter={{ lat: 0, lng: 0 }}
            defaultZoom={2}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId={mapId}
          />

          <AttractionDetailsDialog
            attraction={pendingAttraction}
            isOpen={dialogOpen}
            isLoadingPhotos={isLoadingPhotos}
            onConfirm={handleConfirmAdd}
            onCancel={handleCancelAdd}
            type={pendingType || "attraction"}
          />

          {showSearchNearbyButton && selectedPlace && !(isMobile && mobileTab === "explore") && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Button
                onClick={handleSearchNearby}
                size="sm"
                variant="outline"
                className="bg-white text-gray-900 hover:bg-gray-50 shadow-lg border-gray-200"
                aria-label="Search for attractions and restaurants in the current map area"
              >
                Search this area
              </Button>
            </div>
          )}

          {showAddPlacePopover && clickedLocation && (
            <div className="absolute top-4 left-4 z-50">
              <div className="bg-white rounded-lg shadow-lg border p-4 w-80">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Add Location to Places</h3>
                    <p className="text-xs text-muted-foreground">
                      {clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)}
                    </p>
                  </div>

                  {geocodingError && <p className="text-sm text-red-500">{geocodingError}</p>}

                  {isReverseGeocoding ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Finding address...</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleAddPlace} className="flex-1" size="sm">
                        Add to Places
                      </Button>
                      <Button onClick={handleClosePopover} variant="outline" className="flex-1" size="sm">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Nearby Attractions (Desktop only) */}
        {selectedPlace && (
          <div
            className={`${
              rightSidebarCollapsed ? "w-12" : "w-full sm:w-72 md:w-80 lg:w-[22rem] xl:w-96"
            } hidden sm:flex flex-shrink-0 flex-col bg-white border-l shadow-sm transition-all duration-300 ease-in-out relative z-20`}
          >
            {rightSidebarCollapsed ? (
              <div className="flex items-center justify-center h-full">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setRightSidebarCollapsed(false)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Expand attractions sidebar"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Show Nearby Attractions</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <>
                <AttractionsPanel
                  attractions={attractions}
                  isLoadingAttractions={isLoadingAttractions}
                  attractionsError={attractionsError}
                  restaurants={restaurants}
                  isLoadingRestaurants={isLoadingRestaurants}
                  restaurantsError={restaurantsError}
                  placeName={selectedPlace.name}
                  onClose={handleCloseAttractions}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  onAttractionHover={setHoveredAttractionId}
                  scrollToAttractionId={scrollToAttractionId}
                  onScrollComplete={handleScrollComplete}
                  highlightedAttractionId={highlightedAttractionId}
                  onAttractionClick={(attractionId) => {
                    setHighlightedAttractionId(attractionId);
                    handleOpenAddDialog(attractionId, activeTab === "attractions" ? "attraction" : "restaurant");
                  }}
                  plannedAttractionIds={
                    new Set(places.find((p) => p.id === selectedPlaceId)?.plannedAttractions.map((a) => a.id) || [])
                  }
                  plannedRestaurantIds={
                    new Set(places.find((p) => p.id === selectedPlaceId)?.plannedRestaurants.map((r) => r.id) || [])
                  }
                  place={selectedPlace}
                  onPlaceUpdate={(updatedPlace) => handlePlaceUpdate(selectedPlace.id, updatedPlace)}
                  onAttractionAccepted={handleAttractionAccepted}
                  mapCenter={currentMapCenter}
                  onCollapse={() => setRightSidebarCollapsed(true)}
                  showHighScoresOnly={showHighScoresOnly}
                  onFilterChange={setShowHighScoresOnly}
                />
                <div className="absolute top-4 left-0 -translate-x-1/2 z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setRightSidebarCollapsed(true)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                        aria-label="Collapse attractions sidebar"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Hide Nearby Attractions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mobile Places Drawer */}
        <Drawer open={isMobile && mobileTab === "places"} onOpenChange={(open) => !open && setMobileTab("map")}>
          <DrawerContent className="max-h-[85vh] flex flex-col">
            <DrawerHeader className="pb-3 flex-shrink-0">
              <DrawerTitle className="text-xl font-bold">Places ({places.length})</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-3 space-y-2 flex-shrink-0">
              <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} disabled={isLoading} map={map} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              {isLoading && <p className="text-sm text-muted-foreground">Loading place details...</p>}
            </div>
            <ScrollArea className="flex-1 min-h-0 px-4 pb-20">
              {places.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-center">
                  <p>No places added yet. Search for a place to get started.</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 pb-24">
                      {places.map((place, index) => (
                        <PlaceListItem
                          key={place.id}
                          place={place}
                          index={index}
                          isSelected={selectedPlaceId === place.id}
                          onSelect={handlePanToPlace}
                          onRemove={handleRemovePlace}
                          plannedAttractions={place.plannedAttractions}
                          plannedRestaurants={place.plannedRestaurants}
                          onReorderAttractions={(oldIndex: number, newIndex: number) =>
                            handleReorderPlannedItems(place.id, "attraction", oldIndex, newIndex)
                          }
                          onReorderRestaurants={(oldIndex: number, newIndex: number) =>
                            handleReorderPlannedItems(place.id, "restaurant", oldIndex, newIndex)
                          }
                          onRemoveAttraction={(attractionId: string) =>
                            handleRemoveFromPlan(place.id, attractionId, "attraction")
                          }
                          onRemoveRestaurant={(restaurantId: string) =>
                            handleRemoveFromPlan(place.id, restaurantId, "restaurant")
                          }
                          onPlannedItemClick={handlePlannedItemClick}
                          isMobile={true}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </DrawerContent>
        </Drawer>

        {/* Mobile Explore Drawer (Attractions) */}
        <Drawer
          open={isMobile && mobileTab === "explore" && selectedPlace !== null}
          onOpenChange={(open) => !open && setMobileTab("map")}
        >
          <DrawerContent className="max-h-[85vh] pb-20">
            {selectedPlace && (
              <AttractionsPanel
                attractions={attractions}
                isLoadingAttractions={isLoadingAttractions}
                attractionsError={attractionsError}
                restaurants={restaurants}
                isLoadingRestaurants={isLoadingRestaurants}
                restaurantsError={restaurantsError}
                placeName={selectedPlace.name}
                onClose={() => setMobileTab("map")}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onAttractionHover={setHoveredAttractionId}
                scrollToAttractionId={scrollToAttractionId}
                onScrollComplete={handleScrollComplete}
                highlightedAttractionId={highlightedAttractionId}
                onAttractionClick={(attractionId) => {
                  setHighlightedAttractionId(attractionId);
                  handleOpenAddDialog(attractionId, activeTab === "attractions" ? "attraction" : "restaurant");
                }}
                plannedAttractionIds={
                  new Set(places.find((p) => p.id === selectedPlaceId)?.plannedAttractions.map((a) => a.id) || [])
                }
                plannedRestaurantIds={
                  new Set(places.find((p) => p.id === selectedPlaceId)?.plannedRestaurants.map((r) => r.id) || [])
                }
                place={selectedPlace}
                onPlaceUpdate={(updatedPlace) => handlePlaceUpdate(selectedPlace.id, updatedPlace)}
                onAttractionAccepted={handleAttractionAccepted}
                mapCenter={currentMapCenter}
                onCollapse={() => setMobileTab("map")}
                showHighScoresOnly={showHighScoresOnly}
                onFilterChange={setShowHighScoresOnly}
              />
            )}
          </DrawerContent>
        </Drawer>

        {/* Mobile Plan Drawer */}
        <Drawer open={isMobile && mobileTab === "plan"} onOpenChange={(open) => !open && setMobileTab("map")}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-3">
              <DrawerTitle className="text-xl font-bold">Your Plan ({totalPlannedItems} items)</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="flex-1 px-4 pb-20 pt-2">
              {totalPlannedItems === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-center">
                  <p>No planned items yet. Add attractions and restaurants from the Explore tab.</p>
                </div>
              ) : (
                <div className="space-y-5 pb-24">
                  {places.map((place) => {
                    const plannedItems = [...place.plannedAttractions, ...place.plannedRestaurants];
                    if (plannedItems.length === 0) return null;

                    return (
                      <div key={place.id} className="space-y-3">
                        <h3 className="font-bold text-lg text-gray-900">{place.name}</h3>
                        {place.plannedAttractions.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Attractions ({place.plannedAttractions.length})
                            </h4>
                            <div className="space-y-2">
                              {place.plannedAttractions.map((attraction) => (
                                <button
                                  key={attraction.id}
                                  className="w-full text-left text-sm p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors"
                                  onClick={() => handlePlannedItemClick(attraction)}
                                >
                                  <span className="font-medium text-gray-900">{attraction.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {place.plannedRestaurants.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Restaurants ({place.plannedRestaurants.length})
                            </h4>
                            <div className="space-y-2">
                              {place.plannedRestaurants.map((restaurant) => (
                                <button
                                  key={restaurant.id}
                                  className="w-full text-left text-sm p-3 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 active:bg-orange-200 transition-colors"
                                  onClick={() => handlePlannedItemClick(restaurant)}
                                >
                                  <span className="font-medium text-gray-900">{restaurant.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </DrawerContent>
        </Drawer>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileNavigation activeTab={mobileTab} onTabChange={handleMobileTabChange} tabs={mobileTabs} />}
      </div>
    </TooltipProvider>
  );
};

export default function MapPlanner({ apiKey, mapId, tripId }: MapPlannerProps) {
  return (
    <APIProvider apiKey={apiKey} libraries={["geometry"]}>
      <MapContent mapId={mapId} tripId={tripId} />
    </APIProvider>
  );
}
