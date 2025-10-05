import * as React from "react";
import { SCORING_CONFIG } from "@/lib/services/attractions/scoring";

export function ScoreExplanation() {
  const { quality, diversity, locality } = SCORING_CONFIG.explanations;
  const { weights } = SCORING_CONFIG;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm">How Scores Are Calculated</h4>
      </div>

      <div className="space-y-2">
        <div>
          <p className="font-semibold mb-1">
            {quality.title} ({quality.weight})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {quality.description.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-1">
            {diversity.title} ({diversity.weight})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {diversity.description.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-1">
            {locality.title} ({locality.weight})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {locality.description.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="pt-1 border-t border-border">
          <p className="text-muted-foreground italic">
            Overall Score = {Math.round(weights.quality * 100)}% Quality + {Math.round(weights.diversity * 100)}%
            Diversity + {Math.round(weights.locality * 100)}% Locality
          </p>
        </div>
      </div>
    </div>
  );
}
