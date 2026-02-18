import type { Ref, InjectionKey } from "vue";

export interface ConvexAuthState {
  isLoading: Ref<boolean>;
  isAuthenticated: Ref<boolean>;
}

export const CONVEX_AUTH_KEY: InjectionKey<ConvexAuthState> = Symbol("convex-auth");

export function useConvexAuth(): ConvexAuthState {
  const state = inject(CONVEX_AUTH_KEY);
  if (!state) {
    throw new Error("useConvexAuth() requires the workos-authkit plugin to be installed");
  }
  return state;
}
