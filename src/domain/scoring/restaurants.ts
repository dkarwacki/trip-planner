import type { Attraction, AttractionScore } from "@/domain/models";
import { RESTAURANTS_SCORING_CONFIG } from "./config";

const calculateQualityScore = (attraction: Attraction): number => {
  if (attraction.rating <= 0 || attraction.userRatingsTotal <= 0) return 0;

  // Separate components: rating (60%) + reviews (40%)
  const ratingComponent = (attraction.rating / 5) * 60;
  const reviewComponent = (Math.log10(attraction.userRatingsTotal + 1) / 5) * 40;

  return Math.min(ratingComponent + reviewComponent, 100);
};

const calculateConfidenceScore = (attraction: Attraction): number => {
  if (attraction.userRatingsTotal > 100) return 100;
  if (attraction.userRatingsTotal > 20) return 70;
  return 40;
};

export const scoreRestaurants = (restaurants: Attraction[]): AttractionScore[] => {
  const scored = restaurants.map((restaurant) => {
    const qualityScore = calculateQualityScore(restaurant);
    const confidenceScore = calculateConfidenceScore(restaurant);

    const score =
      qualityScore * RESTAURANTS_SCORING_CONFIG.weights.quality +
      confidenceScore * RESTAURANTS_SCORING_CONFIG.weights.confidence;

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
