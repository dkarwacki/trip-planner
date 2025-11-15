import { useState, useEffect, useCallback, useRef } from "react";
import { LazyImage } from "./LazyImage";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoCarouselProps {
  photos: string[];
  alt: string;
  className?: string;
  /** Enable infinite loop */
  loop?: boolean;
  /** Show navigation dots */
  showDots?: boolean;
  /** Show photo counter */
  showCounter?: boolean;
  /** Auto-advance interval in ms (0 to disable) */
  autoPlay?: number;
  /** Callback when photo changes */
  onChange?: (index: number) => void;
}

/**
 * Photo carousel with swipe support and keyboard navigation
 * 
 * Features:
 * - Swipe navigation on mobile
 * - Arrow buttons on desktop
 * - Keyboard navigation (arrow keys)
 * - Dot indicators
 * - Photo counter
 * - Auto-play support
 * - Infinite loop option
 */
export function PhotoCarousel({
  photos,
  alt,
  className = "",
  loop = false,
  showDots = true,
  showCounter = true,
  autoPlay = 0,
  onChange,
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const canGoPrev = loop || currentIndex > 0;
  const canGoNext = loop || currentIndex < photos.length - 1;

  const goToPrev = useCallback(() => {
    if (!canGoPrev) return;
    
    const newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onChange?.(newIndex);
  }, [currentIndex, photos.length, loop, canGoPrev, onChange]);

  const goToNext = useCallback(() => {
    if (!canGoNext) return;
    
    const newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onChange?.(newIndex);
  }, [currentIndex, photos.length, loop, canGoNext, onChange]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    onChange?.(index);
  }, [onChange]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Auto-play
  useEffect(() => {
    if (autoPlay <= 0) return;

    autoPlayRef.current = setInterval(() => {
      goToNext();
    }, autoPlay);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, goToNext]);

  if (photos.length === 0) {
    return null;
  }

  if (photos.length === 1) {
    return (
      <div className={className}>
        <LazyImage
          photoReference={photos[0]}
          alt={alt}
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main image */}
      <LazyImage
        photoReference={photos[currentIndex]}
        alt={`${alt} - Photo ${currentIndex + 1} of ${photos.length}`}
        className="h-full w-full"
        eager={currentIndex === 0}
      />

      {/* Navigation buttons (desktop) */}
      {canGoPrev && (
        <button
          onClick={goToPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {canGoNext && (
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100"
          aria-label="Next photo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Photo counter */}
      {showCounter && (
        <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Dot indicators */}
      {showDots && photos.length <= 10 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-4 bg-white"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Go to photo ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}

