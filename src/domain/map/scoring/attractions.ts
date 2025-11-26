import type { Attraction, AttractionScore } from "@/domain/map/models";
import { ATTRACTIONS_SCORING_CONFIG, getAttractionScoringWeights } from "./config";
import { PERSONA_FILTER_TYPES } from "@/infrastructure/common/google-maps/constants";
import type { PersonaType } from "@/domain/plan/models";
import { PERSONA_TYPES } from "@/domain/plan/models/Persona";
import { personaTypeToKey } from "./utils";

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

const calculatePersonaScore = (attraction: Attraction, persona?: PersonaType): number => {
  const personaKey = personaTypeToKey(persona);

  // If no persona or FOODIE_TRAVELER (restaurants have their own tab), return 10 (baseline)
  if (!personaKey || personaKey === "FOODIE_TRAVELER") {
    return 10;
  }

  const preferredTypes = PERSONA_FILTER_TYPES[personaKey] as readonly string[];
  const hasPreferredType = attraction.types.some((type: string) => (preferredTypes as string[]).includes(type));

  // 100 points for matches, 10 for non-matches
  return hasPreferredType ? 100 : 10;
};

const shouldExcludePersonaScoring = (personas: PersonaType[]): boolean => {
  return personas.includes(PERSONA_TYPES.GENERAL_TOURIST);
};

const calculateBestPersonaMatch = (attraction: Attraction, personas: PersonaType[]): number => {
  if (personas.length === 0) return 10;

  // Try each persona and return highest score
  const scores = personas.map((persona) => calculatePersonaScore(attraction, persona));

  return Math.max(...scores);
};

export const scoreAttractions = (attractions: Attraction[], personas: PersonaType[]): AttractionScore[] => {
  const typeFrequency = new Map<string, number>();
  attractions.forEach((attr) => {
    attr.types.forEach((type: string) => {
      typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1);
    });
  });

  const excludePersona = shouldExcludePersonaScoring(personas);
  const weights = getAttractionScoringWeights(excludePersona);

  const scored = attractions.map((attraction) => {
    const qualityScore = calculateQualityScore(attraction);
    const personaScore = excludePersona ? 0 : calculateBestPersonaMatch(attraction, personas);
    const diversityScore = calculateDiversityScore(attraction, typeFrequency);
    const confidenceScore = calculateConfidenceScore(attraction);

    const score =
      qualityScore * weights.quality +
      personaScore * weights.persona +
      diversityScore * weights.diversity +
      confidenceScore * weights.confidence;

    return {
      attraction,
      score: Math.round(score * 10) / 10,
      breakdown: excludePersona
        ? {
            qualityScore: Math.round(qualityScore * 10) / 10,
            // personaScore omitted entirely
            diversityScore: Math.round(diversityScore * 10) / 10,
            confidenceScore: Math.round(confidenceScore * 10) / 10,
          }
        : {
            qualityScore: Math.round(qualityScore * 10) / 10,
            personaScore: Math.round(personaScore * 10) / 10,
            diversityScore: Math.round(diversityScore * 10) / 10,
            confidenceScore: Math.round(confidenceScore * 10) / 10,
          },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
};
