import { Request, Response } from "express";
import { getDb } from "../config/db";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator";
import { generateToken } from "../utils/jwt";
import { hashPassword, comparePassword } from "../utils/password";
import { ObjectId, WithId, Document } from "mongodb";
import env from "../config/env";

interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  bio?: string;
  createdAt?: Date;
}

type SafeUser = Omit<WithId<UserDocument>, "password">;

function excludePassword(user: WithId<UserDocument> | null): SafeUser | null {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser as SafeUser;
}

function errorResponse(res: Response, status: number, message: string) {
  res.status(status).json({ success: false, message });
}

/** Set JWT as httpOnly secure cookie */
function setTokenCookie(res: Response, token: string) {
  const isProduction = env.CLIENT_URL.startsWith("https");
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

/** Clear the auth cookie */
function clearTokenCookie(res: Response) {
  const isProduction = env.CLIENT_URL.startsWith("https");
  res.cookie("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    maxAge: 0,
    path: "/",
  });
}

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const { name, email, password } = parsed.data;
      const db = getDb();
      const users = db.collection("users");

      const existingUser = await users.findOne({ email });
      if (existingUser) {
        errorResponse(res, 409, "Email already registered");
        return;
      }

      const hashedPassword = await hashPassword(password);
      const result = await users.insertOne({
        name,
        email,
        password: hashedPassword,
        bio: "",
        createdAt: new Date(),
      });

      const user = (await users.findOne({
        _id: result.insertedId,
      })) as WithId<UserDocument> | null;
      const token = generateToken({ id: result.insertedId.toString() });
      setTokenCookie(res, token);

      res.status(201).json({
        success: true,
        data: { user: excludePassword(user), token },
        message: "Registration successful",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const { email, password } = parsed.data;
      const db = getDb();
      const users = db.collection("users");

      const user = (await users.findOne({
        email,
      })) as WithId<UserDocument> | null;
      if (!user) {
        errorResponse(res, 401, "Invalid email or password");
        return;
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        errorResponse(res, 401, "Invalid email or password");
        return;
      }

      const token = generateToken({ id: user._id.toString() });
      setTokenCookie(res, token);

      res.status(200).json({
        success: true,
        data: { user: excludePassword(user), token },
        message: "Login successful",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async getMe(req: Request, res: Response) {
    try {
      const db = getDb();
      const users = db.collection("users");

      const user = (await users.findOne({
        _id: new ObjectId(req.userId),
      })) as WithId<UserDocument> | null;
      if (!user) {
        errorResponse(res, 404, "User not found");
        return;
      }

      res.status(200).json({
        success: true,
        data: { user: excludePassword(user) },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const db = getDb();
      const users = db.collection("users");

      const updateData: Partial<Pick<UserDocument, "name" | "bio">> = {};
      if (parsed.data.name) updateData.name = parsed.data.name;
      if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio;

      await users.updateOne(
        { _id: new ObjectId(req.userId) },
        { $set: updateData },
      );

      const user = (await users.findOne({
        _id: new ObjectId(req.userId),
      })) as WithId<UserDocument> | null;

      res.status(200).json({
        success: true,
        data: { user: excludePassword(user) },
        message: "Profile updated successfully",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },

  async logout(_req: Request, res: Response) {
    clearTokenCookie(res);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  },
};
