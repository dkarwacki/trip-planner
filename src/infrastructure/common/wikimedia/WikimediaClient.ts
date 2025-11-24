import { Effect, Context, Layer } from "effect";
import type { PlacePhoto } from "@/domain/common/models";
import { WikimediaAPIError, NoWikimediaPhotosFoundError } from "@/domain/common/errors";
import { WikimediaGeosearchResponseSchema } from "./schemas";

export interface IWikimediaClient {
  readonly searchPhotosByLocation: (
    lat: number,
    lng: number,
    radius: number,
    placeName?: string
  ) => Effect.Effect<PlacePhoto[], WikimediaAPIError | NoWikimediaPhotosFoundError>;
}

export class WikimediaClient extends Context.Tag("WikimediaClient")<WikimediaClient, IWikimediaClient>() {}

export const WikimediaClientLive = Layer.succeed(
  WikimediaClient,
  WikimediaClient.of({
    searchPhotosByLocation: (lat: number, lng: number, radius: number, placeName?: string) =>
      Effect.gen(function* () {
        yield* Effect.logDebug("Searching Wikimedia photos", {
          lat,
          lng,
          radius,
          placeName,
        });

        // Validate radius bounds (10-10000 meters as per Wikimedia API)
        const validRadius = Math.max(10, Math.min(10000, radius));

        // Build API URL
        const params = new URLSearchParams({
          action: "query",
          generator: "geosearch",
          ggscoord: `${lat}|${lng}`,
          ggsradius: validRadius.toString(),
          ggsnamespace: "6", // File namespace
          ggslimit: "10", // Get up to 10 results
          prop: "imageinfo",
          iiprop: "url|size|extmetadata",
          format: "json",
          origin: "*", // CORS header
        });

        const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;

        // Fetch from Wikimedia API
        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new WikimediaAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        if (!response.ok) {
          return yield* Effect.fail(
            new WikimediaAPIError(`Failed to fetch from Wikimedia: ${response.status} ${response.statusText}`)
          );
        }

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new WikimediaAPIError("Failed to parse JSON response"),
        });

        // Validate response with Zod
        const parseResult = WikimediaGeosearchResponseSchema.safeParse(json);

        if (!parseResult.success) {
          yield* Effect.logWarning("Wikimedia API response validation failed", {
            error: parseResult.error,
            json,
          });
          return yield* Effect.fail(new WikimediaAPIError(`Invalid API response: ${parseResult.error.message}`));
        }

        const data = parseResult.data;

        // Check if we have results
        if (!data.query?.pages) {
          return yield* Effect.fail(new NoWikimediaPhotosFoundError(lat, lng, validRadius));
        }

        // Extract photos from pages
        const photos: PlacePhoto[] = [];

        for (const page of Object.values(data.query.pages)) {
          // Skip pages without image info
          if (!page.imageinfo || page.imageinfo.length === 0) {
            continue;
          }

          // Filter by place name if provided (case-insensitive match in title)
          if (placeName) {
            const titleLower = page.title.toLowerCase();
            const placeNameLower = placeName.toLowerCase();
            // Skip if title doesn't contain place name
            if (!titleLower.includes(placeNameLower)) {
              continue;
            }
          }

          const imageInfo = page.imageinfo[0];

          // Extract attribution from metadata
          const attributions: string[] = [];
          if (imageInfo.extmetadata) {
            const metadata = imageInfo.extmetadata;

            // Add artist/author
            if (metadata.Artist?.value) {
              // Strip HTML tags from artist name
              const artist = metadata.Artist.value.replace(/<[^>]*>/g, "");
              attributions.push(`Artist: ${artist}`);
            }

            // Add license
            if (metadata.LicenseShortName?.value) {
              attributions.push(`License: ${metadata.LicenseShortName.value}`);
            }

            // Add credit if available
            if (metadata.Credit?.value) {
              const credit = metadata.Credit.value.replace(/<[^>]*>/g, "");
              attributions.push(`Credit: ${credit}`);
            }
          }

          // Add Wikimedia Commons link as attribution
          if (imageInfo.descriptionurl) {
            attributions.push(`Source: ${imageInfo.descriptionurl}`);
          }

          photos.push({
            photoReference: imageInfo.url, // Use full URL as reference
            width: imageInfo.width,
            height: imageInfo.height,
            attributions,
          });
        }

        // Check if we found any photos after filtering
        if (photos.length === 0) {
          return yield* Effect.fail(new NoWikimediaPhotosFoundError(lat, lng, validRadius));
        }

        yield* Effect.logDebug("Found Wikimedia photos", {
          count: photos.length,
          lat,
          lng,
          radius: validRadius,
        });

        return photos;
      }),
  })
);
