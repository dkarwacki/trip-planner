import { useEffect, useRef } from "react";
import { X, Star, MapPin, ExternalLink, Check, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/ScoreBadge";
import type { AttractionScore, Attraction } from "@/types";

type CategoryTab = "attractions" | "restaurants";

interface AttractionsPanelProps {
  attractions: AttractionScore[];
  isLoadingAttractions: boolean;
  attractionsError: string | null;
  restaurants: AttractionScore[];
  isLoadingRestaurants: boolean;
  restaurantsError: string | null;
  placeName: string;
  onClose: () => void;
  activeTab: CategoryTab;
  onTabChange: (tab: CategoryTab) => void;
  onAttractionHover?: (placeId: string | null) => void;
  scrollToAttractionId?: string | null;
  onScrollComplete?: () => void;
  highlightedAttractionId?: string | null;
  onAttractionClick?: (placeId: string) => void;
  plannedAttractionIds: Set<string>;
  plannedRestaurantIds: Set<string>;
  onAddToPlan: (attraction: Attraction, type: "attraction" | "restaurant") => void;
}

const getPriceLevelSymbol = (priceLevel?: number): string => {
  if (!priceLevel) return "N/A";
  return "$".repeat(priceLevel);
};

const formatReviewCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
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

interface ContentListProps {
  data: AttractionScore[];
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  type: "attractions" | "restaurants";
  onAttractionHover?: (placeId: string | null) => void;
  scrollToAttractionId?: string | null;
  onScrollComplete?: () => void;
  highlightedAttractionId?: string | null;
  onAttractionClick?: (placeId: string) => void;
  plannedIds: Set<string>;
  onAddToPlan: (attraction: Attraction, type: "attraction" | "restaurant") => void;
}

const ContentList = ({
  data,
  isLoading,
  error,
  emptyMessage,
  type,
  onAttractionHover,
  scrollToAttractionId,
  onScrollComplete,
  highlightedAttractionId,
  onAttractionClick,
  plannedIds,
  onAddToPlan,
}: ContentListProps) => {
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (scrollToAttractionId) {
      const element = itemRefs.current.get(scrollToAttractionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Wait for smooth scroll to complete before clearing state
        const timeoutId = setTimeout(() => {
          onScrollComplete?.();
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [scrollToAttractionId, onScrollComplete]);
  // Loading State
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Separator />
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-6 text-center">
        <div>
          <p className="text-destructive font-medium mb-2">Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // No Results State
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Success State
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {data.map((scored) => {
          const { attraction, score, breakdown } = scored;
          const topTypes = attraction.types.slice(0, 3);
          const isPlanned = plannedIds.has(attraction.placeId);

          return (
            <div
              key={attraction.placeId}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(attraction.placeId, el);
                } else {
                  itemRefs.current.delete(attraction.placeId);
                }
              }}
              className={`space-y-3 cursor-pointer rounded-lg p-3 -mx-3 transition-colors hover:bg-accent ${
                highlightedAttractionId === attraction.placeId ? "bg-accent ring-2 ring-primary" : ""
              } ${isPlanned ? "bg-muted/50" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => onAttractionClick?.(attraction.placeId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onAttractionClick?.(attraction.placeId);
                }
              }}
              onMouseEnter={() => onAttractionHover?.(attraction.placeId)}
              onMouseLeave={() => onAttractionHover?.(null)}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base leading-tight flex-1 line-clamp-2 min-w-0">
                    {attraction.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPlanned ? (
                      <div
                        className="p-1 rounded-md bg-primary/10 text-primary"
                        title="Added to plan"
                        aria-label="Added to plan"
                      >
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlan(attraction, type === "attractions" ? "attraction" : "restaurant");
                        }}
                        className="p-1 rounded-md hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors"
                        aria-label={`Add ${attraction.name} to plan`}
                        title="Add to plan"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${attraction.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`View ${attraction.name} in Google Maps`}
                      title="View in Google Maps"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <ScoreBadge score={score} breakdown={breakdown} type={type} />
                  </div>
                </div>

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

                <div className="flex items-start gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{attraction.vicinity}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {topTypes.map((type) => (
                    <Badge key={type} variant="outline" className={`text-xs ${getCategoryColor(type)}`}>
                      {formatTypeName(type)}
                    </Badge>
                  ))}
                  {attraction.types.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{attraction.types.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default function AttractionsPanel({
  attractions,
  isLoadingAttractions,
  attractionsError,
  restaurants,
  isLoadingRestaurants,
  restaurantsError,
  placeName,
  onClose,
  activeTab,
  onTabChange,
  onAttractionHover,
  scrollToAttractionId,
  onScrollComplete,
  highlightedAttractionId,
  onAttractionClick,
  plannedAttractionIds,
  plannedRestaurantIds,
  onAddToPlan,
}: AttractionsPanelProps) {
  const headingText = activeTab === "attractions" ? "Nearby Attractions" : "Nearby Restaurants";

  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 z-10 pointer-events-auto">
      <Card className="h-full flex flex-col shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-2">
              <h2 className="text-lg">{headingText}</h2>
              <p className="text-sm font-normal text-muted-foreground mt-1 line-clamp-2">{placeName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Close attractions panel"
            >
              <X className="h-5 w-5" />
            </button>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs
            value={activeTab}
            className="h-full flex flex-col"
            onValueChange={(value) => onTabChange(value as CategoryTab)}
          >
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="attractions" className="flex-1">
                Tourist Attractions
              </TabsTrigger>
              <TabsTrigger value="restaurants" className="flex-1">
                Restaurants
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attractions" className="flex-1 overflow-hidden mt-0">
              <ContentList
                data={attractions}
                isLoading={isLoadingAttractions}
                error={attractionsError}
                emptyMessage="No attractions found for this location."
                type="attractions"
                onAttractionHover={onAttractionHover}
                scrollToAttractionId={scrollToAttractionId}
                onScrollComplete={onScrollComplete}
                highlightedAttractionId={highlightedAttractionId}
                onAttractionClick={onAttractionClick}
                plannedIds={plannedAttractionIds}
                onAddToPlan={onAddToPlan}
              />
            </TabsContent>

            <TabsContent value="restaurants" className="flex-1 overflow-hidden mt-0">
              <ContentList
                data={restaurants}
                isLoading={isLoadingRestaurants}
                error={restaurantsError}
                emptyMessage="No restaurants found for this location."
                type="restaurants"
                onAttractionHover={onAttractionHover}
                scrollToAttractionId={scrollToAttractionId}
                onScrollComplete={onScrollComplete}
                highlightedAttractionId={highlightedAttractionId}
                onAttractionClick={onAttractionClick}
                plannedIds={plannedRestaurantIds}
                onAddToPlan={onAddToPlan}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
