import React from "react";
import { Map, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  placeCount: number;
}

/**
 * ExportButton - "Open Trip Map" button
 *
 * Features:
 * - Disabled when no places
 * - Loading state during export
 * - Prominent styling
 * - Shows place count
 */
export function ExportButton({ disabled = false, isLoading = false, onClick, placeCount }: ExportButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full"
      size="lg"
      aria-label={`Open trip map with ${placeCount} places`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Creating trip...
        </>
      ) : (
        <>
          <Map className="mr-2 h-5 w-5" />
          Open Trip Map ({placeCount})
        </>
      )}
    </Button>
  );
}
