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

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useMapState } from "../context";
import { cn } from "@/lib/common/utils";

interface FloatingAIButtonProps {
  onOpenChat: () => void;
  isLoading?: boolean;
  hidden?: boolean;
}

export function FloatingAIButton({ onOpenChat, isLoading = false, hidden = false }: FloatingAIButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Periodic pulse animation (every 4 seconds)
  useEffect(() => {
    if (hidden || isLoading) return;

    const pulseInterval = setInterval(() => {
      setShouldPulse(true);
      setTimeout(() => setShouldPulse(false), 600);
    }, 4000);

    return () => clearInterval(pulseInterval);
  }, [hidden, isLoading]);

  if (hidden) {
    return null;
  }

  return (
    <button
      onClick={onOpenChat}
      disabled={isLoading}
      className={cn(
        "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-blue-600 text-white shadow-lg transition-all duration-200",
        "hover:bg-blue-700 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        // Position: bottom-right with safe-area-inset
        "right-4 bottom-20",
        // Entrance animation
        mounted ? "scale-100 opacity-100" : "scale-0 opacity-0",
        // Pulse animation
        shouldPulse && "animate-[pulse_600ms_ease-in-out]"
      )}
      style={{
        bottom: "calc(60px + 20px + env(safe-area-inset-bottom))",
      }}
      aria-label="Get AI suggestions"
    >
      {/* Pulsing ring effect */}
      {shouldPulse && !isLoading && (
        <span
          className="absolute inset-0 rounded-full bg-blue-600 opacity-75 animate-ping"
          style={{ animationDuration: "600ms", animationIterationCount: "1" }}
        />
      )}

      {/* Icon */}
      {isLoading ? <Loader2 className="relative h-6 w-6 animate-spin" /> : <Sparkles className="relative h-6 w-6" />}
    </button>
  );
}
