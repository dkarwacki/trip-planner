import type { PlaceSuggestion } from "@/domain/models";

interface NarrativeDisplayProps {
  content: string;
  places?: PlaceSuggestion[];
}

/**
 * Find place ID by matching name (case-insensitive, handles variations)
 */
function findPlaceId(placeName: string, places: PlaceSuggestion[]): string | null {
  if (!places || places.length === 0) return null;

  // Try exact match first
  const exactMatch = places.find((p) => p.name.toLowerCase() === placeName.toLowerCase());
  if (exactMatch) return exactMatch.id;

  // Try partial match (narrative might use shortened names)
  const partialMatch = places.find(
    (p) =>
      p.name.toLowerCase().includes(placeName.toLowerCase()) ||
      placeName.toLowerCase().includes(p.name.split(",")[0].trim().toLowerCase())
  );

  return partialMatch?.id ?? null;
}

/**
 * Scroll to a place card with smooth animation and proper offset
 * Works with Radix UI ScrollArea by finding the viewport container
 */
function scrollToPlace(placeId: string) {
  const element = document.getElementById(`place-${placeId}`);
  if (!element) return;

  // Find the ScrollArea viewport (Radix UI uses data-radix-scroll-area-viewport)
  const viewport = element.closest("[data-radix-scroll-area-viewport]") as HTMLElement;

  if (viewport) {
    // Calculate the element's position relative to the viewport
    const elementRect = element.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();

    // Calculate the scroll position to center the element
    const scrollTop =
      viewport.scrollTop + elementRect.top - viewportRect.top - viewportRect.height / 2 + elementRect.height / 2;

    // Smooth scroll the viewport
    viewport.scrollTo({
      top: scrollTop,
      behavior: "smooth",
    });
  } else {
    // Fallback to standard scrollIntoView if not in a ScrollArea
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  // Add a subtle highlight effect
  element.classList.add("ring-2", "ring-primary", "ring-offset-2");
  setTimeout(() => {
    element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
  }, 2000);
}

/**
 * Parse narrative text and render with clickable place names
 */
function renderNarrative(content: string, places: PlaceSuggestion[]): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const segments = content.split(/(\*\*[^*]+\*\*)/g);

  segments.forEach((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      // This is a place name - make it clickable
      const placeName = segment.slice(2, -2).trim();
      const placeId = findPlaceId(placeName, places);

      if (placeId) {
        parts.push(
          <button
            key={`place-${index}`}
            onClick={() => scrollToPlace(placeId)}
            className="font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 hover:text-blue-800 px-2 py-0.5 rounded cursor-pointer transition-all"
          >
            {placeName}
          </button>
        );
      } else {
        // If we can't find the place ID, render as plain text with styling
        parts.push(
          <span key={`place-${index}`} className="font-semibold">
            {placeName}
          </span>
        );
      }
    } else if (segment.trim()) {
      // Regular text
      parts.push(<span key={`text-${index}`}>{segment}</span>);
    }
  });

  return parts;
}

export default function NarrativeDisplay({ content, places = [] }: NarrativeDisplayProps) {
  // If content doesn't contain bold markers, render as plain text
  if (!content.includes("**")) {
    return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
  }

  return (
    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
      {renderNarrative(content, places)}
    </p>
  );
}
