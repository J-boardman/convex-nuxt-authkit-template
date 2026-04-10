import type { Ref, InjectionKey } from "vue";
import type { SessionUser } from "~~/server/utils/auth";

export interface AuthState {
  isLoading: Ref<boolean>;
  isAuthenticated: Ref<boolean>;
  user: Ref<SessionUser | null>;
  signIn: (options?: { organizationId?: string; loginHint?: string }) => Promise<void>;
  signUp: (options?: { organizationId?: string; loginHint?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AUTH_KEY: InjectionKey<AuthState> = Symbol("workos-auth");

export function useAuth(): AuthState {
  const state = inject(AUTH_KEY);
  if (!state) {
    throw new Error("useAuth() requires the workos-authkit plugin to be installed");
  }
  return state;
}
