import { useState } from "react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { LazyImage } from "@/components/map-v2/shared/LazyImage";
import type { PlacePhoto } from "@/domain/common/models";
import { cn } from "@/lib/common/utils";

interface PhotoLightboxProps {
  photos: PlacePhoto[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  lat: number;
  lng: number;
  /** Size variant - map uses larger, plan uses default */
  size?: "default" | "large";
}

export default function PhotoLightbox({
  photos,
  initialIndex,
  isOpen,
  onClose,
  placeName,
  lat,
  lng,
  size = "default",
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const dialogSizeClass = size === "large" ? "max-w-[98vw] md:max-w-[90vw]" : "max-w-[95vw]";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* High z-index overlay to cover everything including ExpandedPlaceCard (z-100) */}
        <DialogPrimitive.Overlay
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[200] bg-black/80"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed top-[50%] left-[50%] z-[200] w-full translate-x-[-50%] translate-y-[-50%] shadow-lg duration-200",
            `${dialogSizeClass} max-h-[95vh] p-0 overflow-hidden bg-black/95 border-0`
          )}
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">
            {placeName} - Photo {currentIndex + 1} of {photos.length}
          </DialogTitle>
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
            aria-label="Close photo viewer"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Photo counter - only show when multiple photos */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}

          {/* Image - full viewport height minus padding */}
          <div className="w-full h-[95vh] flex items-center justify-center p-4">
            <LazyImage
              key={`${photos[currentIndex].photoReference}-${currentIndex}`}
              photoReference={photos[currentIndex].photoReference}
              alt={`${placeName} - view ${currentIndex + 1}`}
              lat={lat}
              lng={lng}
              placeName={placeName}
              size="large"
              className="w-full h-full object-contain"
              eager
            />
          </div>

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
