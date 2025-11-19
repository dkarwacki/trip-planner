import { useState, useEffect } from "react";
import { useMapStore } from "../../stores/mapStore";
import type { MobileTab } from "../MobileBottomNav";

const TAB_STORAGE_KEY = "map-v2-mobile-active-tab";

export function useMobileNavigation() {
  const activeMobileTab = useMapStore((state) => state.activeMobileTab);
  const setMobileTab = useMapStore((state) => state.setMobileTab);
  const addPlace = useMapStore((state) => state.addPlace);

  const [activeTab, setActiveTab] = useState<MobileTab>("map");
  const [showSearch, setShowSearch] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Load active tab from sessionStorage or URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam === "plan" || tabParam === "map" || tabParam === "discover") {
      setActiveTab(tabParam);
      return;
    }

    const savedTab = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (savedTab === "plan" || savedTab === "map" || savedTab === "discover") {
      setActiveTab(savedTab);
    }
  }, []);

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Sync with global state when activeMobileTab changes
  useEffect(() => {
    if (activeMobileTab && activeMobileTab !== activeTab) {
      setActiveTab(activeMobileTab);
    }
  }, [activeMobileTab, activeTab]);

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    setMobileTab(tab);
  };

  const handleBackClick = () => {
    // This function is kept for potential future use
    // Currently not used as showBackButton is set to false
  };

  const handlePlaceSelect = (placeDetails: {
    placeId: string;
    name: string;
    formattedAddress: string;
    location: { lat: number; lng: number };
  }) => {
    const latValue = placeDetails.location.lat as unknown;
    const lngValue = placeDetails.location.lng as unknown;
    const lat = typeof latValue === "function" ? (latValue as () => number)() : Number(latValue);
    const lng = typeof lngValue === "function" ? (lngValue as () => number)() : Number(lngValue);

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      return;
    }

    const newPlace = {
      id: placeDetails.placeId,
      name: placeDetails.name,
      address: placeDetails.formattedAddress,
      lat,
      lng,
      plannedAttractions: [],
      plannedRestaurants: [],
    };

    addPlace(newPlace);

    if (activeTab !== "map") {
      setActiveTab("map");
    }

    if (mapInstance) {
      const currentZoom = mapInstance.getZoom() || 0;
      if (currentZoom < 13) {
        mapInstance.setZoom(13);
      }
    }
  };

  const handleNavigateToMapWithAttraction = (attractionId: string) => {
    setActiveTab("map");
    setMobileTab("map");

    setTimeout(() => {
      useMapStore.getState().setExpandedCard(attractionId);
    }, 100);
  };

  return {
    activeTab,
    showSearch,
    mapInstance,
    setMapInstance,
    setShowSearch,
    handleTabChange,
    handleBackClick,
    handlePlaceSelect,
    handleNavigateToMapWithAttraction,
  };
}
