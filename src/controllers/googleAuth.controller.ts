import { Request, Response } from "express";
import { getDb } from "../config/db";
import { generateToken } from "../utils/jwt";
import { ObjectId, WithId, Document } from "mongodb";
import env from "../config/env";

interface UserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  bio?: string;
  createdAt?: Date;
}

type SafeUser = Omit<WithId<UserDocument>, "password">;

function excludePassword(user: WithId<UserDocument>): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser as SafeUser;
}

/** Exchange authorization code for access token via Google */
async function getGoogleTokens(code: string) {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.CLIENT_URL.replace(/\/$/, "")}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  return res.json() as Promise<{ access_token: string; id_token?: string }>;
}

/** Get user profile from Google */
async function getGoogleProfile(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  return res.json() as Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email?: boolean;
  }>;
}

/** Set JWT as httpOnly secure cookie */
function setTokenCookie(res: Response, token: string) {
  const isProduction = env.CLIENT_URL.startsWith("https");
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export const googleAuthController = {
  /** Step 1: Redirect user to Google consent screen */
  googleAuth(_req: Request, res: Response) {
    if (!env.GOOGLE_CLIENT_ID) {
      res.status(500).json({ success: false, message: "Google OAuth is not configured" });
      return;
    }

    const redirectUri = `${env.CLIENT_URL.replace(/\/$/, "")}/api/auth/google/callback`;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
      }).toString();

    res.redirect(url);
  },

  /** Step 2: Handle Google callback — exchange code, find/create user, set cookie */
  async googleCallback(req: Request, res: Response) {
    try {
      const { code, error } = req.query;

      if (error || !code) {
        res.redirect(`${env.CLIENT_URL}/login?google_error=${error || "no_code"}`);
        return;
      }

      // Exchange code for tokens
      const tokens = await getGoogleTokens(code as string);

      // Get user profile
      const profile = await getGoogleProfile(tokens.access_token);

      const db = getDb();
      const users = db.collection("users");

      // Find existing user by googleId or email
      let user = await users.findOne({
        $or: [{ googleId: profile.id }, { email: profile.email }],
      });

      if (!user) {
        // Create new user (no password for Google users)
        const result = await users.insertOne({
          name: profile.name,
          email: profile.email,
          googleId: profile.id,
          avatar: profile.picture || "",
          bio: "",
          createdAt: new Date(),
        });

        user = await users.findOne({ _id: result.insertedId });
      } else if (!user.googleId) {
        // Link Google account to existing email user
        await users.updateOne(
          { _id: user._id },
          { $set: { googleId: profile.id, avatar: profile.picture || "" } },
        );
        user = await users.findOne({ _id: user._id });
      }

      if (!user) {
        res.redirect(`${env.CLIENT_URL}/login?google_error=user_creation_failed`);
        return;
      }

      // Generate JWT and set cookie
      const token = generateToken({ id: (user._id as ObjectId).toString() });
      setTokenCookie(res, token);

      // Redirect back to client
      res.redirect(`${env.CLIENT_URL}/?auth=success`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google authentication failed";
      console.error("[GoogleAuth] Callback error:", msg);
      res.redirect(`${env.CLIENT_URL}/login?google_error=${encodeURIComponent(msg)}`);
    }
  },
};