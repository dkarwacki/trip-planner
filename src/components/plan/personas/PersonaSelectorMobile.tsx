import React, { useState } from "react";
import {
  MapPin,
  TreePine,
  Palette,
  Utensils,
  Mountain,
  Laptop,
  Landmark,
  Camera,
  ChevronDown,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { getAllPersonas, getPersonaMetadata, type PersonaType } from "@/domain/plan/models/Persona";
import type { PersonaSelectorProps } from "../types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
 * PersonaSelectorMobile - Mobile-optimized collapsible persona selector
 *
 * Features:
 * - Collapsed: Shows selected count and icons
 * - Expanded: Full persona cards with labels and descriptions
 * - Touch-friendly tap targets
 * - Prevents deselecting last persona
 */
export function PersonaSelectorMobile({ selected, onChange, isLoading = false }: PersonaSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      {/* Collapsed State - Shows selected count and icons */}
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md p-2 hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Travel Style ({selected.length})
          </span>
          <div className="flex gap-1 overflow-hidden">
            {selected.slice(0, 4).map((personaType) => {
              const metadata = getPersonaMetadata(personaType);
              if (!metadata) return null;
              const IconComponent = iconMap[metadata.icon];
              return (
                <div
                  key={personaType}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0"
                  title={metadata.label}
                >
                  {IconComponent && <IconComponent size={14} />}
                </div>
              );
            })}
            {selected.length > 4 && (
              <div className="flex h-6 w-6 items-center justify-center text-xs text-muted-foreground">
                +{selected.length - 4}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>

      {/* Expanded State - Full persona cards */}
      <CollapsibleContent>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {allPersonas.map((persona) => {
            const isSelected = selected.includes(persona.type);
            const IconComponent = iconMap[persona.icon];

            return (
              <button
                key={persona.type}
                onClick={() => handleToggle(persona.type)}
                className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all min-h-[88px] ${
                  isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-input bg-background hover:bg-accent"
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {IconComponent && <IconComponent size={16} />}
                  </div>
                  <span className="text-sm font-medium leading-tight">{persona.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{persona.description}</p>
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
