import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton (CSS value) */
  width?: string;
  /** Height of the skeleton (CSS value) */
  height?: string;
  /** Shape variant */
  variant?: "rectangular" | "circular" | "text";
  /** Disable animation */
  noAnimation?: boolean;
}

/**
 * Base skeleton component with shimmer animation
 *
 * Features:
 * - Shimmer animation (left-to-right gradient sweep)
 * - Configurable shape and size
 * - Matches component layouts
 */
export function Skeleton({
  width,
  height,
  variant = "rectangular",
  noAnimation = false,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    rectangular: "rounded-md",
    circular: "rounded-full",
    text: "rounded",
  };

  const defaultHeight = variant === "text" ? "1em" : undefined;

  return (
    <div
      className={`
        bg-muted
        ${variantClasses[variant]}
        ${!noAnimation ? "animate-shimmer" : ""}
        ${className}
      `}
      style={{
        width,
        height: height || defaultHeight,
        backgroundImage: !noAnimation
          ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)"
          : undefined,
        backgroundSize: !noAnimation ? "200% 100%" : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton variant for text lines
 */
export function SkeletonText({
  lines = 1,
  width = "100%",
  className = "",
}: {
  lines?: number;
  width?: string | string[];
  className?: string;
}) {
  const widths = Array.isArray(width) ? width : Array(lines).fill(width);

  return (
    <div className={`space-y-2 ${className}`}>
      {widths.map((w, i) => (
        <Skeleton key={i} variant="text" width={w} height="1em" />
      ))}
    </div>
  );
}


