import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { newDb } from 'pg-mem';

process.env.JWT_SECRET = 'test-secret';

const db = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
const adapter = db.adapters.createPg();
const pool = new adapter.Pool();

vi.mock('../src/db/pool', () => ({ pool }));

let services: typeof import('../src/services/users');

beforeAll(async () => {
  services = await import('../src/services/users');
});

beforeEach(async () => {
  await (pool as any).query('SELECT 1');
  try {
    db.public.none('DELETE FROM app_users;');
  } catch {
    // ignore when table does not exist yet
  }
});

describe('user service', () => {
  test('first created user becomes admin', async () => {
    const admin = await services.createUser({
      email: 'admin@example.com',
      password: 'password123',
      fullName: 'Admin',
    });
    expect(admin.role).toBe('admin');

    const user = await services.createUser({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(user.role).toBe('user');
  });

  test('login returns an access token', async () => {
    await services.createUser({ email: 'test@example.com', password: 'password123' });
    const result = await services.authenticateUser('test@example.com', 'password123');
    expect(result.user.email).toBe('test@example.com');
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(10);
  });

  test('duplicate email raises service error', async () => {
    await services.createUser({ email: 'dup@example.com', password: 'password123' });
    await expect(
      services.createUser({ email: 'dup@example.com', password: 'password456' })
    ).rejects.toThrow(services.UserServiceError);
  });

  test('list, update and delete users', async () => {
    const admin = await services.createUser({ email: 'admin@example.com', password: 'password123' });
    const other = await services.createUser({ email: 'user2@example.com', password: 'password123' });

    const allUsers = await services.listUsers();
    expect(allUsers).toHaveLength(2);

    const updated = await services.updateUser(other.id, { fullName: 'Updated' });
    expect(updated.fullName).toBe('Updated');

    await services.deleteUser(other.id);
    const remaining = await services.listUsers();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(admin.id);
  });

  test('countUsers reflects table size', async () => {
    expect(await services.countUsers()).toBe(0);
    await services.createUser({ email: 'admin@example.com', password: 'password123' });
    expect(await services.countUsers()).toBe(1);
  });
});
