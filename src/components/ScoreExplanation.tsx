import * as React from "react";
import { ATTRACTIONS_SCORING_CONFIG, RESTAURANTS_SCORING_CONFIG } from "@/domain/scoring";

interface ScoreExplanationProps {
  type: "attractions" | "restaurants";
}

export function ScoreExplanation({ type }: ScoreExplanationProps) {
  const config = type === "attractions" ? ATTRACTIONS_SCORING_CONFIG : RESTAURANTS_SCORING_CONFIG;
  const { explanations, weights } = config;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm">How Scores Are Calculated</h4>
      </div>

      <div className="space-y-2">
        <div>
          <p className="font-semibold mb-1">
            {explanations.quality.title} ({explanations.quality.weight})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {explanations.quality.description.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>

        {"diversity" in explanations && (
          <div>
            <p className="font-semibold mb-1">
              {explanations.diversity.title} ({explanations.diversity.weight})
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              {explanations.diversity.description.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="font-semibold mb-1">
            {explanations.locality.title} ({explanations.locality.weight})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {explanations.locality.description.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="pt-1 border-t border-border">
          <p className="text-muted-foreground italic">
            Overall Score = {Math.round(weights.quality * 100)}% Quality +{" "}
            {"diversity" in weights && `${Math.round(weights.diversity * 100)}% Diversity + `}
            {Math.round(weights.locality * 100)}% Locality
          </p>
        </div>
      </div>
    </div>
  );
}
