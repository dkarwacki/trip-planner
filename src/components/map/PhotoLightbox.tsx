import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import PhotoImage from "@/components/common/PhotoImage";
import type { PlacePhoto } from "@/domain/common/models";

interface PhotoLightboxProps {
  photos: PlacePhoto[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
}

export default function PhotoLightbox({ photos, initialIndex, isOpen, onClose, placeName }: PhotoLightboxProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-0"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">
          {placeName} - Photo {currentIndex + 1} of {photos.length}
        </DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center">
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

          {/* Photo counter */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Image */}
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            <PhotoImage
              photoReference={photos[currentIndex].photoReference}
              alt={`${placeName} - view ${currentIndex + 1}`}
              maxWidth={1600}
              lat={photos[currentIndex].lat}
              lng={photos[currentIndex].lng}
              placeName={placeName}
              className="max-w-full max-h-full w-full object-contain"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
