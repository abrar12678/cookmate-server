import { MongoClient, Db, CreateIndexesOptions } from "mongodb";
import env from "./env";

const client = new MongoClient(env.MONGODB_URI);

let db: Db;
let connected = false;

/** Extract database name from URI or fall back to env.DB_NAME → "cookmate" */
function resolveDbName(uri: string): string {
  // 1. Explicit env override takes highest priority
  if (process.env.DB_NAME && process.env.DB_NAME.trim()) {
    return process.env.DB_NAME.trim();
  }

  // 2. Try to parse DB name from URI path
  try {
    // Remove query params
    const withoutParams = uri.split("?")[0];
    // Remove auth credentials (user:pass@) to simplify parsing
    const afterAuth = withoutParams.replace(/\/\/[^/]+@/, "//");
    // Get the path segment after the host(s)
    const match = afterAuth.match(/\/([^/]+)\/?$/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // URI parsing failed
  }

  // 3. Safe fallback
  return "cookmate";
}

export async function connectDB(): Promise<void> {
  // In serverless (Vercel), the same function instance may handle
  // multiple requests ("warm" invocations). Skip reconnect if already done.
  if (connected && db) return;

  try {
    await client.connect();
    const dbName = resolveDbName(env.MONGODB_URI);
    db = client.db(dbName);
    connected = true;
    console.log(`MongoDB Connected → database: "${dbName}"`);

    // Ensure indexes are created (idempotent — safe on warm starts too)
    await ensureIndexes(db);
    console.log("MongoDB indexes verified");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // In serverless, don't process.exit() — throw so the handler can return 500
    throw error;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

/**
 * Create indexes for optimal query performance.
 * createIndex is idempotent — safe to call on every startup.
 */
async function ensureIndexes(database: Db): Promise<void> {
  type IndexDef = { key: Document; options: CreateIndexesOptions };

  const collections: Record<string, IndexDef[]> = {
    users: [
      { key: { email: 1 }, options: { unique: true, name: "email_unique" } },
    ],

    recipes: [
      { key: { createdAt: -1 }, options: { name: "recipes_createdAt_desc" } },
      { key: { rating: -1 }, options: { name: "recipes_rating_desc" } },
      { key: { cuisine: 1 }, options: { name: "recipes_cuisine" } },
      { key: { difficulty: 1 }, options: { name: "recipes_difficulty" } },
      { key: { dietaryTags: 1 }, options: { name: "recipes_dietaryTags" } },
      { key: { createdBy: 1 }, options: { name: "recipes_createdBy" } },
      // Text index for search (title + shortDescription)
      { key: { title: "text", shortDescription: "text" }, options: { name: "recipes_text_search" } },
    ],

    reviews: [
      { key: { recipeId: 1, userId: 1 }, options: { unique: true, name: "reviews_recipeId_userId_unique" } },
      { key: { recipeId: 1, createdAt: -1 }, options: { name: "reviews_recipeId_createdAt" } },
    ],

    favorites: [
      { key: { userId: 1, recipeId: 1 }, options: { unique: true, name: "favorites_userId_recipeId_unique" } },
      { key: { userId: 1, createdAt: -1 }, options: { name: "favorites_userId_createdAt" } },
    ],

    newsletters: [
      { key: { email: 1 }, options: { unique: true, name: "newsletters_email_unique" } },
    ],

    contacts: [
      { key: { createdAt: -1 }, options: { name: "contacts_createdAt_desc" } },
      { key: { email: 1 }, options: { name: "contacts_email" } },
    ],
  };

  for (const [collectionName, indexes] of Object.entries(collections)) {
    const collection = database.collection(collectionName);
    for (const index of indexes) {
      try {
        await collection.createIndex(index.key, index.options);
      } catch (err) {
        // Index may already exist with different options — log and continue
        console.warn(
          `Index creation warning (${collectionName}):`,
          (err as Error).message
        );
      }
    }
  }
}