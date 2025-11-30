/**
 * Dynamic sidebar component
 * Supports three modes: Discover, Plan, AI
 * Collapsible to icon rail
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Compass, Calendar, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DesktopMode } from "../types";

interface DynamicSidebarProps {
  activeMode: DesktopMode;
  isCollapsed: boolean;
  onModeChange: (mode: DesktopMode) => void;
  onToggleCollapse: () => void;
  children: React.ReactNode;
}

const MODE_CONFIG = {
  discover: {
    id: "discover" as const,
    label: "Discover",
    icon: Compass,
    description: "Find places and attractions",
  },
  plan: {
    id: "plan" as const,
    label: "Plan",
    icon: Calendar,
    description: "Build your itinerary",
  },
  ai: {
    id: "ai" as const,
    label: "AI Assistant",
    icon: Sparkles,
    description: "Get personalized suggestions",
  },
} as const;

export function DynamicSidebar({
  activeMode,
  isCollapsed,
  onModeChange,
  onToggleCollapse,
  children,
}: DynamicSidebarProps) {
  return (
    <TooltipProvider>
      <div
        className={`${
          isCollapsed ? "w-16" : "w-[24rem] lg:w-[28rem]"
        } flex flex-col bg-white border-r shadow-sm transition-all duration-300 ease-in-out relative z-[110] flex-shrink-0`}
      >
        {isCollapsed ? (
          /* Collapsed Icon Rail */
          <div className="flex flex-col h-full" style={{ pointerEvents: "auto" }}>
            {/* Mode Icons */}
            <div className="flex-1 flex flex-col items-center gap-2 py-4" style={{ pointerEvents: "auto" }}>
              {Object.values(MODE_CONFIG).map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;

                return (
                  <Tooltip key={mode.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => {
                          onModeChange(mode.id);
                          // Auto-expand when selecting a mode
                          onToggleCollapse();
                        }}
                        aria-label={mode.label}
                        style={{ pointerEvents: "auto", position: "relative", zIndex: 121 }}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{mode.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Expand Button */}
            <div className="p-2 border-t">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onToggleCollapse}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    aria-label="Expand sidebar"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : (
          /* Expanded Sidebar */
          <>
            {/* Mode Tabs - Sticky Header */}
            <div className="flex-shrink-0 bg-white border-b sticky top-0 z-[120] relative">
              <div className="flex items-center justify-between p-3 relative" style={{ pointerEvents: "auto" }}>
                {/* Mode Tabs */}
                <div className="flex gap-1 flex-1" style={{ pointerEvents: "auto" }}>
                  {Object.values(MODE_CONFIG).map((mode) => {
                    const Icon = mode.icon;
                    const isActive = activeMode === mode.id;

                    return (
                      <Button
                        key={mode.id}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onModeChange(mode.id)}
                        className="flex items-center gap-2 flex-1"
                        style={{ pointerEvents: "auto", position: "relative", zIndex: 121 }}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{mode.label}</span>
                      </Button>
                    );
                  })}
                </div>

                {/* Collapse Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onToggleCollapse}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-2 flex-shrink-0"
                      aria-label="Collapse sidebar"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Collapse Sidebar</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Mode Content */}
            <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
