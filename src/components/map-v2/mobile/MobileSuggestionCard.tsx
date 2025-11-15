/**
 * Mobile Suggestion Card
 * Touch-optimized suggestion card for mobile AI chat
 * 
 * Features:
 * - Larger photos (full width, taller)
 * - Bigger text (18px for name vs 14-16 desktop)
 * - Touch-friendly buttons (44px minimum height)
 * - More spacing and padding
 * - Collapsible reasoning (starts collapsed on mobile)
 * - Haptic feedback on button tap
 */

import React, { useState } from 'react';
import { Plus, Check, ChevronDown } from 'lucide-react';
import type { SuggestionCardProps } from '../../types';
import { PriorityBadge } from '../sidebar/ai/PriorityBadge';

export function MobileSuggestionCard({ 
  suggestion, 
  isAdded, 
  onAddClick 
}: SuggestionCardProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Truncate reasoning to 2 lines on mobile (~120 chars)
  const reasoningExcerpt = suggestion.reasoning.length > 120
    ? suggestion.reasoning.slice(0, 120) + '...'
    : suggestion.reasoning;

  const shouldShowReadMore = suggestion.reasoning.length > 120;

  const handleAddClick = () => {
    if (!isAdded) {
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      onAddClick(suggestion.placeId);
    }
  };

  const toggleReasoning = () => {
    setIsReasoningExpanded(!isReasoningExpanded);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Photo with priority badge - taller on mobile */}
      <div className="relative aspect-[16/10] bg-gray-200">
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
            <span className="text-5xl">📍</span>
          </div>
        )}
        
        {/* Priority badge - slightly larger on mobile */}
        <div className="absolute top-3 right-3">
          <PriorityBadge priority={suggestion.priority} />
        </div>
      </div>

      {/* Content - more padding on mobile */}
      <div className="p-5 space-y-4">
        {/* Name and metadata - larger text */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">
            {suggestion.placeName}
          </h4>
          <div className="flex items-center gap-2 text-base text-gray-600">
            <span>{suggestion.category}</span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold text-blue-600">
              {suggestion.score.toFixed(1)}
            </span>
          </div>
        </div>

        {/* AI reasoning - base text size for readability */}
        <div className="text-base text-gray-700">
          <p className={isReasoningExpanded ? '' : 'line-clamp-2'}>
            {isReasoningExpanded ? suggestion.reasoning : reasoningExcerpt}
          </p>
          
          {shouldShowReadMore && (
            <button
              onClick={toggleReasoning}
              className="mt-2 text-blue-600 active:text-blue-700 font-medium flex items-center gap-1 text-sm min-h-[44px] -ml-2 pl-2 pr-4"
            >
              {isReasoningExpanded ? 'Show less' : 'Read more'}
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${
                  isReasoningExpanded ? 'rotate-180' : ''
                }`} 
              />
            </button>
          )}
        </div>

        {/* Action button - 44px height for touch */}
        <button
          onClick={handleAddClick}
          disabled={isAdded}
          className={`
            w-full h-11 px-4 rounded-xl font-semibold text-base
            transition-all active:scale-[0.98] flex items-center justify-center gap-2
            ${isAdded
              ? 'bg-green-50 text-green-700 cursor-default'
              : 'bg-blue-600 text-white active:bg-blue-700 shadow-sm active:shadow'
            }
          `}
        >
          {isAdded ? (
            <>
              <Check className="h-5 w-5" />
              Added to Plan
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Add to Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}

