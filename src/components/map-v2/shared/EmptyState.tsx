import { ReactNode } from "react";
import {
  MapPinIllustration,
  SearchIllustration,
  ClipboardIllustration,
  SparkleIllustration,
  WifiOffIllustration,
  MapCursorIllustration,
  QuestionMapPinIllustration,
} from "./EmptyStateIllustrations";

type IllustrationType = "map-pin" | "search" | "clipboard" | "sparkle" | "wifi-off" | "map-cursor" | "question-map-pin";

interface EmptyStateProps {
  illustration: IllustrationType;
  heading: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

const illustrations: Record<IllustrationType, React.ComponentType<{ className?: string }>> = {
  "map-pin": MapPinIllustration,
  search: SearchIllustration,
  clipboard: ClipboardIllustration,
  sparkle: SparkleIllustration,
  "wifi-off": WifiOffIllustration,
  "map-cursor": MapCursorIllustration,
  "question-map-pin": QuestionMapPinIllustration,
};

/**
 * Reusable empty state component
 *
 * Design principles:
 * - Simple and minimal
 * - Helpful messaging
 * - Consistent structure
 * - Friendly tone
 * - Actionable when possible
 */
export function EmptyState({ illustration, heading, message, action, className = "" }: EmptyStateProps) {
  const Illustration = illustrations[illustration];

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="status"
      aria-label={heading}
    >
      {/* Illustration */}
      <div className="mb-6">
        <Illustration className="h-20 w-20 md:h-24 md:w-24" />
      </div>

      {/* Heading */}
      <h3 className="mb-2 text-lg font-semibold text-foreground md:text-xl">{heading}</h3>

      {/* Message */}
      <p className="mb-6 max-w-md text-sm text-muted-foreground md:text-base">{message}</p>

      {/* Optional action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * Pre-configured empty state variants
 */

interface EmptyStateVariantProps {
  action?: ReactNode;
  className?: string;
}

export function NoPlaceSelected({ action, className }: EmptyStateVariantProps) {
  return (
    <EmptyState
      illustration="map-pin"
      heading="Select a place to explore"
      message="Tap any location on the map to discover nearby attractions and restaurants"
      action={action}
      className={className}
    />
  );
}

export function NoResults({ action, className }: EmptyStateVariantProps) {
  return (
    <EmptyState
      illustration="search"
      heading="No places found"
      message="Try adjusting your filters or search a different area"
      action={action}
      className={className}
    />
  );
}

export function EmptyItinerary({ action, className }: EmptyStateVariantProps) {
  return (
    <EmptyState
      illustration="clipboard"
      heading="Your itinerary is empty"
      message="Start adding places to build your perfect trip"
      action={action}
      className={className}
    />
  );
}

export function NoAIConversation({ placeName, action, className }: EmptyStateVariantProps & { placeName?: string }) {
  return (
    <EmptyState
      illustration="sparkle"
      heading={placeName ? `Ask me anything about ${placeName}` : "Ask me anything"}
      message="I can suggest attractions, restaurants, and hidden gems based on your preferences"
      action={action}
      className={className}
    />
  );
}

export function NoPlaceSelectedAI({ action, className }: EmptyStateVariantProps) {
  return (
    <EmptyState
      illustration="question-map-pin"
      heading="Select a place first"
      message="Choose a location on the map to get personalized suggestions"
      action={action}
      className={className}
    />
  );
}

export function NetworkError({ action, className }: EmptyStateVariantProps) {
  return (
    <EmptyState
      illustration="wifi-off"
      heading="Connection lost"
      message="Check your internet connection and try again"
      action={action}
      className={className}
    />
  );
}

export function NoMarkerSelected({ action, className }: EmptyStateVariantProps) {
  return (
    <EmptyState
      illustration="map-cursor"
      heading="Explore places on the map"
      message="Hover over or tap any marker to see details and add to your plan"
      action={action}
      className={className}
    />
  );
}


