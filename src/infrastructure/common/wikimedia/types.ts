import { z } from "zod";
import {
  WikimediaGeosearchResponseSchema,
  WikimediaImageInfoSchema,
  WikimediaPageSchema,
  WikimediaExtMetadataSchema,
} from "./schemas";

// Infer types from Zod schemas
export type WikimediaGeosearchResponse = z.infer<typeof WikimediaGeosearchResponseSchema>;
export type WikimediaImageInfo = z.infer<typeof WikimediaImageInfoSchema>;
export type WikimediaPage = z.infer<typeof WikimediaPageSchema>;
export type WikimediaExtMetadata = z.infer<typeof WikimediaExtMetadataSchema>;

