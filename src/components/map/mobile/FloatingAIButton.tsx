/**
 * Floating AI Button (FAB)
 * Material Design FAB with pulse animation to draw attention
 *
 * Features:
 * - Entrance animation on mount
 * - Subtle pulse every 3-5 seconds
 * - Hides when bottom sheet is fully expanded
 * - Positioned 16px from edges with safe-area-inset awareness
 */

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/common/utils";

interface FloatingAIButtonProps {
  onOpenChat: () => void;
  isLoading?: boolean;
  hidden?: boolean;
}

export function FloatingAIButton({
  onOpenChat,
  isLoading = false,
  hidden = false,
  className,
}: FloatingAIButtonProps & { className?: string }) {
  if (hidden) {
    return null;
  }

  return (
    <button
      onClick={onOpenChat}
      disabled={isLoading}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full",
        "bg-white text-gray-700 shadow-md transition-all duration-200",
        "hover:bg-gray-50 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      aria-label="Get AI suggestions"
    >
      {/* Icon */}
      {isLoading ? <Loader2 className="relative h-5 w-5 animate-spin" /> : <Sparkles className="relative h-5 w-5" />}
    </button>
  );
}
