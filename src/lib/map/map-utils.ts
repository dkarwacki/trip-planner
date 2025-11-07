/**
 * Calculate distance between two geographic points in meters.
 * Uses Google Maps Geometry library's spherical distance calculation.
 *
 * @param point1 - First point with lat/lng
 * @param point2 - Second point with lat/lng
 * @returns Distance in meters, or 0 if geometry library is not loaded
 */
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  if (!google?.maps?.geometry?.spherical) {
    // eslint-disable-next-line no-console
    console.warn("Google Maps geometry library not loaded yet");
    return 0;
  }

  const latLng1 = new google.maps.LatLng(point1.lat, point1.lng);
  const latLng2 = new google.maps.LatLng(point2.lat, point2.lng);

  return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
};

/**
 * Minimum distance (in meters) user must pan before "Search this area" button appears.
 */
export const SEARCH_NEARBY_DISTANCE_THRESHOLD = 2000; // 2km

/**
 * Get Tailwind CSS classes for category badges based on place type.
 * Returns consistent color styling for background, text, and border in both light and dark modes.
 *
 * @param type - Google Places API type string (e.g., "museum", "restaurant", "park")
 * @returns Tailwind CSS classes for styling category badges
 */
export const getCategoryColor = (type: string): string => {
  const colors: Record<string, string> = {
    museum:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800",
    restaurant:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800",
    cafe: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    park: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    art_gallery: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-800",
    tourist_attraction:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    church:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
    place_of_worship:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
    point_of_interest:
      "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800",
    natural_feature:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    campground:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    hiking_area:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    beach: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
    forest: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    mountain:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    lake: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
    river: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
    waterfall: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
    zoo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    aquarium: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
    botanical_garden:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    nature_reserve:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    national_park:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    historical_site:
      "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700",
    monument:
      "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700",
    memorial:
      "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700",
    castle: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    palace: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    ruins: "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700",
    archaeological_site:
      "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700",
    historical_landmark:
      "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700",
    historical_place:
      "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700",
  };
  return (
    colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800"
  );
};
