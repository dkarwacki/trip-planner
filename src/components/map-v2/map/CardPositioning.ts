/**
 * Utility functions for smart positioning of map overlay cards
 * Ensures cards stay within viewport bounds
 */

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface PositionOptions {
  markerPosition: Position;
  cardSize: Size;
  viewportSize: Size;
  offset?: number;
  preferredSide?: 'top' | 'bottom' | 'left' | 'right';
}

interface PositionResult extends Position {
  side: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Calculate optimal card position that stays within viewport
 */
export function calculateCardPosition({
  markerPosition,
  cardSize,
  viewportSize,
  offset = 12,
  preferredSide = 'right',
}: PositionOptions): PositionResult {
  const margin = 16;

  // Try preferred side first
  const positions = {
    right: {
      x: markerPosition.x + offset,
      y: markerPosition.y - cardSize.height / 2,
      side: 'right' as const,
    },
    left: {
      x: markerPosition.x - cardSize.width - offset,
      y: markerPosition.y - cardSize.height / 2,
      side: 'left' as const,
    },
    bottom: {
      x: markerPosition.x - cardSize.width / 2,
      y: markerPosition.y + offset,
      side: 'bottom' as const,
    },
    top: {
      x: markerPosition.x - cardSize.width / 2,
      y: markerPosition.y - cardSize.height - offset,
      side: 'top' as const,
    },
  };

  // Try preferred side
  const preferredPosition = positions[preferredSide];
  if (!wouldOverflow({ position: preferredPosition, size: cardSize, viewport: viewportSize, margin })) {
    return preferredPosition;
  }

  // Try other sides in order
  const sideOrder: Array<'top' | 'bottom' | 'left' | 'right'> = ['right', 'left', 'bottom', 'top'];
  for (const side of sideOrder) {
    const position = positions[side];
    if (!wouldOverflow({ position, size: cardSize, viewport: viewportSize, margin })) {
      return position;
    }
  }

  // If no position works, constrain to viewport and return preferred
  const constrained = constrainToViewport({
    position: preferredPosition,
    size: cardSize,
    viewport: viewportSize,
    margin,
  });

  return { ...constrained, side: preferredSide };
}

/**
 * Check if position would cause card to overflow viewport
 */
export function wouldOverflow({
  position,
  size,
  viewport,
  margin = 16,
}: {
  position: Position;
  size: Size;
  viewport: Size;
  margin?: number;
}): boolean {
  return (
    position.x < margin ||
    position.y < margin ||
    position.x + size.width > viewport.width - margin ||
    position.y + size.height > viewport.height - margin
  );
}

/**
 * Adjust position to fit within viewport bounds
 */
export function constrainToViewport({
  position,
  size,
  viewport,
  margin = 16,
}: {
  position: Position;
  size: Size;
  viewport: Size;
  margin?: number;
}): Position {
  let { x, y } = position;

  // Constrain horizontally
  if (x < margin) {
    x = margin;
  } else if (x + size.width > viewport.width - margin) {
    x = viewport.width - size.width - margin;
  }

  // Constrain vertically
  if (y < margin) {
    y = margin;
  } else if (y + size.height > viewport.height - margin) {
    y = viewport.height - size.height - margin;
  }

  return { x, y };
}

