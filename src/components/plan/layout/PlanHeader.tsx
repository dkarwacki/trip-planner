import React from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import type { SaveStatus } from "../types";
import { UserMenuDropdown, type AuthUser } from "@/components/auth";

interface PlanHeaderProps {
  saveStatus: SaveStatus;
  onRetrySync?: () => void;
  conversationId?: string | null;
  user?: AuthUser;
}

export function PlanHeader({ saveStatus, onRetrySync, user }: PlanHeaderProps) {
  return (
    <header
      className="h-14 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-[110] relative"
      data-testid="plan-header"
    >
      {/* Left: Branding */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a href="/" className="flex items-center gap-2" data-testid="logo-link">
          <h1 className="text-lg font-bold text-gray-900">Trip Planner</h1>
        </a>
        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded" data-testid="plan-badge">
          Plan
        </span>
      </div>

      {/* Right: Save Status & User Menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0" data-testid="save-status-container">
          {saveStatus === "saving" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Check className="h-3.5 w-3.5" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Error saving</span>
              {onRetrySync && (
                <button onClick={onRetrySync} className="underline hover:no-underline font-medium">
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        {user && <UserMenuDropdown user={user} />}
      </div>
    </header>
  );
}
