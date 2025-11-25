import { useState } from "react";
import { Info, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScoreExplanation } from "@/components/map/ScoreExplanation";
import { HIGH_SCORE_THRESHOLD } from "@/domain/map/scoring";

export type ScoreType = "attractions" | "restaurants";

interface ScoreBadgeProps {
  score: number;
  breakdown: {
    qualityScore: number;
    personaScore: number;
    diversityScore: number;
    confidenceScore: number;
  };
  type: ScoreType;
}

export function ScoreBadge({ score, breakdown, type }: ScoreBadgeProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const isHighScore = score > HIGH_SCORE_THRESHOLD;

  return (
    <TooltipProvider disableHoverableContent={false}>
      <Tooltip
        delayDuration={300}
        onOpenChange={(open) => {
          if (!open) {
            setShowExplanation(false);
          }
        }}
      >
        <TooltipTrigger asChild>
          <div
            className={`relative flex items-center gap-1 px-2 py-1 rounded-md cursor-help flex-shrink-0 bg-primary/10 ${isHighScore ? "border border-amber-500" : ""}`}
          >
            {isHighScore && <span className="absolute -top-1.5 -right-1.5 text-[10px]">🏆</span>}
            <Info className="h-3 w-3 text-primary" />
            <span className="text-sm font-semibold text-primary">{score}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-64">
          {showExplanation ? (
            <ScoreExplanation type={type} />
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 mb-2">
                <p className="font-semibold text-sm">Score Breakdown</p>
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
              <div className="flex justify-between text-xs">
                <span>Quality Score:</span>
                <span className="font-medium">{breakdown.qualityScore}</span>
              </div>
              {type === "attractions" && (
                <div className="flex justify-between text-xs">
                  <span>Persona Score:</span>
                  <span className="font-medium">{breakdown.personaScore}</span>
                </div>
              )}
              {type === "attractions" && (
                <div className="flex justify-between text-xs">
                  <span>Diversity Score:</span>
                  <span className="font-medium">{breakdown.diversityScore}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span>Confidence Score:</span>
                <span className="font-medium">{breakdown.confidenceScore}</span>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
