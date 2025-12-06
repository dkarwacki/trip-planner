import React, { useState, useRef, createRef } from "react";
import { Bot, ChevronDown } from "lucide-react";
import type { ChatMessage, PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import { PlaceSuggestionCard } from "./PlaceSuggestionCard";
import { NarrativeDisplay } from "./NarrativeDisplay";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AssistantMessageProps {
  message: ChatMessage;
  onAddPlace?: (place: PlaceSuggestion) => void;
  addedPlaceIds?: Set<string>;
  isFirstMessage?: boolean;
}

/**
 * AssistantMessage - Assistant message bubble
 *
 * Features:
 * - Left-aligned with avatar
 * - Place suggestion cards
 * - Timestamp display
 * - Thinking process display
 */
export function AssistantMessage({
  message,
  onAddPlace,
  addedPlaceIds = new Set(),
  isFirstMessage = false,
}: AssistantMessageProps) {
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const placeRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Create refs for each place suggestion for scroll-to functionality
  if (message.suggestedPlaces) {
    message.suggestedPlaces.forEach((place) => {
      const placeId = place.id || place.name;
      if (!placeRefs.current.has(placeId)) {
        placeRefs.current.set(placeId, createRef<HTMLDivElement>());
      }
    });
  }

  const handleAddPlace = async (place: PlaceSuggestion) => {
    if (!onAddPlace) return;

    const placeId = place.id || place.name;
    setAddingPlaceId(placeId);

    try {
      await onAddPlace(place);
    } finally {
      setAddingPlaceId(null);
    }
  };

  const handlePlaceClick = (placeId: string) => {
    const ref = placeRefs.current.get(placeId);
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      // Briefly highlight the card
      ref.current.classList.add("ring-2", "ring-primary");
      setTimeout(() => {
        ref.current?.classList.remove("ring-2", "ring-primary");
      }, 2000);
    }
  };

  return (
    <div className="flex gap-3" data-testid="assistant-message">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10" data-testid="assistant-avatar">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 space-y-3" data-testid="assistant-message-content">
        {/* Main message */}
        <div className="max-w-[90%] space-y-1">
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5" data-testid="assistant-message-bubble">
            <div data-testid="assistant-message-text">
              {message.suggestedPlaces && message.suggestedPlaces.length > 0 ? (
                <NarrativeDisplay
                  content={message.content}
                  suggestedPlaces={message.suggestedPlaces}
                  onPlaceClick={handlePlaceClick}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
              )}
            </div>

            {/* Thinking process (inline, collapsed by default) */}
            {message.thinking && message.thinking.length > 0 && (
              <Collapsible open={isThinkingExpanded} onOpenChange={setIsThinkingExpanded} className="mt-3" data-testid="reasoning-section">
                <div className="flex justify-end">
                  <CollapsibleTrigger className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors" data-testid="reasoning-toggle">
                    <span>reasoning</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isThinkingExpanded ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground/80" data-testid="reasoning-content">
                    {message.thinking.map((thought, idx) => (
                      <p key={idx} className="leading-relaxed">
                        • {thought}
                      </p>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
          <p className="px-1 text-xs text-muted-foreground" data-testid="assistant-message-timestamp">{timestamp}</p>
        </div>

        {/* Place suggestions */}
        {message.suggestedPlaces && message.suggestedPlaces.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" data-testid="place-suggestions-grid">
            {message.suggestedPlaces.map((place, idx) => {
              const placeId = place.id || place.name;
              return (
                <PlaceSuggestionCard
                  key={`${placeId}-${idx}`}
                  place={place}
                  onAdd={handleAddPlace}
                  isAdded={addedPlaceIds.has(placeId)}
                  isAdding={addingPlaceId === placeId}
                  scrollRef={placeRefs.current.get(placeId)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
