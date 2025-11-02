interface NarrativeDisplayProps {
  content: string;
}

/**
 * Create URL-safe ID from place name
 */
function createPlaceId(name: string): string {
  return `place-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

/**
 * Scroll to a place card with smooth animation and proper offset
 */
function scrollToPlace(placeId: string) {
  const element = document.getElementById(placeId);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Add a subtle highlight effect
    element.classList.add("ring-2", "ring-primary", "ring-offset-2");
    setTimeout(() => {
      element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
    }, 2000);
  }
}

/**
 * Parse narrative text and render with clickable place names
 */
function renderNarrative(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const segments = content.split(/(\*\*[^*]+\*\*)/g);

  segments.forEach((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      // This is a place name - make it clickable
      const placeName = segment.slice(2, -2).trim();
      const placeId = createPlaceId(placeName);

      parts.push(
        <button
          key={`place-${index}`}
          onClick={() => scrollToPlace(placeId)}
          className="font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 hover:text-blue-800 px-2 py-0.5 rounded cursor-pointer transition-all"
        >
          {placeName}
        </button>
      );
    } else if (segment.trim()) {
      // Regular text
      parts.push(<span key={`text-${index}`}>{segment}</span>);
    }
  });

  return parts;
}

export default function NarrativeDisplay({ content }: NarrativeDisplayProps) {
  // If content doesn't contain bold markers, render as plain text
  if (!content.includes("**")) {
    return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
  }

  return (
    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{renderNarrative(content)}</p>
  );
}
