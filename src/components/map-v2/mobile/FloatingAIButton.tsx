/**
 * Floating AI Button (FAB)
 * Material Design FAB with pulse animation to draw attention
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useMapState } from '../context';
import { cn } from '@/lib/common/utils';

export function FloatingAIButton() {
  const { setActiveMode } = useMapState();

  const handleClick = () => {
    setActiveMode('ai');
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group relative flex h-14 w-14 items-center justify-center rounded-full',
        'bg-blue-600 text-white shadow-lg transition-all',
        'hover:bg-blue-700 hover:shadow-xl',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50',
        'active:scale-95'
      )}
      aria-label="Open AI chat"
    >
      {/* Pulse Animation */}
      <span className="absolute inset-0 rounded-full bg-blue-600 opacity-0 animate-ping" />
      
      {/* Icon */}
      <Sparkles className="relative h-6 w-6" />
    </button>
  );
}

