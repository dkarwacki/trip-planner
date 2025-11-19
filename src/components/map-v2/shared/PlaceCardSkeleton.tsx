import { Skeleton, SkeletonText } from "./Skeleton";

interface PlaceCardSkeletonProps {
  /** Card layout variant */
  variant?: "grid" | "list";
  className?: string;
}

/**
 * Skeleton for PlaceCard component
 * Matches the exact layout of the real component
 */
export function PlaceCardSkeleton({ variant = "grid", className = "" }: PlaceCardSkeletonProps) {
  if (variant === "list") {
    return (
      <div className={`flex gap-3 rounded-lg border border-border bg-card p-3 ${className}`}>
        {/* Photo */}
        <Skeleton width="96px" height="96px" variant="rectangular" />

        {/* Content */}
        <div className="flex-1 space-y-2">
          <SkeletonText width={["80%"]} />
          <SkeletonText width={["60%"]} />
          <SkeletonText width={["70%"]} />
        </div>

        {/* Action button */}
        <div className="flex items-center">
          <Skeleton width="80px" height="32px" variant="rectangular" />
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-card ${className}`}>
      {/* Photo */}
      <Skeleton width="100%" height="200px" variant="rectangular" className="rounded-none" />

      {/* Content */}
      <div className="space-y-2 p-4">
        <SkeletonText width={["85%"]} />
        <SkeletonText width={["65%"]} />
        <SkeletonText width={["75%"]} />

        {/* Button */}
        <div className="pt-2">
          <Skeleton width="100%" height="36px" variant="rectangular" />
        </div>
      </div>
    </div>
  );
}









