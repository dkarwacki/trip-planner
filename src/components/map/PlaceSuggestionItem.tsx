import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Plus, Check, Loader2, ExternalLink } from "lucide-react";
import type { PlaceSuggestion } from "@/domain/plan/models";
import PhotoImage from "@/components/common/PhotoImage";
import PhotoLightbox from "./PhotoLightbox";

interface PlaceSuggestionItemProps {
  suggestion: PlaceSuggestion;
  isAdded: boolean;
  isValidating: boolean;
  onAdd: (suggestionId: string) => void;
}

export default function PlaceSuggestionItem({ suggestion, isAdded, isValidating, onAdd }: PlaceSuggestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const handleToggleAdd = () => {
    if (isAdded) {
      // Don't allow removing from here - user should remove from itinerary panel
      return;
    }
    onAdd(suggestion.id);
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const getGoogleMapsUrl = () => {
    // Use place ID for more accurate Google Maps linking
    return `https://www.google.com/maps/place/?q=place_id:${suggestion.id}`;
  };

  return (
    <Card
      id={`place-${suggestion.id}`}
      className="transition-shadow hover:shadow-md overflow-hidden scroll-mt-4 w-full max-w-full"
    >
      {/* Photos Section */}
      {suggestion.photos && suggestion.photos.length > 0 && (
        <div className="relative">
          <div className="grid grid-cols-1">
            <button
              type="button"
              onClick={() => handlePhotoClick(0)}
              className="relative aspect-[4/3] overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`View ${suggestion.name} photo in full size`}
            >
              <PhotoImage
                photoReference={suggestion.photos[0].photoReference}
                alt={`${suggestion.name}`}
                maxWidth={800}
                lat={suggestion.photos[0].lat}
                lng={suggestion.photos[0].lng}
                placeName={suggestion.name}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {/* Hover overlay to indicate clickability */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />
              {/* Show indicator if there are more photos */}
              {suggestion.photos.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                  <span>+{suggestion.photos.length - 1}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 w-full max-w-full">
          <div className="flex-1 min-w-0 overflow-hidden">
            <h4 className="font-medium text-gray-900 mb-1 break-words" style={{ overflowWrap: "anywhere" }}>
              {suggestion.name}
            </h4>
            <p className="text-sm text-gray-600 break-words" style={{ overflowWrap: "anywhere" }}>
              {suggestion.description}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button variant="outline" size="icon" asChild title="Open in Google Maps" className="h-8 w-8">
              <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant={isAdded ? "outline" : "default"}
              onClick={handleToggleAdd}
              disabled={isValidating || isAdded}
              title={isAdded ? "This place is already in your itinerary" : "Add to itinerary"}
              size="icon"
              className="h-8 w-8"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              <span>{isExpanded ? "Hide details" : "Show details"}</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Why this place?</p>
              <p className="text-xs text-gray-600 break-words" style={{ overflowWrap: "anywhere" }}>
                {suggestion.reasoning}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {/* Photo Lightbox */}
      {suggestion.photos && suggestion.photos.length > 0 && (
        <PhotoLightbox
          photos={suggestion.photos}
          initialIndex={selectedPhotoIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          placeName={suggestion.name}
        />
      )}
    </Card>
  );
}
