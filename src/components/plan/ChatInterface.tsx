import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Bot, User as UserIcon, ChevronDown, ChevronRight } from "lucide-react";
import type { ChatMessage, PersonaType } from "@/domain/plan/models";
import type { Place } from "@/domain/common/models";
import { createUserMessage, createAssistantMessage } from "@/domain/plan/models/ChatMessage";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import PlaceSuggestionItem from "@/components/map/PlaceSuggestionItem";
import NarrativeDisplay from "./NarrativeDisplay";

interface ChatInterfaceProps {
  personas: PersonaType[];
  itinerary: Place[];
  onAddPlace: (place: Place) => void;
  onRemovePlace: (placeId: string) => void;
}

export default function ChatInterface({ personas, itinerary, onAddPlace }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validatingPlaces, setValidatingPlaces] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isSuggestionInItinerary = (suggestion: { id: string; name: string; lat?: number; lng?: number }): boolean => {
    return itinerary.some((place) => {
      // Match by ID
      if (String(place.id) === String(suggestion.id)) {
        return true;
      }

      // Match by name (case-insensitive)
      if (place.name.toLowerCase() === suggestion.name.toLowerCase()) {
        return true;
      }

      // Match by coordinates if both have them
      if (suggestion.lat !== undefined && suggestion.lng !== undefined) {
        const placeLat = Number(place.lat);
        const placeLng = Number(place.lng);
        const latDiff = Math.abs(placeLat - suggestion.lat);
        const lngDiff = Math.abs(placeLng - suggestion.lng);

        if (latDiff < 0.0001 && lngDiff < 0.0001) {
          return true;
        }
      }

      return false;
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = createUserMessage(inputValue);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputValue,
          personas,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const assistantMessage = createAssistantMessage(data.message, data.suggestedPlaces, data.thinking);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = createAssistantMessage("I'm having trouble processing your request. Please try again.");
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlace = async (suggestionId: string) => {
    // Find the suggestion
    const suggestion = messages.flatMap((m) => m.suggestedPlaces || []).find((s) => s.id === suggestionId);

    if (!suggestion) {
      return;
    }

    // Check if suggestion is already in itinerary
    if (isSuggestionInItinerary(suggestion)) {
      return;
    }

    setValidatingPlaces((prev) => new Set(prev).add(suggestionId));

    try {
      let place: Place;

      // If suggestion already has coordinates and a valid Google Place ID, use it directly
      // (This means it was successfully resolved during the AI response photo fetch)
      if (suggestion.lat !== undefined && suggestion.lng !== undefined && suggestion.id.startsWith("ChIJ")) {
        place = {
          id: PlaceId(suggestion.id),
          name: suggestion.name,
          lat: Latitude(suggestion.lat),
          lng: Longitude(suggestion.lng),
          plannedAttractions: [],
          plannedRestaurants: [],
        };
      } else {
        const response = await fetch("/api/places/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: suggestion.name }),
        });

        if (!response.ok) {
          throw new Error("Failed to validate place");
        }

        const data = await response.json();

        // Check if the response has the expected structure
        if (!data.place || !data.place.id) {
          throw new Error("Invalid place data received from API");
        }

        place = {
          id: PlaceId(data.place.id),
          name: data.place.name,
          lat: Latitude(data.place.lat),
          lng: Longitude(data.place.lng),
          plannedAttractions: [],
          plannedRestaurants: [],
        };
      }

      // Double-check after getting place data (in case place ID already exists)
      const alreadyExists = itinerary.some((p) => String(p.id) === String(place.id));
      if (!alreadyExists) {
        onAddPlace(place);
      }
    } catch (error) {
      console.error("Error validating place:", error);
      alert(`Failed to add "${suggestion.name}". Please try a different name or check if the place exists.`);
    } finally {
      setValidatingPlaces((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full w-full flex flex-col min-h-0 overflow-hidden mb-16 sm:mb-0">
      <CardHeader className="border-b flex-shrink-0 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5" />
          Travel Assistant
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0 p-4 w-full" ref={scrollRef}>
        <div className="space-y-4 w-full max-w-full">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">Ask me about places to visit!</p>
              <p className="text-xs mt-1">I&apos;ll suggest great starting points for your trip exploration.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 w-full max-w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}

              <div className={`flex-1 min-w-0 max-w-[85%] ${message.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block rounded-lg px-4 py-2 break-words ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                  style={{ overflowWrap: "anywhere", wordBreak: "break-word", maxWidth: "100%" }}
                >
                  {message.role === "assistant" && message.content.includes("**") ? (
                    <NarrativeDisplay content={message.content} places={message.suggestedPlaces} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>
                      {message.content}
                    </p>
                  )}
                </div>

                {message.role === "assistant" && message.thinking && message.thinking.length > 0 && (
                  <div className="mt-3 max-w-full">
                    <ThinkingSection thinking={message.thinking} />
                  </div>
                )}

                {message.suggestedPlaces && message.suggestedPlaces.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    {message.suggestedPlaces.map((suggestion) => (
                      <PlaceSuggestionItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        isAdded={isSuggestionInItinerary(suggestion)}
                        isValidating={validatingPlaces.has(suggestion.id)}
                        onAdd={handleAddPlace}
                      />
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardContent className="border-t p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about places to visit..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ThinkingSectionProps {
  thinking: string[];
}

function ThinkingSection({ thinking }: ThinkingSectionProps) {
  const [showThinking, setShowThinking] = useState(false);

  return (
    <Collapsible open={showThinking} onOpenChange={setShowThinking}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-gray-600">
          <span>View AI reasoning ({thinking.length} steps)</span>
          {showThinking ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-gray-50 rounded-lg p-4 mt-2 space-y-2">
          {thinking.map((thought: string, index: number) => (
            <div key={index} className="text-xs text-gray-600 flex gap-2">
              <span className="font-mono text-gray-400 flex-shrink-0">{index + 1}.</span>
              <span className="break-words overflow-wrap-anywhere" style={{ overflowWrap: "anywhere" }}>
                {thought}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
