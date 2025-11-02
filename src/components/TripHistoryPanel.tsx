import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, MapPin, Trash2 } from "lucide-react";
import type { SavedTrip } from "@/domain/models";

interface TripHistoryPanelProps {
  trips: SavedTrip[];
  onOpenTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

export default function TripHistoryPanel({ trips, onOpenTrip, onDeleteTrip }: TripHistoryPanelProps) {
  const isEmpty = trips.length === 0;

  return (
    <Card className="h-full flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Trip History
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0 p-4">
        {isEmpty ? (
          <div className="text-center text-gray-500 py-8">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium">No saved trips yet</p>
            <p className="text-xs mt-1">Your exported trips will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="p-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">{trip.title}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {trip.placeCount} {trip.placeCount === 1 ? "place" : "places"}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteTrip(trip.id)}
                      className="h-8 w-8 p-0"
                      title="Delete trip"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Button size="sm" variant="outline" onClick={() => onOpenTrip(trip.id)} className="w-full mt-2">
                  Open in Map
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
