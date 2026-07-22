import { Request, Response } from "express";
import { ObjectId, Filter, Sort, Document } from "mongodb";
import { getDb } from "../config/db";
import { escapeRegex } from "../utils/string.utils";

interface AuthRequest extends Request {
  userId?: string;
}

/** Safely extract a string param (handles string | string[]) */
function paramId(req: Request): string {
  const v = req.params.id;
  return Array.isArray(v) ? v[0] : v;
}

// ─── Dashboard Stats ───────────────────────────────────────

export async function getDashboardStats(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const [totalUsers, totalRecipes, totalReviews, totalNewsletters, totalContacts] =
      await Promise.all([
        db.collection("users").countDocuments(),
        db.collection("recipes").countDocuments(),
        db.collection("reviews").countDocuments(),
        db.collection("newsletters").countDocuments(),
        db.collection("contacts").countDocuments(),
      ]);

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await db
      .collection("users")
      .countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Recent recipes (last 7 days)
    const recentRecipes = await db
      .collection("recipes")
      .countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Average recipe rating
    const ratingAgg = await db
      .collection("recipes")
      .aggregate([{ $group: { _id: null, avgRating: { $avg: "$rating" } } }])
      .toArray();
    const avgRating = ratingAgg.length > 0 ? (ratingAgg[0].avgRating || 0) : 0;

    // Top cuisines
    const topCuisines = await db
      .collection("recipes")
      .aggregate([
        { $group: { _id: "$cuisine", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ])
      .toArray();

    // Users per day (last 7 days)
    const usersPerDay = await db
      .collection("users")
      .aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRecipes,
        totalReviews,
        totalNewsletters,
        totalContacts,
        recentUsers,
        recentRecipes,
        avgRating: Math.round(avgRating * 10) / 10,
        topCuisines,
        usersPerDay,
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
}

// ─── User Management ───────────────────────────────────────

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string)?.trim() || "";
    const sortField = (req.query.sort as string) || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const filter: Filter<Document> = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const sort: Sort = { [sortField]: sortOrder };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db
        .collection("users")
        .find(filter, { projection: { password: 0, googleId: 0 } })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("users").countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
}

export async function getUserById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const id = paramId(req);
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0, googleId: 0 } },
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Get user's recipe count and review count
    const [recipeCount, reviewCount] = await Promise.all([
      db.collection("recipes").countDocuments({ createdBy: new ObjectId(id) }),
      db.collection("reviews").countDocuments({ userId: new ObjectId(id) }),
    ]);

    res.json({
      success: true,
      data: { ...user, recipeCount, reviewCount },
    });
  } catch (error) {
    console.error("Admin get user error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
}

export async function updateUserRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const { role } = req.body;
    const id = paramId(req);

    if (!["user", "admin"].includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role. Must be 'user' or 'admin'." });
      return;
    }

    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { role, updatedAt: new Date() } },
        { returnDocument: "after", projection: { password: 0, googleId: 0 } },
      );

    if (!result) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: result, message: "User role updated successfully" });
  } catch (error) {
    console.error("Admin update user role error:", error);
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const id = paramId(req);
    const userId = new ObjectId(id);

    // Prevent self-deletion
    if (req.userId && req.userId === id) {
      res.status(400).json({ success: false, message: "Cannot delete your own account" });
      return;
    }

    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Delete user's recipes, reviews, favorites
    const recipeIds = await db
      .collection("recipes")
      .find({ createdBy: userId }, { projection: { _id: 1 } })
      .map((r) => r._id)
      .toArray();

    await Promise.all([
      db.collection("users").deleteOne({ _id: userId }),
      db.collection("reviews").deleteMany({ userId: userId }),
      db.collection("favorites").deleteMany({ userId: userId }),
      ...(recipeIds.length > 0
        ? [
            db.collection("reviews").deleteMany({
              recipeId: { $in: recipeIds },
            }),
            db.collection("favorites").deleteMany({
              recipeId: { $in: recipeIds },
            }),
            db.collection("recipes").deleteMany({ createdBy: userId }),
          ]
        : []),
    ]);

    res.json({ success: true, message: "User and related data deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
}

// ─── Recipe Management ─────────────────────────────────────

export async function getRecipes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string)?.trim() || "";
    const cuisine = (req.query.cuisine as string)?.trim() || "";
    const difficulty = (req.query.difficulty as string)?.trim() || "";
    const sortField = (req.query.sort as string) || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const filter: Filter<Document> = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { shortDescription: { $regex: safeSearch, $options: "i" } },
      ];
    }
    if (cuisine) filter.cuisine = cuisine;
    if (difficulty) filter.difficulty = difficulty;

    const sort: Sort = { [sortField]: sortOrder };
    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
      db.collection("recipes").find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      db.collection("recipes").countDocuments(filter),
    ]);

    // Enrich with creator names
    const creatorIds = [...new Set(recipes.map((r) => r.createdBy).filter(Boolean))];
    const creators = await db
      .collection("users")
      .find({ _id: { $in: creatorIds.map((id) => new ObjectId(id.toString())) } }, { projection: { name: 1 } })
      .toArray();
    const creatorMap = new Map(creators.map((c) => [c._id.toString(), c.name]));

    const enriched = recipes.map((r) => ({
      ...r,
      creatorName: creatorMap.get(r.createdBy?.toString()) || "Unknown",
    }));

    res.json({
      success: true,
      data: {
        recipes: enriched,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin get recipes error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recipes" });
  }
}

export async function deleteRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const id = paramId(req);
    const recipeId = new ObjectId(id);

    const recipe = await db.collection("recipes").findOne({ _id: recipeId });
    if (!recipe) {
      res.status(404).json({ success: false, message: "Recipe not found" });
      return;
    }

    await Promise.all([
      db.collection("recipes").deleteOne({ _id: recipeId }),
      db.collection("reviews").deleteMany({ recipeId }),
      db.collection("favorites").deleteMany({ recipeId }),
    ]);

    res.json({ success: true, message: "Recipe and related data deleted successfully" });
  } catch (error) {
    console.error("Admin delete recipe error:", error);
    res.status(500).json({ success: false, message: "Failed to delete recipe" });
  }
}

