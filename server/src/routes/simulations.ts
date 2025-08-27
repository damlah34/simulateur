import { Router } from "express";
import { z } from "zod";
import { getSupabaseForServer } from "../supabase";
import type { Request } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
router.use(requireAuth); // protège tout le router

// Schémas d'inputs
const createSchema = z.object({
  title: z.string().min(1, "Title required"),
  payload: z.record(z.any()).default({}),
});
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  payload: z.record(z.any()).optional(),
});

// Récup infos auth
function getAuth(req: Request): { jwt: string; userId: string } {
  // @ts-expect-error injecté par le middleware
  const u = req.user as { jwt: string; userId: string } | undefined;
  if (!u) throw new Error("Missing req.user");
  return u;
}

// GET /api/simulations -> liste mes simulations
router.get("/", async (req, res) => {
  const { jwt, userId } = getAuth(req);
  const supabase = getSupabaseForServer(jwt);
  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
});

// POST /api/simulations -> créer (force owner_id)
router.post("/", async (req, res) => {
  try {
    const { jwt, userId } = getAuth(req);
    const supabase = getSupabaseForServer(jwt);
    const body = createSchema.parse(req.body);

    const insert = { owner_id: userId, title: body.title, payload: body.payload ?? {} };
    const { data, error } = await supabase.from("simulations").insert(insert).select().single();
    if (error) return res.status(400).json({ error: error.message });

    await supabase.rpc("rpc_log_action", {
      p_owner: userId,
      p_action: "create",
      p_entity: "simulation",
      p_entity_id: data.id,
      p_diff: { title: data.title },
    });

    return res.status(201).json(data);
  } catch (e: any) {
    if (e?.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
    return res.status(500).json({ error: e?.message ?? "Unexpected error" });
  }
});

// GET /api/simulations/:id -> détail si propriétaire
router.get("/:id", async (req, res) => {
  const { jwt, userId } = getAuth(req);
  const supabase = getSupabaseForServer(jwt);
  const id = req.params.id;

  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();

  if (error?.code === "PGRST116") return res.status(404).json({ error: "Not found" });
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

// PATCH /api/simulations/:id -> maj si propriétaire
router.patch("/:id", async (req, res) => {
  try {
    const { jwt, userId } = getAuth(req);
    const supabase = getSupabaseForServer(jwt);
    const id = req.params.id;
    const body = updateSchema.parse(req.body);

    const { data: existing, error: getErr } = await supabase
      .from("simulations")
      .select("id, owner_id, title, payload")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();
    if (getErr?.code === "PGRST116") return res.status(404).json({ error: "Not found" });
    if (getErr) return res.status(400).json({ error: getErr.message });

    const updated = { title: body.title ?? existing.title, payload: body.payload ?? existing.payload };

    const { data, error } = await supabase
      .from("simulations")
      .update(updated)
      .eq("id", id)
      .eq("owner_id", userId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    await supabase.rpc("rpc_log_action", {
      p_owner: userId,
      p_action: "update",
      p_entity: "simulation",
      p_entity_id: id,
      p_diff: updated,
    });

    return res.json(data);
  } catch (e: any) {
    if (e?.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
    return res.status(500).json({ error: e?.message ?? "Unexpected error" });
  }
});

// DELETE /api/simulations/:id -> supprime si propriétaire
router.delete("/:id", async (req, res) => {
  const { jwt, userId } = getAuth(req);
  const supabase = getSupabaseForServer(jwt);
  const id = req.params.id;

  const { error } = await supabase.from("simulations").delete().eq("id", id).eq("owner_id", userId);
  if (error) return res.status(400).json({ error: error.message });

  await supabase.rpc("rpc_log_action", {
    p_owner: userId,
    p_action: "delete",
    p_entity: "simulation",
    p_entity_id: id,
    p_diff: null,
  });

  return res.status(204).send();
});

export default router;
