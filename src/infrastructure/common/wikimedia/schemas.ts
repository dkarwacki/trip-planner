import { z } from "zod";

// Wikimedia Commons API extmetadata for image attribution
const ExtMetadataValueSchema = z.object({
  value: z.string().optional(),
  source: z.string().optional(),
  hidden: z.string().optional(),
});

const ExtMetadataSchema = z.object({
  Artist: ExtMetadataValueSchema.optional(),
  LicenseShortName: ExtMetadataValueSchema.optional(),
  UsageTerms: ExtMetadataValueSchema.optional(),
  AttributionRequired: ExtMetadataValueSchema.optional(),
  LicenseUrl: ExtMetadataValueSchema.optional(),
  Credit: ExtMetadataValueSchema.optional(),
  Attribution: ExtMetadataValueSchema.optional(),
});

// Image info structure from Wikimedia API
const ImageInfoSchema = z.object({
  url: z.string().url(),
  descriptionurl: z.string().url().optional(),
  descriptionshorturl: z.string().url().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  size: z.number().int().optional(),
  extmetadata: ExtMetadataSchema.optional(),
});

// Page structure in geosearch response
const PageSchema = z.object({
  pageid: z.number().int(),
  ns: z.number().int(),
  title: z.string(),
  imageinfo: z.array(ImageInfoSchema).optional(),
});

// Main API response schema
export const WikimediaGeosearchResponseSchema = z.object({
  batchcomplete: z.string().optional(),
  continue: z
    .object({
      iistart: z.string().optional(),
      continue: z.string().optional(),
    })
    .optional(),
  query: z.object({
    pages: z.record(z.string(), PageSchema).optional(),
  }),
});

// Export individual schemas for reuse
export const WikimediaImageInfoSchema = ImageInfoSchema;
export const WikimediaPageSchema = PageSchema;
export const WikimediaExtMetadataSchema = ExtMetadataSchema;
