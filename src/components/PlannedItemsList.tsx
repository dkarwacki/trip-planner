import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DragEndEvent } from "@dnd-kit/core";
import { X, Star } from "lucide-react";
import type { Attraction } from "@/domain/models";

interface PlannedItemsListProps {
  items: Attraction[];
  type: "attractions" | "restaurants";
  onReorder: (oldIndex: number, newIndex: number) => void;
  onRemove: (attractionId: string) => void;
  onItemClick?: (attraction: Attraction) => void;
}

interface PlannedItemProps {
  attraction: Attraction;
  index: number;
  type: "attractions" | "restaurants";
  onRemove: (attractionId: string) => void;
  onItemClick?: (attraction: Attraction) => void;
}

const formatReviewCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

function PlannedItem({ attraction, index, type, onRemove, onItemClick }: PlannedItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attraction.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const accentColor = type === "attractions" ? "text-blue-600" : "text-red-600";
  const bgColor = type === "attractions" ? "bg-blue-50 dark:bg-blue-950" : "bg-red-50 dark:bg-red-950";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-start gap-2 p-2 rounded-md ${bgColor} group`}
    >
      <div
        {...listeners}
        className={`flex-shrink-0 w-5 h-5 rounded-full ${
          type === "attractions" ? "bg-blue-600" : "bg-red-600"
        } text-white flex items-center justify-center text-xs font-semibold cursor-grab active:cursor-grabbing mt-0.5`}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onItemClick?.(attraction)}
          className="text-left w-full hover:opacity-80 transition-opacity"
        >
          <h4 className={`font-medium text-sm line-clamp-2 ${accentColor}`}>{attraction.name}</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{attraction.rating.toFixed(1)}</span>
            <span>({formatReviewCount(attraction.userRatingsTotal)})</span>
          </div>
        </button>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(attraction.id);
        }}
        className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        aria-label={`Remove ${attraction.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function PlannedItemsList({ items, type, onReorder, onRemove, onItemClick }: PlannedItemsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    onReorder(oldIndex, newIndex);
  };

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic px-2 py-1">
        No {type === "attractions" ? "attractions" : "restaurants"} planned yet
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <PlannedItem
              key={item.id}
              attraction={item}
              index={index}
              type={type}
              onRemove={onRemove}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
