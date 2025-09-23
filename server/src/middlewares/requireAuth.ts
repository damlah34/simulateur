import { Request, Response, NextFunction } from "express";
import { getSupabaseForServer } from "../supabase";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    // On vérifie le token côté Supabase
    const supabase = getSupabaseForServer();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });

    // On stocke pour la suite
    (req as any).user = { id: data.user.id, jwt: token };
    next();
  } catch (e: any) {
    res.status(401).json({ error: e?.message || "Unauthorized" });
  }
}
