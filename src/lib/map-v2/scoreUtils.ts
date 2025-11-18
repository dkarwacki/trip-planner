/**
 * Unified scoring utilities for places
 * Consolidates scoring logic into a single system with quality, diversity, confidence, and persona components
 */

export type ScoreLevel = "exceptional" | "excellent" | "good" | "hidden";

export interface ScoreBreakdown {
  total: number;
  quality: number;
  diversity?: number;
  confidence: number;
  personaBoost?: number;
}

export interface ScoreColor {
  bg: string;
  text: string;
  border: string;
}

/**
 * Calculate unified place score (0-10)
 *
 * Components:
 * - Quality (60-70%): Based on rating and review volume
 * - Diversity (25% for attractions): Uniqueness boost
 * - Confidence (15-30%): Based on review count
 * - Persona boost (30%): Match with user travel style
 */
export function calculatePlaceScore(params: {
  rating: number;
  totalReviews: number;
  isDiverse?: boolean;
  personaMatch?: number; // 0-1
  isAttraction?: boolean;
}): ScoreBreakdown {
  const { rating, totalReviews, isDiverse = false, personaMatch = 0, isAttraction = true } = params;

  // Quality score: Normalize rating (0-5) to 0-10
  const quality = (rating / 5) * 10;

  // Confidence: Based on review volume (logarithmic scale)
  const confidence = Math.min(10, Math.log10(totalReviews + 1) * 3);

  // Diversity bonus for attractions
  const diversity = isAttraction && isDiverse ? 8.0 : undefined;

  // Persona boost
  const personaBoost = personaMatch > 0 ? personaMatch * 3 : undefined;

  // Calculate total with weighted average
  const qualityWeight = isAttraction && isDiverse ? 0.6 : 0.7;
  const diversityWeight = isAttraction && isDiverse ? 0.25 : 0;
  const confidenceWeight = isAttraction && isDiverse ? 0.15 : 0.3;

  let total = quality * qualityWeight + confidence * confidenceWeight;

  if (diversity !== undefined) {
    total += diversity * diversityWeight;
  }

  if (personaBoost !== undefined) {
    total = Math.min(10, total + personaBoost * 0.3);
  }

  return {
    total: Math.round(total * 10) / 10, // Round to 1 decimal
    quality: Math.round(quality * 10) / 10,
    diversity,
    confidence: Math.round(confidence * 10) / 10,
    personaBoost,
  };
}

/**
 * Get score level from numeric score
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 9.0) return "exceptional";
  if (score >= 8.0) return "excellent";
  if (score >= 7.0) return "good";
  return "hidden";
}

/**
 * Get color scheme for score level
 */
export function getScoreColors(level: ScoreLevel): ScoreColor {
  switch (level) {
    case "exceptional":
      return {
        bg: "bg-green-500",
        text: "text-white",
        border: "border-green-600",
      };
    case "excellent":
      return {
        bg: "bg-blue-500",
        text: "text-white",
        border: "border-blue-600",
      };
    case "good":
      return {
        bg: "bg-gray-500",
        text: "text-white",
        border: "border-gray-600",
      };
    case "hidden":
      return {
        bg: "bg-gray-300",
        text: "text-gray-700",
        border: "border-gray-400",
      };
  }
}

/**
 * Get label for score level
 */
export function getScoreLabel(level: ScoreLevel): string {
  switch (level) {
    case "exceptional":
      return "Exceptional";
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "hidden":
      return "Fair";
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}


