import React from "react";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Loader2, AlertCircle, Check } from "lucide-react";
import type { SaveStatus } from "../types";

interface PlanHeaderProps {
  saveStatus: SaveStatus;
  onRetrySync?: () => void;
  conversationId?: string | null;
}

export function PlanHeader({ saveStatus, onRetrySync, conversationId }: PlanHeaderProps) {
  const handleMapClick = () => {
    const url = conversationId 
      ? `/map-v2?conversationId=${conversationId}` 
      : '/map-v2';
    window.location.href = url;
  };

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-[110] relative">
      {/* Left: Branding */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Trip Planner</h1>
        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded">Plan</span>
      </div>

      {/* Right: Save Status & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {saveStatus === "saving" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveStatus === "saved" && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Check className="h-3.5 w-3.5" />
            <span>Saved</span>
          </div>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Error saving</span>
            {onRetrySync && (
              <button onClick={onRetrySync} className="underline hover:no-underline font-medium">
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Map Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMapClick}
          className="flex items-center gap-1.5"
        >
          <MapIcon className="h-4 w-4" />
          <span>Map</span>
        </Button>
      </div>
    </header>
  );
}

