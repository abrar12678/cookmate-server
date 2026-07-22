import { ObjectId, Filter, Sort, Document } from "mongodb";
import { getDb } from "../config/db";
import { escapeRegex } from "../utils/string.utils";

export const adminService = {
  async getDashboardStats() {
    const db = getDb();
    const [totalUsers, totalRecipes, totalReviews, totalNewsletters, totalContacts] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("recipes").countDocuments(),
      db.collection("reviews").countDocuments(),
      db.collection("newsletters").countDocuments(),
      db.collection("contacts").countDocuments(),
    ]);

    return {
      totalUsers,
      totalRecipes,
      totalReviews,
      totalNewsletters,
      totalContacts,
    };
  },

  async getUsers(page = 1, limit = 10, search = "", sortField = "createdAt", sortOrder: 1 | -1 = -1) {
    const db = getDb();
    const filter: Filter<Document> = {};
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const sort: Sort = { [sortField]: sortOrder };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.collection("users").find(filter, { projection: { password: 0 } }).sort(sort).skip(skip).limit(limit).toArray(),
      db.collection("users").countDocuments(filter),
    ]);

    return {
      users: users.map((u) => ({ ...u, _id: u._id.toString() })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getRecipes(page = 1, limit = 10, search = "", cuisine?: string, difficulty?: string, sortField = "createdAt", sortOrder: 1 | -1 = -1) {
    const db = getDb();
    const filter: Filter<Document> = {};
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { shortDescription: { $regex: safe, $options: "i" } },
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

    return {
      recipes: recipes.map((r) => ({ ...r, _id: r._id.toString(), createdBy: r.createdBy.toString() })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};
