import { useCallback, useEffect, useRef, useState } from "react";
import { X, Star, MapPin, Check, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/map/ScoreBadge";
import PlaceSuggestionsButton from "@/components/map/PlaceSuggestionsButton";
import PhotoImage from "@/components/common/PhotoImage";
import type { AttractionScore, Attraction } from "@/domain/map/models";
import type { Place } from "@/domain/common/models";
import { HIGH_SCORE_THRESHOLD } from "@/domain/map/scoring";

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
  place: Place;
  onPlaceUpdate: (updatedPlace: Place) => void;
  onAttractionAccepted?: (placeId: string, attraction: Attraction, type: "attraction" | "restaurant") => void;
  mapCenter?: { lat: number; lng: number } | null;
  onCollapse?: () => void;
  showHighScoresOnly: boolean;
  onFilterChange: (value: boolean) => void;
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
  showHighScoresOnly: boolean;
  onFilteredCountChange?: (filtered: number, total: number) => void;
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
  showHighScoresOnly,
  onFilteredCountChange,
}: ContentListProps) => {
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const filteredData = showHighScoresOnly ? data.filter((scored) => scored.score >= HIGH_SCORE_THRESHOLD) : data;

  useEffect(() => {
    if (onFilteredCountChange && showHighScoresOnly) {
      onFilteredCountChange(filteredData.length, data.length);
    }
  }, [filteredData.length, data.length, showHighScoresOnly, onFilteredCountChange]);

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
      <div className="p-4 pb-40 sm:pb-24 space-y-4">
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
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6 text-center">
        <p className="text-muted-foreground">
          {showHighScoresOnly && data.length > 0
            ? `No high-scoring ${type} found. Try disabling the filter.`
            : emptyMessage}
        </p>
      </div>
    );
  }

  // Success State
  return (
    <ScrollArea className="flex-1 overflow-auto">
      <div className="p-4 pb-40 sm:pb-24 space-y-4">
        {filteredData.map((scored) => {
          const { attraction, score, breakdown } = scored;
          const topTypes = attraction.types.slice(0, 3);
          const isPlanned = plannedIds.has(attraction.id);

          return (
            <div
              key={attraction.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(attraction.id, el);
                } else {
                  itemRefs.current.delete(attraction.id);
                }
              }}
              className={`space-y-3 cursor-pointer rounded-lg p-3 -mx-3 transition-colors hover:bg-accent ${
                highlightedAttractionId === attraction.id ? "bg-accent ring-2 ring-primary" : ""
              } ${isPlanned ? "bg-muted/50" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => onAttractionClick?.(attraction.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onAttractionClick?.(attraction.id);
                }
              }}
              onMouseEnter={() => onAttractionHover?.(attraction.id)}
              onMouseLeave={() => onAttractionHover?.(null)}
            >
              <div className="flex gap-3">
                {/* Main content area */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-base leading-tight flex-1 line-clamp-2 min-w-0">
                      {attraction.name}
                    </h3>
                    {isPlanned && (
                      <div
                        className="p-1 rounded-md bg-primary/10 text-primary flex-shrink-0"
                        title="Added to plan"
                        aria-label="Added to plan"
                      >
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{attraction.rating?.toFixed(1) ?? "N/A"}</span>
                      <span>({formatReviewCount(attraction.userRatingsTotal ?? 0)})</span>
                    </div>
                    <ScoreBadge score={score} breakdown={breakdown} type={type} />
                    {attraction.priceLevel && (
                      <div className="flex items-center gap-1">
                        <span>{getPriceLevelSymbol(attraction.priceLevel)}</span>
                      </div>
                    )}
                  </div>

                  {attraction.vicinity && (
                    <div className="flex items-start gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{attraction.vicinity}</span>
                    </div>
                  )}

                  {attraction.openNow !== undefined && (
                    <div className="mb-3">
                      <Badge variant={attraction.openNow ? "default" : "secondary"} className="text-xs">
                        {attraction.openNow ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  )}

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

                {/* Photo thumbnail */}
                {attraction.photos && attraction.photos.length > 0 && (
                  <div className="flex-shrink-0 w-24 h-24">
                    <PhotoImage
                      photoReference={attraction.photos[0].photoReference}
                      alt={attraction.name}
                      maxWidth={400}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
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
  place,
  onPlaceUpdate,
  onAttractionAccepted,
  mapCenter,
  onCollapse,
  showHighScoresOnly,
  onFilterChange,
}: AttractionsPanelProps) {
  const [attractionsFilteredCount, setAttractionsFilteredCount] = useState<{ filtered: number; total: number } | null>(
    null
  );
  const [restaurantsFilteredCount, setRestaurantsFilteredCount] = useState<{ filtered: number; total: number } | null>(
    null
  );

  const headingText = activeTab === "attractions" ? "Nearby Attractions" : "Nearby Restaurants";

  const handleAttractionsFilteredCountChange = useCallback((filtered: number, total: number) => {
    setAttractionsFilteredCount({ filtered, total });
  }, []);

  const handleRestaurantsFilteredCountChange = useCallback((filtered: number, total: number) => {
    setRestaurantsFilteredCount({ filtered, total });
  }, []);

  // Clear filtered counts when filter is turned off
  useEffect(() => {
    if (!showHighScoresOnly) {
      setAttractionsFilteredCount(null);
      setRestaurantsFilteredCount(null);
    }
  }, [showHighScoresOnly]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Card className="h-full flex flex-col border-0 shadow-none py-3">
        <div className="px-4 sm:px-6 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-2">
              <h2 className="text-lg font-semibold">{headingText}</h2>
              <p className="text-sm font-normal text-muted-foreground mt-1 line-clamp-2">{placeName}</p>
            </div>
            <button
              onClick={onCollapse || onClose}
              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Close attractions panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
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

            <div className="border-b bg-muted/20">
              <PlaceSuggestionsButton
                place={place}
                onPlaceUpdate={onPlaceUpdate}
                onExpandRequest={() => {
                  /* No-op since we're already in the panel */
                }}
                onAttractionAccepted={onAttractionAccepted}
                onHighlight={() => {
                  /* No-op since place is already selected */
                }}
                mapCenter={mapCenter}
              />
            </div>

            <TabsContent value="attractions" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
              <div className="border-b bg-muted/5">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {attractionsFilteredCount
                      ? `${attractionsFilteredCount.filtered} of ${attractionsFilteredCount.total} results`
                      : `${attractions.length} results`}
                  </span>
                  <button
                    onClick={() => onFilterChange(!showHighScoresOnly)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      showHighScoresOnly
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    aria-label={showHighScoresOnly ? "Show all results" : "Show high scores only"}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>High scores</span>
                  </button>
                </div>
              </div>
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
                showHighScoresOnly={showHighScoresOnly}
                onFilteredCountChange={handleAttractionsFilteredCountChange}
              />
            </TabsContent>

            <TabsContent value="restaurants" className="flex-1 overflow-hidden mt-0 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/5">
                <span className="text-sm text-muted-foreground">
                  {restaurantsFilteredCount
                    ? `${restaurantsFilteredCount.filtered} of ${restaurantsFilteredCount.total} results`
                    : `${restaurants.length} results`}
                </span>
                <button
                  onClick={() => onFilterChange(!showHighScoresOnly)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showHighScoresOnly
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  aria-label={showHighScoresOnly ? "Show all results" : "Show high scores only"}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>High scores</span>
                </button>
              </div>
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
                showHighScoresOnly={showHighScoresOnly}
                onFilteredCountChange={handleRestaurantsFilteredCountChange}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
