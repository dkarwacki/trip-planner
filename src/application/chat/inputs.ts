import { z } from "zod";
import { PERSONA_TYPES } from "@/domain/models";

const PersonaTypeSchema = z.enum([
  PERSONA_TYPES.GENERAL_TOURIST,
  PERSONA_TYPES.NATURE_LOVER,
  PERSONA_TYPES.FIRST_TIME_VISITOR,
  PERSONA_TYPES.ART_ENTHUSIAST,
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
