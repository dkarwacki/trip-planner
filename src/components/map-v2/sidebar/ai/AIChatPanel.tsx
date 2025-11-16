/**
 * Main AI chat panel container
 * Manages layout with sticky header and footer
 */

import React from 'react';
import { useMapState } from '../../context';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useAIChat } from '../../hooks/useAIChat';

export function AIChatPanel() {
  const { state, dispatch } = useMapState();
  const { 
    sendMessage, 
    isLoading, 
    addSuggestionToPlan 
  } = useAIChat();

  // Get selected place for context
  const selectedPlace = state.selectedPlaceId
    ? state.places.find(p => p.id === state.selectedPlaceId)
    : null;

  // Get added place IDs for suggestion card states
  const addedPlaceIds = new Set(state.places.map(p => p.id));

  // Handle message send
  const handleSendMessage = async (message: string) => {
    if (!selectedPlace) {
      console.error('No place selected for AI assistant');
      // TODO: Show error toast to user
      return;
    }
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast to user
    }
  };

  // Handle adding suggestion to plan
  const handleAddSuggestion = (placeId: string) => {
    addSuggestionToPlan(placeId);
  };

  // Suggested prompts based on context
  // Only show before the first message
  const hasMessages = state.aiConversation.length > 0;
  const suggestedPrompts = selectedPlace && !hasMessages
    ? [
        'Must-see highlights',
        'Best local restaurants',
        'Hidden gems nearby',
        'Family-friendly activities',
      ]
    : [];

  return (
    <div className="flex flex-col h-full bg-white">
      <ChatHeader selectedPlace={selectedPlace} />
      
      <ChatMessages 
        messages={state.aiConversation}
        isLoading={isLoading}
        onAddSuggestion={handleAddSuggestion}
        addedPlaceIds={addedPlaceIds}
      />
      
      <ChatInput 
        onSend={handleSendMessage}
        disabled={!selectedPlace || isLoading}
        placeholder={
          selectedPlace 
            ? `Ask anything about ${selectedPlace.name}...`
            : 'Select a place to get started...'
        }
        suggestedPrompts={suggestedPrompts}
        showSuggestedPrompts={!hasMessages}
      />
    </div>
  );
}

