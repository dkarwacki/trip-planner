import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { cn } from "@/lib/common/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedCallback } from "@/components/hooks/useDebouncedCallback";

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export default function PlaceAutocomplete({
  onPlaceSelect,
  placeholder = "Enter place name...",
  disabled = false,
  className,
}: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const placesLibrary = useMapsLibrary("places");

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // Fetch predictions
  const fetchPredictionsImpl = async (input: string) => {
    if (!input.trim() || !placesLibrary) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const PlacesLib = placesLibrary as typeof google.maps.places;
      const request: google.maps.places.AutocompleteRequest = {
        input: input.trim(),
        // Optional: add location bias, types, etc.
      };

      const { suggestions: autocompleteSuggestions } =
        await PlacesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      setIsLoading(false);

      if (autocompleteSuggestions && autocompleteSuggestions.length > 0) {
        const formattedSuggestions: Suggestion[] = autocompleteSuggestions
          .filter((suggestion) => suggestion.placePrediction)
          .map((suggestion) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) {
              return {
                placeId: "",
                description: "",
                mainText: "",
                secondaryText: "",
              };
            }
            return {
              placeId: prediction.placeId,
              description: prediction.text.text,
              mainText: prediction.mainText?.text || prediction.text.text,
              secondaryText: prediction.secondaryText?.text || "",
            };
          })
          .filter((suggestion) => suggestion.placeId);
        setSuggestions(formattedSuggestions);
        setIsOpen(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[PlaceAutocomplete] Error fetching predictions:", error);
      setIsLoading(false);
      setSuggestions([]);
    }
  };

  const [debouncedFetchPredictions] = useDebouncedCallback(fetchPredictionsImpl as (...args: unknown[]) => void, 300);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);
    (debouncedFetchPredictions as (input: string) => void)(value);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    if (!placesLibrary) return;

    setInputValue(suggestion.mainText);
    setIsOpen(false);
    setSuggestions([]);

    try {
      const PlacesLib = placesLibrary as typeof google.maps.places;

      // Create a Place instance from the placeId
      const place = new PlacesLib.Place({
        id: suggestion.placeId,
      });

      // Fetch the fields we need
      await place.fetchFields({
        fields: ["id", "displayName", "formattedAddress", "location"],
      });

      // Convert to legacy PlaceResult format for compatibility
      const placeResult: google.maps.places.PlaceResult = {
        place_id: place.id || undefined,
        name: place.displayName || undefined,
        formatted_address: place.formattedAddress || undefined,
        geometry: place.location
          ? {
              location: place.location,
            }
          : undefined,
      };

      onPlaceSelectRef.current(placeResult);

      // Clear input after selection
      setInputValue("");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[PlaceAutocomplete] Error fetching place details:", error);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("w-full", className)}>
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            disabled={disabled}
            aria-label="Search for a place"
            aria-autocomplete="list"
            aria-controls="place-suggestions"
            aria-expanded={isOpen}
            autoComplete="off"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        id="place-suggestions"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="py-1" role="listbox">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.placeId}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="font-medium">{suggestion.mainText}</div>
                  {suggestion.secondaryText && (
                    <div className="text-xs text-muted-foreground">{suggestion.secondaryText}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
