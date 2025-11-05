import type { Attraction, AttractionScore } from "@/domain/map/models";
import { RESTAURANTS_SCORING_CONFIG } from "./config";
import { PERSONA_FILTER_TYPES } from "@/infrastructure/common/google-maps/constants";

type PersonaKey = keyof typeof PERSONA_FILTER_TYPES;

const calculateQualityScore = (attraction: Attraction): number => {
  if (!attraction.rating || !attraction.userRatingsTotal || attraction.rating <= 0 || attraction.userRatingsTotal <= 0)
    return 0;

  // Separate components: rating (60%) + reviews (40%)
  const ratingComponent = (attraction.rating / 5) * 60;
  const reviewComponent = (Math.log10(attraction.userRatingsTotal + 1) / 5) * 40;

  return Math.min(ratingComponent + reviewComponent, 100);
};

const calculateConfidenceScore = (attraction: Attraction): number => {
  if (!attraction.userRatingsTotal) return 40;
  if (attraction.userRatingsTotal > 100) return 100;
  if (attraction.userRatingsTotal > 20) return 70;
  return 40;
};

const calculatePersonaBoost = (
  restaurant: Attraction,
  persona?: PersonaKey,
  personaFilterEnabled?: boolean
): number => {
  // For restaurants, only FOODIE_TRAVELER gets a small boost
  // But since all results are restaurants, the boost is minimal
  if (!persona || personaFilterEnabled || persona !== "FOODIE_TRAVELER") {
    return 1.0;
  }

  // Small 10% boost for foodies to slightly adjust ranking
  return 1.1;
};

export const scoreRestaurants = (
  restaurants: Attraction[],
  persona?: PersonaKey,
  personaFilterEnabled?: boolean
): AttractionScore[] => {
  const scored = restaurants.map((restaurant) => {
    const qualityScore = calculateQualityScore(restaurant);
    const confidenceScore = calculateConfidenceScore(restaurant);
    const personaBoost = calculatePersonaBoost(restaurant, persona, personaFilterEnabled);

    const baseScore =
      qualityScore * RESTAURANTS_SCORING_CONFIG.weights.quality +
      confidenceScore * RESTAURANTS_SCORING_CONFIG.weights.confidence;

    // Apply persona boost to final score
    const score = baseScore * personaBoost;

    return {
      attraction: restaurant,
      score: Math.round(score * 10) / 10,
      breakdown: {
        qualityScore: Math.round(qualityScore * 10) / 10,
        diversityScore: 0,
        confidenceScore: Math.round(confidenceScore * 10) / 10,
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
};
