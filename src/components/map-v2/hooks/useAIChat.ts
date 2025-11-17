/**
 * Hook for AI chat conversation management
 * Handles sending messages, receiving responses, and managing conversation state
 */

import { useState, useCallback } from "react";
import { useMapState } from "../context";
import type { AIMessage, AISuggestion } from "../types";
import { getPhotoUrl } from "@/lib/common/photo-utils";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import type { Attraction } from "@/domain/map/models";

interface UseAIChatReturn {
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  addSuggestionToPlan: (placeId: string) => void;
  addingPlaceIds: Set<string>;
  addedPlaceIds: Set<string>;
}

export function useAIChat(): UseAIChatReturn {
  const { state, dispatch, addAttractionToPlace, addRestaurantToPlace } = useMapState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingPlaceIds, setAddingPlaceIds] = useState<Set<string>>(new Set());

  // Compute which attractions/restaurants are already in the selected place's plan
  const addedPlaceIds = (() => {
    if (!state.aiContext) return new Set<string>();

    const selectedPlace = state.places.find((p: any) => p.id === state.aiContext);
    if (!selectedPlace) return new Set<string>();

    const ids = new Set<string>();

    // Add all attraction IDs
    (selectedPlace.plannedAttractions || []).forEach((a: any) => {
      ids.add(a.id);
    });

    // Add all restaurant IDs
    (selectedPlace.plannedRestaurants || []).forEach((r: any) => {
      ids.add(r.id);
    });

    return ids;
  })();

  // Send message to AI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.aiContext) {
        console.warn("No AI context set");
        return;
      }

      // Find the selected place to get context
      const selectedPlace = state.places.find((p: any) => p.id === state.aiContext);
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
      dispatch({ type: "ADD_AI_MESSAGE", payload: userMessage });

      // Set loading state
      setIsLoading(true);
      setError(null);

      try {
        // Build the place object with planned attractions and restaurants
        const place = {
          id: selectedPlace.id,
          name: selectedPlace.name,
          plannedAttractions: (selectedPlace.plannedAttractions || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            rating: a.rating ?? 0, // Default to 0 if missing (required by schema)
            userRatingsTotal: a.userRatingsTotal ?? 0, // Default to 0 if missing (required by schema)
            types: a.types || [],
            vicinity: a.vicinity || "",
            priceLevel: a.priceLevel,
            location: a.location,
          })),
          plannedRestaurants: (selectedPlace.plannedRestaurants || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            rating: r.rating ?? 0, // Default to 0 if missing (required by schema)
            userRatingsTotal: r.userRatingsTotal ?? 0, // Default to 0 if missing (required by schema)
            types: r.types || [],
            vicinity: r.vicinity || "",
            priceLevel: r.priceLevel,
            location: r.location,
          })),
        };

        // Build conversation history in the correct format
        const conversationHistory = state.aiConversation.slice(-10).map((msg: AIMessage) => ({
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
              lat: selectedPlace.lat,
              lng: selectedPlace.lng,
            },
            conversationHistory,
            userMessage: content,
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
        const suggestions: AISuggestion[] = agentResponse.suggestions.map((s: any, index: number) => {
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

          return {
            id: `suggestion-${s.attractionData.id}-${Date.now()}-${index}`,
            placeId: s.attractionData.id,
            placeName: s.attractionData.name,
            priority: normalizePriority(s.priority),
            reasoning: s.reasoning,
            score: s.attractionData.rating || 0,
            category: s.type === "add_restaurant" ? "restaurant" : "attraction",
            photoUrl: photoReference ? getPhotoUrl(photoReference, 800) : undefined,
            type: s.type as "add_attraction" | "add_restaurant",
            attractionData: s.attractionData, // Store full data for adding to plan
          };
        });

        // Add AI response message with the summary
        const assistantMessage: AIMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: agentResponse.summary || "Here are my recommendations:",
          timestamp: new Date(),
          suggestions,
        };
        dispatch({ type: "ADD_AI_MESSAGE", payload: assistantMessage });
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
        dispatch({ type: "ADD_AI_MESSAGE", payload: errorMessage });
      } finally {
        setIsLoading(false);
      }
    },
    [state.aiContext, state.aiConversation, dispatch]
  );

  // Add suggestion to plan (optimistic update)
  const addSuggestionToPlan = useCallback(
    (placeId: string) => {
      // Check if already in AI context
      if (!state.aiContext) {
        console.warn("No AI context set - cannot add suggestion");
        return;
      }

      // Check if already adding or added
      if (addingPlaceIds.has(placeId) || addedPlaceIds.has(placeId)) {
        return;
      }

      // Find the suggestion in the conversation messages
      let foundSuggestion: AISuggestion | null = null;

      for (const message of state.aiConversation) {
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
      const contextPlace = state.places.find((p: any) => p.id === state.aiContext);
      if (!contextPlace) {
        console.warn("Context place not found");
        return;
      }

      const isRestaurant = foundSuggestion.category === "restaurant";
      const alreadyExists = isRestaurant
        ? contextPlace.plannedRestaurants?.some((r: any) => r.id === placeId)
        : contextPlace.plannedAttractions?.some((a: any) => a.id === placeId);

      if (alreadyExists) {
        // Already exists, no need to add again
        return;
      }

      // Set loading state
      setAddingPlaceIds((prev) => new Set(prev).add(placeId));

      try {
        // Use the full attractionData we stored from the API response
        const apiData = foundSuggestion.attractionData;

        // Create properly typed Attraction object
        const attraction: Attraction = {
          id: PlaceId(apiData.id),
          name: apiData.name,
          rating: apiData.rating ?? undefined,
          userRatingsTotal: apiData.userRatingsTotal ?? undefined,
          types: apiData.types || [],
          vicinity: apiData.vicinity || "",
          priceLevel: apiData.priceLevel,
          location: {
            lat: Latitude(apiData.location.lat),
            lng: Longitude(apiData.location.lng),
          },
          photos: apiData.photos,
        };

        // Add to appropriate array (this will update state and addedPlaceIds will be recomputed)
        if (isRestaurant) {
          addRestaurantToPlace(state.aiContext, attraction);
        } else {
          addAttractionToPlace(state.aiContext, attraction);
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
    [state.aiContext, state.aiConversation, state.places, addingPlaceIds, addAttractionToPlace, addRestaurantToPlace]
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
