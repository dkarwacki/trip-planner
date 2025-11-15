/**
 * Mobile view toggle dropdown
 * Allows switching between different view modes (By Hubs, By Day, By Category)
 * For now, only "By Hubs" is implemented
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileViewToggleProps {
  currentView?: 'hubs' | 'days' | 'category';
  onViewChange?: (view: 'hubs' | 'days' | 'category') => void;
}

export function MobileViewToggle({ 
  currentView = 'hubs', 
  onViewChange 
}: MobileViewToggleProps) {
  const viewLabels = {
    hubs: 'By Hubs',
    days: 'By Day',
    category: 'By Category',
  };

  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
      onClick={() => {
        // Future: Open dropdown menu
        console.log('View toggle clicked');
      }}
    >
      <span>{viewLabels[currentView]}</span>
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

