import { useState } from "react";
import { Star, MapPin, ExternalLink, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Attraction } from "@/domain/map/models";
import PhotoImage from "@/components/common/PhotoImage";
import PhotoLightbox from "./PhotoLightbox";
import { ScoreBadge } from "./ScoreBadge";
import { getCategoryColor } from "@/lib/map/map-utils";

interface AttractionDetailsDialogProps {
  attraction: Attraction | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  type: "attraction" | "restaurant";
  score?: number;
  breakdown?: {
    qualityScore: number;
    diversityScore: number;
    confidenceScore: number;
  };
}

const formatReviewCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const getPriceLevelInfo = (priceLevel?: number): { symbol: string; label: string; description: string } => {
  if (!priceLevel) {
    return {
      symbol: "N/A",
      label: "Price not available",
      description: "Price information is not available for this place",
    };
  }

  const priceInfo: Record<number, { symbol: string; label: string; description: string }> = {
    0: { symbol: "Free", label: "Free", description: "No cost to visit" },
    1: { symbol: "$", label: "Inexpensive", description: "Budget-friendly, typically under $10" },
    2: { symbol: "$$", label: "Moderate", description: "Moderate pricing, typically $10-$30" },
    3: { symbol: "$$$", label: "Expensive", description: "Higher pricing, typically $30-$60" },
    4: { symbol: "$$$$", label: "Very Expensive", description: "Premium pricing, typically over $60" },
  };

  return (
    priceInfo[priceLevel] || { symbol: "$".repeat(priceLevel), label: "Price level " + priceLevel, description: "" }
  );
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
  onConfirm,
  onCancel,
  type,
  score,
  breakdown,
}: AttractionDetailsDialogProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [typesExpanded, setTypesExpanded] = useState(false);

  if (!attraction) return null;

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const hasPhotos = attraction.photos && attraction.photos.length > 0;
  const photoCount = attraction.photos?.length || 0;
  const displayedTypes = attraction.types.slice(0, 3);
  const hasMoreTypes = attraction.types.length > 3;
  const priceInfo = getPriceLevelInfo(attraction.priceLevel);
  const hasVicinity = attraction.vicinity && attraction.vicinity.trim().length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
          {/* Photos Section - Enhanced with overlay and count indicator */}
          {hasPhotos && attraction.photos && (
            <div className="pt-6 px-6">
              <div className={`grid ${attraction.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1.5`}>
                {attraction.photos.slice(0, 2).map((photo, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePhotoClick(index)}
                    className="relative aspect-[4/3] overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                    aria-label={`View ${attraction.name} photo ${index + 1} in full size`}
                  >
                    <PhotoImage
                      photoReference={photo.photoReference}
                      alt={`${attraction.name} ${index + 1}`}
                      maxWidth={800}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    {index === 0 && photoCount > 2 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm">
                        <ImageIcon className="h-3 w-3" />
                        <span>{photoCount}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 pb-6 pt-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
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

            <Separator className="my-4" />

            {/* Rating and Price Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                {attraction.rating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{attraction.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({formatReviewCount(attraction.userRatingsTotal || 0)})
                    </span>
                  </div>
                )}
                {score !== undefined && breakdown && (
                  <ScoreBadge
                    score={score}
                    breakdown={breakdown}
                    type={type === "attraction" ? "attractions" : "restaurants"}
                  />
                )}
                {attraction.priceLevel !== undefined && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                        <span className="font-medium">{priceInfo.symbol}</span>
                        <span className="text-xs">·</span>
                        <span className="text-xs">{priceInfo.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{priceInfo.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Address - Only show if vicinity exists */}
              {hasVicinity && (
                <>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{attraction.vicinity}</span>
                  </div>
                  <Separator />
                </>
              )}

              {/* Type Badges - Enhanced with expandable functionality */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {displayedTypes.map((placeType) => (
                    <Badge
                      key={placeType}
                      variant="outline"
                      className={`text-xs border ${getCategoryColor(placeType)} transition-colors`}
                    >
                      {formatTypeName(placeType)}
                    </Badge>
                  ))}
                </div>
                {hasMoreTypes && (
                  <Collapsible open={typesExpanded} onOpenChange={setTypesExpanded}>
                    <CollapsibleContent className="mt-2">
                      <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-200">
                        {attraction.types.slice(3).map((placeType) => (
                          <Badge
                            key={placeType}
                            variant="outline"
                            className={`text-xs border ${getCategoryColor(placeType)} transition-colors`}
                          >
                            {formatTypeName(placeType)}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
                        aria-label={typesExpanded ? "Show fewer categories" : "Show all categories"}
                      >
                        {typesExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            <span>Show fewer</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            <span>+{attraction.types.length - 3} more categories</span>
                          </>
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </Collapsible>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="px-6 pb-6 pt-4">
            <Button onClick={onConfirm} className="w-full" size="lg">
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
