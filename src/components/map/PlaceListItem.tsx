import { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, MapPin, Utensils } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
              className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-primary text-primary bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-sm font-semibold cursor-grab active:cursor-grabbing hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0 pointer-events-none">
              <h3 className="font-medium break-words hyphens-auto" lang="el">
                {place.name}
              </h3>
              {!isOpen && hasPlannedItems && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {plannedAttractions.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Attractions</span>
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-blue-600 border-blue-600/30">
                        {plannedAttractions.length}
                      </Badge>
                    </div>
                  )}
                  {plannedRestaurants.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Utensils className="h-3 w-3 text-red-600" />
                      <span className="text-xs font-medium text-red-600">Restaurants</span>
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-red-600 border-red-600/30">
                        {plannedRestaurants.length}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>
          <div className="flex items-start gap-1 flex-shrink-0">
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
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-blue-600" />
                  <h4 className="text-xs font-medium text-blue-600">Attractions</h4>
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-blue-600 border-blue-600/30">
                    {plannedAttractions.length}
                  </Badge>
                </div>
                <PlannedItemsList
                  items={plannedAttractions}
                  type="attractions"
                  onReorder={onReorderAttractions}
                  onRemove={onRemoveAttraction}
                  onItemClick={onPlannedItemClick}
                />
              </div>
            )}

            {plannedAttractions.length > 0 && plannedRestaurants.length > 0 && <Separator className="my-2" />}

            {plannedRestaurants.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Utensils className="h-3 w-3 text-red-600" />
                  <h4 className="text-xs font-medium text-red-600">Restaurants</h4>
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-red-600 border-red-600/30">
                    {plannedRestaurants.length}
                  </Badge>
                </div>
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
