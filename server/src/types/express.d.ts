import type { User } from "../services/users";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      accessToken?: string;
    }
  }
}

export {};
