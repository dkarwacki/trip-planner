import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import type { Place } from "@/types";

interface PlaceListItemProps {
  place: Place;
  index: number;
  isSelected: boolean;
  onSelect: (place: Place) => void;
  onRemove: (placeId: string) => void;
}

export default function PlaceListItem({ place, index, isSelected, onSelect, onRemove }: PlaceListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.placeId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-3 rounded-lg border transition-colors hover:bg-accent ${
        isSelected ? "bg-accent border-primary" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-label={`${place.name} - Click to view on map, drag number to reorder`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex items-start gap-3 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
          onClick={() => onSelect(place)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(place);
            }
          }}
        >
          <div
            {...listeners}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold cursor-grab active:cursor-grabbing"
          >
            {index + 1}
          </div>
          <div className="flex-1 min-w-0 pointer-events-none">
            <h3 className="font-medium line-clamp-2">{place.name}</h3>
            <p className="text-sm text-muted-foreground">
              {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
            </p>
          </div>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(place.placeId);
          }}
          className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          aria-label={`Remove ${place.name}`}
          style={{ cursor: "pointer" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
