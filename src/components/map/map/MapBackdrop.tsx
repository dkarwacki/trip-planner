/**
 * Map backdrop overlay
 * Dims map when expanded card is open
 */

import React, { useEffect, useState } from "react";

interface MapBackdropProps {
  isVisible: boolean;
  onClick: () => void;
}

export function MapBackdrop({ isVisible, onClick }: MapBackdropProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      // Delay unmount to allow fade-out animation
      const timer = setTimeout(() => setShouldRender(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black transition-opacity duration-150 ${isVisible ? "opacity-10" : "opacity-0"}`}
      style={{ zIndex: 40 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    />
  );
}
