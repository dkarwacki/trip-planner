/**
 * Inline suggestion card within AI chat
 * Shows place photo, priority, score, and AI reasoning
 */

import React, { useState } from 'react';
import { Plus, Check, ChevronDown } from 'lucide-react';
import type { SuggestionCardProps } from '../../types';
import { PriorityBadge } from './PriorityBadge';

export function SuggestionCard({ 
  suggestion, 
  isAdded, 
  onAddClick 
}: SuggestionCardProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Truncate reasoning to 2-3 lines (~150 chars)
  const reasoningExcerpt = suggestion.reasoning.length > 150
    ? suggestion.reasoning.slice(0, 150) + '...'
    : suggestion.reasoning;

  const shouldShowReadMore = suggestion.reasoning.length > 150;

  const handleAddClick = () => {
    if (!isAdded) {
      onAddClick(suggestion.placeId);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Photo with priority badge */}
      <div className="relative aspect-video bg-gray-200">
        {suggestion.photoUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
              src={suggestion.photoUrl}
              alt={suggestion.placeName}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-4xl">📍</span>
          </div>
        )}
        
        {/* Priority badge */}
        <div className="absolute top-2 right-2">
          <PriorityBadge priority={suggestion.priority} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and metadata */}
        <div>
          <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
            {suggestion.placeName}
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{suggestion.category}</span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold text-blue-600">
              Score: {suggestion.score.toFixed(1)}
            </span>
          </div>
        </div>

        {/* AI reasoning */}
        <div className="text-sm text-gray-700">
          <p className={isReasoningExpanded ? '' : 'line-clamp-3'}>
            {isReasoningExpanded ? suggestion.reasoning : reasoningExcerpt}
          </p>
          
          {shouldShowReadMore && (
            <button
              onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
              className="mt-1 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-xs"
            >
              {isReasoningExpanded ? 'Show less' : 'Read more'}
              <ChevronDown 
                className={`h-3 w-3 transition-transform ${
                  isReasoningExpanded ? 'rotate-180' : ''
                }`} 
              />
            </button>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={handleAddClick}
          disabled={isAdded}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium text-sm
            transition-colors flex items-center justify-center gap-2
            ${isAdded
              ? 'bg-green-50 text-green-700 cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added to Plan
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add to Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}

