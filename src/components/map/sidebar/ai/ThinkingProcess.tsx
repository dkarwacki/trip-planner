/**
 * Collapsible thinking process section
 * Shows AI's reasoning steps (optional)
 */

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ThinkingProcessProps {
  steps?: string[];
}

export function ThinkingProcess({ steps }: ThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const thinkingSteps = steps || [];

  // Don't render if there are no steps
  if (thinkingSteps.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-medium text-gray-700">How I chose these</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-200 space-y-2">
          {thinkingSteps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
              <p className="text-xs text-gray-700 flex-1">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
