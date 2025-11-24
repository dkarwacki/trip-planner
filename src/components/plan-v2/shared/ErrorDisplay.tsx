import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  /** Error message to display */
  message: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show as inline (border/background) or just text */
  variant?: "inline" | "standalone";
}

/**
 * ErrorDisplay - Reusable error display with retry action
 *
 * Features:
 * - Clear error icon and message
 * - Optional retry button
 * - Multiple size variants
 * - Inline or standalone styling
 */
export function ErrorDisplay({ message, onRetry, size = "md", variant = "inline" }: ErrorDisplayProps) {
  const iconSize = size === "sm" ? 16 : size === "md" ? 20 : 24;
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  const containerClasses = variant === "inline" ? "rounded-lg border border-destructive/50 bg-destructive/10 p-4" : "";

  return (
    <div className={containerClasses}>
      <div className="flex items-start gap-3">
        <AlertCircle size={iconSize} className="flex-shrink-0 text-destructive" aria-hidden="true" />
        <div className="flex-1 space-y-2">
          <p className={`text-destructive ${textSize}`} role="alert">
            {message}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size={size === "md" ? "default" : size}
              onClick={onRetry}
              className="gap-2"
              aria-label="Retry action"
            >
              <RefreshCw size={14} />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
