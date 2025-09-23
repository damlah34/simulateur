import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getSupabaseForServer } from "../supabase";

const router = Router();
router.use(requireAuth);

const upsertSchema = z.object({
  title: z.string().min(1, "title is required"),
  payload: z.any().optional(),
});

/**
 * GET /api/simulations
 * Liste les simulations de l’utilisateur connecté
 */
router.get("/", async (req, res) => {
  try {
    const jwt = (req as any).user?.jwt as string;
    const supabase = getSupabaseForServer(jwt);

    const { data, error } = await supabase
      .from("simulations")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to list simulations" });
  }
});

/**
 * GET /api/simulations/:id
 * Récupère une simulation par id (appartient au user via RLS)
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const jwt = (req as any).user?.jwt as string;
    const supabase = getSupabaseForServer(jwt);

    const { data, error } = await supabase
      .from("simulations")
      .select("id, title, payload, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Simulation not found" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to get simulation" });
  }
});

/**
 * POST /api/simulations
 * Crée une simulation
 * -> retourne 409 en cas de titre en doublon pour le même user
 */
router.post("/", async (req, res) => {
  try {
    const body = upsertSchema.parse(req.body);
    const jwt = (req as any).user?.jwt as string;
    const supabase = getSupabaseForServer(jwt);

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("simulations")
      .insert([{ title: body.title, payload: body.payload ?? {}, created_at: now, updated_at: now }])
      .select("id, title, payload, created_at, updated_at")
      .single();

    if (error) {
      const msg = String(error.message || "");
      // Supabase renverra une erreur de contrainte unique : on mape en 409
      if (/duplicate key value|uniq_simulations_per_user_title|unique/i.test(msg)) {
        return res.status(409).json({ error: "Un projet avec ce titre existe déjà." });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (e: any) {
    // zod validation ?
    if (e?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: e.issues });
    }
    res.status(500).json({ error: e?.message || "Failed to create simulation" });
  }
});

/**
 * PUT /api/simulations/:id
 * Met à jour le titre/payload d’une simulation
 * -> retourne 409 si le nouveau titre est déjà pris par une autre simulation du même user
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = upsertSchema.parse(req.body);

    const jwt = (req as any).user?.jwt as string;
    const supabase = getSupabaseForServer(jwt);

    const { data, error } = await supabase
      .from("simulations")
      .update({ title: body.title, payload: body.payload ?? {}, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, title, payload, created_at, updated_at")
      .single();

    if (error) {
      const msg = String(error.message || "");
      if (/duplicate key value|uniq_simulations_per_user_title|unique/i.test(msg)) {
        return res.status(409).json({ error: "Un projet avec ce titre existe déjà." });
      }
      throw error;
    }

    res.json(data);
  } catch (e: any) {
    if (e?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: e.issues });
    }
    res.status(500).json({ error: e?.message || "Failed to update simulation" });
  }
});

/**
 * DELETE /api/simulations/:id
 * Supprime une simulation de l’utilisateur
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const jwt = (req as any).user?.jwt as string;
    const supabase = getSupabaseForServer(jwt);

    const { error } = await supabase.from("simulations").delete().eq("id", id);
    if (error) {
      return res.status(400).json({ error: error.message || "Failed to delete simulation" });
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to delete simulation" });
  }
});

export default router;
