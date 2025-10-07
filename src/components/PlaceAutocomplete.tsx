import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  map?: google.maps.Map | null;
}

export default function PlaceAutocomplete({
  onPlaceSelect,
  placeholder = "Enter place name...",
  disabled = false,
  className,
  map,
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const placesLibrary = useMapsLibrary("places");
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    if (!map) {
      setIsZoomedIn(false);
      return;
    }

    const updateZoomState = () => {
      const zoom = map.getZoom();
      setIsZoomedIn(zoom !== undefined && zoom > 5);
    };

    updateZoomState();

    const zoomListener = map.addListener("zoom_changed", updateZoomState);

    return () => {
      google.maps.event.removeListener(zoomListener);
    };
  }, [map]);

  useEffect(() => {
    if (!placesLibrary || !inputRef.current) {
      return;
    }

    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    const getExpandedBounds = (bounds: google.maps.LatLngBounds, zoom: number) => {
      const center = bounds.getCenter();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Zoom levels: 0-3 (world), 4-6 (continent/country), 7-10 (region), 11-14 (city), 15-18 (streets), 19+ (buildings)
      let expandKm: number;

      if (zoom >= 15) {
        expandKm = 1;
      } else if (zoom >= 11) {
        expandKm = 5;
      } else if (zoom >= 7) {
        expandKm = 20;
      } else {
        expandKm = 50;
      }

      const latExpansion = expandKm / 111;
      const lngExpansion = expandKm / (111 * Math.cos((center.lat() * Math.PI) / 180));

      return new google.maps.LatLngBounds(
        new google.maps.LatLng(sw.lat() - latExpansion, sw.lng() - lngExpansion),
        new google.maps.LatLng(ne.lat() + latExpansion, ne.lng() + lngExpansion)
      );
    };

    const options: google.maps.places.AutocompleteOptions = {
      fields: ["place_id", "name", "formatted_address", "geometry"],
    };

    if (isZoomedIn) {
      options.types = ["establishment"];
    } else {
      options.types = ["establishment", "geocode"];
    }

    if (map) {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      if (bounds && zoom !== undefined) {
        options.bounds = getExpandedBounds(bounds, zoom);
      }
    }

    const autocomplete = new placesLibrary.Autocomplete(inputRef.current, options);

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      onPlaceSelectRef.current(place);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
      });
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [placesLibrary, map, isZoomedIn]);

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      aria-label="Search for a place"
    />
  );
}
