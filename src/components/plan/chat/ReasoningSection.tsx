import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ReasoningSectionProps {
  reasoning: string;
}

/**
 * ReasoningSection - Collapsible reasoning display
 *
 * Features:
 * - Collapsed by default
 * - Toggle to show/hide
 * - Smooth animation
 * - Accessible with proper ARIA attributes
 */
export function ReasoningSection({ reasoning }: ReasoningSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasoning) return null;

  return (
    <div className="border-t pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground"
        aria-expanded={isExpanded}
        aria-label="Toggle reasoning"
      >
        <span className="font-medium">Why this place?</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="mt-2 text-sm text-muted-foreground">
          <p className="whitespace-pre-wrap">{reasoning}</p>
        </div>
      )}
    </div>
  );
}
