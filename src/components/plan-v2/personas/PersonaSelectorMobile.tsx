import React from "react";
import { PersonaChip } from "./PersonaChip";
import { getAllPersonas, type PersonaType } from "@/domain/plan/models/Persona";
import type { PersonaSelectorProps } from "../types";
import { Loader2 } from "lucide-react";

/**
 * PersonaSelectorMobile - Mobile-optimized persona selector
 *
 * Features:
 * - Compact horizontal scrolling layout
 * - Icon-only chips to save space
 * - Displays in chat header
 * - Touch-friendly sizing
 */
export function PersonaSelectorMobile({
  selected,
  onChange,
  isLoading = false,
}: PersonaSelectorProps) {
  const allPersonas = getAllPersonas();

  const handleToggle = (persona: PersonaType) => {
    const isSelected = selected.includes(persona);

    if (isSelected) {
      // Don't allow removing last persona
      if (selected.length === 1) {
        return;
      }
      onChange(selected.filter((p) => p !== persona));
    } else {
      onChange([...selected, persona]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium text-muted-foreground">Travel Style</div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {allPersonas.map((persona) => (
          <PersonaChip
            key={persona.type}
            persona={persona.type}
            isSelected={selected.includes(persona.type)}
            onToggle={handleToggle}
            showLabel={false}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}
