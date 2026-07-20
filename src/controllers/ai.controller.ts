import { Request, Response } from "express";
import { openai } from "../config/openai";

function handleServerError(res: Response, error: unknown) {
  const msg = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ success: false, message: msg });
}

export const aiController = {
  async generateRecipe(req: Request, res: Response) {
    try {
      const { ingredients, cuisine, outputLength, messages, followUp } = req.body;

      const detailGuidance: Record<string, string> = {
        brief:
          "Keep instructions concise (3-4 steps). Give a short description.",
        detailed:
          "Provide thorough step-by-step instructions (6-8 steps) with clear technique descriptions.",
        comprehensive:
          "Provide exhaustive instructions (10+ steps) with technique tips, timing cues, and doneness indicators.",
      };

      // Build conversation messages
      const conversationMessages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];

      // System prompt
      conversationMessages.push({
        role: "system",
        content:
          "You are an autonomous AI Chef Agent with memory. You remember the conversation history and use reasoning to analyze ingredients, make decisions about flavor pairings, infer missing culinary context, and synthesize complete recipes. You can adapt and refine recipes based on follow-up questions. Output strict JSON: { title, shortDescription, ingredients: [{name, qty, unit}], instructions: [], cookingTime, difficulty, cuisine, nutrition: {calories, protein, carbs, fat} }. Adapt the detail level based on the requested output length.",
      });

      // Previous conversation history (stripped of images for token efficiency)
      if (Array.isArray(messages) && messages.length > 0) {
        for (const msg of messages) {
          conversationMessages.push({
            role: msg.role,
            content: typeof msg.content === "string"
              ? msg.content.substring(0, 500)
              : JSON.stringify(msg.content).substring(0, 500),
          });
        }
      }

      // Current user message
      if (followUp) {
        conversationMessages.push({
          role: "user",
          content: `Follow-up question about the previous recipe: ${followUp}`,
        });
      } else {
        conversationMessages.push({
          role: "user",
          content: `Generate a recipe with these ingredients: ${JSON.stringify(ingredients)}. Cuisine preference: ${cuisine || "any"}. Detail level: ${outputLength}. ${detailGuidance[outputLength]}`,
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: conversationMessages as Parameters<typeof openai.chat.completions.create>["0"]["messages"],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        res.status(500).json({
          success: false,
          message: "AI returned an empty response",
        });
        return;
      }

      let recipe;
      try {
        recipe = JSON.parse(raw);
      } catch {
        res.status(500).json({
          success: false,
          message: "Failed to generate valid recipe structure",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { recipe },
        message: followUp ? "Follow-up answered successfully" : "Recipe generated successfully",
      });
    } catch (error: unknown) {
      handleServerError(res, error);
    }
  },

  async analyzeFood(req: Request, res: Response) {
    try {
      const { imageBase64, messages, followUp } = req.body;

      const conversationMessages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];

      // System prompt
      conversationMessages.push({
        role: "system",
        content:
          "You are an autonomous Food Analysis Agent with memory. You remember previous analyses and can answer follow-up questions about the food. Use visual reasoning to identify dishes, estimate portions, deduce ingredients, and calculate nutrition. For follow-up questions, provide relevant dietary advice, substitution suggestions, or cooking tips based on the previous analysis. Return strict JSON: { dishName, cuisine, ingredients: [], nutrition: {calories, protein, carbs, fat}, suggestions: [] }.",
      });

      // Previous conversation history
      if (Array.isArray(messages) && messages.length > 0) {
        for (const msg of messages) {
          conversationMessages.push({
            role: msg.role,
            content: typeof msg.content === "string"
              ? msg.content.substring(0, 500)
              : JSON.stringify(msg.content).substring(0, 500),
          });
        }
      }

      // Current user message
      if (followUp) {
        conversationMessages.push({
          role: "user",
          content: `Follow-up question about the previous food analysis: ${followUp}`,
        });
      } else {
        conversationMessages.push({
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
            {
              type: "text",
              text: "Analyze this food image. Identify the dish, estimate ingredients and nutrition, and provide suggestions.",
            },
          ],
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: conversationMessages as Parameters<typeof openai.chat.completions.create>["0"]["messages"],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        res.status(500).json({
          success: false,
          message: "AI returned an empty response",
        });
        return;
      }

      let analysis;
      try {
        analysis = JSON.parse(raw);
      } catch {
        res.status(500).json({
          success: false,
          message: "Failed to generate valid analysis structure",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { analysis },
        message: followUp ? "Follow-up answered successfully" : "Food analyzed successfully",
      });
    } catch (error: unknown) {
      handleServerError(res, error);
    }
  },
};