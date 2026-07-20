/**
 * Vercel Serverless Function Entry Point
 *
 * This file is ONLY used by Vercel. It imports the Express app
 * and exports it as a serverless handler — no app.listen().
 *
 * For local development, use: npm run dev (uses src/server.ts)
 */

import app from "../src/app";
import { connectDB } from "../src/config/db";

// Ensure DB is connected before handling requests.
// In serverless, this caches the connection across warm invocations.
let dbPromise: Promise<void> | null = null;

export default async function handler(
  req: import("express").Request,
  res: import("express").Response,
) {
  if (!dbPromise) {
    dbPromise = connectDB();
  }
  await dbPromise;
  return app(req, res);
}