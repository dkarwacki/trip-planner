/**
 * Desktop header component
 * Displays branding, save status, and conversation link
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, AlertCircle, Check, Clock } from "lucide-react";
import type { SaveStatus } from "../types";
import { TripSelector } from "../shared/TripSelector";
import { useMapStore } from "../stores/mapStore";

interface DesktopHeaderProps {
  saveStatus: SaveStatus;
  onRetrySync?: () => void;
}

export function DesktopHeader({ saveStatus, onRetrySync }: DesktopHeaderProps) {
  const conversationId = useMapStore((state) => state.conversationId);
  const tripId = useMapStore((state) => state.tripId);
  const setConversationId = useMapStore((state) => state.setConversationId);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const handleConversationClick = async () => {
    if (conversationId) {
      // Conversation exists, redirect immediately
      window.location.href = `/plan-v2?conversationId=${conversationId}`;
      return;
    }

    // No conversation exists, create one
    if (!tripId) {
      console.error("No trip ID available");
      return;
    }

    setIsCreatingConversation(true);

    try {
      // Create new conversation
      const createResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Trip Planning Chat",
          personas: ["general_tourist"],
          initial_message: "Help me plan my trip",
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create conversation");
      }

      const conversation = await createResponse.json();
      const newConversationId = conversation.id;

      // Associate conversation with trip
      const updateResponse = await fetch(`/api/trips/${tripId}/conversation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: newConversationId }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to associate conversation with trip");
      }

      // Update store
      setConversationId(newConversationId);

      // Redirect to conversation
      window.location.href = `/plan-v2?conversationId=${newConversationId}`;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      alert("Failed to open conversation. Please try again.");
    } finally {
      setIsCreatingConversation(false);
    }
  };
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
        {/* Conversation Button - Always visible */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleConversationClick}
          disabled={isCreatingConversation}
          className="flex items-center gap-1.5"
        >
          {isCreatingConversation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          <span>Chat</span>
        </Button>

        {/* Trip History Selector */}
        <TripSelector>
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Trips</span>
          </Button>
        </TripSelector>
      </div>
    </header>
  );
}
