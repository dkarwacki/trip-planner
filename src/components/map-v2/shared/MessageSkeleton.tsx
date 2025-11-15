import { Skeleton, SkeletonText } from "./Skeleton";

interface MessageSkeletonProps {
  /** Message type */
  type?: 'user' | 'ai' | 'ai-with-cards';
  className?: string;
}

/**
 * Skeleton for chat messages
 * Different variants for user messages, AI messages, and AI messages with suggestion cards
 */
export function MessageSkeleton({ type = 'ai', className = "" }: MessageSkeletonProps) {
  if (type === 'user') {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[80%] space-y-2 rounded-lg bg-primary/10 p-3">
          <SkeletonText width={['90%', '75%']} />
        </div>
      </div>
    );
  }

  if (type === 'ai-with-cards') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Message text */}
        <div className="space-y-2 rounded-lg bg-muted p-3">
          <SkeletonText width={['95%', '88%', '92%']} />
        </div>

        {/* Suggestion cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-border">
            <Skeleton width="100%" height="120px" variant="rectangular" className="rounded-none" />
            <div className="space-y-2 p-3">
              <SkeletonText width={['80%']} />
              <SkeletonText width={['60%']} />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Skeleton width="100%" height="120px" variant="rectangular" className="rounded-none" />
            <div className="space-y-2 p-3">
              <SkeletonText width={['80%']} />
              <SkeletonText width={['60%']} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default AI message
  return (
    <div className={`space-y-2 rounded-lg bg-muted p-3 ${className}`}>
      <SkeletonText width={['95%', '88%', '70%']} />
    </div>
  );
}

