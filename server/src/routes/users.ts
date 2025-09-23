import { Router } from "express";
import { z } from "zod";
import {
  authenticateUser,
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
  UserServiceError,
} from "../services/users";
import { requireAdmin, requireUserAuth, type AuthenticatedRequest } from "../middlewares/userAuth";
import { createAccessToken } from "../services/token";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const nameSchema = z
  .string()
  .trim()
  .min(1, "Full name must not be empty")
  .max(200, "Full name is too long");

const registerSchema = credentialsSchema.extend({
  fullName: nameSchema.optional(),
});

const adminCreateSchema = registerSchema.extend({
  role: z.enum(["admin", "user"]).optional(),
});

const updateSchema = z.object({
  fullName: nameSchema.nullable().optional(),
  role: z.enum(["admin", "user"]).optional(),
  password: z.string().min(8).optional(),
});

router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const user = await createUser(body);
    const token = createAccessToken(user);
    return res.status(201).json({ token, user });
  } catch (error: any) {
    if (error instanceof UserServiceError) {
      if (error.code === "EMAIL_IN_USE") {
        return res.status(409).json({ error: error.message });
      }
    }
    if (error?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: error.issues });
    }
    return res.status(500).json({ error: error?.message ?? "Unexpected error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = credentialsSchema.parse(req.body);
    const result = await authenticateUser(body.email, body.password);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof UserServiceError && error.code === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: error.message });
    }
    if (error?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: error.issues });
    }
    return res.status(500).json({ error: error?.message ?? "Unexpected error" });
  }
});

router.get("/me", requireUserAuth, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.currentUser });
});

router.get("/", requireUserAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? "Unexpected error" });
  }
});

router.post("/", requireUserAuth, requireAdmin, async (req, res) => {
  try {
    const body = adminCreateSchema.parse(req.body);
    const user = await createUser(body, { allowRoleAssignment: true });
    return res.status(201).json({ user });
  } catch (error: any) {
    if (error instanceof UserServiceError && error.code === "EMAIL_IN_USE") {
      return res.status(409).json({ error: error.message });
    }
    if (error?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: error.issues });
    }
    return res.status(500).json({ error: error?.message ?? "Unexpected error" });
  }
});

router.patch("/:id", requireUserAuth, requireAdmin, async (req, res) => {
  try {
    const body = updateSchema.parse(req.body);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (body.role && id === req.currentUser?.id) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }
    const updated = await updateUser(id, body, { allowRoleAssignment: true });
    return res.json({ user: updated });
  } catch (error: any) {
    if (error instanceof UserServiceError && error.code === "NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }
    if (error?.issues) {
      return res.status(400).json({ error: "Invalid payload", details: error.issues });
    }
    return res.status(500).json({ error: error?.message ?? "Unexpected error" });
  }
});

router.delete("/:id", requireUserAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (req.currentUser?.id === id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    await deleteUser(id);
    return res.status(204).send();
  } catch (error: any) {
    if (error instanceof UserServiceError && error.code === "NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error?.message ?? "Unexpected error" });
  }
});

router.get("/:id", requireUserAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? "Unexpected error" });
  }
});

export default router;
