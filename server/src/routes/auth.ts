// server/src/routes/auth.ts
import { Router } from "express";
import { z } from "zod";
import { getSupabaseForServer, getSupabaseAdmin } from "../supabase";

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
 * - Tente de vérifier via Admin si l’email existe déjà (si la méthode existe)
 * - Sinon laisse signUp remonter l’erreur "already registered"
 * - Force la redirection de confirmation email vers /confirm si configurée
 */
router.post("/signup", async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);

    // 1) Tentative de check existence avec le client Admin
    const admin = getSupabaseAdmin();
    const hasGetUserByEmail =
      typeof (admin as any).auth?.admin?.getUserByEmail === "function";

    if (hasGetUserByEmail) {
      const { data: existingUser, error: adminErr } =
        await (admin as any).auth.admin.getUserByEmail(body.email);

      // Si l’API admin renvoie autre chose que "not found", on traite
      if (adminErr && adminErr.message && !/not\s*found/i.test(adminErr.message)) {
        return res.status(500).json({ error: adminErr.message || "Admin lookup failed" });
      }
      if (existingUser) {
        return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      }
    }
    // Si la méthode n’existe pas (lib différente), on laissera signUp gérer le cas “already registered”.

    // 2) Création du compte
    const supabase = getSupabaseForServer();
    const emailRedirectTo =
      process.env.EMAIL_CONFIRM_REDIRECT_URL || "http://localhost:5173/confirm";

    const { error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo,
        data: body.fullName ? { full_name: body.fullName } : undefined,
      },
    });

    if (error) {
      const msg = String(error.message || "");
      if (/already\s*registered|exists|used/i.test(msg)) {
        return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      }
      return res.status(400).json({ error: msg });
    }

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

/**
 * POST /api/auth/forgot
 */
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ error: "email is required" });

    const supabase = getSupabaseForServer();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        process.env.PASSWORD_RESET_REDIRECT_URL || "http://localhost:5173",
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Unexpected error" });
  }
});

/**
 * GET /api/auth/me
 */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    const supabaseNoJwt = getSupabaseForServer();
    const { data, error } = await supabaseNoJwt.auth.getUser(token);
    if (error || !data?.user)
      return res.status(401).json({ error: error?.message || "Invalid token" });

    const user = data.user;
    const email = user.email || "";

    const fullFromMeta =
      (user.user_metadata &&
        (user.user_metadata.full_name || user.user_metadata.fullName)) ||
      "";
    const firstName =
      (fullFromMeta && fullFromMeta.trim().split(/\s+/)[0]) ||
      (email && email.split("@")[0]) ||
      "";

    return res.json({ email, full_name: fullFromMeta, firstName });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Unexpected error" });
  }
});

export default router;
