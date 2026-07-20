import { Request, Response, NextFunction } from "express";
import { authenticate } from "./auth.middleware";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db";

/**
 * Extended Request type with userId (set by authenticate middleware)
 */
interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Admin middleware — requires authentication + admin role check
 */
export function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  // First, authenticate the user
  authenticate(req as Request, res, (err?: unknown) => {
    if (err || !req.userId) {
      // authenticate already sent response
      return;
    }

    // Check if user has admin role
    const db = getDb();
    db.collection("users")
      .findOne({ _id: new ObjectId(req.userId) }, { projection: { role: 1 } })
      .then((user) => {
        if (!user || user.role !== "admin") {
          res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required.",
          });
          return;
        }
        next();
      })
      .catch(() => {
        res.status(500).json({
          success: false,
          message: "Failed to verify admin privileges.",
        });
      });
  });
}