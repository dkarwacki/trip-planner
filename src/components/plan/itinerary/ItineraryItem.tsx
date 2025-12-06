import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, X, MapPin } from "lucide-react";
import { PhotoBlock } from "../shared/PhotoBlock";
import type { ItineraryPlace } from "../types";
import { getGoogleMapsUrl } from "@/lib/common/google-maps";

interface ItineraryItemProps {
  place: ItineraryPlace;
  order: number;
  onRemove: (placeId: string) => void;
}

/**
 * ItineraryItem - Single place card with timeline node and drag handle
 *
 * Features:
 * - Timeline node with numbered circle (serves as drag handle)
 * - Photo thumbnail
 * - Place name and Google Maps link
 * - Remove button with hover reveal
 * - Accessible keyboard support
 */
export function ItineraryItem({ place, order, onRemove }: ItineraryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(place.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex gap-4 ${isDragging ? "opacity-50 z-50" : ""}`}
      data-testid="itinerary-item"
    >
      {/* Timeline Node */}
      <div className="flex-shrink-0 flex flex-col items-center pt-2">
        <div
          {...attributes}
          {...listeners}
          data-sortable-handle
          data-testid="drag-handle"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-gray-400 text-xs font-medium text-gray-500 shadow-sm cursor-grab hover:border-gray-600 hover:text-gray-700 active:cursor-grabbing z-10"
        >
          {order}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group">
        <div className="flex p-3 gap-3">
          {/* Left Thumbnail */}
          <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 relative">
            {place.photos && place.photos.length > 0 ? (
              <PhotoBlock
                photos={place.photos}
                alt={place.name}
                lat={place.coordinates.lat}
                lng={place.coordinates.lng}
                placeName={place.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Search className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-medium text-gray-900 truncate pr-2" data-testid="itinerary-item-name">
                {place.name}
              </h4>
              <button
                onClick={handleRemove}
                className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove place"
                data-testid="remove-place-button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* View on Google Maps link */}
            {/* View on Google Maps link */}
            <a
              href={getGoogleMapsUrl({
                name: place.name,
                placeId: place.id,
                location: { lat: place.coordinates.lat, lng: place.coordinates.lng },
              })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              data-testid="google-maps-link"
            >
              <MapPin className="w-3 h-3" />
              View on Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
