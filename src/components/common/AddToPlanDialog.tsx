import { Star, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Attraction } from "@/domain/map/models";

interface AddToPlanDialogProps {
  attraction: Attraction | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  type: "attraction" | "restaurant";
}

const formatReviewCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const getPriceLevelSymbol = (priceLevel?: number): string => {
  if (!priceLevel) return "N/A";
  return "$".repeat(priceLevel);
};

export default function AddToPlanDialog({ attraction, isOpen, onConfirm, onCancel, type }: AddToPlanDialogProps) {
  if (!attraction) return null;

  const typeLabel = type === "attraction" ? "attraction" : "restaurant";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Plan</DialogTitle>
          <DialogDescription>Add this {typeLabel} to your place plan?</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div>
            <h3 className="font-semibold text-base mb-2">{attraction.name}</h3>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{attraction.rating.toFixed(1)}</span>
                <span>({formatReviewCount(attraction.userRatingsTotal)})</span>
              </div>
              {attraction.priceLevel && (
                <div className="flex items-center gap-1">
                  <span>{getPriceLevelSymbol(attraction.priceLevel)}</span>
                </div>
              )}
              {attraction.openNow !== undefined && (
                <Badge variant={attraction.openNow ? "default" : "secondary"} className="text-xs">
                  {attraction.openNow ? "Open" : "Closed"}
                </Badge>
              )}
            </div>

            <div className="flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{attraction.vicinity}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Add to Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
