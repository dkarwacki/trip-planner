import type { PersonaType, GetUserPersonasResponseDTO } from "@/infrastructure/plan/api";

// API response types
interface PersonasSuccessResponse extends GetUserPersonasResponseDTO {}

interface PersonasSaveSuccessResponse {
  success: true;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type PersonasAPIResponse = PersonasSuccessResponse | ErrorResponse;
type SaveAPIResponse = PersonasSaveSuccessResponse | ErrorResponse;

/**
 * Get user's persona preferences from backend
 * Returns empty array if none set
 */
export const getUserPersonas = async (): Promise<PersonaType[]> => {
  const response = await fetch("/api/personas", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load personas: ${response.statusText}`);
  }

  const data: PersonasAPIResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error || "Failed to load personas");
  }

  return data.persona_types;
};

/**
 * Update user's persona preferences in backend
 * Creates or updates (upsert)
 */
export const updatePersonas = async (personas: PersonaType[]): Promise<void> => {
  const response = await fetch("/api/personas", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ persona_types: personas }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update personas: ${response.statusText}`);
  }

  const data: SaveAPIResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error || "Failed to update personas");
  }
};
