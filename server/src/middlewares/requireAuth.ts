import type { Request, Response, NextFunction } from "express";
import { getUserFromJWT } from "../supabase";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.header("Authorization")?.trim(); // "Bearer <jwt>"
    const jwt = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!jwt) return res.status(401).json({ error: "Missing Authorization header" });

    const { userId } = await getUserFromJWT(jwt);
    // @ts-expect-error: on enrichit req avec les infos user
    req.user = { jwt, userId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
