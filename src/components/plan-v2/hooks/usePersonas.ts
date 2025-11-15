import { useState, useEffect, useCallback } from "react";
import type { PersonaType } from "@/domain/plan/models/Persona";
import { PERSONA_TYPES } from "@/domain/plan/models/Persona";
import { getUserPersonas, updatePersonas } from "@/infrastructure/plan/clients/personas";

export interface UsePersonasReturn {
  selected: PersonaType[];
  isLoading: boolean;
  error: string | null;
  togglePersona: (persona: PersonaType) => void;
  setPersonas: (personas: PersonaType[]) => void;
}

/**
 * usePersonas - Manage persona selection state
 *
 * Features:
 * - Loads user's saved persona preferences on mount
 * - Auto-saves changes to server
 * - Ensures at least one persona is always selected (fallback to general_tourist)
 * - Provides loading and error states
 */
export function usePersonas(): UsePersonasReturn {
  const [selected, setSelected] = useState<PersonaType[]>([PERSONA_TYPES.GENERAL_TOURIST]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user personas on mount
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const personas = await getUserPersonas();

      if (personas && personas.length > 0) {
        setSelected(personas);
      }
    } catch (err) {
      console.error("Failed to load personas:", err);
      setError("Failed to load your persona preferences");
      // Keep default persona on error
    } finally {
      setIsLoading(false);
    }
  };

  const savePersonas = async (personas: PersonaType[]) => {
    try {
      await updatePersonas(personas);
    } catch (err) {
      console.error("Failed to save personas:", err);
      setError("Failed to save persona preferences");
    }
  };

  const togglePersona = useCallback((persona: PersonaType) => {
    setSelected((current) => {
      const isSelected = current.includes(persona);

      if (isSelected) {
        // Don't allow removing last persona
        if (current.length === 1) {
          return current;
        }
        // Remove persona
        const newPersonas = current.filter((p) => p !== persona);
        savePersonas(newPersonas);
        return newPersonas;
      } else {
        // Add persona
        const newPersonas = [...current, persona];
        savePersonas(newPersonas);
        return newPersonas;
      }
    });
  }, []);

  const setPersonas = useCallback((personas: PersonaType[]) => {
    // Ensure at least one persona
    const validPersonas = personas.length > 0 ? personas : [PERSONA_TYPES.GENERAL_TOURIST];
    setSelected(validPersonas);
    savePersonas(validPersonas);
  }, []);

  return {
    selected,
    isLoading,
    error,
    togglePersona,
    setPersonas,
  };
}
