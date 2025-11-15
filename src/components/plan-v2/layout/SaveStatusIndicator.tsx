import React from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { SaveStatus } from "../types";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

/**
 * SaveStatusIndicator - Displays current save status
 *
 * States:
 * - idle: No status shown
 * - saving: Spinner with "Saving..." text
 * - saved: Checkmark with "Saved" text (auto-hide after 2s)
 * - error: Warning icon with "Save failed" text
 */
export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
          <span className="text-muted-foreground">Saved</span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Save failed</span>
        </>
      )}
    </div>
  );
}
