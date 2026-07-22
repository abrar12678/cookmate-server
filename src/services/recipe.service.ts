import { ObjectId, Filter, Sort, Document } from "mongodb";
import { getDb } from "../config/db";
import { escapeRegex } from "../utils/string.utils";
import type { RecipeDocument, FavoriteDocument, ReviewDocument } from "../types/recipe";

function toSafeId<T extends { _id: ObjectId | string }>(doc: T): string {
  return doc._id.toString();
}

export interface GetRecipesOptions {
  search?: string;
  cuisine?: string;
  difficulty?: string;
  dietary?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export const recipeService = {
  async getRecipes(options: GetRecipesOptions) {
    const db = getDb();
    const {
      search,
      cuisine,
      difficulty,
      dietary,
      sortBy = "newest",
      page = 1,
      limit = 12,
    } = options;

    const query: Record<string, unknown> = {};

    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { title: { $regex: safe, $options: "i" } },
        { shortDescription: { $regex: safe, $options: "i" } },
      ];
    }

    if (cuisine) query.cuisine = cuisine;
    if (difficulty) query.difficulty = difficulty;
    if (dietary) query.dietaryTags = dietary;

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === "oldest") sortOption = { createdAt: 1 };
    else if (sortBy === "rating") sortOption = { rating: -1, reviewCount: -1 };
    else if (sortBy === "prepTime") sortOption = { prepTime: 1 };

    const skip = (page - 1) * limit;
    const recipesCollection = db.collection<RecipeDocument>("recipes");

    const [recipes, total] = await Promise.all([
      recipesCollection.find(query).sort(sortOption).skip(skip).limit(limit).toArray(),
      recipesCollection.countDocuments(query),
    ]);

    const serialized = recipes.map((r) => ({
      ...r,
      _id: toSafeId(r),
      createdBy: toSafeId(r),
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      recipes: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getPopularRecipes() {
    const db = getDb();
    const recipes = await db
      .collection<RecipeDocument>("recipes")
      .find({})
      .sort({ rating: -1, reviewCount: -1 })
      .limit(6)
      .toArray();

    return recipes.map((r) => ({
      ...r,
      _id: toSafeId(r),
      createdBy: toSafeId(r),
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async getRecipeById(id: string) {
    if (!ObjectId.isValid(id)) return null;
    const db = getDb();
    const recipe = await db
      .collection<RecipeDocument>("recipes")
      .findOne({ _id: new ObjectId(id) });

    if (!recipe) return null;

    return {
      ...recipe,
      _id: toSafeId(recipe),
      createdBy: toSafeId(recipe),
      createdAt: recipe.createdAt.toISOString(),
    };
  },

  async createRecipe(recipeData: Omit<RecipeDocument, "_id">) {
    const db = getDb();
    const recipes = db.collection<RecipeDocument>("recipes");
    const result = await recipes.insertOne(recipeData as RecipeDocument);
    const recipe = await recipes.findOne({ _id: result.insertedId });

    return {
      ...recipe!,
      _id: toSafeId(recipe!),
      createdBy: toSafeId(recipe!),
      createdAt: recipe!.createdAt.toISOString(),
    };
  },

  async updateRecipe(
    id: string,
    updateData: Record<string, unknown>,
    userId: string,
    userRole?: string
  ) {
    if (!ObjectId.isValid(id)) throw { status: 400, message: "Invalid recipe ID" };

    const db = getDb();
    const recipes = db.collection<RecipeDocument>("recipes");
    const recipe = await recipes.findOne({ _id: new ObjectId(id) });

    if (!recipe) throw { status: 404, message: "Recipe not found" };

    const isOwner = recipe.createdBy.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      throw { status: 403, message: "Forbidden: You do not own this recipe" };
    }

    await recipes.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    const updated = await recipes.findOne({ _id: new ObjectId(id) });

    return {
      ...updated!,
      _id: toSafeId(updated!),
      createdBy: toSafeId(updated!),
      createdAt: updated!.createdAt.toISOString(),
    };
  },

  async deleteRecipe(id: string, userId: string, userRole?: string) {
    if (!ObjectId.isValid(id)) throw { status: 400, message: "Invalid recipe ID" };

    const db = getDb();
    const recipes = db.collection<RecipeDocument>("recipes");
    const recipe = await recipes.findOne({ _id: new ObjectId(id) });

    if (!recipe) throw { status: 404, message: "Recipe not found" };

    const isOwner = recipe.createdBy.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      throw { status: 403, message: "Forbidden: You do not own this recipe" };
    }

    await Promise.all([
      recipes.deleteOne({ _id: new ObjectId(id) }),
      db.collection("reviews").deleteMany({ recipeId: new ObjectId(id) }),
      db.collection("favorites").deleteMany({ recipeId: new ObjectId(id) }),
    ]);

    return true;
  },
};
