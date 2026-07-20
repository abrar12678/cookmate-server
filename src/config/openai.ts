import OpenAI from "openai";
import env from "./env";

// Supports both OpenAI and Groq (free) via OPENAI_BASE_URL env var.
// Groq: set OPENAI_BASE_URL=https://api.groq.com/openai/v1
// OpenAI: leave OPENAI_BASE_URL empty (uses default)
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.AI_BASE_URL || undefined,
});
