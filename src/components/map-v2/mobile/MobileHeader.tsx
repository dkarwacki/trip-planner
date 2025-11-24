/**
 * Mobile Header
 * Compact header with search icon and optional back button
 */

import React, { useState } from "react";
import { Search, ArrowLeft, Menu, Clock, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/common/utils";
import { TripSelector } from "../shared/TripSelector";
import { useMapStore } from "../stores/mapStore";

interface MobileHeaderProps {
  onSearchClick: () => void;
  onMenuClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backLabel?: string;
}

export function MobileHeader({
  onSearchClick,
  onMenuClick,
  showBackButton = false,
  onBackClick,
  backLabel = "Back to Planning",
}: MobileHeaderProps) {
  const conversationId = useMapStore((state) => state.conversationId);
  const tripId = useMapStore((state) => state.tripId);
  const setConversationId = useMapStore((state) => state.setConversationId);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const handleConversationClick = async () => {
    if (conversationId) {
      window.location.href = `/plan-v2?conversationId=${conversationId}`;
      return;
    }

    if (!tripId) {
      console.error("No trip ID available");
      return;
    }

    setIsCreatingConversation(true);

    try {
      const createResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Trip Planning Chat",
          personas: ["general_tourist"],
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create conversation");
      }

      const conversation = await createResponse.json();
      const newConversationId = conversation.id;

      const updateResponse = await fetch(`/api/trips/${tripId}/conversation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: newConversationId }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to associate conversation with trip");
      }

      setConversationId(newConversationId);
      window.location.href = `/plan-v2?conversationId=${newConversationId}`;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      alert("Failed to open conversation. Please try again.");
    } finally {
      setIsCreatingConversation(false);
    }
  };
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-12 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Menu or empty */}
        <div className="flex items-center">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className={cn(
                "rounded-lg p-2 text-gray-700 transition-colors",
                "hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Center - Search */}
        <button
          onClick={onSearchClick}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors",
            "hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          )}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
          <span className="text-sm font-medium">Search</span>
        </button>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {/* Conversation Button - Always visible */}
          <button
            onClick={handleConversationClick}
            disabled={isCreatingConversation}
            className={cn(
              "rounded-lg p-2 text-gray-700 transition-colors",
              "hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              "disabled:opacity-50"
            )}
            aria-label="Chat"
          >
            {isCreatingConversation ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
          </button>

          {/* Trip Selector */}
          <TripSelector>
            <button
              className={cn(
                "rounded-lg p-2 text-gray-700 transition-colors",
                "hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              aria-label="View trips"
            >
              <Clock className="h-5 w-5" />
            </button>
          </TripSelector>

          {/* Back Button (if shown) */}
          {showBackButton && onBackClick && (
            <button
              onClick={onBackClick}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-blue-600 transition-colors",
                "hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
