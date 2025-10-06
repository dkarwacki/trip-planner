import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PlaceAutocomplete({
  onPlaceSelect,
  placeholder = "Enter place name...",
  disabled = false,
  className,
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const placesLibrary = useMapsLibrary("places");

  // Keep the callback ref up to date
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // Initialize autocomplete when places library is loaded
  useEffect(() => {
    if (!placesLibrary || !inputRef.current || autocompleteRef.current) {
      return;
    }

    // Create autocomplete instance
    const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
      fields: ["place_id", "name", "formatted_address", "geometry"],
      types: ["(regions)"], // Focus on cities, regions, etc.
    });

    autocompleteRef.current = autocomplete;

    // Listen for place selection
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        // User entered a place without selecting from predictions
        return;
      }

      // Call the parent handler first using the ref
      onPlaceSelectRef.current(place);

      // Clear input after selection - Google's autocomplete fills it asynchronously
      // We need to use double requestAnimationFrame to ensure we clear AFTER Google fills it
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            // Also trigger an input event to ensure any listeners are notified
            inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
      });
    });

    // Cleanup
    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [placesLibrary]);

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
