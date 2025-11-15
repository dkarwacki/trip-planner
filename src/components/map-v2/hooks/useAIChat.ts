/**
 * Hook for AI chat conversation management
 * Handles sending messages, receiving responses, and managing conversation state
 */

import { useState, useCallback } from 'react';
import { useMapState } from '../context';
import type { AIMessage, AISuggestion } from '../types';

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
      // Call AI suggestions API
      const response = await fetch('/api/attractions/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: state.aiContext,
          message: content,
          conversationHistory: state.aiConversation.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse suggestions from response
      const suggestions: AISuggestion[] = data.suggestions?.map((s: any) => ({
        id: `suggestion-${s.placeId}-${Date.now()}`,
        placeId: s.placeId,
        placeName: s.name,
        priority: s.priority || 'highly-recommended',
        reasoning: s.reasoning || s.aiReasoning || 'Recommended based on your query.',
        score: s.score || 8.0,
        category: s.category || s.types?.[0] || 'attraction',
        photoUrl: s.photoUrl || s.photos?.[0]?.url,
      })) || [];

      // Add AI response message
      const assistantMessage: AIMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || data.response || 'Here are my recommendations:',
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

