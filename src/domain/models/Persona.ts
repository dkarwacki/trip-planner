import { Brand } from "effect";

// Branded type for persona
export type PersonaType = string & Brand.Brand<"PersonaType">;
export const PersonaType = Brand.nominal<PersonaType>();

// Available persona types
export const PERSONA_TYPES = {
  GENERAL_TOURIST: PersonaType("general_tourist"),
  NATURE_LOVER: PersonaType("nature_lover"),
  FIRST_TIME_VISITOR: PersonaType("first_time_visitor"),
  ART_ENTHUSIAST: PersonaType("art_enthusiast"),
} as const;

export interface PersonaMetadata {
  type: PersonaType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

export const PERSONA_METADATA: Record<string, PersonaMetadata> = {
  [PERSONA_TYPES.GENERAL_TOURIST]: {
    type: PERSONA_TYPES.GENERAL_TOURIST,
    label: "General Tourist",
    description: "Popular destinations and well-known attractions",
    icon: "map-pin",
  },
  [PERSONA_TYPES.NATURE_LOVER]: {
    type: PERSONA_TYPES.NATURE_LOVER,
    label: "Nature Lover",
    description: "Outdoor activities, parks, and natural landscapes",
    icon: "tree-pine",
  },
  [PERSONA_TYPES.FIRST_TIME_VISITOR]: {
    type: PERSONA_TYPES.FIRST_TIME_VISITOR,
    label: "First-Time Visitor",
    description: "Must-see spots and comprehensive guidance",
    icon: "compass",
  },
  [PERSONA_TYPES.ART_ENTHUSIAST]: {
    type: PERSONA_TYPES.ART_ENTHUSIAST,
    label: "Art Enthusiast",
    description: "Museums, galleries, and cultural experiences",
    icon: "palette",
  },
};

export const getAllPersonas = (): PersonaMetadata[] => Object.values(PERSONA_METADATA);

export const getPersonaMetadata = (type: PersonaType): PersonaMetadata | undefined => {
  return PERSONA_METADATA[type];
};
