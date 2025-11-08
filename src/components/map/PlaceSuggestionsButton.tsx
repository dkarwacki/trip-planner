import { useState, useCallback, useEffect, useRef } from "react";
import { Wand2, Loader2, X, ChevronDown, ChevronRight, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Place } from "@/domain/common/models";
import type { Attraction } from "@/domain/map/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import type { AgentResponse } from "@/application/map/attractions";
import PhotoImage from "@/components/common/PhotoImage";
import PhotoLightbox from "./PhotoLightbox";

interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface SuggestionGroup {
  userMessage: string | null; // null for initial suggestions
  suggestions: AgentResponse["suggestions"];
}

interface PlaceSuggestionsButtonProps {
  place: Place;
  disabled?: boolean;
  onPlaceUpdate?: (updatedPlace: Place) => void;
  onExpandRequest?: () => void;
  onAttractionAccepted?: (placeId: string, attraction: Attraction, type: "attraction" | "restaurant") => void;
  onHighlight?: () => void;
  mapCenter?: { lat: number; lng: number } | null;
}

export default function PlaceSuggestionsButton({
  place,
  disabled,
  onPlaceUpdate,
  onExpandRequest,
  onAttractionAccepted,
  onHighlight,
  mapCenter,
}: PlaceSuggestionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionGroups, setSuggestionGroups] = useState<SuggestionGroup[]>([]);
  const [latestSummary, setLatestSummary] = useState<string>("");
  const [latestThinking, setLatestThinking] = useState<string[]>([]);
  const [showThinking, setShowThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [refinementMessage, setRefinementMessage] = useState("");
  const [showRefinementInput, setShowRefinementInput] = useState(false);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());
  const [localPlannedAttractions, setLocalPlannedAttractions] = useState<Attraction[]>(place.plannedAttractions);
  const [localPlannedRestaurants, setLocalPlannedRestaurants] = useState<Attraction[]>(place.plannedRestaurants);
  const userMessageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [scrollToGroupIndex, setScrollToGroupIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState<
    { url: string; width: number; height: number; attributions: string[] }[]
  >([]);
  const [selectedPlaceName, setSelectedPlaceName] = useState("");

  // Sync local state with place prop changes (from parent updates)
  useEffect(() => {
    setLocalPlannedAttractions(place.plannedAttractions);
    setLocalPlannedRestaurants(place.plannedRestaurants);
  }, [place.plannedAttractions, place.plannedRestaurants]);

  // Scroll to the user message separator when new suggestions are added
  useEffect(() => {
    if (scrollToGroupIndex !== null) {
      const element = userMessageRefs.current.get(scrollToGroupIndex);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setScrollToGroupIndex(null);
      }
    }
  }, [scrollToGroupIndex, suggestionGroups]);

  const handleSuggest = useCallback(
    async (userMessage?: string) => {
      setIsLoading(true);
      setError(null);
      if (!userMessage) {
        // Starting fresh suggestions - clear all groups
        setSuggestionGroups([]);
        setLatestSummary("");
        setLatestThinking([]);
        setAcceptedSuggestions(new Set());
        // Reset local state to current place state when starting fresh suggestions
        setLocalPlannedAttractions(place.plannedAttractions);
        setLocalPlannedRestaurants(place.plannedRestaurants);
        // Expand the planned items list so user can see changes
        onExpandRequest?.();
        // Highlight the place on the map
        onHighlight?.();
      }

      try {
        const response = await fetch("/api/attractions/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            place: {
              id: place.id,
              name: place.name,
              plannedAttractions: place.plannedAttractions,
              plannedRestaurants: place.plannedRestaurants,
            },
            mapCoordinates: mapCenter || { lat: place.lat, lng: place.lng },
            conversationHistory,
            userMessage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to get suggestions");
        }

        const data = await response.json();

        // Update suggestion groups
        if (userMessage) {
          // Append new group with user message
          setSuggestionGroups((prev) => {
            const newGroups = [
              ...prev,
              {
                userMessage,
                suggestions: data.suggestions.suggestions,
              },
            ];
            // Trigger scroll to the new group (after render)
            setTimeout(() => setScrollToGroupIndex(newGroups.length - 1), 100);
            return newGroups;
          });
        } else {
          // Initial request - create first group without message
          setSuggestionGroups([
            {
              userMessage: null,
              suggestions: data.suggestions.suggestions,
            },
          ]);
        }

        // Always update summary and thinking to latest
        setLatestSummary(data.suggestions.summary);
        setLatestThinking(data.suggestions._thinking);
        setIsOpen(true);

        // Update conversation history
        if (userMessage) {
          setConversationHistory((prev) => [
            ...prev,
            { role: "user", content: userMessage },
            { role: "assistant", content: data.suggestions.summary },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [place, conversationHistory, onExpandRequest, onHighlight, mapCenter]
  );

  const handleAcceptSuggestion = useCallback(
    (globalIndex: number) => {
      if (suggestionGroups.length === 0) return;

      // Find the suggestion by global index
      let currentIndex = 0;
      let suggestion = null;

      for (const group of suggestionGroups) {
        if (globalIndex < currentIndex + group.suggestions.length) {
          suggestion = group.suggestions[globalIndex - currentIndex];
          break;
        }
        currentIndex += group.suggestions.length;
      }

      if (!suggestion || !suggestion.attractionData) {
        return;
      }

      // Convert plain object to Attraction with branded types
      const attractionData: Attraction = {
        id: PlaceId(suggestion.attractionData.id),
        name: suggestion.attractionData.name,
        rating: suggestion.attractionData.rating,
        userRatingsTotal: suggestion.attractionData.userRatingsTotal,
        types: suggestion.attractionData.types,
        vicinity: suggestion.attractionData.vicinity,
        priceLevel: suggestion.attractionData.priceLevel,
        location: {
          lat: Latitude(suggestion.attractionData.location.lat),
          lng: Longitude(suggestion.attractionData.location.lng),
        },
      };

      // Update local state and create updated place
      let newAttractions = localPlannedAttractions;
      let newRestaurants = localPlannedRestaurants;

      switch (suggestion.type) {
        case "add_attraction":
          newAttractions = [...localPlannedAttractions, attractionData];
          setLocalPlannedAttractions(newAttractions);
          break;
        case "add_restaurant":
          newRestaurants = [...localPlannedRestaurants, attractionData];
          setLocalPlannedRestaurants(newRestaurants);
          break;
        default:
          return;
      }

      const updatedPlace: Place = {
        ...place,
        plannedAttractions: newAttractions,
        plannedRestaurants: newRestaurants,
      };

      // Notify parent that attraction was accepted so it can be added to nearby lists
      const attractionType = suggestion.type === "add_restaurant" ? "restaurant" : "attraction";
      onAttractionAccepted?.(place.id, attractionData, attractionType);

      onPlaceUpdate?.(updatedPlace);
      setAcceptedSuggestions((prev) => new Set([...prev, globalIndex]));
    },
    [suggestionGroups, place, localPlannedAttractions, localPlannedRestaurants, onPlaceUpdate, onAttractionAccepted]
  );

  const handleRemoveSuggestion = useCallback(
    (globalIndex: number) => {
      if (suggestionGroups.length === 0) return;

      // Find which group contains this suggestion
      let currentIndex = 0;
      let groupIndex = -1;
      let localIndex = -1;

      for (let i = 0; i < suggestionGroups.length; i++) {
        const group = suggestionGroups[i];
        if (globalIndex < currentIndex + group.suggestions.length) {
          groupIndex = i;
          localIndex = globalIndex - currentIndex;
          break;
        }
        currentIndex += group.suggestions.length;
      }

      if (groupIndex === -1 || localIndex === -1) return;

      // Remove the suggestion from the group
      const updatedGroups = suggestionGroups.map((group, idx) => {
        if (idx === groupIndex) {
          return {
            ...group,
            suggestions: group.suggestions.filter((_, sIdx) => sIdx !== localIndex),
          };
        }
        return group;
      });

      // Remove empty groups (but keep the first group even if empty)
      const filteredGroups = updatedGroups.filter((group, idx) => idx === 0 || group.suggestions.length > 0);

      setSuggestionGroups(filteredGroups);

      // Update accepted suggestions indices (shift down any that were after the removed one)
      setAcceptedSuggestions((prev) => {
        const newSet = new Set<number>();
        prev.forEach((idx) => {
          if (idx < globalIndex) {
            newSet.add(idx);
          } else if (idx > globalIndex) {
            newSet.add(idx - 1);
          }
        });
        return newSet;
      });
    },
    [suggestionGroups]
  );

  const handleRequestChanges = useCallback(() => {
    setShowRefinementInput(true);
  }, []);

  const handleSendRefinement = useCallback(async () => {
    if (!refinementMessage.trim()) return;

    setShowRefinementInput(false);
    await handleSuggest(refinementMessage);
    setRefinementMessage("");
  }, [refinementMessage, handleSuggest]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowRefinementInput(false);
    setRefinementMessage("");
  }, []);

  const getSuggestionBadgeVariant = (type: string): "default" | "outline" => {
    switch (type) {
      case "add_attraction":
      case "add_restaurant":
        return "default";
      case "general_tip":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSuggestionBadgeStyle = (type: string): string => {
    switch (type) {
      case "add_attraction":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50";
      case "add_restaurant":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50";
      case "general_tip":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800/50";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800/50";
    }
  };

  const getPriorityBadgeStyle = (priority?: string): string => {
    switch (priority) {
      case "must-see":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50";
      case "highly recommended":
        return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/50";
      case "hidden gem":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50";
      default:
        return "";
    }
  };

  const formatPriority = (priority?: string): string => {
    if (!priority) return "";
    return priority
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleSuggest();
        }}
        disabled={disabled || isLoading}
        variant="ghost"
        size="sm"
        className="w-full justify-center gap-2 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing...</span>
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            <span className="text-sm">Get AI suggestions</span>
          </>
        )}
      </Button>

      {error && <div className="text-xs text-red-500 break-words max-w-full px-4 pb-2">{error}</div>}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Suggestions for {place.name}
            </DialogTitle>
            <DialogDescription>AI-powered recommendations for attractions and restaurants</DialogDescription>
          </DialogHeader>

          {suggestionGroups.length > 0 && (
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground">{latestSummary}</p>
                </div>

                {/* Thinking process (collapsible) */}
                {latestThinking.length > 0 && (
                  <Collapsible open={showThinking} onOpenChange={setShowThinking}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="text-xs text-muted-foreground">
                          View AI reasoning ({latestThinking.length} steps)
                        </span>
                        {showThinking ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/30 rounded-lg p-4 mt-2 space-y-2">
                        {latestThinking.map((thought, index) => (
                          <div key={index} className="text-xs text-muted-foreground flex gap-2">
                            <span className="font-mono text-muted-foreground/50">{index + 1}.</span>
                            <span>{thought}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Suggestions grouped by refinement */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">
                    Suggestions ({suggestionGroups.reduce((sum, group) => sum + group.suggestions.length, 0)})
                  </h3>
                  <div className="space-y-6">
                    {suggestionGroups.map((group, groupIndex) => {
                      // Calculate starting global index for this group
                      const groupStartIndex = suggestionGroups
                        .slice(0, groupIndex)
                        .reduce((sum, g) => sum + g.suggestions.length, 0);

                      return (
                        <div key={groupIndex}>
                          {/* Show user message separator if it exists */}
                          {group.userMessage && (
                            <div
                              ref={(el) => {
                                if (el) {
                                  userMessageRefs.current.set(groupIndex, el);
                                }
                              }}
                              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3"
                            >
                              <div className="flex items-start gap-2 text-sm">
                                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium text-blue-900 dark:text-blue-100">Your request: </span>
                                  <span className="text-blue-700 dark:text-blue-300">{group.userMessage}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Suggestions in this group */}
                          <div className="space-y-3">
                            {group.suggestions.map((suggestion, suggestionIndex) => {
                              const globalIndex = groupStartIndex + suggestionIndex;
                              const isAccepted = acceptedSuggestions.has(globalIndex);
                              const canAccept =
                                !isAccepted &&
                                suggestion.attractionData &&
                                ["add_attraction", "add_restaurant"].includes(suggestion.type);

                              return (
                                <div
                                  key={suggestionIndex}
                                  className={`border rounded-lg p-4 transition-colors ${
                                    isAccepted
                                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                      : "hover:bg-muted/30"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant={getSuggestionBadgeVariant(suggestion.type)}
                                          className={getSuggestionBadgeStyle(suggestion.type)}
                                        >
                                          {suggestion.type.replace(/_/g, " ")}
                                        </Badge>
                                        {suggestion.priority &&
                                          ["add_attraction", "add_restaurant"].includes(suggestion.type) && (
                                            <Badge
                                              variant="default"
                                              className={getPriorityBadgeStyle(suggestion.priority)}
                                            >
                                              {formatPriority(suggestion.priority)}
                                            </Badge>
                                          )}
                                        {isAccepted && (
                                          <Badge variant="default" className="bg-green-600">
                                            <Check className="h-3 w-3 mr-1" />
                                            Applied
                                          </Badge>
                                        )}
                                      </div>

                                      {!isAccepted && (
                                        <>
                                          {suggestion.photos && suggestion.photos.length > 0 && (
                                            <div className="mb-2">
                                              <div className="grid grid-cols-1 rounded overflow-hidden bg-accent ring-2 ring-primary">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setSelectedPhotos(suggestion.photos || []);
                                                    setSelectedPhotoIndex(0);
                                                    setSelectedPlaceName(
                                                      suggestion.attractionData?.name || suggestion.attractionName || ""
                                                    );
                                                    setLightboxOpen(true);
                                                  }}
                                                  className="relative aspect-[4/3] overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                  aria-label={`View ${suggestion.attractionData?.name || suggestion.attractionName} photo in full size`}
                                                >
                                                  <PhotoImage
                                                    photoReference={suggestion.photos[0].photoReference}
                                                    alt={`${suggestion.attractionData?.name || suggestion.attractionName}`}
                                                    maxWidth={800}
                                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                  />
                                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />
                                                  {/* Show indicator if there are more photos */}
                                                  {suggestion.photos.length > 1 && (
                                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                                      <span>+{suggestion.photos.length - 1}</span>
                                                    </div>
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                          <p className="text-sm">{suggestion.reasoning}</p>
                                          {suggestion.attractionData && (
                                            <div className="bg-muted/50 rounded p-3 mt-2 text-sm">
                                              <div className="font-medium">{suggestion.attractionData.name}</div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                ⭐ {suggestion.attractionData.rating} (
                                                {suggestion.attractionData.userRatingsTotal} reviews)
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {suggestion.attractionData.vicinity}
                                              </div>
                                            </div>
                                          )}
                                          <div className="flex gap-2 mt-3">
                                            {canAccept && (
                                              <Button
                                                onClick={() => handleAcceptSuggestion(globalIndex)}
                                                size="sm"
                                                variant="default"
                                                className="gap-1"
                                              >
                                                <Check className="h-3 w-3" />
                                                Accept
                                              </Button>
                                            )}
                                            {suggestion.type !== "general_tip" && (
                                              <Button
                                                onClick={() => handleRemoveSuggestion(globalIndex)}
                                                size="sm"
                                                variant="outline"
                                                className="gap-1"
                                              >
                                                <X className="h-3 w-3" />
                                                Reject
                                              </Button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <div className="pt-4 border-t space-y-3">
            {showRefinementInput && (
              <div className="space-y-2">
                <label htmlFor="refinement-input" className="text-sm font-medium">
                  What would you like to change?
                </label>
                <div className="flex gap-2">
                  <Input
                    id="refinement-input"
                    value={refinementMessage}
                    onChange={(e) => setRefinementMessage(e.target.value)}
                    placeholder="e.g., Show me more affordable restaurants"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendRefinement();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button onClick={handleSendRefinement} disabled={!refinementMessage.trim() || isLoading} size="sm">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRefinementInput(false);
                      setRefinementMessage("");
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <div className="flex gap-2">
                {!showRefinementInput && suggestionGroups.length > 0 && (
                  <Button variant="outline" onClick={handleRequestChanges} className="gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" />
                        Ask for Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Button
                variant="default"
                onClick={handleClose}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
        {selectedPhotos.length > 0 && (
          <PhotoLightbox
            photos={selectedPhotos}
            initialIndex={selectedPhotoIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            placeName={selectedPlaceName}
          />
        )}
      </Dialog>
    </div>
  );
}
