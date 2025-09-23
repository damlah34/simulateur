import { pool } from "../db/pool";
import type { PoolClient } from "pg";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { createAccessToken } from "./token";

const TABLE_NAME = "app_users";

type Queryable = PoolClient | typeof pool;

let initialized = false;

export type UserRole = "admin" | "user";

export interface User {
  id: number;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export class UserServiceError extends Error {
  constructor(
    message: string,
    public code: "EMAIL_IN_USE" | "INVALID_CREDENTIALS" | "NOT_FOUND"
  ) {
    super(message);
    this.name = "UserServiceError";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function ensureUsersTable(executor: Queryable = pool) {
  if (initialized) return;
  await executor.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await executor.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_${TABLE_NAME}_email ON ${TABLE_NAME}(email)
  `);
  initialized = true;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  const derivedBuffer = Buffer.from(derived, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (derivedBuffer.length !== storedBuffer.length) return false;
  return timingSafeEqual(derivedBuffer, storedBuffer);
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName?: string | null;
  role?: UserRole;
}

export async function createUser(
  input: CreateUserInput,
  options?: { allowRoleAssignment?: boolean }
): Promise<User> {
  const client = await pool.connect();
  try {
    await ensureUsersTable(client);
    const email = normalizeEmail(input.email);
    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${TABLE_NAME}`
    );
    const totalUsers = Number(rows[0]?.count ?? 0);
    const role =
      options?.allowRoleAssignment && input.role
        ? input.role
        : totalUsers === 0
        ? "admin"
        : "user";

    const passwordHash = hashPassword(input.password);

    const result = await client.query<UserRow>(
      `INSERT INTO ${TABLE_NAME} (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, password_hash, full_name, role, created_at, updated_at`,
      [email, passwordHash, input.fullName ?? null, role]
    );
    return mapUser(result.rows[0]);
  } catch (error: any) {
    if (error?.code === "23505") {
      throw new UserServiceError("Email already in use", "EMAIL_IN_USE");
    }
    throw error;
  } finally {
    client.release();
  }
}

export interface AuthenticateResult {
  token: string;
  user: User;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticateResult> {
  await ensureUsersTable();
  const normalized = normalizeEmail(email);
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM ${TABLE_NAME} WHERE email = $1 LIMIT 1`,
    [normalized]
  );
  const row = rows[0];
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new UserServiceError("Invalid email or password", "INVALID_CREDENTIALS");
  }
  const user = mapUser(row);
  const token = createAccessToken(user);
  return { token, user };
}

export async function listUsers(): Promise<User[]> {
  await ensureUsersTable();
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, full_name, role, created_at, updated_at
     FROM ${TABLE_NAME}
     ORDER BY created_at DESC`
  );
  return rows.map(mapUser);
}

export async function getUserById(id: number): Promise<User | null> {
  await ensureUsersTable();
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, full_name, role, created_at, updated_at
     FROM ${TABLE_NAME}
     WHERE id = $1`,
    [id]
  );
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export interface UpdateUserInput {
  fullName?: string | null;
  role?: UserRole;
  password?: string;
}

export async function updateUser(
  id: number,
  updates: UpdateUserInput,
  options?: { allowRoleAssignment?: boolean }
): Promise<User> {
  const client = await pool.connect();
  try {
    await ensureUsersTable(client);
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (updates.fullName !== undefined) {
      fields.push(`full_name = $${index++}`);
      values.push(updates.fullName ?? null);
    }

    if (updates.password) {
      fields.push(`password_hash = $${index++}`);
      values.push(hashPassword(updates.password));
    }

    if (options?.allowRoleAssignment && updates.role) {
      fields.push(`role = $${index++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) {
      const existing = await getUserById(id);
      if (!existing) throw new UserServiceError("User not found", "NOT_FOUND");
      return existing;
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE ${TABLE_NAME}
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, email, password_hash, full_name, role, created_at, updated_at
    `;
    values.push(id);

    const { rows } = await client.query<UserRow>(query, values);
    if (!rows[0]) throw new UserServiceError("User not found", "NOT_FOUND");
    return mapUser(rows[0]);
  } finally {
    client.release();
  }
}

export async function deleteUser(id: number): Promise<void> {
  await ensureUsersTable();
  const { rowCount } = await pool.query(
    `DELETE FROM ${TABLE_NAME} WHERE id = $1`,
    [id]
  );
  if (rowCount === 0) {
    throw new UserServiceError("User not found", "NOT_FOUND");
  }
}

export async function countUsers(): Promise<number> {
  await ensureUsersTable();
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${TABLE_NAME}`
  );
  return Number(rows[0]?.count ?? 0);
}
