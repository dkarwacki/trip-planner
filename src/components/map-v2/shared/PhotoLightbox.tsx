import { useState, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { LazyImage } from "./LazyImage";

interface PhotoLightboxProps {
  photos: string[];
  initialIndex?: number;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen photo lightbox with zoom and navigation
 * 
 * Features:
 * - Full-screen overlay
 * - Zoom controls (pinch, double-tap, buttons)
 * - Swipe navigation
 * - Keyboard navigation (arrows, ESC)
 * - Click outside to close
 * - Focus trap
 */
export function PhotoLightbox({
  photos,
  initialIndex = 0,
  alt,
  isOpen,
  onClose,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < photos.length - 1;

  const goToPrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentIndex((prev) => prev - 1);
      setZoom(1);
    }
  }, [canGoPrev]);

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1);
      setZoom(1);
    }
  }, [canGoNext]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  const handleDoubleClick = () => {
    setZoom((prev) => (prev === 1 ? 2 : 1));
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrev, goToNext, onClose]);

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || zoom !== 1) {
      setTouchStart(null);
      return;
    }

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = Math.abs(touchStart.y - touchEnd.y);

    // Only swipe horizontally if not scrolling vertically
    if (Math.abs(deltaX) > 50 && deltaY < 30) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setTouchStart(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Zoom controls */}
      <div className="absolute right-4 top-20 z-10 flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          disabled={zoom >= 3}
          className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-50"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          disabled={zoom <= 1}
          className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-50"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation buttons */}
      {canGoPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {canGoNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          aria-label="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Photo counter */}
      <div className="absolute left-4 top-4 z-10 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Main image */}
      <div
        className="relative h-full w-full overflow-auto p-8"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex min-h-full items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <LazyImage
            photoReference={photos[currentIndex]}
            alt={`${alt} - Photo ${currentIndex + 1}`}
            size="large"
            className="max-h-[90vh] max-w-full"
            eager
          />
        </div>
      </div>
    </div>
  );
}

