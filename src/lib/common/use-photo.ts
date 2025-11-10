import { useEffect, useState } from "react";
import { fetchPhoto } from "./photo-utils";

/**
 * Hook to load a photo from the backend proxy endpoint
 * @param photoReference - The Google Places photo reference
 * @param maxWidth - Maximum width of the photo (default: 800)
 * @returns Object with photo URL and loading state
 */
export const usePhoto = (photoReference: string | undefined, maxWidth = 800) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!photoReference) {
      setPhotoUrl(null);
      return;
    }

    let cancelled = false;

    const loadPhoto = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = await fetchPhoto(photoReference, maxWidth);
        if (!cancelled) {
          setPhotoUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load photo"));
          setIsLoading(false);
        }
      }
    };

    loadPhoto();

    // Cleanup: revoke the object URL to prevent memory leaks
    return () => {
      cancelled = true;
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoReference, maxWidth]);

  return { photoUrl, isLoading, error };
};
