/**
 * View toggle - switch between Cards, Grid, and List views
 */

import React from "react";
import type { ViewMode } from "../types";
import { LayoutGrid, Images, List } from "lucide-react";
import { cn } from "@/lib/common/utils";

interface ViewToggleProps {
  activeMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  variant?: "default" | "compact";
}

export function ViewToggle({ activeMode, onChange, variant = "default" }: ViewToggleProps) {
  const modes: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "cards", label: "Cards", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "grid", label: "Grid", icon: <Images className="w-4 h-4" /> },
    { id: "list", label: "List", icon: <List className="w-4 h-4" /> },
  ];

  const isCompact = variant === "compact";

  return (
    <div className={cn("flex items-center gap-1 bg-gray-100 rounded-lg", isCompact ? "p-0.5" : "p-1")} data-testid="view-toggle">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={cn(
            "flex items-center rounded-md transition-all",
            isCompact ? "gap-0 p-1.5" : "gap-2 px-3 py-1.5 text-sm font-medium",
            activeMode === mode.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
          aria-label={`${mode.label} view`}
          aria-pressed={activeMode === mode.id}
          data-testid={`view-toggle-${mode.id}`}
        >
          {mode.icon}
          {!isCompact && <span className="hidden sm:inline">{mode.label}</span>}
        </button>
      ))}
    </div>
  );
}
