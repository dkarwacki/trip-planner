/**
 * Inline suggestion card within AI chat
 * Shows place photo, priority, score, and AI reasoning
 */

import React, { useState } from 'react';
import { Plus, Check, ChevronDown, Lightbulb, Loader2 } from 'lucide-react';
import type { SuggestionCardProps } from '../../types';
import { PriorityBadge } from './PriorityBadge';

export function SuggestionCard({ 
  suggestion, 
  isAdded,
  isAdding = false,
  onAddClick 
}: SuggestionCardProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Truncate reasoning to 2-3 lines (~150 chars)
  const reasoningExcerpt = suggestion.reasoning.length > 150
    ? suggestion.reasoning.slice(0, 150) + '...'
    : suggestion.reasoning;

  const shouldShowReadMore = suggestion.reasoning.length > 150;
  
  const isGeneralTip = suggestion.type === 'general_tip';

  const handleAddClick = () => {
    if (!isAdded && !isAdding && suggestion.placeId) {
      onAddClick(suggestion.placeId);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Photo with priority badge (or tip icon for general tips) */}
      {!isGeneralTip && (
        <div className="relative aspect-video bg-gray-200">
          {suggestion.photoUrl ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <img
                src={suggestion.photoUrl}
                alt={suggestion.placeName || 'Place photo'}
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
      )}
      
      {/* General tip header */}
      {isGeneralTip && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 flex items-center gap-2 border-b border-amber-100">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">Travel Tip</span>
          <div className="ml-auto">
            <PriorityBadge priority={suggestion.priority} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and metadata (skip for general tips) */}
        {!isGeneralTip && (
          <div>
            <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
              {suggestion.placeName}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="capitalize">{suggestion.category}</span>
              {suggestion.score !== null && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="font-semibold text-blue-600">
                    Score: {suggestion.score.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

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

        {/* Action button (only for places, not general tips) */}
        {!isGeneralTip && (
          <button
            onClick={handleAddClick}
            disabled={isAdded || isAdding}
            className={`
              w-full py-2.5 px-4 rounded-lg font-medium text-sm
              transition-colors flex items-center justify-center gap-2
              ${isAdded
                ? 'bg-green-50 text-green-700 cursor-default'
                : isAdding
                ? 'bg-blue-50 text-blue-600 cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : isAdded ? (
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
        )}
      </div>
    </div>
  );
}