export async function toggleFeaturedRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const id = paramId(req);
    const recipeId = new ObjectId(id);

    const recipe = await db.collection("recipes").findOne({ _id: recipeId });
    if (!recipe) {
      res.status(404).json({ success: false, message: "Recipe not found" });
      return;
    }

    const newFeatured = !recipe.featured;
    const result = await db.collection("recipes").findOneAndUpdate(
      { _id: recipeId },
      { $set: { featured: newFeatured } },
      { returnDocument: "after" },
    );

    res.json({
      success: true,
      data: result,
      message: `Recipe ${newFeatured ? "marked as featured" : "unfeatured"} successfully`,
    });
  } catch (error) {
    console.error("Admin toggle featured error:", error);
    res.status(500).json({ success: false, message: "Failed to update recipe" });
  }
}

// ─── Review Management ─────────────────────────────────────

export async function getReviews(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const sortField = (req.query.sort as string) || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const sort: Sort = { [sortField]: sortOrder };
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      db.collection("reviews").find({}).sort(sort).skip(skip).limit(limit).toArray(),
      db.collection("reviews").countDocuments({}),
    ]);

    // Enrich with recipe title and user name
    const recipeIds = [...new Set(reviews.map((r) => r.recipeId).filter(Boolean))];
    const userIds = [...new Set(reviews.map((r) => r.userId).filter(Boolean))];

    const [recipes, users] = await Promise.all([
      recipeIds.length > 0
        ? db
            .collection("recipes")
            .find({ _id: { $in: recipeIds.map((id) => new ObjectId(id.toString())) } }, { projection: { title: 1 } })
            .toArray()
        : [],
      userIds.length > 0
        ? db
            .collection("users")
            .find({ _id: { $in: userIds.map((id) => new ObjectId(id.toString())) } }, { projection: { name: 1 } })
            .toArray()
        : [],
    ]);

    const recipeMap = new Map(recipes.map((r) => [r._id.toString(), r.title]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const enriched = reviews.map((r) => ({
      ...r,
      recipeTitle: recipeMap.get(r.recipeId?.toString()) || "Deleted Recipe",
      userName: (r as Record<string, unknown>).userName as string | undefined || userMap.get(r.userId?.toString()) || "Unknown User",
    }));

    res.json({
      success: true,
      data: {
        reviews: enriched,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin get reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
}

export async function deleteReview(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const id = paramId(req);
    const result = await db.collection("reviews").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Admin delete review error:", error);
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
}

// ─── Newsletter Management ─────────────────────────────────

export async function getNewsletters(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string)?.trim() || "";

    const filter: Filter<Document> = {};
    if (search) {
      filter.email = { $regex: escapeRegex(search), $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [newsletters, total] = await Promise.all([
      db.collection("newsletters").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("newsletters").countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        newsletters,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin get newsletters error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch newsletters" });
  }
}

export async function deleteNewsletter(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const id = paramId(req);
    const result = await db.collection("newsletters").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "Newsletter subscription not found" });
      return;
    }

    res.json({ success: true, message: "Newsletter subscription deleted successfully" });
  } catch (error) {
    console.error("Admin delete newsletter error:", error);
    res.status(500).json({ success: false, message: "Failed to delete newsletter" });
  }
}

// ─── Contact Management ────────────────────────────────────

export async function getContacts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      db.collection("contacts").find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("contacts").countDocuments({}),
    ]);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin get contacts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch contacts" });
  }
}

export async function deleteContact(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDb();
    const id = paramId(req);
    const result = await db.collection("contacts").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "Contact message not found" });
      return;
    }

    res.json({ success: true, message: "Contact message deleted successfully" });
  } catch (error) {
    console.error("Admin delete contact error:", error);
    res.status(500).json({ success: false, message: "Failed to delete contact" });
  }
}