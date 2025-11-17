import { useState } from "react";
import {
  getScoreLevel,
  getScoreColors,
  getScoreLabel,
  formatScore,
  type ScoreBreakdown,
} from "@/lib/map-v2/scoreUtils";

interface ScoreBadgeProps {
  score: ScoreBreakdown;
  /** Show tooltip on hover (desktop only) */
  showTooltip?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Color-coded score badge with optional tooltip breakdown
 *
 * Colors:
 * - Green (9.0-10.0): "Exceptional" - Must-see
 * - Blue (8.0-8.9): "Excellent" - Highly recommended
 * - Gray (7.0-7.9): "Good" - Worth visiting
 * - Hidden (<7.0): Don't show
 */
export function ScoreBadge({ score, showTooltip = true, size = "md", className = "" }: ScoreBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const level = getScoreLevel(score.total);
  const colors = getScoreColors(level);
  const label = getScoreLabel(level);

  // Don't render if score is too low
  if (level === "hidden") {
    return null;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowBreakdown(true)}
      onMouseLeave={() => setShowBreakdown(false)}
    >
      {/* Badge */}
      <div
        className={`
          ${colors.bg} ${colors.text}
          ${sizeClasses[size]}
          inline-flex items-center gap-1 rounded border
          ${colors.border} bg-opacity-90 font-bold
          backdrop-blur-sm
        `}
        role="status"
        aria-label={`Score: ${formatScore(score.total)} - ${label}`}
      >
        {formatScore(score.total)}
      </div>

      {/* Tooltip (desktop only) */}
      {showTooltip && showBreakdown && (
        <div
          className="absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
          role="tooltip"
        >
          <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
            <span className="font-semibold">Score: {formatScore(score.total)}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}>{label}</span>
          </div>

          <div className="space-y-1.5">
            {/* Quality */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quality:</span>
              <span className="font-medium">{formatScore(score.quality)}</span>
            </div>

            {/* Diversity */}
            {score.diversity !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diversity:</span>
                <span className="font-medium">{formatScore(score.diversity)}</span>
              </div>
            )}

            {/* Confidence */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">{formatScore(score.confidence)}</span>
            </div>

            {/* Persona boost */}
            {score.personaBoost !== undefined && score.personaBoost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persona:</span>
                <span className="font-medium text-green-600">+{formatScore(score.personaBoost)}</span>
              </div>
            )}
          </div>

          <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground">
            Based on ratings, reviews, and uniqueness
          </div>
        </div>
      )}
    </div>
  );
}
