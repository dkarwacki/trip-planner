import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Send,
  Bot,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  SquarePen,
  MapPin,
  TreePine,
  Palette,
  Utensils,
  Mountain,
  Laptop,
  Landmark,
  Camera,
} from "lucide-react";
import type { ChatMessage, PersonaType, ConversationId } from "@/domain/plan/models";
import { getPersonaMetadata } from "@/domain/plan/models";
import type { Place } from "@/domain/common/models";
import { createUserMessage, createAssistantMessage } from "@/domain/plan/models/ChatMessage";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import PlaceSuggestionItem from "@/components/map/PlaceSuggestionItem";
import NarrativeDisplay from "./NarrativeDisplay";
import PersonaSelector from "./PersonaSelector";

interface ChatInterfaceProps {
  personas: PersonaType[];
  itinerary: Place[];
  onAddPlace: (place: Place) => void;
  onRemovePlace: (placeId: string) => void;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onNewConversation?: () => void;
  currentConversationId?: ConversationId | null;
  onPersonasChange?: (personas: PersonaType[]) => void;
}

export default function ChatInterface({
  personas,
  itinerary,
  onAddPlace,
  initialMessages = [],
  onMessagesChange,
  onNewConversation,
  currentConversationId,
  onPersonasChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validatingPlaces, setValidatingPlaces] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const personaContainerRef = useRef<HTMLDivElement>(null);
  const [visiblePersonaCount, setVisiblePersonaCount] = useState(2);

  // Load initial messages when they change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Calculate how many persona badges can fit in the container
  useEffect(() => {
    if (!onPersonasChange || !personaContainerRef.current || personas.length === 0) {
      setVisiblePersonaCount(0);
      return;
    }

    const calculateVisibleCount = () => {
      const container = personaContainerRef.current;
      if (!container) return;

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        const containerWidth = container.offsetWidth;
        const gap = 8; // gap-2 = 8px
        const moreTextWidth = 75; // Approximate width for "+X more" text with buffer
        const availableWidth = containerWidth - gap;

        // First, try to fit all badges without "+X more"
        let allFitWidth = 0;
        for (const personaType of personas) {
          const personaMetadata = getPersonaMetadata(personaType);
          if (!personaMetadata) continue;

          const textWidth = personaMetadata.label.length * 6;
          const estimatedBadgeWidth = 12 + textWidth + 12 + gap;
          allFitWidth += estimatedBadgeWidth;
        }

        // If all badges fit, show them all
        if (allFitWidth <= availableWidth) {
          setVisiblePersonaCount(personas.length);
          return;
        }

        // Otherwise, fit as many as possible while reserving space for "+X more"
        const reservedForMore = moreTextWidth + gap;
        let count = 0;
        let usedWidth = 0;

        for (let i = 0; i < personas.length; i++) {
          const personaMetadata = getPersonaMetadata(personas[i]);
          if (!personaMetadata) continue;

          const textWidth = personaMetadata.label.length * 6;
          const estimatedBadgeWidth = 12 + textWidth + 12 + gap;

          // Check if we can fit this badge plus "+X more" if it's not the last one
          const neededWidth = usedWidth + estimatedBadgeWidth + (i < personas.length - 1 ? reservedForMore : 0);

          if (neededWidth <= availableWidth) {
            usedWidth += estimatedBadgeWidth;
            count++;
          } else {
            break;
          }
        }

        setVisiblePersonaCount(count);
      });
    };

    // Initial calculation with a small delay to ensure container is rendered
    const timeoutId = setTimeout(calculateVisibleCount, 0);

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleCount();
    });

    if (personaContainerRef.current) {
      resizeObserver.observe(personaContainerRef.current);
    }

    window.addEventListener("resize", calculateVisibleCount);
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateVisibleCount);
    };
  }, [personas, onPersonasChange]);

  const isSuggestionInItinerary = (suggestion: { id?: string; name: string; lat?: number; lng?: number }): boolean => {
    return itinerary.some((place) => {
      // Match by ID (only if suggestion has an ID)
      if (suggestion.id && String(place.id) === String(suggestion.id)) {
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
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
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
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      // Notify parent about message changes
      onMessagesChange?.(updatedMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = createAssistantMessage("I'm having trouble processing your request. Please try again.");
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      onMessagesChange?.(updatedMessages);
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
      if (
        suggestion.lat !== undefined &&
        suggestion.lng !== undefined &&
        suggestion.id &&
        suggestion.id.startsWith("ChIJ")
      ) {
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

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "map-pin":
        return MapPin;
      case "tree-pine":
        return TreePine;
      case "palette":
        return Palette;
      case "utensils":
        return Utensils;
      case "mountain":
        return Mountain;
      case "laptop":
        return Laptop;
      case "landmark":
        return Landmark;
      case "camera":
        return Camera;
      default:
        return MapPin;
    }
  };

  // Calculate visible personas based on available space
  const visiblePersonas = personas.slice(0, visiblePersonaCount);
  const remainingCount = Math.max(0, personas.length - visiblePersonaCount);

  return (
    <Card className="h-full w-full flex flex-col min-h-0 overflow-hidden mb-16 sm:mb-0">
      <CardHeader className="border-b flex-shrink-0 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5" />
            Travel Assistant
            {currentConversationId && (
              <span className="text-xs text-muted-foreground font-normal ml-2">(Saved conversation)</span>
            )}
          </CardTitle>
          {onNewConversation && (
            <Button variant="outline" size="sm" onClick={onNewConversation} className="gap-1.5">
              <SquarePen className="h-4 w-4" />
              New Chat
            </Button>
          )}
        </div>
        {onPersonasChange && (
          <Popover>
            <PopoverTrigger asChild>
              <div
                ref={personaContainerRef}
                className="flex items-center gap-2 flex-nowrap overflow-hidden w-full cursor-pointer sm:hidden"
              >
                {visiblePersonas.map((personaType) => {
                  const personaMetadata = getPersonaMetadata(personaType);
                  if (!personaMetadata) return null;
                  const Icon = getIconComponent(personaMetadata.icon);
                  return (
                    <Badge
                      key={personaType}
                      variant="secondary"
                      className="px-1.5 py-0.5 text-xs flex-shrink-0 whitespace-nowrap"
                    >
                      <Icon className="h-3 w-3" />
                      {personaMetadata.label}
                    </Badge>
                  );
                })}
                {remainingCount > 0 && (
                  <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                    +{remainingCount} more
                  </span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <PersonaSelector selected={personas} onChange={onPersonasChange} />
            </PopoverContent>
          </Popover>
        )}
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

          {messages.map((message, messageIndex) => {
            // Collect all places from messages up to and including this one
            const allPlacesUpToThisMessage = messages
              .slice(0, messageIndex + 1)
              .flatMap((m) => m.suggestedPlaces || [])
              .filter((place, index, self) => index === self.findIndex((p) => p.id === place.id));

            return (
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
                      <NarrativeDisplay content={message.content} places={allPlacesUpToThisMessage} />
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
                      {message.suggestedPlaces.map((suggestion, idx) => (
                        <PlaceSuggestionItem
                          key={suggestion.id || `suggestion-${idx}`}
                          suggestion={suggestion}
                          isAdded={isSuggestionInItinerary(suggestion)}
                          isValidating={suggestion.id ? validatingPlaces.has(suggestion.id) : false}
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
            );
          })}

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
