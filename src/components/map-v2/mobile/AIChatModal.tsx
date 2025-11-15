/**
 * AI Chat Modal
 * Full-screen modal for mobile AI chat interface
 * 
 * Features:
 * - Slide up animation from bottom
 * - Full-screen layout with fixed header and footer
 * - Scrollable message area
 * - Mobile-optimized suggestion cards
 * - Keyboard handling
 * - Swipe down to dismiss (optional)
 */

import React, { useEffect, useRef } from 'react';
import { MobileChatHeader } from './MobileChatHeader';
import { MobileChatInput } from './MobileChatInput';
import { MobileSuggestionCard } from './MobileSuggestionCard';
import type { AIMessage } from '../types';
import { TypingIndicator } from '../sidebar/ai/TypingIndicator';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: AIMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onAddSuggestion: (placeId: string) => void;
  addedPlaceIds: Set<string>;
  selectedPlace?: { name: string } | null;
  suggestedPrompts?: string[];
}

export function AIChatModal({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  onAddSuggestion,
  addedPlaceIds,
  selectedPlace,
  suggestedPrompts = []
}: AIChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      {/* Modal container */}
      <div 
        className="w-full h-full bg-white flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{
          maxHeight: '100vh',
          height: '100vh',
        }}
      >
        {/* Header with context */}
        <MobileChatHeader 
          onClose={onClose}
          selectedPlace={selectedPlace}
        />

        {/* Messages area - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            <EmptyState />
          ) : (
            <div className="px-4 py-6 space-y-6">
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  onAddSuggestion={onAddSuggestion}
                  addedPlaceIds={addedPlaceIds}
                />
              ))}
              
              {isLoading && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area - fixed at bottom */}
        <MobileChatInput
          onSend={onSendMessage}
          disabled={!selectedPlace || isLoading}
          placeholder={
            selectedPlace 
              ? `Ask about ${selectedPlace.name}...`
              : 'Select a place to get started...'
          }
          suggestedPrompts={suggestedPrompts}
          autoFocus
        />
      </div>
    </div>
  );
}

// Empty state when no messages
function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full p-8 text-center">
      <div className="max-w-sm space-y-4">
        <div className="text-6xl">💬</div>
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-900">
            AI Travel Assistant
          </h3>
          <p className="text-base text-gray-600">
            Ask me anything about places to visit, restaurants, hidden gems, or activities.
          </p>
        </div>
      </div>
    </div>
  );
}

// Individual message bubble
interface MessageBubbleProps {
  message: AIMessage;
  onAddSuggestion: (placeId: string) => void;
  addedPlaceIds: Set<string>;
}

function MessageBubble({ message, onAddSuggestion, addedPlaceIds }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble - larger on mobile */}
        <div
          className={`rounded-2xl px-5 py-3.5 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-base whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-500 px-2">
          {message.timestamp.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })}
        </p>

        {/* Suggestion cards (for assistant messages) */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="w-full space-y-4 mt-2">
            {message.suggestions.map((suggestion) => (
              <MobileSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isAdded={addedPlaceIds.has(suggestion.placeId)}
                onAddClick={onAddSuggestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

