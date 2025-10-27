import type { Attraction, AttractionScore } from "@/domain/models";
import { ATTRACTIONS_SCORING_CONFIG } from "./config";

const calculateQualityScore = (attraction: Attraction): number => {
  if (attraction.rating <= 0 || attraction.userRatingsTotal <= 0) return 0;
  const score = attraction.rating * Math.log10(attraction.userRatingsTotal + 1);
  return Math.min((score / 15) * 100, 100);
};

const calculateDiversityScore = (attraction: Attraction, typeFrequency: Map<string, number>): number => {
  const maxFrequency = Math.max(...Array.from(typeFrequency.values()));

  // Use minimum frequency to reward rare/unique types
  // This avoids penalizing places just because they have one common type
  const attractionMinFreq = Math.min(...attraction.types.map((type) => typeFrequency.get(type) || 0));

  if (maxFrequency === 0) return 100;

  // Higher score for attractions with rare types (low frequency)
  const score = 100 - (attractionMinFreq / maxFrequency) * 100;
  return Math.max(Math.min(score, 100), 0);
};

const calculateConfidenceScore = (attraction: Attraction): number => {
  if (attraction.userRatingsTotal > 100) return 100;
  if (attraction.userRatingsTotal > 20) return 70;
  return 40;
};

export const scoreAttractions = (attractions: Attraction[]): AttractionScore[] => {
  const typeFrequency = new Map<string, number>();
  attractions.forEach((attr) => {
    attr.types.forEach((type) => {
      typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1);
    });
  });

  const scored = attractions.map((attraction) => {
    const qualityScore = calculateQualityScore(attraction);
    const diversityScore = calculateDiversityScore(attraction, typeFrequency);
    const confidenceScore = calculateConfidenceScore(attraction);

    const score =
      qualityScore * ATTRACTIONS_SCORING_CONFIG.weights.quality +
      diversityScore * ATTRACTIONS_SCORING_CONFIG.weights.diversity +
      confidenceScore * ATTRACTIONS_SCORING_CONFIG.weights.confidence;

    return {
      attraction,
      score: Math.round(score * 10) / 10,
      breakdown: {
        qualityScore: Math.round(qualityScore * 10) / 10,
        diversityScore: Math.round(diversityScore * 10) / 10,
        confidenceScore: Math.round(confidenceScore * 10) / 10,
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
};
