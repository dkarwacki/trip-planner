import { X, Star, MapPin, DollarSign, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AttractionScore } from "@/types";

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
  onTabChange: (tab: CategoryTab) => void;
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

const renderContent = (data: AttractionScore[], isLoading: boolean, error: string | null, emptyMessage: string) => {
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

          return (
            <div key={attraction.placeId} className="space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base leading-tight flex-1">{attraction.name}</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md cursor-help flex-shrink-0">
                          <Info className="h-3 w-3 text-primary" />
                          <span className="text-sm font-semibold text-primary">{score}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="w-64">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm mb-2">Score Breakdown</p>
                          <div className="flex justify-between text-xs">
                            <span>Quality Score:</span>
                            <span className="font-medium">{breakdown.qualityScore}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Diversity Score:</span>
                            <span className="font-medium">{breakdown.diversityScore}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Locality Score:</span>
                            <span className="font-medium">{breakdown.localityScore}</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{attraction.rating.toFixed(1)}</span>
                    <span>({formatReviewCount(attraction.userRatingsTotal)})</span>
                  </div>
                  {attraction.priceLevel && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
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
  onTabChange,
}: AttractionsPanelProps) {
  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 z-10 pointer-events-auto">
      <Card className="h-full flex flex-col shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-lg">Nearby Places</h2>
              <p className="text-sm font-normal text-muted-foreground mt-1">{placeName}</p>
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
            defaultValue="attractions"
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
              {renderContent(
                attractions,
                isLoadingAttractions,
                attractionsError,
                "No attractions found for this location."
              )}
            </TabsContent>

            <TabsContent value="restaurants" className="flex-1 overflow-hidden mt-0">
              {renderContent(
                restaurants,
                isLoadingRestaurants,
                restaurantsError,
                "No restaurants found for this location."
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
