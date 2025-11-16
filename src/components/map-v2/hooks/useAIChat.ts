/**
 * Hook for AI chat conversation management
 * Handles sending messages, receiving responses, and managing conversation state
 */

import { useState, useCallback } from 'react';
import { useMapState } from '../context';
import type { AIMessage, AISuggestion } from '../types';
import { getPhotoUrl } from '@/lib/common/photo-utils';

interface UseAIChatReturn {
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  addSuggestionToPlan: (placeId: string) => void;
}

export function useAIChat(): UseAIChatReturn {
  const { state, dispatch } = useMapState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!state.aiContext) {
      console.warn('No AI context set');
      return;
    }

    // Find the selected place to get context
    const selectedPlace = state.places.find((p: any) => p.id === state.aiContext);
    if (!selectedPlace) {
      console.warn('Selected place not found');
      setError('Place not found. Please select a place first.');
      return;
    }

    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_AI_MESSAGE', payload: userMessage });

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
          vicinity: a.vicinity || '',
          priceLevel: a.priceLevel,
          location: a.location,
        })),
        plannedRestaurants: (selectedPlace.plannedRestaurants || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          rating: r.rating ?? 0, // Default to 0 if missing (required by schema)
          userRatingsTotal: r.userRatingsTotal ?? 0, // Default to 0 if missing (required by schema)
          types: r.types || [],
          vicinity: r.vicinity || '',
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
      const response = await fetch('/api/attractions/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        console.error('API error response:', errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // The API returns: { success: true, suggestions: { _thinking, suggestions, summary } }
      // We need to access the nested suggestions array
      const agentResponse = data.suggestions;
      
      if (!agentResponse || !Array.isArray(agentResponse.suggestions)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from AI');
      }

      // Helper to normalize priority values from API format to component format
      const normalizePriority = (priority: string | undefined): 'must-see' | 'highly-recommended' | 'hidden-gem' => {
        if (!priority) return 'highly-recommended';
        
        // API returns: "must-see", "highly recommended", "hidden gem"
        // Component expects: "must-see", "highly-recommended", "hidden-gem"
        switch (priority.toLowerCase()) {
          case 'must-see':
            return 'must-see';
          case 'highly recommended':
            return 'highly-recommended';
          case 'hidden gem':
            return 'hidden-gem';
          default:
            return 'highly-recommended';
        }
      };

      // Parse suggestions from response
      const suggestions: AISuggestion[] = agentResponse.suggestions
        .filter((s: any) => s.type !== 'general_tip' && s.attractionData) // Only include suggestions with attraction data
        .map((s: any) => {
          // Get photo reference from attractionData or photos array
          const photoReference = s.attractionData.photos?.[0]?.photoReference || s.photos?.[0]?.photoReference;
          
          return {
            id: `suggestion-${s.attractionData.id}-${Date.now()}`,
            placeId: s.attractionData.id,
            placeName: s.attractionData.name,
            priority: normalizePriority(s.priority),
            reasoning: s.reasoning,
            score: s.attractionData.rating || 0,
            category: s.type === 'add_restaurant' ? 'restaurant' : 'attraction',
            photoUrl: photoReference ? getPhotoUrl(photoReference, 800) : undefined,
          };
        });

      // Add AI response message with the summary
      const assistantMessage: AIMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: agentResponse.summary || 'Here are my recommendations:',
        timestamp: new Date(),
        suggestions,
      };
      dispatch({ type: 'ADD_AI_MESSAGE', payload: assistantMessage });

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to get AI response. Please try again.');
      
      // Add error message
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_AI_MESSAGE', payload: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [state.aiContext, state.aiConversation, dispatch]);

  // Add suggestion to plan (optimistic update)
  const addSuggestionToPlan = useCallback((placeId: string) => {
    // TODO: Implement actual place addition
    // For now, just log the action
    console.log('Adding suggestion to plan:', placeId);
    
    // TODO: Fetch full place details and add to state.places
    // dispatch({ type: 'ADD_PLACE', payload: placeData });
    
    // TODO: Update save status
    // dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
    
    // TODO: Persist to backend
    // await savePlaceToDB(placeId);
    // dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    addSuggestionToPlan,
  };
}

