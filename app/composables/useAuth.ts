import type { Ref, InjectionKey } from "vue";
import type { User } from "@workos-inc/authkit-js";

export interface AuthState {
  isLoading: Ref<boolean>;
  user: Ref<User | null>;
  organizationId: Ref<string | null>;
  role: Ref<string | null>;
  permissions: Ref<string[]>;
  signIn: (options?: { organizationId?: string; loginHint?: string }) => Promise<void>;
  signUp: (options?: { organizationId?: string; loginHint?: string }) => Promise<void>;
  signOut: () => void;
  getAccessToken: () => Promise<string>;
  getUser: () => User | null;
}

export const AUTH_KEY: InjectionKey<AuthState> = Symbol("workos-auth");

export function useAuth(): AuthState {
  const state = inject(AUTH_KEY);
  if (!state) {
    throw new Error("useAuth() requires the workos-authkit plugin to be installed");
  }
  return state;
}
