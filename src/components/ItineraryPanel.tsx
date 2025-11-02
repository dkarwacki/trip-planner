import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin, X, Map } from "lucide-react";
import type { Place } from "@/domain/models";
import type { DragEndEvent } from "@dnd-kit/core";

interface ItineraryPanelProps {
  places: Place[];
  onReorder: (places: Place[]) => void;
  onRemove: (placeId: string) => void;
  onExport: () => void;
}

interface SortablePlaceItemProps {
  place: Place;
  onRemove: (placeId: string) => void;
}

function SortablePlaceItem({ place, onRemove }: SortablePlaceItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-gray-100 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>

      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
        <p className="text-xs text-gray-500">
          {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
        </p>
      </div>

      <Button size="sm" variant="ghost" onClick={() => onRemove(place.id)} className="flex-shrink-0 h-8 w-8 p-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ItineraryPanel({ places, onReorder, onRemove, onExport }: ItineraryPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = places.findIndex((place) => place.id === active.id);
      const newIndex = places.findIndex((place) => place.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(places, oldIndex, newIndex);
        onReorder(reordered);
      }
    }
  };

  const isEmpty = places.length === 0;

  return (
    <Card className="h-full flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            My Itinerary
          </span>
          <span className="text-sm font-normal text-gray-500">{places.length} places</span>
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0 p-4">
        {isEmpty ? (
          <div className="text-center text-gray-500 py-8">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium">No places added yet</p>
            <p className="text-xs mt-1">Start by asking the assistant for suggestions</p>
            <div className="mt-4 space-y-1 text-xs text-gray-400">
              <p>Try asking:</p>
              <p>"What are some great places to explore in Tokyo?"</p>
              <p>"Recommend nature spots in Iceland"</p>
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {places.map((place) => (
                  <SortablePlaceItem key={place.id} place={place} onRemove={onRemove} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </ScrollArea>

      <CardContent className="border-t p-4 flex-shrink-0">
        <Button onClick={onExport} disabled={isEmpty} className="w-full" size="lg">
          <Map className="mr-2 h-4 w-4" />
          Export to Map
        </Button>
        {isEmpty && <p className="text-xs text-gray-500 text-center mt-2">Add places to enable export</p>}
      </CardContent>
    </Card>
  );
}
