import type { Attraction } from "@/domain/map/models/Attraction";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";

/**
 * Create a test Attraction object with default values and optional overrides
 */
function create(overrides: Partial<Omit<Attraction, "id" | "location">> & { id?: string } = {}): Attraction {
  return {
    id: PlaceId(overrides.id || "test-place-id"),
    name: "Test Attraction",
    rating: 4.5,
    userRatingsTotal: 100,
    types: ["museum"],
    vicinity: "Test Location",
    location: { lat: Latitude(0), lng: Longitude(0) },
    ...overrides,
  } as Attraction;
}

/**
 * Create a high-quality attraction (5.0 rating, 10000 reviews)
 */
function createHighQuality(overrides: Partial<Omit<Attraction, "id" | "location">> & { id?: string } = {}): Attraction {
  return create({
    rating: 5.0,
    userRatingsTotal: 10000,
    ...overrides,
  });
}

/**
 * Create a low-quality attraction (3.0 rating, 10 reviews)
 */
function createLowQuality(overrides: Partial<Omit<Attraction, "id" | "location">> & { id?: string } = {}): Attraction {
  return create({
    rating: 3.0,
    userRatingsTotal: 10,
    ...overrides,
  });
}

/**
 * Create an attraction with specific review count (for confidence score testing)
 */
function withReviews(
  count: number,
  overrides: Partial<Omit<Attraction, "id" | "location">> & { id?: string } = {}
): Attraction {
  return create({
    userRatingsTotal: count,
    ...overrides,
  });
}

/**
 * Create an attraction with specific types (for persona/diversity testing)
 */
function withTypes(
  types: string[],
  overrides: Partial<Omit<Attraction, "id" | "location">> & { id?: string } = {}
): Attraction {
  return create({
    types,
    ...overrides,
  });
}

/**
 * Test fixtures for attraction scoring tests
 */
export const AttractionFixtures = {
  create,
  createHighQuality,
  createLowQuality,
  withReviews,
  withTypes,
};
