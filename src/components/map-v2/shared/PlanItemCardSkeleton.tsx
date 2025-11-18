import { Skeleton, SkeletonText } from "./Skeleton";

interface PlanItemCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton for PlanItemCard component
 * Matches the plan item card layout with banner and collapsible sections
 */
export function PlanItemCardSkeleton({ className = "" }: PlanItemCardSkeletonProps) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-card ${className}`}>
      {/* Banner photo (16:3 aspect ratio) */}
      <Skeleton width="100%" height="120px" variant="rectangular" className="rounded-none" />

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Place name and count */}
        <div className="space-y-2">
          <SkeletonText width={["60%"]} />
          <SkeletonText width={["45%"]} />
        </div>

        {/* Section 1 header */}
        <div className="flex items-center gap-2">
          <Skeleton width="16px" height="16px" variant="rectangular" />
          <SkeletonText width={["40%"]} />
        </div>

        {/* Section 1 items */}
        <div className="space-y-2 pl-6">
          <SkeletonText width={["90%", "85%", "80%"]} />
        </div>

        {/* Section 2 header */}
        <div className="flex items-center gap-2">
          <Skeleton width="16px" height="16px" variant="rectangular" />
          <SkeletonText width={["40%"]} />
        </div>

        {/* Action button */}
        <Skeleton width="100%" height="36px" variant="rectangular" />
      </div>
    </div>
  );
}


