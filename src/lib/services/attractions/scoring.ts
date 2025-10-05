import type { Attraction, AttractionScore } from "@/types";

/**
 * Calculate quality score (40% weight)
 * Rewards high ratings with substantial reviews
 */
const calculateQualityScore = (attraction: Attraction): number => {
  if (attraction.rating <= 0 || attraction.userRatingsTotal <= 0) return 0;

  // Formula: rating * log10(userRatingsTotal + 1)
  const score = attraction.rating * Math.log10(attraction.userRatingsTotal + 1);

  // Normalize to 0-100 scale (max expected ~15 for 5.0 rating * log10(100000))
  return Math.min((score / 15) * 100, 100);
};

/**
 * Calculate diversity score (30% weight)
 * Penalizes over-representation of common types
 */
const calculateDiversityScore = (attraction: Attraction, typeFrequency: Map<string, number>): number => {
  // Unique/local categories to boost
  const uniqueTypes = new Set([
    "art_gallery",
    "book_store",
    "park",
    "local_government_office",
    "museum",
    "library",
    "cafe",
  ]);

  let score = 50; // Base score

  // Boost for unique categories
  const hasUniqueType = attraction.types.some((type) => uniqueTypes.has(type));
  if (hasUniqueType) score += 30;

  // Penalize over-represented types
  const maxFrequency = Math.max(...Array.from(typeFrequency.values()));
  const attractionMaxFreq = Math.max(...attraction.types.map((type) => typeFrequency.get(type) || 0));

  if (maxFrequency > 0) {
    const penalty = (attractionMaxFreq / maxFrequency) * 20;
    score -= penalty;
  }

  return Math.max(Math.min(score, 100), 0);
};

/**
 * Calculate locality score (30% weight)
 * Favors local places over mega-tourist traps
 */
const calculateLocalityScore = (attraction: Attraction): number => {
  let score = 50; // Base score

  // Sweet spot: 500-5000 reviews (not mega-tourist traps)
  if (attraction.userRatingsTotal >= 500 && attraction.userRatingsTotal <= 5000) {
    score += 25;
  } else if (attraction.userRatingsTotal > 50000) {
    score -= 20; // Penalize mega-tourist traps
  }

  // Favor moderate prices (1-2) over expensive (3-4)
  if (attraction.priceLevel === 1 || attraction.priceLevel === 2) {
    score += 15;
  } else if (attraction.priceLevel === 4) {
    score -= 10;
  }

  return Math.max(Math.min(score, 100), 0);
};

/**
 * Score attractions using smart algorithm
 * Quality (40%) + Diversity (30%) + Locality (30%)
 *
 * This is a pure function with no side effects, making it easy to test and reuse
 */
export const scoreAttractions = (attractions: Attraction[]): AttractionScore[] => {
  // Build type frequency map
  const typeFrequency = new Map<string, number>();
  attractions.forEach((attr) => {
    attr.types.forEach((type) => {
      typeFrequency.set(type, (typeFrequency.get(type) || 0) + 1);
    });
  });

  // Score each attraction
  const scored = attractions.map((attraction) => {
    const qualityScore = calculateQualityScore(attraction);
    const diversityScore = calculateDiversityScore(attraction, typeFrequency);
    const localityScore = calculateLocalityScore(attraction);

    // Weighted sum: 40% quality, 30% diversity, 30% locality
    const score = qualityScore * 0.4 + diversityScore * 0.3 + localityScore * 0.3;

    return {
      attraction,
      score: Math.round(score * 10) / 10, // Round to 1 decimal
      breakdown: {
        qualityScore: Math.round(qualityScore * 10) / 10,
        diversityScore: Math.round(diversityScore * 10) / 10,
        localityScore: Math.round(localityScore * 10) / 10,
      },
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
};
