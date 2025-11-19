import { Effect } from "effect";
import { WikimediaClient } from "@/infrastructure/common/wikimedia";

export interface SearchWikimediaPhotosQuery {
  lat: number;
  lng: number;
  radius: number;
  placeName?: string;
}

/**
 * Use case: Search for photos from Wikimedia Commons near a location
 *
 * @param query - Search parameters (lat, lng, radius, optional placeName)
 * @returns PlacePhoto[] with Wikimedia Commons photos
 */
export const SearchWikimediaPhotos = (query: SearchWikimediaPhotosQuery) =>
  Effect.gen(function* () {
    yield* Effect.logDebug("Searching Wikimedia photos", query);

    const wikimediaClient = yield* WikimediaClient;

    const photos = yield* wikimediaClient.searchPhotosByLocation(query.lat, query.lng, query.radius, query.placeName);

    return photos;
  });
