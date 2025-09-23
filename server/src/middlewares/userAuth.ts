import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/token";
import { getUserById } from "../services/users";

export interface AuthenticatedRequest extends Request {
  currentUser?: NonNullable<Awaited<ReturnType<typeof getUserById>>>;
  accessToken?: string;
}

export async function requireUserAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.header("Authorization")?.trim();
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ error: "Invalid token payload" });
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.currentUser = user;
    req.accessToken = token;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error?.message ?? "Invalid or expired token" });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.currentUser || req.currentUser.role !== "admin") {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
}
