import { z } from "zod";

const chatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const generateRecipeSchema = z.object({
  ingredients: z
    .array(z.string())
    .min(1, "At least one ingredient is required")
    .max(15, "Maximum 15 ingredients allowed"),
  cuisine: z.string().optional(),
  outputLength: z
    .enum(["brief", "detailed", "comprehensive"])
    .default("detailed"),
  messages: z.array(chatMessage).max(20).optional(),
  followUp: z.string().optional(),
});

export const analyzeFoodSchema = z.object({
  imageBase64: z
    .string()
    .min(1, "Image is required")
    .refine(
      (val) => val.startsWith("data:image"),
      "Must be a valid base64 image string starting with data:image",
    ),
  messages: z.array(chatMessage).max(20).optional(),
  followUp: z.string().optional(),
});