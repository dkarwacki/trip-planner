// Persona-specific attraction types based on Google Maps Places API Table A
// https://developers.google.com/maps/documentation/places/web-service/place-types

// Valid Table A types only - these can be used in includedTypes for Nearby Search
// Reference: https://developers.google.com/maps/documentation/places/web-service/place-types
export const UNIVERSAL_ATTRACTION_TYPES = [
  "tourist_attraction",
  "museum",
  "art_gallery",
  "zoo",
  "aquarium",
  "amusement_park",
  "park",
  "beach",
  "national_park",
  "state_park",
  "monument",
  "historical_place",
  "cultural_landmark",
  "church",
  "hindu_temple",
  "mosque",
  "synagogue",
  "performing_arts_theater",
  "stadium",
  "library",
  "city_hall",
  "casino",
  "adventure_sports_center",
  "sculpture",
  "campground",
  "hiking_area",
  "botanical_garden",
] as const;

// Persona-specific types for scoring boost
// These types get a 1.3x scoring boost when they match the user's selected persona
export const PERSONA_FILTER_TYPES = {
  GENERAL_TOURIST: ["tourist_attraction", "museum", "park", "historical_landmark", "plaza", "visitor_center"],
  NATURE_LOVER: ["national_park", "state_park", "hiking_area", "botanical_garden", "wildlife_park", "wildlife_refuge"],
  ART_ENTHUSIAST: [
    "art_gallery",
    "museum",
    "sculpture",
    "performing_arts_theater",
    "opera_house",
    "philharmonic_hall",
    "cultural_landmark",
    "historical_place",
  ],
  FOODIE_TRAVELER: [
    "restaurant",
    "cafe",
    "coffee_shop",
    "fine_dining_restaurant",
    "food_court",
    "pub",
    "wine_bar",
    "bakery",
  ],
  ADVENTURE_SEEKER: [
    "adventure_sports_center",
    "amusement_park",
    "hiking_area",
    "off_roading_area",
    "roller_coaster",
    "water_park",
    "ski_resort",
    "national_park",
  ],
  DIGITAL_NOMAD: ["cafe", "coffee_shop", "internet_cafe", "library", "hotel", "hostel", "guest_house"],
  HISTORY_BUFF: ["historical_place", "historical_landmark", "monument", "museum", "cultural_landmark"],
  PHOTOGRAPHY_ENTHUSIAST: [
    "observation_deck",
    "garden",
    "plaza",
    "beach",
    "art_gallery",
    "sculpture",
    "historical_landmark",
    "wildlife_park",
    "wildlife_refuge",
    "botanical_garden",
  ],
} as const;

// Legacy exports for backward compatibility (deprecated - use PERSONA_FILTER_TYPES instead)
export const GENERAL_TOURIST_TYPES = PERSONA_FILTER_TYPES.GENERAL_TOURIST;
export const NATURE_LOVER_TYPES = PERSONA_FILTER_TYPES.NATURE_LOVER;
export const ART_ENTHUSIAST_TYPES = PERSONA_FILTER_TYPES.ART_ENTHUSIAST;
export const FOODIE_TRAVELER_TYPES = ["restaurant", "cafe", "bar", "bakery"] as const;
export const ADVENTURE_SEEKER_TYPES = PERSONA_FILTER_TYPES.ADVENTURE_SEEKER;
export const DIGITAL_NOMAD_TYPES = PERSONA_FILTER_TYPES.DIGITAL_NOMAD;
export const HISTORY_BUFF_TYPES = PERSONA_FILTER_TYPES.HISTORY_BUFF;
export const PHOTOGRAPHY_ENTHUSIAST_TYPES = PERSONA_FILTER_TYPES.PHOTOGRAPHY_ENTHUSIAST;

// Union of all persona types for general attraction searches (deprecated - use UNIVERSAL_ATTRACTION_TYPES instead)
export const ATTRACTION_TYPES = UNIVERSAL_ATTRACTION_TYPES;

export const RESTAURANT_TYPES = ["restaurant", "cafe", "bar", "bakery"] as const;

// Place types to block from general attraction suggestions
// These are typically services, accommodations, or non-tourist-oriented businesses
export const BLOCKED_PLACE_TYPES = new Set([
  // Automotive
  "car_repair",
  "car_dealer",
  "car_wash",
  "car_rental",
  "gas_station",
  // Shopping (non-tourist markets)
  "store",
  "shopping_mall",
  "convenience_store",
  "supermarket",
  "department_store",
  "clothing_store",
  "shoe_store",
  "electronics_store",
  "furniture_store",
  "hardware_store",
  "home_goods_store",
  "jewelry_store",
  "pet_store",
  // Services
  "electrician",
  "plumber",
  "locksmith",
  "painter",
  "roofing_contractor",
  "lawyer",
  "real_estate_agency",
  "insurance_agency",
  "accounting",
  "travel_agency",
  "moving_company",
  "courier_service",
  // Financial
  "atm",
  "bank",
  // Health
  "dentist",
  "doctor",
  "hospital",
  "pharmacy",
  "veterinary_care",
  // Personal care
  "hair_care",
  "beauty_salon",
  "spa",
  "gym",
  // Utilities
  "laundry",
  "post_office",
  "storage",
  // Lodging (handled separately in trip planning)
  "lodging",
  "hotel",
  "motel",
  "hostel",
  "resort_hotel",
  "bed_and_breakfast",
  "guest_house",
  "rv_park",
  // Food/Drink (handled separately as restaurants)
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "food",
  "night_club",
]);
