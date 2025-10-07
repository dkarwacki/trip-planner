import type { Attraction, AttractionScore } from "@/types";

export const ATTRACTIONS_SCORING_CONFIG = {
  weights: {
    quality: 0.4,
    diversity: 0.3,
    locality: 0.3,
  },
  explanations: {
    quality: {
      title: "Quality Score",
      weight: "40% weight",
      description: [
        "Based on rating and review count",
        "Higher ratings with more reviews score better",
        "Formula: rating × log₁₀(reviews + 1)",
      ],
    },
    diversity: {
      title: "Diversity Score",
      weight: "30% weight",
      description: [
        "Rewards unique place types",
        "Penalizes over-represented categories",
        "Boosts for art galleries, museums, parks, cafes",
      ],
    },
    locality: {
      title: "Locality Score",
      weight: "30% weight",
      description: [
        "Favors local gems over tourist traps",
        "Sweet spot: 500-5000 reviews",
        "Prefers moderate pricing ($ or $$)",
      ],
    },
  },
} as const;

export const RESTAURANTS_SCORING_CONFIG = {
  weights: {
    quality: 0.6,
    locality: 0.4,
  },
  explanations: {
    quality: {
      title: "Quality Score",
      weight: "60% weight",
      description: [
        "Based on rating and review count",
        "Higher ratings with more reviews score better",
        "Formula: rating × log₁₀(reviews + 1)",
      ],
    },
    locality: {
      title: "Locality Score",
      weight: "40% weight",
      description: [
        "Favors local gems over tourist traps",
        "Sweet spot: 500-5000 reviews",
        "Prefers moderate pricing ($ or $$)",
      ],
    },
  },
} as const;

const calculateQualityScore = (attraction: Attraction): number => {
  if (attraction.rating <= 0 || attraction.userRatingsTotal <= 0) return 0;

  const score = attraction.rating * Math.log10(attraction.userRatingsTotal + 1);

  return Math.min((score / 15) * 100, 100);
};

const calculateDiversityScore = (attraction: Attraction, typeFrequency: Map<string, number>): number => {
  const uniqueTypes = new Set([
    "art_gallery",
    "book_store",
    "park",
    "local_government_office",
    "museum",
    "library",
    "cafe",
  ]);

  let score = 50;

  const hasUniqueType = attraction.types.some((type) => uniqueTypes.has(type));
  if (hasUniqueType) score += 30;

  const maxFrequency = Math.max(...Array.from(typeFrequency.values()));
  const attractionMaxFreq = Math.max(...attraction.types.map((type) => typeFrequency.get(type) || 0));

  if (maxFrequency > 0) {
    const penalty = (attractionMaxFreq / maxFrequency) * 20;
    score -= penalty;
  }

  return Math.max(Math.min(score, 100), 0);
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
    const localityScore = calculateLocalityScore(attraction);

    const score =
      qualityScore * ATTRACTIONS_SCORING_CONFIG.weights.quality +
      diversityScore * ATTRACTIONS_SCORING_CONFIG.weights.diversity +
      localityScore * ATTRACTIONS_SCORING_CONFIG.weights.locality;

    return {
      attraction,
      score: Math.round(score * 10) / 10,
      breakdown: {
        qualityScore: Math.round(qualityScore * 10) / 10,
        diversityScore: Math.round(diversityScore * 10) / 10,
        localityScore: Math.round(localityScore * 10) / 10,
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
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
