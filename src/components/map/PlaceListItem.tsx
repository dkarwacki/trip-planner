import { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import PlannedItemsList from "@/components/plan/PlannedItemsList";
import type { Place } from "@/domain/common/models";
import type { Attraction } from "@/domain/map/models";

interface PlaceListItemProps {
  place: Place;
  index: number;
  isSelected: boolean;
  onSelect: (place: Place) => void;
  onRemove: (placeId: string) => void;
  plannedAttractions: Attraction[];
  plannedRestaurants: Attraction[];
  onReorderAttractions: (oldIndex: number, newIndex: number) => void;
  onReorderRestaurants: (oldIndex: number, newIndex: number) => void;
  onRemoveAttraction: (attractionId: string) => void;
  onRemoveRestaurant: (restaurantId: string) => void;
  onPlannedItemClick?: (attraction: Attraction) => void;
  isMobile?: boolean;
}

export default function PlaceListItem({
  place,
  index,
  isSelected,
  onSelect,
  onRemove,
  plannedAttractions,
  plannedRestaurants,
  onReorderAttractions,
  onReorderRestaurants,
  onRemoveAttraction,
  onRemoveRestaurant,
  onPlannedItemClick,
  isMobile = false,
}: PlaceListItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.id,
  });
  const prevItemsCountRef = useRef(0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const hasPlannedItems = plannedAttractions.length > 0 || plannedRestaurants.length > 0;
  const itemsCount = plannedAttractions.length + plannedRestaurants.length;

  // Auto-expand only when items are first added (count increases from 0)
  useEffect(() => {
    if (itemsCount > 0 && prevItemsCountRef.current === 0) {
      setIsOpen(true);
    }
    prevItemsCountRef.current = itemsCount;
  }, [itemsCount]);

  // Collapse when this place is not selected
  useEffect(() => {
    if (!isSelected && isOpen) {
      setIsOpen(false);
    }
  }, [isSelected, isOpen]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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
        <div className="flex items-start gap-2 min-w-0">
          <button
            type="button"
            className="flex items-start gap-3 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
            onClick={() => {
              onSelect(place);
              if (hasPlannedItems) {
                setIsOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(place);
                if (hasPlannedItems) {
                  setIsOpen(true);
                }
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
              <h3 className="font-medium break-words hyphens-auto" lang="el">
                {place.name}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
              </p>
            </div>
          </button>
          <div className="flex items-start gap-1 flex-shrink-0">
            {hasPlannedItems && !isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(place);
                  setIsOpen(!isOpen);
                }}
                className="flex-shrink-0 p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
                aria-label={isOpen ? "Collapse planned items" : "Expand planned items"}
                style={{ cursor: "pointer" }}
              >
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(place.id);
              }}
              className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              aria-label={`Remove ${place.name}`}
              style={{ cursor: "pointer" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {hasPlannedItems && !isMobile && (
          <CollapsibleContent className="mt-3 space-y-3">
            {plannedAttractions.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Planned Attractions</h4>
                <PlannedItemsList
                  items={plannedAttractions}
                  type="attractions"
                  onReorder={onReorderAttractions}
                  onRemove={onRemoveAttraction}
                  onItemClick={onPlannedItemClick}
                />
              </div>
            )}

            {plannedRestaurants.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide">Planned Restaurants</h4>
                <PlannedItemsList
                  items={plannedRestaurants}
                  type="restaurants"
                  onReorder={onReorderRestaurants}
                  onRemove={onRemoveRestaurant}
                  onItemClick={onPlannedItemClick}
                />
              </div>
            )}
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
