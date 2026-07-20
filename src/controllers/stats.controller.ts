import { Request, Response } from "express";
import { getDb } from "../config/db";

export const statsController = {
  async getStats(_req: Request, res: Response) {
    try {
      const db = getDb();

      const [recipeCount, userCount, reviewCount] = await Promise.all([
        db.collection("recipes").countDocuments(),
        db.collection("users").countDocuments(),
        db.collection("reviews").countDocuments(),
      ]);

      const recipeAgg = await db
        .collection("recipes")
        .aggregate<{
          _id: null;
          uniqueCuisines: string[];
        }>([
          {
            $group: {
              _id: null,
              uniqueCuisines: { $addToSet: "$cuisine" },
            },
          },
        ])
        .toArray();

      const aggData = recipeAgg[0] || { uniqueCuisines: [] };

      res.status(200).json({
        success: true,
        data: {
          recipes: recipeCount,
          users: userCount,
          reviews: reviewCount,
          cuisines: (aggData.uniqueCuisines as string[]).length,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },
};