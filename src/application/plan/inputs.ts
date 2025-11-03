import { z } from "zod";
import { PERSONA_TYPES } from "@/domain/plan/models";

const PersonaTypeSchema = z.enum([
  PERSONA_TYPES.GENERAL_TOURIST,
  PERSONA_TYPES.NATURE_LOVER,
  PERSONA_TYPES.ART_ENTHUSIAST,
  PERSONA_TYPES.FOODIE_TRAVELER,
  PERSONA_TYPES.ADVENTURE_SEEKER,
  PERSONA_TYPES.DIGITAL_NOMAD,
  PERSONA_TYPES.HISTORY_BUFF,
  PERSONA_TYPES.PHOTOGRAPHY_ENTHUSIAST,
]);

export const ChatRequestInputSchema = z.object({
  message: z.string({ required_error: "message is required" }).min(1, "message cannot be empty"),
  personas: z
    .array(PersonaTypeSchema)
    .min(1, "At least one persona is required")
    .default([PERSONA_TYPES.GENERAL_TOURIST]),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export type ChatRequestInput = z.infer<typeof ChatRequestInputSchema>;
