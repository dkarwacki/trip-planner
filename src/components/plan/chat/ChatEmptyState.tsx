import React from "react";
import { MessageCircle } from "lucide-react";
import { getAllPersonas, type PersonaType } from "@/domain/plan/models/Persona";
import { PersonaChip } from "../personas/PersonaChip";

interface ChatEmptyStateProps {
  selectedPersonas?: PersonaType[];
  onPersonaChange?: (personas: PersonaType[]) => void;
}

/**
 * ChatEmptyState - Welcome message when chat is empty
 *
 * Features:
 * - Friendly welcome message
 * - Interactive Travel Style selector
 * - Encourages persona selection before starting
 */
export function ChatEmptyState({ selectedPersonas = [], onPersonaChange }: ChatEmptyStateProps) {
  const allPersonas = getAllPersonas();

  const handleToggle = (persona: PersonaType) => {
    if (!onPersonaChange) return;

    const isSelected = selectedPersonas.includes(persona);
    if (isSelected) {
      if (selectedPersonas.length === 1) return; // Prevent removing last one
      onPersonaChange(selectedPersonas.filter((p) => p !== persona));
    } else {
      onPersonaChange([...selectedPersonas, persona]);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center overflow-y-auto">
      <div className="mb-6 rounded-full bg-primary/10 p-6">
        <MessageCircle className="h-12 w-12 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-semibold">Start Planning Your Trip</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Select your travel style and tell me about your dream destination.
      </p>

      <div className="w-full max-w-3xl mb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {allPersonas.map((persona) => {
            const isSelected = selectedPersonas.includes(persona.type);
            return (
              <div key={persona.type} className="group relative">
                <PersonaChip
                  layoutId={`persona-${persona.type}`}
                  persona={persona.type}
                  isSelected={isSelected}
                  onToggle={handleToggle}
                  showLabel={true}
                  size="md"
                  className="relative z-10"
                />

                {/* Hover description tooltip */}
                <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded-md bg-popover p-2 text-xs text-popover-foreground shadow-md border group-hover:block z-20">
                  {persona.description}
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r bg-popover border-inherit"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Type your request below. For example: <br className="hidden sm:block" />
        &quot;I&apos;m planning a 7-day trip to Italy. Can you suggest some towns to visit in Tuscany?&quot;
      </p>
    </div>
  );
}
