/**
 * Expanded place card component
 * Shows on marker click with action buttons
 */

import React, { useEffect, useState } from "react";
import { X, Loader2, Check, Plus, MapPinned, ChevronDown, ChevronUp } from "lucide-react";
import type { Attraction } from "@/domain/map/models";
import { calculateCardPosition } from "./CardPositioning";
import { LazyImage } from "../shared/LazyImage";
import { ScoreBadge } from "../shared/ScoreBadge";
import PhotoLightbox from "@/components/PhotoLightbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExpandedPlaceCardProps {
  attraction: Attraction;
  markerPosition: { x: number; y: number };
  viewportSize: { width: number; height: number };
  score?: number;
  breakdown?: {
    qualityScore: number;
    diversityScore?: number;
    confidenceScore: number;
  };
  isAddedToPlan: boolean;
  isAddingToPlan?: boolean;
  onClose: () => void;
  onAddToPlan: (attractionId: string) => void;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 380;

export const ExpandedPlaceCard = React.memo(
  function ExpandedPlaceCard({
    attraction,
    markerPosition,
    viewportSize,
    score,
    breakdown,
    isAddedToPlan,
    isAddingToPlan,
    onClose,
    onAddToPlan,
  }: ExpandedPlaceCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Fade-in animation
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }, []);

    // ESC key to close
    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Calculate position - center on mobile, near marker on desktop
    // Ensure card doesn't overlap sidebar area (max sidebar width: ~500px)
    const SIDEBAR_SAFE_ZONE = 500; // Conservative estimate for sidebar area

    const position = isMobile
      ? {
          x: (viewportSize.width - CARD_WIDTH) / 2,
          y: (viewportSize.height - CARD_HEIGHT) / 2,
        }
      : (() => {
          const calculated = calculateCardPosition({
            markerPosition,
            cardSize: { width: CARD_WIDTH, height: CARD_HEIGHT },
            viewportSize,
            offset: 20,
            preferredSide: "right",
          });

          // If card would overlap sidebar area (left side), adjust position to the right
          if (calculated.x < SIDEBAR_SAFE_ZONE) {
            // Position card to the right of sidebar
            const adjustedX = SIDEBAR_SAFE_ZONE + 20;

            // Ensure it doesn't overflow right side
            const finalX = Math.min(adjustedX, viewportSize.width - CARD_WIDTH - 20);

            return {
              x: finalX,
              y: calculated.y,
            };
          }

          return calculated;
        })();

    // Get single photo reference
    const photoReference = attraction.photos?.[0]?.photoReference;

    const handlePhotoClick = () => {
      if (photoReference) {
        setIsLightboxOpen(true);
      }
    };

    const handleGoogleMapsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const query = encodeURIComponent(attraction.name);
      // Google Maps search URL with query and place_id
      // Note: query_place_id parameter helps Google Maps find the exact place
      const url = `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${attraction.id}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    // Format rating
    const rating = attraction.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const reviewCount = attraction.userRatingsTotal || 0;

    return (
      <>
        {/* Container wrapper for card and score badge tooltip */}
        <div
          className="fixed pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${CARD_WIDTH}px`,
            zIndex: 100,
          }}
        >
          {/* Main Card */}
          <div
            className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-opacity duration-200 pointer-events-auto ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Hero Photo with Score Badge */}
            <div className="relative w-full h-32 md:h-44 bg-gray-200">
              {photoReference ? (
                <button
                  onClick={handlePhotoClick}
                  className="w-full h-full relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset group"
                  aria-label="View photo in fullscreen"
                >
                  <LazyImage
                    photoReference={photoReference}
                    alt={attraction.name}
                    lat={attraction.location.lat}
                    lng={attraction.location.lng}
                    placeName={attraction.name}
                    size="medium"
                    eager={true}
                    className="w-full h-full object-cover transition-opacity group-hover:opacity-90 group-active:opacity-90"
                  />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No photo</span>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-2 left-2 w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-all z-10 shadow-md hover:shadow-lg hover:scale-105"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-700" />
              </button>

              {/* Google Maps Button */}
              <button
                onClick={handleGoogleMapsClick}
                className="absolute top-2 left-12 h-8 px-3 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center gap-2 transition-all z-10 text-xs font-medium text-gray-700 shadow-md hover:shadow-lg hover:scale-105"
                aria-label="Open in Google Maps"
              >
                <MapPinned className="h-3.5 w-3.5" />
                <span>Google Maps</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Place Name */}
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{attraction.name}</h2>

              {/* Metadata */}
              <div className="text-sm text-gray-600">
                {attraction.types && attraction.types[0] && (
                  <>
                    <span className="capitalize">{attraction.types[0].replace(/_/g, " ")}</span>
                    {attraction.priceLevel && <span> • {"$".repeat(attraction.priceLevel)}</span>}
                  </>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => {
                    if (i < fullStars) {
                      return <span key={i}>★</span>;
                    }
                    if (i === fullStars && hasHalfStar) {
                      return <span key={i}>☆</span>;
                    }
                    return (
                      <span key={i} className="text-gray-300">
                        ☆
                      </span>
                    );
                  })}
                </div>
                <span className="text-gray-700 font-medium">{rating.toFixed(1)}</span>
                {reviewCount > 0 && (
                  <span className="text-gray-500">
                    ({reviewCount.toLocaleString("pl-PL").replace(/,/g, " ")} reviews)
                  </span>
                )}
              </div>

              {/* Description */}
              {attraction.editorialSummary && (
                <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen} className="w-full">
                  <div className="text-sm text-gray-600">
                    {!isDescriptionOpen && (
                      <p className="line-clamp-3 leading-relaxed">{attraction.editorialSummary}</p>
                    )}
                    <CollapsibleContent>
                      <p className="leading-relaxed">{attraction.editorialSummary}</p>
                    </CollapsibleContent>
                    {attraction.editorialSummary.length > 150 && (
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-1 focus:outline-none">
                          {isDescriptionOpen ? (
                            <>
                              Show less <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </CollapsibleTrigger>
                    )}
                  </div>
                </Collapsible>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onAddToPlan(attraction.id)}
                  disabled={isAddedToPlan || isAddingToPlan}
                  className={`
                    flex-1 h-11 py-2.5 px-4 rounded-lg font-medium text-sm
                    transition-all flex items-center justify-center gap-2
                    ${
                      isAddedToPlan
                        ? "bg-green-50 text-green-700 cursor-default"
                        : isAddingToPlan
                          ? "bg-blue-50 text-blue-600 cursor-wait"
                          : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                    }
                  `}
                >
                  {isAddingToPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : isAddedToPlan ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added to Plan
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add to Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Score Badge - Outside overflow-hidden container so tooltip can overflow */}
          {score && score >= 70 && (
            <div className="absolute top-2 right-2 pointer-events-auto transition-all hover:scale-105">
              <ScoreBadge
                score={score}
                breakdown={breakdown}
                size="md"
                showTooltip={true}
                isAttraction={!!breakdown?.diversityScore}
              />
            </div>
          )}
        </div>

        {/* Photo Lightbox */}
        {photoReference && attraction.photos && attraction.photos.length > 0 && (
          <PhotoLightbox
            photos={attraction.photos}
            initialIndex={0}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            placeName={attraction.name}
            lat={attraction.location.lat}
            lng={attraction.location.lng}
            size="large"
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if attraction ID, isAddedToPlan, or position changes
    return (
      prevProps.attraction.id === nextProps.attraction.id &&
      prevProps.isAddedToPlan === nextProps.isAddedToPlan &&
      prevProps.isAddingToPlan === nextProps.isAddingToPlan &&
      prevProps.markerPosition.x === nextProps.markerPosition.x &&
      prevProps.markerPosition.y === nextProps.markerPosition.y
    );
  }
);
