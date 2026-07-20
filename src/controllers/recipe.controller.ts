import { Request, Response } from "express";
import { getDb } from "../config/db";
import { ObjectId } from "mongodb";
import { createRecipeSchema } from "../validators/recipe.validator";

/* ──────────────────────────────────────────────
   MongoDB Document Types (server-side)
   ────────────────────────────────────────────── */

interface RecipeDocument {
  _id: ObjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image?: string;
  cuisine: string;
  difficulty: string;
  cookingTime: number;
  servings: number;
  ingredients: Array<{ name: string; qty: string; unit: string }>;
  instructions: string[];
  dietaryTags?: string[];
  rating: number;
  reviewCount: number;
  createdBy: ObjectId;
  createdAt: Date;
}

interface ReviewDocument {
  _id: ObjectId;
  recipeId: ObjectId;
  userId: ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
}

interface FavoriteDocument {
  _id: ObjectId;
  userId: ObjectId;
  recipeId: ObjectId;
  createdAt: Date;
}

function errorResponse(res: Response, status: number, message: string) {
  res.status(status).json({ success: false, message });
}

/** Escape special regex characters to prevent ReDoS / $expr injection */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSafeId(doc: { _id: ObjectId }): string {
  return doc._id.toString();
}

export const recipeController = {
  async getRecipes(req: Request, res: Response) {
    try {
      const db = getDb();
      const recipes = db.collection<RecipeDocument>("recipes");

      const {
        search,
        cuisine,
        difficulty,
        dietary,
        sortBy = "newest",
        page = "1",
        limit = "12",
      } = req.query;

      const query: Record<string, unknown> = {};

      if (search) {
        const safe = escapeRegex(search as string);
        query.$or = [
          { title: { $regex: safe, $options: "i" } },
          { shortDescription: { $regex: safe, $options: "i" } },
        ];
      }

      if (cuisine) {
        query.cuisine = cuisine as string;
      }

      if (difficulty) {
        query.difficulty = difficulty as string;
      }

      if (dietary) {
        query.dietaryTags = dietary as string;
      }

      // Filter by createdBy (used by manage page)
      if (req.query.createdBy) {
        try {
          query.createdBy = new ObjectId(req.query.createdBy as string);
        } catch {
          // Invalid ObjectId — skip filter
        }
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 12;
      const skip = (pageNum - 1) * limitNum;

      let sort: Record<string, 1 | -1> = { createdAt: -1 };
      if (sortBy === "oldest") sort = { createdAt: 1 };
      else if (sortBy === "rating") sort = { rating: -1 };

      const [data, total] = await Promise.all([
        recipes.find(query).sort(sort).skip(skip).limit(limitNum).toArray(),
        recipes.countDocuments(query),
      ]);

      // Serialize ObjectId fields to strings
      const serialized = data.map((r) => ({
        ...r,
        _id: toSafeId(r),
        createdBy: toSafeId(r),
        createdAt: r.createdAt.toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: {
          recipes: serialized,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async getPopularRecipes(req: Request, res: Response) {
    try {
      const db = getDb();
      const recipes = db.collection<RecipeDocument>("recipes");

      const limit = parseInt(req.query.limit as string) || 4;

      const data = await recipes
        .find()
        .sort({ rating: -1 })
        .limit(limit)
        .toArray();

      const serialized = data.map((r) => ({
        ...r,
        _id: toSafeId(r),
        createdBy: toSafeId(r),
        createdAt: r.createdAt.toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: { recipes: serialized },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async getRecipeById(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !ObjectId.isValid(id)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const db = getDb();
      const recipes = db.collection<RecipeDocument>("recipes");

      const recipe = await recipes.findOne({ _id: new ObjectId(id) });

      if (!recipe) {
        errorResponse(res, 404, "Recipe not found");
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          recipe: {
            ...recipe,
            _id: toSafeId(recipe),
            createdBy: toSafeId(recipe),
            createdAt: recipe.createdAt.toISOString(),
          },
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async createRecipe(req: Request, res: Response) {
    try {
      const parsed = createRecipeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const db = getDb();
      const recipes = db.collection<RecipeDocument>("recipes");

      const recipeData: Omit<RecipeDocument, "_id"> = {
        ...parsed.data,
        dietaryTags: (req.body as Record<string, unknown>).dietaryTags as string[] || [],
        createdBy: new ObjectId(req.userId!),
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
      };

      const result = await recipes.insertOne(recipeData as RecipeDocument);
      const recipe = await recipes.findOne({ _id: result.insertedId });

      res.status(201).json({
        success: true,
        data: {
          recipe: {
            ...recipe!,
            _id: toSafeId(recipe!),
            createdBy: toSafeId(recipe!),
            createdAt: recipe!.createdAt.toISOString(),
          },
        },
        message: "Recipe created successfully",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async updateRecipe(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !ObjectId.isValid(id)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const parsed = createRecipeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const db = getDb();
      const recipes = db.collection<RecipeDocument>("recipes");

      const recipe = await recipes.findOne({ _id: new ObjectId(id) });

      if (!recipe) {
        errorResponse(res, 404, "Recipe not found");
        return;
      }

      if (recipe.createdBy.toString() !== req.userId) {
        errorResponse(res, 403, "Forbidden: You do not own this recipe");
        return;
      }

      const updateData = {
        ...parsed.data,
        dietaryTags: (req.body as Record<string, unknown>).dietaryTags as string[] || [],
      };

      await recipes.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
      const updated = await recipes.findOne({ _id: new ObjectId(id) });

      res.status(200).json({
        success: true,
        data: {
          recipe: {
            ...updated!,
            _id: toSafeId(updated!),
            createdBy: toSafeId(updated!),
            createdAt: updated!.createdAt.toISOString(),
          },
        },
        message: "Recipe updated successfully",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async deleteRecipe(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !ObjectId.isValid(id)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const db = getDb();
      const recipes = db.collection<RecipeDocument>("recipes");

      const recipe = await recipes.findOne({ _id: new ObjectId(id) });

      if (!recipe) {
        errorResponse(res, 404, "Recipe not found");
        return;
      }

      if (recipe.createdBy.toString() !== req.userId) {
        errorResponse(res, 403, "Forbidden: You do not own this recipe");
        return;
      }

      // Delete recipe, its reviews, and favorites in parallel
      await Promise.all([
        recipes.deleteOne({ _id: new ObjectId(id) }),
        db.collection("reviews").deleteMany({ recipeId: new ObjectId(id) }),
        db.collection("favorites").deleteMany({ recipeId: new ObjectId(id) }),
      ]);

      res.status(200).json({
        success: true,
        message: "Recipe deleted successfully",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async rateRecipe(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !ObjectId.isValid(id)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const { rating, review } = req.body as { rating: unknown; review?: string };
      const ratingNum = Number(rating);

      if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        errorResponse(res, 400, "Rating must be between 1 and 5");
        return;
      }

      const db = getDb();
      const recipes = db.collection<RecipeDocument>("recipes");
      const reviews = db.collection<ReviewDocument>("reviews");

      const recipe = await recipes.findOne({ _id: new ObjectId(id) });
      if (!recipe) {
        errorResponse(res, 404, "Recipe not found");
        return;
      }

      // Check if user already rated (unique index handles this too, but explicit check gives cleaner error)
      const existing = await reviews.findOne({
        recipeId: new ObjectId(id),
        userId: new ObjectId(req.userId!),
      });

      if (existing) {
        errorResponse(res, 409, "You have already rated this recipe");
        return;
      }

      await reviews.insertOne({
        recipeId: new ObjectId(id),
        userId: new ObjectId(req.userId!),
        rating: ratingNum,
        review: review || "",
        createdAt: new Date(),
      });

      // Recalculate average rating using aggregation (single query)
      const aggResult = await reviews
        .aggregate<{ avgRating: number; reviewCount: number }>([
          { $match: { recipeId: new ObjectId(id) } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const { avgRating, reviewCount } = aggResult[0] || {
        avgRating: 0,
        reviewCount: 0,
      };

      await recipes.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount,
          },
        }
      );

      const updatedRecipe = await recipes.findOne({ _id: new ObjectId(id) });

      res.status(200).json({
        success: true,
        data: {
          recipe: {
            ...updatedRecipe!,
            _id: toSafeId(updatedRecipe!),
            createdBy: toSafeId(updatedRecipe!),
            createdAt: updatedRecipe!.createdAt.toISOString(),
          },
        },
        message: "Rating submitted successfully",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  /**
   * Get reviews for a recipe — uses $lookup to populate user names
   * in a SINGLE aggregation pipeline (eliminates N+1)
   */
  async getReviews(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !ObjectId.isValid(id)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const db = getDb();

      const populated = await db
        .collection<ReviewDocument>("reviews")
        .aggregate<{
          _id: ObjectId;
          recipeId: ObjectId;
          userId: ObjectId;
          rating: number;
          review: string;
          createdAt: Date;
          userName: string;
        }>([
          { $match: { recipeId: new ObjectId(id) } },
          { $sort: { createdAt: -1 } },
          { $limit: 50 },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $addFields: {
              userName: {
                $ifNull: [
                  { $arrayElemAt: ["$userDoc.name", 0] },
                  "Unknown",
                ],
              },
            },
          },
          {
            $project: {
              userDoc: 0,
            },
          },
        ])
        .toArray();

      const serialized = populated.map((r) => ({
        ...r,
        _id: toSafeId(r),
        recipeId: toSafeId(r),
        userId: toSafeId(r),
        createdAt: r.createdAt.toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: { reviews: serialized },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  // ---- Favorites (with $lookup) ----

  /**
   * Get user favorites — uses $lookup to populate recipe data
   * in a SINGLE aggregation pipeline (eliminates N+1)
   */
  async getFavorites(req: Request, res: Response) {
    try {
      const db = getDb();

      const populated = await db
        .collection<FavoriteDocument>("favorites")
        .aggregate<{
          _id: ObjectId;
          recipeId: ObjectId;
          userId: ObjectId;
          createdAt: Date;
          recipe: RecipeDocument | null;
        }>([
          { $match: { userId: new ObjectId(req.userId!) } },
          { $sort: { createdAt: -1 } },
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
              recipe: {
                $ifNull: [{ $arrayElemAt: ["$recipeDoc", 0] }, null],
              },
            },
          },
          {
            $project: {
              recipeDoc: 0,
            },
          },
        ])
        .toArray();

      const serialized = populated.map((f) => ({
        _id: toSafeId(f),
        recipeId: toSafeId(f),
        userId: toSafeId(f),
        createdAt: f.createdAt.toISOString(),
        recipe: f.recipe
          ? {
              ...f.recipe,
              _id: toSafeId(f.recipe),
              createdBy: toSafeId(f.recipe),
              createdAt: f.recipe.createdAt.toISOString(),
            }
          : null,
      }));

      res.status(200).json({
        success: true,
        data: { favorites: serialized },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async addFavorite(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const recipeId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!recipeId || !ObjectId.isValid(recipeId)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const db = getDb();

      const recipe = await db.collection("recipes").findOne({ _id: new ObjectId(recipeId) });
      if (!recipe) {
        errorResponse(res, 404, "Recipe not found");
        return;
      }

      // Try insert — unique index will catch duplicates
      try {
        await db.collection("favorites").insertOne({
          userId: new ObjectId(req.userId!),
          recipeId: new ObjectId(recipeId),
          createdAt: new Date(),
        });
      } catch (insertErr: unknown) {
        // E11000 duplicate key error from unique index
        if (
          insertErr instanceof Error &&
          insertErr.message.includes("E11000")
        ) {
          errorResponse(res, 409, "Already in favorites");
          return;
        }
        throw insertErr;
      }

      res.status(201).json({
        success: true,
        message: "Added to favorites",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async removeFavorite(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const recipeId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!recipeId || !ObjectId.isValid(recipeId)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const db = getDb();
      await db.collection("favorites").deleteOne({
        userId: new ObjectId(req.userId!),
        recipeId: new ObjectId(recipeId),
      });

      res.status(200).json({
        success: true,
        message: "Removed from favorites",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async checkFavorite(req: Request, res: Response) {
    try {
      const rawId = req.params.id;
      const recipeId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!recipeId || !ObjectId.isValid(recipeId)) {
        errorResponse(res, 400, "Invalid recipe ID");
        return;
      }

      const db = getDb();
      const fav = await db.collection("favorites").findOne({
        userId: new ObjectId(req.userId!),
        recipeId: new ObjectId(recipeId),
      });

      res.status(200).json({
        success: true,
        data: { isFavorite: !!fav },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },
};