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
  const qualityWeight = isAttraction ? "50%" : "70%";
  const personaWeight = "10%";
  const diversityWeight = "20%";
  const confidenceWeight = isAttraction ? "20%" : "30%";

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm">How Scores Are Calculated</h4>
      </div>

      <div className="space-y-2">
        {/* Quality Score */}
        <div>
          <p className="font-semibold mb-1">Quality Score ({qualityWeight} weight)</p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• Based on rating and review count</li>
            <li>• Higher ratings with more reviews score better</li>
            <li>• Formula: rating (60%) + log₁₀(reviews) (40%)</li>
          </ul>
        </div>

        {/* Persona Score (attractions only) */}
        {isAttraction && (
          <div>
            <p className="font-semibold mb-1">Persona Score ({personaWeight} weight)</p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• Matches your travel style preferences</li>
              <li>• 100 points if attraction matches your persona</li>
              <li>• 10 points if no match or no persona selected</li>
            </ul>
          </div>
        )}

        {/* Diversity Score (attractions only) */}
        {isAttraction && (
          <div>
            <p className="font-semibold mb-1">Diversity Score ({diversityWeight} weight)</p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• Rewards places with unique/rare types</li>
              <li>• Based on rarest type the place has</li>
              <li>• Adds variety to your recommendations</li>
            </ul>
          </div>
        )}

        {/* Confidence Score */}
        <div>
          <p className="font-semibold mb-1">Confidence Score ({confidenceWeight} weight)</p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• Based on review volume reliability</li>
            <li>• High confidence: &gt;100 reviews</li>
            <li>• Medium confidence: 20-100 reviews</li>
          </ul>
        </div>

        {/* Formula */}
        <div className="pt-1 border-t border-border">
          <p className="text-muted-foreground italic">
            Overall Score = {qualityWeight} Quality +{" "}
            {isAttraction && `${personaWeight} Persona + ${diversityWeight} Diversity + `}
            {confidenceWeight} Confidence
          </p>
        </div>
      </div>
    </div>
  );
}
