import React from "react";
import {
  MapPin,
  TreePine,
  Palette,
  Utensils,
  Mountain,
  Laptop,
  Landmark,
  Camera,
  type LucideIcon,
} from "lucide-react";
import type { PersonaType } from "@/domain/plan/models/Persona";
import { getPersonaMetadata } from "@/domain/plan/models/Persona";

interface PersonaChipProps {
  persona: PersonaType;
  isSelected: boolean;
  onToggle: (persona: PersonaType) => void;
  showLabel?: boolean;
  size?: "sm" | "md";
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  "map-pin": MapPin,
  "tree-pine": TreePine,
  palette: Palette,
  utensils: Utensils,
  mountain: Mountain,
  laptop: Laptop,
  landmark: Landmark,
  camera: Camera,
};

/**
 * PersonaChip - Individual persona badge component
 *
 * Features:
 * - Displays persona icon and optional label
 * - Shows selected/unselected state
 * - Supports different sizes (sm, md)
 * - Accessible with proper ARIA attributes
 */
export function PersonaChip({
  persona,
  isSelected,
  onToggle,
  showLabel = true,
  size = "md",
}: PersonaChipProps) {
  const metadata = getPersonaMetadata(persona);

  if (!metadata) {
    return null;
  }

  const IconComponent = iconMap[metadata.icon];
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      onClick={() => onToggle(persona)}
      className={`
        inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all
        ${size === "sm" ? "text-xs" : "text-sm"}
        ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      `}
      aria-label={`${metadata.label} persona${isSelected ? " (selected)" : ""}`}
      aria-pressed={isSelected}
      title={metadata.description}
    >
      {IconComponent && <IconComponent size={iconSize} />}
      {showLabel && <span>{metadata.label}</span>}
    </button>
  );
}
