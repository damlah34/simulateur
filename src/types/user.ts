export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: number;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
