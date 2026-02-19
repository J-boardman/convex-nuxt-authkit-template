import { AUTH_KEY, type AuthState } from "~/composables/useAuth";
import { CONVEX_AUTH_KEY, type ConvexAuthState } from "~/composables/useConvexAuth";

// Server-side plugin that provides default auth state during SSR.
// During SSR, AuthLoading renders its slot while Authenticated/Unauthenticated render nothing.
// The client plugins hydrate and take over with real auth state.
export default defineNuxtPlugin((nuxtApp) => {
  const authState: AuthState = {
    isLoading: ref(true),
    user: ref(null),
    organizationId: ref(null),
    role: ref(null),
    permissions: ref([]),
    signIn: async () => {},
    signUp: async () => {},
    signOut: () => {},
    getAccessToken: async () => {
      throw new Error("Cannot get access token during SSR");
    },
    getUser: () => null,
  };

  const convexAuthState: ConvexAuthState = {
    isLoading: ref(true),
    isAuthenticated: ref(false),
  };

  nuxtApp.vueApp.provide(AUTH_KEY, authState);
  nuxtApp.vueApp.provide(CONVEX_AUTH_KEY, convexAuthState);
});
