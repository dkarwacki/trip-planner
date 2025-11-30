/**
 * Unified scoring utilities for places
 * Consolidates scoring logic into a single system with quality, diversity, confidence, and persona components
 */

export type ScoreLevel = "exceptional" | "excellent" | "good" | "hidden";

export interface ScoreBreakdown {
  total: number;
  quality: number;
  persona?: number;
  diversity?: number;
  confidence: number;
}

export interface ScoreColor {
  bg: string;
  text: string;
  border: string;
}

/**
 * Calculate unified place score (0-10)
 *
 * Components for attractions:
 * - Quality (50%): Based on rating and review volume
 * - Persona (10%): Match with user travel style (100 if match, 0 if not)
 * - Diversity (20%): Uniqueness of place types
 * - Confidence (20%): Based on review count
 *
 * Components for restaurants:
 * - Quality (70%): Based on rating and review volume
 * - Confidence (30%): Based on review count
 */
export function calculatePlaceScore(params: {
  rating: number;
  totalReviews: number;
  isDiverse?: boolean;
  personaMatch?: boolean; // true if matches persona
  isAttraction?: boolean;
}): ScoreBreakdown {
  const { rating, totalReviews, isDiverse = false, personaMatch = false, isAttraction = true } = params;

  // Quality score: Normalize rating (0-5) to 0-10
  const quality = (rating / 5) * 10;

  // Confidence: Based on review volume (logarithmic scale)
  const confidence = Math.min(10, Math.log10(totalReviews + 1) * 3);

  // Diversity score for attractions (0-10)
  const diversity = isAttraction && isDiverse ? 10.0 : isAttraction ? 0 : undefined;

  // Persona score for attractions (1.0 or 10.0, which is 10 or 100 on 0-100 scale)
  const persona = isAttraction ? (personaMatch ? 10.0 : 1.0) : undefined;

  // Calculate total with weighted average based on type
  let total: number;
  if (isAttraction) {
    // Attractions: Quality 50%, Persona 10%, Diversity 20%, Confidence 20%
    total = quality * 0.5 + (persona ?? 0) * 0.1 + (diversity ?? 0) * 0.2 + confidence * 0.2;
  } else {
    // Restaurants: Quality 70%, Confidence 30%
    total = quality * 0.7 + confidence * 0.3;
  }

  return {
    total: Math.round(total * 10) / 10, // Round to 1 decimal
    quality: Math.round(quality * 10) / 10,
    persona: persona !== undefined ? Math.round(persona * 10) / 10 : undefined,
    diversity: diversity !== undefined ? Math.round(diversity * 10) / 10 : undefined,
    confidence: Math.round(confidence * 10) / 10,
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
