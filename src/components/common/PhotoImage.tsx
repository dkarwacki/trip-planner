import { usePhoto } from "@/lib/common/use-photo";
import { Skeleton } from "@/components/ui/skeleton";

interface PhotoImageProps {
  photoReference: string;
  alt: string;
  maxWidth?: number;
  className?: string;
  onError?: () => void;
}

export default function PhotoImage({ photoReference, alt, maxWidth = 800, className, onError }: PhotoImageProps) {
  const { photoUrl, isLoading, error } = usePhoto(photoReference, maxWidth);

  if (isLoading) {
    return <Skeleton className={className} />;
  }

  if (error || !photoUrl) {
    // Hide the component if there's an error
    if (onError) {
      onError();
    }
    return null;
  }

  return (
    <img
      src={photoUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (onError) {
          onError();
        }
      }}
    />
  );
}

