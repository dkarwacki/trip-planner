import { Star } from "lucide-react";
import type { Attraction } from "@/domain/map/models";

interface MarkerTooltipProps {
  attraction: Attraction;
  position: { x: number; y: number };
  type: "attraction" | "restaurant";
}

export function MarkerTooltip({ attraction, position, type }: MarkerTooltipProps) {
  // Render price level as dollar signs
  const renderPriceLevel = (level?: number) => {
    if (!level) return null;
    return (
      <span className="text-green-600 font-medium">
        {"$".repeat(level)}
        <span className="text-gray-300">{"$".repeat(4 - level)}</span>
      </span>
    );
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-3 w-3">
            <Star className="h-3 w-3 text-gray-300 absolute" />
            <div className="overflow-hidden absolute w-1/2 h-full">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="h-3 w-3 text-gray-300" />
        );
      }
    }

    return stars;
  };

  const bgColor = type === "attraction" ? "bg-blue-600" : "bg-red-600";

  // Adjust positioning to prevent tooltip from going off screen
  const tooltipWidth = 288; // max-w-xs = 20rem = 320px, with padding ~288px content
  const tooltipHeight = 100; // Approximate height
  const margin = 16; // Margin from edges

  let adjustedX = position.x;
  let adjustedY = position.y;
  let transformX = "-50%";
  let transformY = "-100%";

  // Check if tooltip would overflow on the right
  if (position.x + tooltipWidth / 2 > window.innerWidth - margin) {
    transformX = "-100%";
    adjustedX = position.x - 12;
  }
  // Check if tooltip would overflow on the left
  else if (position.x - tooltipWidth / 2 < margin) {
    transformX = "0%";
    adjustedX = position.x + 12;
  }

  // Check if tooltip would overflow on top
  if (position.y - tooltipHeight < margin) {
    transformY = "0%";
    adjustedY = position.y + 24;
  }

  return (
    <div
      className="absolute pointer-events-none z-[1000]"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        transform: `translate(${transformX}, ${transformY})`,
        marginTop: transformY === "-100%" ? "-12px" : "0",
      }}
    >
      <div 
        className={`${bgColor} text-white rounded-lg shadow-lg px-3 py-2 max-w-xs relative transition-all duration-300 ease-out`}
        style={{
          animation: "tooltipFadeIn 0.3s ease-out forwards",
        }}
      >
        {/* Tooltip arrow */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${transformY === "-100%" ? "-bottom-1" : "-top-1"} w-2 h-2 ${bgColor} rotate-45`}
        />
        
        {/* Content */}
        <div className="relative z-10 space-y-1">
          <h4 className="font-semibold text-sm leading-tight">{attraction.name}</h4>
          
          <div className="flex items-center gap-2 text-xs">
            {attraction.rating > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {renderStars(attraction.rating)}
                </div>
                <span className="font-medium">{attraction.rating.toFixed(1)}</span>
              </div>
            )}
            
            {attraction.userRatingsTotal > 0 && (
              <span className="text-white/80">
                ({attraction.userRatingsTotal.toLocaleString()})
              </span>
            )}
            
            {attraction.priceLevel && (
              <div className="ml-auto">
                {renderPriceLevel(attraction.priceLevel)}
              </div>
            )}
          </div>
          
          {attraction.vicinity && (
            <p className="text-xs text-white/90 leading-tight">
              {attraction.vicinity}
            </p>
          )}
          
          {attraction.openNow !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${attraction.openNow ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-white/90">
                {attraction.openNow ? "Open now" : "Closed"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

