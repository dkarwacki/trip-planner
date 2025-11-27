/**
 * Hook for AI chat conversation management
 * Handles sending messages, receiving responses, and managing conversation state
 */

import { useState, useCallback } from "react";
import { useMapStore } from "../stores/mapStore";
import type { AIMessage, AISuggestion } from "../types";
import { getPhotoUrl } from "@/lib/common/photo-utils";
import type { PlannedPOIViewModel, DiscoveryItemViewModel } from "@/lib/map-v2/types";
import { usePersonas } from "@/components/plan-v2/hooks/usePersonas";

interface UseAIChatReturn {
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  addSuggestionToPlan: (placeId: string) => void;
  addingPlaceIds: Set<string>;
  addedPlaceIds: Set<string>;
}

// Raw API response types for AI suggestions
interface ScoreBreakdown {
  qualityScore: number;
  personaScore?: number;
  diversityScore?: number;
  confidenceScore: number;
}

interface RawAttractionData {
  id: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  vicinity: string;
  priceLevel?: number;
  location: {
    lat: number;
    lng: number;
  };
  photos?: {
    photoReference: string;
    width?: number;
    height?: number;
  }[];
  score?: number;
  breakdown?: ScoreBreakdown;
}

interface RawSuggestion {
  type: "add_attraction" | "add_restaurant" | "general_tip";
  priority?: string;
  reasoning: string;
  attractionData?: RawAttractionData;
  photos?: { photoReference: string }[];
}

/**
 * Convert raw attraction data from AI API to DiscoveryItemViewModel
 * Ensures proper type safety without type casts
 */
function rawAttractionToDiscoveryItem(
  raw: RawAttractionData,
  type: "attraction" | "restaurant"
): DiscoveryItemViewModel {
  // Extract scores from breakdown if available
  const qualityScore = raw.breakdown?.qualityScore;
  const personaScore = raw.breakdown?.personaScore;
  const diversityScore = raw.breakdown?.diversityScore;
  const confidenceScore = raw.breakdown?.confidenceScore;

  // Base properties common to both types
  const baseItem = {
    id: raw.id,
    googlePlaceId: raw.id, // AI API uses same ID
    name: raw.name,
    latitude: raw.location.lat,
    longitude: raw.location.lng,
    rating: raw.rating,
    userRatingsTotal: raw.userRatingsTotal,
    types: raw.types,
    vicinity: raw.vicinity,
    photos: raw.photos?.map((p) => ({
      photoReference: p.photoReference,
      width: p.width ?? 400,
      height: p.height ?? 300,
      attributions: [],
      lat: raw.location.lat,
      lng: raw.location.lng,
    })),
    score: raw.score ?? qualityScore ?? 0,
    qualityScore,
    personaScore,
    diversityScore,
    confidenceScore,
    scoresExplanation: raw.breakdown ? JSON.stringify(raw.breakdown) : undefined,
  };

  // Return proper discriminated union type
  if (type === "restaurant") {
    return {
      ...baseItem,
      itemType: "restaurant" as const,
      priceLevel: raw.priceLevel,
    };
  } else {
    return {
      ...baseItem,
      itemType: "attraction" as const,
    };
  }
}

