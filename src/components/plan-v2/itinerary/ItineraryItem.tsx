import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoBlock } from "../shared/PhotoBlock";
import PhotoLightbox from "@/components/PhotoLightbox";
import type { ItineraryPlace } from "../types";

/**
 * Parse markdown-style bold text (**text**)
 */
function parseBoldText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const segments = text.split(/(\*\*[^*]+\*\*)/g);

  segments.forEach((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      // This is bold text
      const boldText = segment.slice(2, -2).trim();
      parts.push(
        <span key={`bold-${index}`} className="font-semibold">
          {boldText}
        </span>
      );
    } else if (segment.trim()) {
      // Regular text
      parts.push(<span key={`text-${index}`}>{segment}</span>);
    }
  });

  return parts;
}

interface ItineraryItemProps {
  place: ItineraryPlace;
  onRemove: (placeId: string) => void;
}

/**
 * ItineraryItem - Single place card with drag handle
 *
 * Features:
 * - Photo thumbnail
 * - Place name and coordinates
 * - Drag handle (via @dnd-kit/sortable)
 * - Remove button with confirmation
 * - Accessible keyboard support
 */
export function ItineraryItem({ place, onRemove }: ItineraryItemProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRemove = () => {
    if (window.confirm(`Remove ${place.name} from your itinerary?`)) {
      onRemove(place.id);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group flex gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50"
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={20} />
        </button>

        {/* Photo */}
        <div className="flex-shrink-0">
          <PhotoBlock
            photos={place.photos}
            alt={place.name}
            className="h-16 w-16 rounded-md"
            onClick={place.photos && place.photos.length > 0 ? () => setIsLightboxOpen(true) : undefined}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="truncate font-medium text-sm">{place.name}</h4>
          {place.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {parseBoldText(place.description)}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={10} />
            <span className="truncate">
              {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100"
          onClick={handleRemove}
          aria-label={`Remove ${place.name}`}
        >
          <X size={16} />
        </Button>
      </div>

      {/* Photo Lightbox */}
      {place.photos && place.photos.length > 0 && (
        <PhotoLightbox
          photos={place.photos}
          initialIndex={0}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          placeName={place.name}
        />
      )}
    </>
  );
}
