import * as React from "react";
import {
  ATTRACTIONS_SCORING_CONFIG,
  RESTAURANTS_SCORING_CONFIG,
  getAttractionScoringWeights,
} from "@/domain/map/scoring";

interface ScoreExplanationProps {
  type: "attractions" | "restaurants";
  excludePersona?: boolean;
}

export function ScoreExplanation({ type, excludePersona = false }: ScoreExplanationProps) {
  const config = type === "attractions" ? ATTRACTIONS_SCORING_CONFIG : RESTAURANTS_SCORING_CONFIG;
  const weights = type === "attractions" ? getAttractionScoringWeights(excludePersona) : config.weights;
  const { explanations } = config;

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

        {type === "attractions" && !excludePersona && (
          <div>
            <p className="font-semibold mb-1">
              {explanations.persona.title} ({explanations.persona.weight})
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              {explanations.persona.description.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {type === "attractions" && (
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
            {explanations.confidence.title} ({explanations.confidence.weight})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {explanations.confidence.description.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="pt-1 border-t border-border">
          <p className="text-muted-foreground italic">
            Overall Score = {Math.round(weights.quality * 100)}% Quality +{" "}
            {"persona" in weights && weights.persona > 0 && `${Math.round(weights.persona * 100)}% Persona + `}
            {type === "attractions" && `${Math.round(weights.diversity * 100)}% Diversity + `}
            {Math.round(weights.confidence * 100)}% Confidence
          </p>
        </div>
      </div>
    </div>
  );
}
