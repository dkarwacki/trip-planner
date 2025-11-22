import React from "react";

interface LoadingSkeletonProps {
  variant?: "message" | "conversation" | "place-card" | "itinerary-item";
  count?: number;
}

/**
 * LoadingSkeleton - Skeleton screens for loading states
 *
 * Variants:
 * - message: Loading state for chat messages
 * - conversation: Loading state for conversation list items
 * - place-card: Loading state for place suggestion cards
 * - itinerary-item: Loading state for itinerary items
 */
export function LoadingSkeleton({ variant = "message", count = 1 }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === "message") {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-muted" />
            </div>
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (variant === "conversation") {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </>
    );
  }

  if (variant === "place-card") {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="rounded-lg border bg-card animate-pulse">
            {/* Photo placeholder */}
            <div className="h-48 w-full rounded-t-lg bg-muted" />
            {/* Content */}
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
              <div className="h-10 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (variant === "itinerary-item") {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3 animate-pulse">
            {/* Drag handle */}
            <div className="h-4 w-4 rounded bg-muted" />
            {/* Photo */}
            <div className="h-16 w-16 flex-shrink-0 rounded bg-muted" />
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
            {/* Remove button */}
            <div className="h-8 w-8 rounded bg-muted" />
          </div>
        ))}
      </>
    );
  }

  return null;
}













