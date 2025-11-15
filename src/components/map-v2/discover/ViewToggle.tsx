/**
 * View toggle - switch between Cards, Grid, and List views
 */

import React from 'react';
import type { ViewMode } from '../types';
import { LayoutGrid, Images, List } from 'lucide-react';

interface ViewToggleProps {
  activeMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ activeMode, onChange }: ViewToggleProps) {
  const modes: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
    { id: 'cards', label: 'Cards', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'grid', label: 'Grid', icon: <Images className="w-4 h-4" /> },
    { id: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${
              activeMode === mode.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
          aria-label={`${mode.label} view`}
          aria-pressed={activeMode === mode.id}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

