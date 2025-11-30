import React from "react";
import { PersonaChip } from "./PersonaChip";
import { getAllPersonas, type PersonaType } from "@/domain/plan/models/Persona";
import type { PersonaSelectorProps } from "../types";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

/**
 * PersonaSelector - Desktop persona selector
 *
 * Features:
 * - Displays all available personas as chips
 * - Multi-select with visual feedback
 * - Always visible at top of chat area
 * - Shows loading state while fetching preferences
 * - Supports read-only and filtered views
 */
export function PersonaSelector({
  selected,
  onChange,
  isLoading = false,
  readOnly = false,
  showOnlySelected = false,
}: PersonaSelectorProps) {
  const allPersonas = getAllPersonas();

  const handleToggle = (persona: PersonaType) => {
    if (readOnly) return;

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
      <div className="flex items-center justify-center gap-2 p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading personas...</span>
      </div>
    );
  }

  const displayedPersonas = showOnlySelected ? allPersonas.filter((p) => selected.includes(p.type)) : allPersonas;

  // When showing only selected (in header), we don't show the title if empty (though it shouldn't be empty there)
  if (showOnlySelected && displayedPersonas.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium text-muted-foreground">Travel Style</div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {displayedPersonas.map((persona) => (
            <PersonaChip
              key={persona.type}
              layoutId={`persona-${persona.type}`}
              persona={persona.type}
              isSelected={selected.includes(persona.type)}
              onToggle={handleToggle}
              showLabel={true}
              size="md"
              disabled={readOnly}
            />
          ))}
        </AnimatePresence>
      </div>
      {!readOnly && selected.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select at least one travel style to get personalized suggestions
        </p>
      )}
    </div>
  );
}
