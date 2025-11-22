import { PERSONA_FILTER_TYPES } from "@/infrastructure/common/google-maps/constants";
import type { PersonaType } from "@/domain/plan/models";

type PersonaKey = keyof typeof PERSONA_FILTER_TYPES;

/**
 * Convert PersonaType (lowercase kebab-case string) to PersonaKey (uppercase snake_case key)
 * @param persona - The persona type from domain models (e.g., "general-tourist")
 * @returns The corresponding PersonaKey (e.g., "GENERAL_TOURIST") or undefined if not found
 */
export const personaTypeToKey = (persona?: PersonaType): PersonaKey | undefined => {
  if (!persona) return undefined;

  // Convert lowercase "general-tourist" to uppercase "GENERAL_TOURIST"
  const upperKey = persona.toUpperCase().replace(/-/g, "_") as PersonaKey;
  return upperKey in PERSONA_FILTER_TYPES ? upperKey : undefined;
};













