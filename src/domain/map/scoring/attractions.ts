import type { Attraction, AttractionScore } from "@/domain/map/models";
import { ATTRACTIONS_SCORING_CONFIG } from "./config";
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

const calculateDiversityScore = (attraction: Attraction, typeFrequency: Map<string, number>): number => {
  const maxFrequency = Math.max(...Array.from(typeFrequency.values()));

  // Use minimum frequency to reward rare/unique types
  // This avoids penalizing places just because they have one common type
  const attractionMinFreq = Math.min(...attraction.types.map((type: string) => typeFrequency.get(type) || 0));

  if (maxFrequency === 0) return 100;

  // Higher score for attractions with rare types (low frequency)
  const score = 100 - (attractionMinFreq / maxFrequency) * 100;
  return Math.max(Math.min(score, 100), 0);
};

const calculateConfidenceScore = (attraction: Attraction): number => {
  if (!attraction.userRatingsTotal) return 40;
  if (attraction.userRatingsTotal > 100) return 100;
  if (attraction.userRatingsTotal > 20) return 70;
  return 40;
};

const calculatePersonaBoost = (
  attraction: Attraction,
  persona?: PersonaKey,
  personaFilterEnabled?: boolean
): number => {
  // Only apply boost if we have a persona and we're NOT in persona filter mode
  // In filter mode, results are already filtered, so no extra boost needed
  // In "all attractions" mode, boost helps preferred types rank higher
  if (!persona || personaFilterEnabled) {
    return 1.0; // No boost
  }

  const preferredTypes = PERSONA_FILTER_TYPES[persona] as readonly string[];
  const hasPreferredType = attraction.types.some((type: string) => (preferredTypes as string[]).includes(type));

  // 30% boost for matches in "all attractions" mode
  return hasPreferredType ? 1.3 : 1.0;
};

export const scoreAttractions = (
  attractions: Attraction[],
  persona?: PersonaKey,
  personaFilterEnabled?: boolean
): AttractionScore[] => {
  const typeFrequency = new Map<string, number>();
  attractions.forEach((attr) => {
    attr.types.forEach((type: string) => {
      typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1);
    });
  });

  const scored = attractions.map((attraction) => {
    const qualityScore = calculateQualityScore(attraction);
    const diversityScore = calculateDiversityScore(attraction, typeFrequency);
    const confidenceScore = calculateConfidenceScore(attraction);
    const personaBoost = calculatePersonaBoost(attraction, persona, personaFilterEnabled);

    const baseScore =
      qualityScore * ATTRACTIONS_SCORING_CONFIG.weights.quality +
      diversityScore * ATTRACTIONS_SCORING_CONFIG.weights.diversity +
      confidenceScore * ATTRACTIONS_SCORING_CONFIG.weights.confidence;

    // Apply persona boost to final score
    const score = baseScore * personaBoost;

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
