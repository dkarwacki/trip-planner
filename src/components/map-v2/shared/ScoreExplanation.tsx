import * as React from "react";

interface ScoreExplanationProps {
  /** Whether this is for an attraction (has diversity) or restaurant */
  isAttraction?: boolean;
}

/**
 * Displays detailed explanation of how the custom score is calculated
 *
 * Shows scoring components, weights, and calculation formula
 * Used in tooltip when hovering over the help icon in ScoreBadge
 */
export function ScoreExplanation({ isAttraction = true }: ScoreExplanationProps) {
  const qualityWeight = isAttraction ? "60%" : "70%";
  const diversityWeight = "25%";
  const confidenceWeight = isAttraction ? "15%" : "30%";
  const personaWeight = "up to +30%";

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm">How Scores Are Calculated</h4>
      </div>

      <div className="space-y-2">
        {/* Quality Score */}
        <div>
          <p className="font-semibold mb-1">
            Quality Score ({qualityWeight} weight)
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• Normalized rating from 0-10 scale</li>
            <li>• Higher ratings = better quality</li>
            <li>• Formula: (rating ÷ 5) × 10</li>
          </ul>
        </div>

        {/* Diversity Score (attractions only) */}
        {isAttraction && (
          <div>
            <p className="font-semibold mb-1">
              Diversity Score ({diversityWeight} weight)
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• Rewards unique/rare place types</li>
              <li>• Adds variety to recommendations</li>
              <li>• Score: 8.0 for diverse places</li>
            </ul>
          </div>
        )}

        {/* Confidence Score */}
        <div>
          <p className="font-semibold mb-1">
            Confidence Score ({confidenceWeight} weight)
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• Based on review volume</li>
            <li>• More reviews = higher confidence</li>
            <li>• Formula: min(10, log₁₀(reviews + 1) × 3)</li>
          </ul>
        </div>

        {/* Persona Boost */}
        <div>
          <p className="font-semibold mb-1">
            Persona Boost ({personaWeight} bonus)
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• Matches your travel style</li>
            <li>• AI-based personalization</li>
            <li>• Applied as final boost to total</li>
          </ul>
        </div>

        {/* Formula */}
        <div className="pt-1 border-t border-border">
          <p className="text-muted-foreground italic">
            Overall Score = {qualityWeight} Quality +{" "}
            {isAttraction && `${diversityWeight} Diversity + `}
            {confidenceWeight} Confidence{" "}
            {personaWeight && `+ ${personaWeight} Persona`}
          </p>
        </div>
      </div>
    </div>
  );
}










