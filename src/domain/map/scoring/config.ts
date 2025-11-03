export const ATTRACTIONS_SCORING_CONFIG = {
  weights: {
    quality: 0.6,
    diversity: 0.25,
    confidence: 0.15,
  },
  explanations: {
    quality: {
      title: "Quality Score",
      weight: "60% weight",
      description: [
        "Based on rating and review count",
        "Higher ratings with more reviews score better",
        "Formula: rating (60%) + log₁₀(reviews) (40%)",
      ],
    },
    diversity: {
      title: "Diversity Score",
      weight: "25% weight",
      description: [
        "Rewards places with unique/rare types",
        "Based on rarest type the place has",
        "Adds variety to your recommendations",
      ],
    },
    confidence: {
      title: "Confidence Score",
      weight: "15% weight",
      description: [
        "Based on review volume reliability",
        "High confidence: >100 reviews",
        "Medium confidence: 20-100 reviews",
        "Low confidence: <20 reviews",
      ],
    },
  },
} as const;

export const RESTAURANTS_SCORING_CONFIG = {
  weights: {
    quality: 0.7,
    confidence: 0.3,
  },
  explanations: {
    quality: {
      title: "Quality Score",
      weight: "70% weight",
      description: [
        "Based on rating and review count",
        "Higher ratings with more reviews score better",
        "Formula: rating (60%) + log₁₀(reviews) (40%)",
      ],
    },
    confidence: {
      title: "Confidence Score",
      weight: "30% weight",
      description: [
        "Based on review volume reliability",
        "High confidence: >100 reviews",
        "Medium confidence: 20-100 reviews",
        "Low confidence: <20 reviews",
      ],
    },
  },
} as const;
