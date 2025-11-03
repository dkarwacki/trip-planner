import { Brand } from "effect";

// Branded type for persona
export type PersonaType = string & Brand.Brand<"PersonaType">;
export const PersonaType = Brand.nominal<PersonaType>();

// Available persona types
export const PERSONA_TYPES = {
  GENERAL_TOURIST: PersonaType("general_tourist"),
  NATURE_LOVER: PersonaType("nature_lover"),
  ART_ENTHUSIAST: PersonaType("art_enthusiast"),
  FOODIE_TRAVELER: PersonaType("foodie_traveler"),
  ADVENTURE_SEEKER: PersonaType("adventure_seeker"),
  DIGITAL_NOMAD: PersonaType("digital_nomad"),
  HISTORY_BUFF: PersonaType("history_buff"),
  PHOTOGRAPHY_ENTHUSIAST: PersonaType("photography_enthusiast"),
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
  [PERSONA_TYPES.ART_ENTHUSIAST]: {
    type: PERSONA_TYPES.ART_ENTHUSIAST,
    label: "Art Enthusiast",
    description: "Museums, galleries, and cultural experiences",
    icon: "palette",
  },
  [PERSONA_TYPES.FOODIE_TRAVELER]: {
    type: PERSONA_TYPES.FOODIE_TRAVELER,
    label: "Foodie Traveler",
    description: "Culinary experiences, local cuisine, and food markets",
    icon: "utensils",
  },
  [PERSONA_TYPES.ADVENTURE_SEEKER]: {
    type: PERSONA_TYPES.ADVENTURE_SEEKER,
    label: "Adventure Seeker",
    description: "Extreme sports, hiking trails, and adrenaline activities",
    icon: "mountain",
  },
  [PERSONA_TYPES.DIGITAL_NOMAD]: {
    type: PERSONA_TYPES.DIGITAL_NOMAD,
    label: "Digital Nomad",
    description: "Co-working spaces, cafes with WiFi, and work-friendly spots",
    icon: "laptop",
  },
  [PERSONA_TYPES.HISTORY_BUFF]: {
    type: PERSONA_TYPES.HISTORY_BUFF,
    label: "History Buff",
    description: "Historical sites, monuments, and heritage tours",
    icon: "landmark",
  },
  [PERSONA_TYPES.PHOTOGRAPHY_ENTHUSIAST]: {
    type: PERSONA_TYPES.PHOTOGRAPHY_ENTHUSIAST,
    label: "Photography Enthusiast",
    description: "Scenic viewpoints, Instagram-worthy spots, and unique perspectives",
    icon: "camera",
  },
};

export const getAllPersonas = (): PersonaMetadata[] => Object.values(PERSONA_METADATA);

export const getPersonaMetadata = (type: PersonaType): PersonaMetadata | undefined => {
  return PERSONA_METADATA[type];
};
