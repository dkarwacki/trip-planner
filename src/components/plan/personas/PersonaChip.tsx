import React from "react";
import { MapPin, TreePine, Palette, Utensils, Mountain, Laptop, Landmark, Camera, type LucideIcon } from "lucide-react";
import type { PersonaType } from "@/domain/plan/models/Persona";
import { getPersonaMetadata } from "@/domain/plan/models/Persona";
import { motion } from "framer-motion";

interface PersonaChipProps {
  persona: PersonaType;
  isSelected: boolean;
  onToggle?: (persona: PersonaType) => void;
  showLabel?: boolean;
  size?: "sm" | "md";
  layoutId?: string;
  className?: string;
  disabled?: boolean;
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
 * - Animated using framer-motion
 */
export function PersonaChip({
  persona,
  isSelected,
  onToggle,
  showLabel = true,
  size = "md",
  layoutId,
  className = "",
  disabled = false,
}: PersonaChipProps) {
  const metadata = getPersonaMetadata(persona);

  if (!metadata) {
    return null;
  }

  const IconComponent = iconMap[metadata.icon];
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <motion.button
      layoutId={layoutId}
      onClick={() => !disabled && onToggle?.(persona)}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors
        ${size === "sm" ? "text-xs" : "text-sm"}
        ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
        }
        ${disabled ? "cursor-default opacity-90" : "cursor-pointer"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        ${className}
      `}
      aria-label={`${metadata.label} persona${isSelected ? " (selected)" : ""}`}
      aria-pressed={isSelected}
      title={metadata.description}
      initial={false}
      animate={{
        backgroundColor: isSelected ? "var(--color-primary)" : "var(--color-background)",
        color: isSelected ? "var(--color-primary-foreground)" : "var(--color-foreground)",
        borderColor: isSelected ? "var(--color-primary)" : "var(--color-input)",
      }}
      transition={{ duration: 0.2 }}
    >
      <span className="flex items-center gap-2">
        {IconComponent && <IconComponent size={iconSize} />}
        {showLabel && <span>{metadata.label}</span>}
      </span>
    </motion.button>
  );
}
