import React from "react";
import { CheckCircle2, AlertCircle, Loader2, HelpCircle } from "lucide-react";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";

interface ValidationBadgeProps {
  status?: PlaceSuggestion["validationStatus"];
  size?: "sm" | "md";
}

/**
 * ValidationBadge - Verification status indicator with hover tooltips
 *
 * States:
 * - verified: Green checkmark
 * - not_found: Red warning
 * - partial: Yellow help icon
 * - undefined: Loading spinner
 */
export function ValidationBadge({ status, size = "sm" }: ValidationBadgeProps) {
  const iconSize = size === "sm" ? 14 : 16;

  if (!status) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={iconSize} className="animate-spin" />
        <span>Verifying...</span>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="group relative flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500">
          <CheckCircle2 size={iconSize} />
          <span>Verified</span>
        </div>
        {/* Hover description tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden w-56 rounded-md bg-popover p-2 text-xs text-popover-foreground shadow-md border group-hover:block z-20">
          This place has been confirmed through Google Places and includes accurate location data, photos, and details.
          <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 border-b border-r bg-popover border-inherit"></div>
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="group relative flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle size={iconSize} />
          <span>Not verified</span>
        </div>
        {/* Hover description tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden w-56 rounded-md bg-popover p-2 text-xs text-popover-foreground shadow-md border group-hover:block z-20">
          This place could not be verified in Google Places. The location or details may be inaccurate.
          <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 border-b border-r bg-popover border-inherit"></div>
        </div>
      </div>
    );
  }

  if (status === "partial") {
    return (
      <div className="group relative flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-500">
          <HelpCircle size={iconSize} />
          <span>Partially verified</span>
        </div>
        {/* Hover description tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden w-56 rounded-md bg-popover p-2 text-xs text-popover-foreground shadow-md border group-hover:block z-20">
          This place was found in Google Places but some information may be incomplete or approximate.
          <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 border-b border-r bg-popover border-inherit"></div>
        </div>
      </div>
    );
  }

  return null;
}
