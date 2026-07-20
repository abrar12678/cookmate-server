import { Request, Response } from "express";
import { getDb } from "../config/db";
import { ObjectId } from "mongodb";

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

  async getTestimonials(_req: Request, res: Response) {
    try {
      const db = getDb();

      const reviews = await db
        .collection("reviews")
        .aggregate<{
          _id: ObjectId;
          recipeId: ObjectId;
          userId: ObjectId;
          rating: number;
          review: string;
          createdAt: Date;
          userName: string;
          recipeTitle: string;
        }>([
          { $match: { rating: { $gte: 4 }, review: { $ne: "" } } },
          { $sort: { rating: -1, createdAt: -1 } },
          { $limit: 6 },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $lookup: {
              from: "recipes",
              localField: "recipeId",
              foreignField: "_id",
              as: "recipeDoc",
            },
          },
          {
            $addFields: {
              userName: {
                $ifNull: [{ $arrayElemAt: ["$userDoc.name", 0] }, "Anonymous"],
              },
              recipeTitle: {
                $ifNull: [
                  { $arrayElemAt: ["$recipeDoc.title", 0] },
                  "Unknown Recipe",
                ],
              },
            },
          },
          { $project: { userDoc: 0, recipeDoc: 0 } },
        ])
        .toArray();

      const testimonials = reviews.map((r) => ({
        comment: r.review,
        name: r.userName,
        role: `Reviewed ${r.recipeTitle}`,
        stars: r.rating,
      }));

      res.status(200).json({
        success: true,
        data: { testimonials },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },
};
