import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";
import { ScoreExplanation } from "./ScoreExplanation";

interface ScoreBadgeProps {
  /** Total score (0-100) */
  score: number;
  /** Score breakdown */
  breakdown?: {
    qualityScore: number;
    personaScore?: number;
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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Show tooltip immediately, hide with delay
  const handleShow = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowBreakdown(true);
  };

  const handleHide = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setShowBreakdown(false);
      setShowExplanation(false);
    }, 300);
  };

  // Calculate tooltip position when shown
  useEffect(() => {
    if (showBreakdown && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8, // 8px below badge
        left: rect.left + rect.width / 2, // centered on badge
      });
    }
  }, [showBreakdown]);

  // Determine badge color and label based on score (0-100 scale)
  // With new weights, 70+ is great (requires persona match), 60+ is good
  const getScoreColor = (s: number) => {
    if (s >= 70) return { bg: "bg-green-600", text: "text-white", label: "Exceptional" };
    if (s >= 60) return { bg: "bg-blue-600", text: "text-white", label: "Recommended" };
    return { bg: "bg-gray-600", text: "text-white", label: "Good" };
  };

  const { bg, text, label } = getScoreColor(score);

  // Don't render if score is too low
  // With new weights (Quality 50%, Persona 10%, Diversity 20%, Confidence 20%),
  // places without persona match can only score max 70, so threshold lowered to 50
  if (score < 50) {
    return null;
  }

  // Detect if persona scoring was excluded based on breakdown structure
  const excludePersona = breakdown?.personaScore === undefined;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const formatScore = (s: number) => (s / 10).toFixed(1);

  const tooltipContent = showTooltip && showBreakdown && (
    <>
      {/* Transparent bridge to prevent tooltip from closing when moving mouse to it */}
      <div className="absolute left-0 top-full w-full h-2" onMouseEnter={handleShow} onMouseLeave={handleHide} />
      <div
        className="fixed w-64 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: "translateX(-50%)",
          zIndex: 9999,
        }}
        role="tooltip"
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
      >
        {showExplanation ? (
          <ScoreExplanation isAttraction={isAttraction} excludePersona={excludePersona} />
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

                {/* Persona */}
                {breakdown.personaScore !== undefined && isAttraction && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Persona:</span>
                    <span className="font-medium">{formatScore(breakdown.personaScore)}</span>
                  </div>
                )}

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
  );

  return (
    <div
      ref={badgeRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
    >
      {/* Badge */}
      <div
        className={`
          ${bg} ${text}
          ${sizeClasses[size]}
          inline-flex items-center gap-1 rounded-md
          font-bold shadow-md
        `}
        role="status"
        aria-label={`Score: ${formatScore(score)} - ${label}`}
      >
        {formatScore(score)}
      </div>

      {/* Tooltip rendered via portal */}
      {typeof document !== "undefined" && tooltipContent && createPortal(tooltipContent, document.body)}
    </div>
  );
}
