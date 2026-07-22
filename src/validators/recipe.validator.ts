import { z } from "zod";

export const createRecipeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters"),
  fullDescription: z
    .string()
    .min(20, "Full description must be at least 20 characters"),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        qty: z.string(),
        unit: z.string(),
      }),
    )
    .min(1, "At least one ingredient is required"),
  instructions: z
    .array(z.string())
    .min(1, "At least one instruction step is required"),
  cuisine: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  cookingTime: z.number(),
  servings: z.number(),
  image: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : undefined))
    .pipe(z.string().url().optional()),
});