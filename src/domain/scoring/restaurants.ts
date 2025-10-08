import type { Attraction, AttractionScore } from "@/domain/models";
import { RESTAURANTS_SCORING_CONFIG } from "./config";

const calculateQualityScore = (attraction: Attraction): number => {
  if (attraction.rating <= 0 || attraction.userRatingsTotal <= 0) return 0;
  const score = attraction.rating * Math.log10(attraction.userRatingsTotal + 1);
  return Math.min((score / 15) * 100, 100);
};

const calculateLocalityScore = (attraction: Attraction): number => {
  let score = 50;

  if (attraction.userRatingsTotal >= 500 && attraction.userRatingsTotal <= 5000) {
    score += 25;
  } else if (attraction.userRatingsTotal > 50000) {
    score -= 20;
  }

  if (attraction.priceLevel === 1 || attraction.priceLevel === 2) {
    score += 15;
  } else if (attraction.priceLevel === 4) {
    score -= 10;
  }

  return Math.max(Math.min(score, 100), 0);
};

export const scoreRestaurants = (restaurants: Attraction[]): AttractionScore[] => {
  const scored = restaurants.map((restaurant) => {
    const qualityScore = calculateQualityScore(restaurant);
    const localityScore = calculateLocalityScore(restaurant);

    const score =
      qualityScore * RESTAURANTS_SCORING_CONFIG.weights.quality +
      localityScore * RESTAURANTS_SCORING_CONFIG.weights.locality;

    return {
      attraction: restaurant,
      score: Math.round(score * 10) / 10,
      breakdown: {
        qualityScore: Math.round(qualityScore * 10) / 10,
        diversityScore: 0,
        localityScore: Math.round(localityScore * 10) / 10,
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
};
