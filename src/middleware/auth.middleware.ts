import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

/** Parse cookies from the raw Cookie header without needing cookie-parser */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (key) acc[key] = rest.join("=");
    return acc;
  }, {});
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookies = parseCookies(req.headers.cookie);

  // Priority 1: Read from httpOnly cookie
  let token = cookies["token"];

  // Priority 2: Fallback to Authorization header (backward compat)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  try {
    const decoded = verifyToken(token) as { id: string; role?: string };
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}