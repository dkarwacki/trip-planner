import { useState } from "react";
import { Info, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScoreExplanation } from "@/components/ScoreExplanation";

export type ScoreType = "attractions" | "restaurants";

interface ScoreBadgeProps {
  score: number;
  breakdown: {
    qualityScore: number;
    diversityScore: number;
    confidenceScore: number;
  };
  type: ScoreType;
}

export function ScoreBadge({ score, breakdown, type }: ScoreBadgeProps) {
  const [showExplanation, setShowExplanation] = useState(false);

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
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md cursor-help flex-shrink-0">
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
