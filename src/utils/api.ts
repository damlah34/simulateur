import type { AppUser, UserRole } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    let message = 'Une erreur est survenue';
    try {
      const data = await response.json();
      message = data?.error ?? message;
    } catch {
      // ignore JSON parsing errors
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  return (await response.json()) as T;
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: AppUser }>('/users/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName?: string;
}) {
  return request<{ token: string; user: AppUser }>('/users/register', {
    method: 'POST',
    body: input,
  });
}

export async function fetchCurrentUser(token: string) {
  return request<{ user: AppUser }>('/users/me', { token });
}

export async function fetchUsers(token: string) {
  return request<{ users: AppUser[] }>('/users', { token });
}

export async function createUser(token: string, input: {
  email: string;
  password: string;
  fullName?: string;
  role?: UserRole;
}) {
  return request<{ user: AppUser }>('/users', {
    method: 'POST',
    token,
    body: input,
  });
}

export async function updateUser(token: string, id: number, input: {
  fullName?: string | null;
  role?: UserRole;
  password?: string;
}) {
  return request<{ user: AppUser }>(`/users/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

export async function deleteUser(token: string, id: number) {
  return request<void>(`/users/${id}`, {
    method: 'DELETE',
    token,
  });
}
