import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { ScoreExplanation } from "./ScoreExplanation";

interface ScoreBadgeProps {
  /** Total score (0-100) */
  score: number;
  /** Score breakdown */
  breakdown?: {
    qualityScore: number;
    diversityScore?: number;
    confidenceScore: number;
  };
  /** Show tooltip on hover (desktop only) */
  showTooltip?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Whether this is for an attraction (has diversity) or restaurant */
  isAttraction?: boolean;
}

/**
 * Color-coded score badge with optional tooltip breakdown
 *
 * Colors:
 * - Green (90-100): Exceptional scores
 * - Blue (70-89): Good scores
 * - Hidden (<70): Don't show
 */
export function ScoreBadge({
  score,
  breakdown,
  showTooltip = true,
  size = "md",
  className = "",
  isAttraction = true,
}: ScoreBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset explanation when breakdown is hidden
  const handleBreakdownChange = (show: boolean) => {
    setShowBreakdown(show);
    if (!show) {
      setShowExplanation(false);
    }
  };

  // Determine badge color and label based on score (0-100 scale)
  const getScoreColor = (s: number) => {
    if (s >= 90) return { bg: "bg-green-500", text: "text-white", border: "border-green-600", label: "Exceptional" };
    return { bg: "bg-blue-500", text: "text-white", border: "border-blue-600", label: "Recommended" };
  };

  const { bg, text, border, label } = getScoreColor(score);

  // Don't render if score is too low
  if (score < 70) {
    return null;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const formatScore = (s: number) => (s / 10).toFixed(1);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => handleBreakdownChange(true)}
      onMouseLeave={() => handleBreakdownChange(false)}
    >
      {/* Badge */}
      <div
        className={`
          ${bg} ${text}
          ${sizeClasses[size]}
          inline-flex items-center gap-1 rounded border
          ${border} bg-opacity-90 font-bold
          backdrop-blur-sm
        `}
        role="status"
        aria-label={`Score: ${formatScore(score)} - ${label}`}
      >
        {formatScore(score)}
      </div>

      {/* Tooltip (desktop only) */}
      {showTooltip && showBreakdown && (
        <>
          {/* Transparent bridge to prevent tooltip from closing when moving mouse to it */}
          <div
            className="absolute left-0 top-full w-full h-2"
            onMouseEnter={() => handleBreakdownChange(true)}
            onMouseLeave={() => handleBreakdownChange(false)}
          />
          <div
            className="absolute left-1/2 top-full z-[1001] mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
            role="tooltip"
            onMouseEnter={() => handleBreakdownChange(true)}
            onMouseLeave={() => handleBreakdownChange(false)}
          >
            {showExplanation ? (
              <ScoreExplanation isAttraction={isAttraction} />
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">Score: {formatScore(score)}</span>
                    <button
                      type="button"
                      onMouseEnter={() => setShowExplanation(true)}
                      onMouseLeave={() => setShowExplanation(false)}
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Show score calculation help"
                    >
                      <HelpCircle className="h-[14px] w-[14px]" />
                    </button>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${bg} ${text}`}>{label}</span>
                </div>

                {breakdown ? (
                  <div className="space-y-1.5">
                    {/* Quality */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quality:</span>
                      <span className="font-medium">
                        {breakdown.qualityScore !== undefined ? formatScore(breakdown.qualityScore) : "N/A"}
                      </span>
                    </div>

                    {/* Diversity */}
                    {breakdown.diversityScore !== undefined && isAttraction && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Diversity:</span>
                        <span className="font-medium">{formatScore(breakdown.diversityScore)}</span>
                      </div>
                    )}

                    {/* Confidence */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-medium">
                        {breakdown.confidenceScore !== undefined ? formatScore(breakdown.confidenceScore) : "N/A"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Breakdown not available</div>
                )}

                <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground">
                  Hover over the ? icon for details
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
