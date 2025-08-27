import { Router } from "express";
import { z } from "zod";
import { getSupabaseForServer } from "../supabase";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * POST /api/auth/signup
 * Crée un compte Supabase + enregistre un profil minimal dans la table profiles.
 */
// --- /signup SANS insertion manuelle dans profiles ---
// (on laisse le TRIGGER SQL créer la ligne dans public.profiles)
router.post("/signup", async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);
    const supabase = getSupabaseForServer();

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: body.fullName ? { full_name: body.fullName } : undefined,
      },
    });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ message: "Signup successful" });
  } catch (e: any) {
    if (e?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: e.issues });
    }
    return res.status(500).json({ error: e?.message ?? "Unexpected error" });
  }
});


/**
 * POST /api/auth/login
 * Retourne un access_token (JWT) que le front utilisera dans Authorization: Bearer <token>.
 */
router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const supabase = getSupabaseForServer();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) return res.status(401).json({ error: error.message });

    const token = data.session?.access_token;
    if (!token) return res.status(500).json({ error: "No access token returned" });

    return res.json({ access_token: token });
  } catch (e: any) {
    if (e?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: e.issues });
    }
    return res.status(500).json({ error: e?.message ?? "Unexpected error" });
  }
});

export default router;
