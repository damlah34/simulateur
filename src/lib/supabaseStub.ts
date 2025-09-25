// Minimal stub for @supabase/supabase-js used in offline builds.

type Session = {
  access_token: string;
  refresh_token: string;
};

type AuthResult<T = unknown> = { data: T | null; error: Error | null };

type SessionResult = AuthResult<{ session: Session | null }>;

type SetSessionInput = {
  access_token: string;
  refresh_token: string;
};

let currentSession: Session | null = null;

export function createClient() {
  return {
    auth: {
      async exchangeCodeForSession(): Promise<AuthResult> {
        currentSession = { access_token: 'stub-access-token', refresh_token: 'stub-refresh-token' };
        return { data: null, error: null };
      },
      async setSession(session: SetSessionInput): Promise<SessionResult> {
        currentSession = { access_token: session.access_token, refresh_token: session.refresh_token };
        return { data: { session: currentSession }, error: null };
      },
      async getSession(): Promise<SessionResult> {
        return { data: { session: currentSession }, error: null };
      },
      async updateUser(): Promise<AuthResult> {
        return { data: null, error: null };
      },
      async signOut(): Promise<AuthResult> {
        currentSession = null;
        return { data: null, error: null };
      },
    },
  };
}
