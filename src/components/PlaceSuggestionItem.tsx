import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Check, Loader2 } from "lucide-react";
import type { PlaceSuggestion } from "@/domain/models";

interface PlaceSuggestionItemProps {
  suggestion: PlaceSuggestion;
  isAdded: boolean;
  isValidating: boolean;
  onAdd: (placeName: string) => void;
  onRemove: (placeName: string) => void;
}

export default function PlaceSuggestionItem({
  suggestion,
  isAdded,
  isValidating,
  onAdd,
  onRemove,
}: PlaceSuggestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleAdd = () => {
    if (isAdded) {
      // Don't allow removing from here - user should remove from itinerary panel
      return;
    }
    onAdd(suggestion.name);
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 overflow-hidden">
            <h4 className="font-medium text-gray-900 mb-1 truncate">{suggestion.name}</h4>
            <p className="text-sm text-gray-600 line-clamp-2 break-words">{suggestion.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdded && (
              <Badge variant="secondary" className="text-xs">
                <Check className="mr-1 h-3 w-3" />
                Added
              </Badge>
            )}
            <Button
              size="sm"
              variant={isAdded ? "outline" : "default"}
              onClick={handleToggleAdd}
              disabled={isValidating || isAdded}
              title={isAdded ? "This place is already in your itinerary" : undefined}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Validating
                </>
              ) : isAdded ? (
                "Added"
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              <span>{isExpanded ? "Hide details" : "Show details"}</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Why this place?</p>
              <p className="text-xs text-gray-600 break-words">{suggestion.reasoning}</p>
            </div>
            <p className="text-xs text-gray-500 italic">
              This place is selected as a starting point for discovering nearby attractions and restaurants on the map.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