export function useAIChat(): UseAIChatReturn {
  // Selectors
  const context = useMapStore((state) => state.context);
  const places = useMapStore((state) => state.places);
  const conversation = useMapStore((state) => state.conversation);

  // Actions
  const addAIMessage = useMapStore((state) => state.addAIMessage);
  const addAttractionToPlace = useMapStore((state) => state.addAttractionToPlace);
  const addRestaurantToPlace = useMapStore((state) => state.addRestaurantToPlace);
  const addDiscoveryResults = useMapStore((state) => state.addDiscoveryResults);

  // Get user personas for personalized recommendations
  const { selectedPersonas } = usePersonas();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingPlaceIds, setAddingPlaceIds] = useState<Set<string>>(new Set());

  // Compute which attractions/restaurants are already in the selected place's plan
  const addedPlaceIds = (() => {
    if (!context) return new Set<string>();

    const selectedPlace = places.find((p) => p.id === context);
    if (!selectedPlace) return new Set<string>();

    const ids = new Set<string>();

    // Add all attraction IDs
    selectedPlace.plannedAttractions.forEach((a) => {
      ids.add(a.id);
    });

    // Add all restaurant IDs
    selectedPlace.plannedRestaurants.forEach((r) => {
      ids.add(r.id);
    });

    return ids;
  })();

  // Send message to AI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!context) {
        console.warn("No AI context set");
        return;
      }

      // Find the selected place to get context
      const selectedPlace = places.find((p) => p.id === context);
      if (!selectedPlace) {
        console.warn("Selected place not found");
        setError("Place not found. Please select a place first.");
        return;
      }

      // Add user message
      const userMessage: AIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };
      addAIMessage(userMessage);

      // Set loading state
      setIsLoading(true);
      setError(null);

      try {
        // Build the place object with planned attractions and restaurants
        const place = {
          id: selectedPlace.id,
          name: selectedPlace.name,
          plannedAttractions: selectedPlace.plannedAttractions.map((a) => ({
            id: a.id,
            name: a.name,
            rating: a.rating ?? 0, // Default to 0 if missing (required by schema)
            userRatingsTotal: a.userRatingsTotal ?? 0, // Default to 0 if missing (required by schema)
            types: a.types,
            vicinity: a.vicinity,
            priceLevel: a.priceLevel,
            location: {
              lat: a.latitude,
              lng: a.longitude,
            },
          })),
          plannedRestaurants: selectedPlace.plannedRestaurants.map((r) => ({
            id: r.id,
            name: r.name,
            rating: r.rating ?? 0, // Default to 0 if missing (required by schema)
            userRatingsTotal: r.userRatingsTotal ?? 0, // Default to 0 if missing (required by schema)
            types: r.types,
            vicinity: r.vicinity,
            priceLevel: r.priceLevel,
            location: {
              lat: r.latitude,
              lng: r.longitude,
            },
          })),
        };

        // Build conversation history in the correct format
        const conversationHistory = conversation.slice(-10).map((msg: AIMessage) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Call AI suggestions API
        const response = await fetch("/api/attractions/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            place,
            mapCoordinates: {
              lat: selectedPlace.latitude,
              lng: selectedPlace.longitude,
            },
            conversationHistory,
            userMessage: content,
            personas: selectedPersonas, // User's persona preferences for personalized recommendations
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error response:", errorData);
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // The API returns: { success: true, suggestions: { _thinking, suggestions, summary } }
        // We need to access the nested suggestions array
        const agentResponse = data.suggestions;

        if (!agentResponse || !Array.isArray(agentResponse.suggestions)) {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response format from AI");
        }

        // Helper to normalize priority values from API format to component format
        const normalizePriority = (priority: string | undefined): "must-see" | "highly-recommended" | "hidden-gem" => {
          if (!priority) return "highly-recommended";

          // API can return different formats:
          // - "must-see", "highly recommended", "hidden gem" (with spaces)
          // - "must_see", "highly_recommended", "hidden_gem" (with underscores)
          // Component expects: "must-see", "highly-recommended", "hidden-gem" (with hyphens)
          const normalized = priority.toLowerCase().replace(/_/g, " ");

          switch (normalized) {
            case "must-see":
            case "must see":
              return "must-see";
            case "highly recommended":
            case "highly-recommended":
              return "highly-recommended";
            case "hidden gem":
            case "hidden-gem":
              return "hidden-gem";
            default:
              return "highly-recommended";
          }
        };

        // Parse suggestions from response (including general tips)
        const suggestions: AISuggestion[] = agentResponse.suggestions.map((s: RawSuggestion, index: number) => {
          // Handle general tips (no attraction data)
          if (s.type === "general_tip" || !s.attractionData) {
            return {
              id: `suggestion-general-${Date.now()}-${index}`,
              placeId: null,
              placeName: null,
              priority: normalizePriority(s.priority),
              reasoning: s.reasoning,
              score: null,
              category: "tip",
              photoUrl: undefined,
              type: "general_tip" as const,
            };
          }

          // Handle attractions and restaurants with data
          const photoReference = s.attractionData.photos?.[0]?.photoReference || s.photos?.[0]?.photoReference;

          // Use domain-calculated score if available, otherwise fallback to simple rating calculation
          const score =
            s.attractionData.score ??
            (() => {
              console.warn(
                `[AI Suggestions] Missing domain score for ${s.attractionData.name}, falling back to rating × 20`
              );
              return (s.attractionData.rating || 0) * 20;
            })();

          return {
            id: `suggestion-${s.attractionData.id}-${Date.now()}-${index}`,
            placeId: s.attractionData.id,
            placeName: s.attractionData.name,
            priority: normalizePriority(s.priority),
            reasoning: s.reasoning,
            score: score,
            category: s.type === "add_restaurant" ? "restaurant" : "attraction",
            photoUrl: photoReference
              ? getPhotoUrl(
                  photoReference,
                  800,
                  s.attractionData.location.lat,
                  s.attractionData.location.lng,
                  s.attractionData.name
                )
              : undefined,
            type: s.type as "add_attraction" | "add_restaurant",
            attractionData: rawAttractionToDiscoveryItem(
              s.attractionData,
              s.type === "add_restaurant" ? "restaurant" : "attraction"
            ),
          };
        });

        // Extract thinking steps from the API response
        // _thinking can be a string, array of strings, or undefined
        const thinkingSteps = (() => {
          const thinking = agentResponse._thinking;
          if (!thinking) return undefined;

          // If it's already an array, use it
          if (Array.isArray(thinking)) {
            return thinking.filter((step) => typeof step === "string" && step.trim().length > 0);
          }

          // If it's a string, try to split by newlines or numbered steps
          if (typeof thinking === "string") {
            const trimmed = thinking.trim();
            if (!trimmed) return undefined;

            // Try to split by newlines first
            const lines = trimmed.split(/\n+/).filter((line) => line.trim().length > 0);
            if (lines.length > 1) {
              return lines;
            }

            // If no newlines, return as single step
            return [trimmed];
          }

          return undefined;
        })();

        // Transform valid suggestions to discovery results format
        // Filter out general tips (they don't have place data) and ensure attractionData exists
        const validSuggestions = suggestions.filter(
          (s): s is AISuggestion & { attractionData: DiscoveryItemViewModel } =>
            s.type !== "general_tip" && s.attractionData !== undefined
        );
        // attractionData is already a DiscoveryItemViewModel, just extract it
        const discoveryItems = validSuggestions.map((s) => s.attractionData);

        // Add AI response message with the summary
        const assistantMessage: AIMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: agentResponse.summary || "Here are my recommendations:",
          timestamp: new Date(),
          suggestions,
          thinkingSteps,
        };
        addAIMessage(assistantMessage);

        // Add AI suggestions to discovery results (if any valid attractions/restaurants)
        // This makes them appear on the map and in the discovery list alongside nearby places
        if (discoveryItems.length > 0) {
          addDiscoveryResults(discoveryItems);
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to get AI response. Please try again.");

        // Add error message
        const errorMessage: AIMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        addAIMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [context, conversation, addAIMessage, addDiscoveryResults, places, selectedPersonas]
  );

  // Add suggestion to plan (optimistic update)
  const addSuggestionToPlan = useCallback(
    (placeId: string) => {
      // Check if already in AI context
      if (!context) {
        console.warn("No AI context set - cannot add suggestion");
        return;
      }

      // Check if already adding or added
      if (addingPlaceIds.has(placeId) || addedPlaceIds.has(placeId)) {
        return;
      }

      // Find the suggestion in the conversation messages
      let foundSuggestion: AISuggestion | null = null;

      for (const message of conversation) {
        if (message.suggestions) {
          const suggestion = message.suggestions.find((s) => s.placeId === placeId);
          if (suggestion) {
            foundSuggestion = suggestion;
            break;
          }
        }
      }

      if (!foundSuggestion) {
        console.warn("Suggestion not found in conversation:", placeId);
        return;
      }

      // Can't add general tips (they don't have place data)
      if (
        foundSuggestion.type === "general_tip" ||
        !foundSuggestion.placeId ||
        !foundSuggestion.placeName ||
        !foundSuggestion.attractionData
      ) {
        console.warn("Cannot add general tip to plan or missing attraction data");
        return;
      }

      // Check if already in current place's attractions/restaurants
      const contextPlace = places.find((p) => p.id === context);
      if (!contextPlace) {
        console.warn("Context place not found");
        return;
      }

      const isRestaurant = foundSuggestion.category === "restaurant";
      const alreadyExists = isRestaurant
        ? contextPlace.plannedRestaurants.some((r) => r.id === placeId)
        : contextPlace.plannedAttractions.some((a) => a.id === placeId);

      if (alreadyExists) {
        // Already exists, no need to add again
        return;
      }

      // Set loading state
      setAddingPlaceIds((prev) => new Set(prev).add(placeId));

      try {
        // Use the full attractionData we stored from the API response
        const apiData = foundSuggestion.attractionData;

        // Create properly typed PlannedPOIViewModel object
        const poi: PlannedPOIViewModel = {
          id: apiData.id,
          googlePlaceId: apiData.googlePlaceId,
          name: apiData.name,
          latitude: apiData.latitude,
          longitude: apiData.longitude,
          rating: apiData.rating,
          userRatingsTotal: apiData.userRatingsTotal,
          types: apiData.types,
          vicinity: apiData.vicinity,
          photos: apiData.photos,
          priceLevel: apiData.itemType === "restaurant" ? apiData.priceLevel : undefined,
          qualityScore: apiData.qualityScore,
          diversityScore: apiData.diversityScore,
          confidenceScore: apiData.confidenceScore,
        };

        // Add to appropriate array (this will update state and addedPlaceIds will be recomputed)
        if (isRestaurant) {
          addRestaurantToPlace(context, poi);
        } else {
          addAttractionToPlace(context, poi);
        }
      } catch (error) {
        console.error("Failed to add suggestion:", error);
      } finally {
        // Clear loading state
        setAddingPlaceIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(placeId);
          return newSet;
        });
      }
    },
    [context, conversation, places, addingPlaceIds, addedPlaceIds, addAttractionToPlace, addRestaurantToPlace]
  );

  return {
    sendMessage,
    isLoading,
    error,
    addSuggestionToPlan,
    addingPlaceIds,
    addedPlaceIds,
  };
}
