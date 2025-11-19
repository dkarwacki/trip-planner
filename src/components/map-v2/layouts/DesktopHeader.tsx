/**
 * Desktop header component
 * Displays branding, save status, and optional conversation link
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, AlertCircle, Check, Clock } from "lucide-react";
import type { SaveStatus } from "../types";
import { TripSelector } from "../shared/TripSelector";

interface DesktopHeaderProps {
  conversationId?: string;
  saveStatus: SaveStatus;
  onRetrySync?: () => void;
}

export function DesktopHeader({ conversationId, saveStatus, onRetrySync }: DesktopHeaderProps) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-[110] relative">
      {/* Left: Branding */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Trip Planner</h1>
        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded">Map</span>
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
        {/* Trip History Selector */}
        <TripSelector>
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Trips</span>
          </Button>
        </TripSelector>

        {/* Conversation Link (if available) */}
        {conversationId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = `/plan-v2?conversationId=${conversationId}`)}
            className="flex items-center gap-1.5"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Back to Chat</span>
          </Button>
        )}
      </div>
    </header>
  );
}
