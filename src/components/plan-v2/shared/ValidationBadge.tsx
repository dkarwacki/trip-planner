import React from "react";
import { CheckCircle2, AlertCircle, Loader2, HelpCircle } from "lucide-react";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";

interface ValidationBadgeProps {
  status?: PlaceSuggestion["validationStatus"];
  size?: "sm" | "md";
}

/**
 * ValidationBadge - Verification status indicator
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
      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500">
        <CheckCircle2 size={iconSize} />
        <span>Verified</span>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle size={iconSize} />
        <span>Not verified</span>
      </div>
    );
  }

  if (status === "partial") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-500">
        <HelpCircle size={iconSize} />
        <span>Partially verified</span>
      </div>
    );
  }

  return null;
}
