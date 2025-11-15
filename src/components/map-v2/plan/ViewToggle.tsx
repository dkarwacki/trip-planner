/**
 * View toggle for different plan organization modes
 * By Hubs (default) | By Category | Timeline (future)
 */

import React, { useState } from 'react';

type PlanViewMode = 'hubs' | 'category' | 'timeline';

export default function ViewToggle() {
  const [activeView, setActiveView] = useState<PlanViewMode>('hubs');

  const views: { id: PlanViewMode; label: string; disabled?: boolean }[] = [
    { id: 'hubs', label: 'By Hubs' },
    { id: 'category', label: 'By Category', disabled: true },
    { id: 'timeline', label: 'Timeline', disabled: true },
  ];

  return (
    <div className="flex gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-2 self-center">
        View:
      </span>
      
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => !view.disabled && setActiveView(view.id)}
            disabled={view.disabled}
            className={`
              rounded-md px-3 py-1 text-sm font-medium transition-colors
              ${activeView === view.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
              ${view.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
            title={view.disabled ? 'Coming soon' : undefined}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}

