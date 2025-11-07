import { useState } from "react";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Attraction } from "@/domain/map/models";
import PhotoImage from "@/components/common/PhotoImage";
import PhotoLightbox from "./PhotoLightbox";

interface AttractionDetailsDialogProps {
  attraction: Attraction | null;
  isOpen: boolean;
  isLoadingPhotos?: boolean;
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

const getCategoryColor = (type: string): string => {
  const colors: Record<string, string> = {
    museum: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    restaurant: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    cafe: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    park: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    art_gallery: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    tourist_attraction: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
};

const formatTypeName = (type: string): string => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function AttractionDetailsDialog({
  attraction,
  isOpen,
  isLoadingPhotos = false,
  onConfirm,
  onCancel,
}: AttractionDetailsDialogProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!attraction) return null;

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const topTypes = attraction.types.slice(0, 3);
  const hasPhotos = attraction.photos && attraction.photos.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
          {/* Photos Section */}
          {isLoadingPhotos ? (
            <div className="pt-6">
              <div className="grid grid-cols-2 gap-0.5">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="aspect-[4/3] w-full" />
              </div>
            </div>
          ) : (
            hasPhotos &&
            attraction.photos && (
              <div className="pt-6">
                <div className={`grid ${attraction.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-0.5`}>
                  {attraction.photos.map((photo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePhotoClick(index)}
                      className="relative aspect-[4/3] overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`View ${attraction.name} photo ${index + 1} in full size`}
                    >
                      <PhotoImage
                        photoReference={photo.photoReference}
                        alt={`${attraction.name} ${index + 1}`}
                        maxWidth={800}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          <div className="px-6 pb-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-xl font-semibold leading-tight flex-1 pr-2">{attraction.name}</DialogTitle>
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${attraction.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  aria-label={`View ${attraction.name} in Google Maps`}
                  title="View in Google Maps"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </DialogHeader>

            <div className="space-y-3">
              {/* Rating and Price */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{attraction.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({formatReviewCount(attraction.userRatingsTotal)})</span>
                </div>
                {attraction.priceLevel && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>{getPriceLevelSymbol(attraction.priceLevel)}</span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{attraction.vicinity}</span>
              </div>

              {/* Type Badges */}
              <div className="flex flex-wrap gap-1.5">
                {topTypes.map((placeType) => (
                  <Badge key={placeType} variant="outline" className={`text-xs ${getCategoryColor(placeType)}`}>
                    {formatTypeName(placeType)}
                  </Badge>
                ))}
                {attraction.types.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{attraction.types.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pb-6">
            <Button onClick={onConfirm} className="w-full">
              Add to Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      {hasPhotos && attraction.photos && (
        <PhotoLightbox
          photos={attraction.photos}
          initialIndex={selectedPhotoIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          placeName={attraction.name}
        />
      )}
    </>
  );
}
