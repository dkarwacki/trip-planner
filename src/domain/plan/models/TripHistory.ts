import { Brand } from "effect";
import type { Place } from "@/domain/common/models";

// Branded types
export type TripId = string & Brand.Brand<"TripId">;
export const TripId = Brand.nominal<TripId>();

export type TripTimestamp = number & Brand.Brand<"TripTimestamp">;
export const TripTimestamp = Brand.nominal<TripTimestamp>();

export interface SavedTrip {
  id: TripId;
  title: string;
  places: Place[];
  timestamp: TripTimestamp;
  placeCount: number;
}

export const createSavedTrip = (places: Place[]): SavedTrip => {
  const timestamp = TripTimestamp(Date.now());
  const title = formatTripTitle(timestamp);

  return {
    id: TripId(crypto.randomUUID()),
    title,
    places,
    timestamp,
    placeCount: places.length,
  };
};

export const formatTripTitle = (timestamp: TripTimestamp): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `Trip Plan - ${year}-${month}-${day} ${hours}:${minutes}`;
};

export const updateTripPlaces = (trip: SavedTrip, places: Place[]): SavedTrip => ({
  ...trip,
  places,
  placeCount: places.length,
});


