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
