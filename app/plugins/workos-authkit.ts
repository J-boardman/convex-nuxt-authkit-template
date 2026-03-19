import { AUTH_KEY, type AuthState } from "~/composables/useAuth";
import {
  CONVEX_AUTH_KEY,
  type ConvexAuthState,
} from "~/composables/useConvexAuth";
import type { SessionUser } from "~~/server/utils/auth";

export default defineNuxtPlugin((nuxtApp) => {
  const isLoading = ref(true);
  const user = ref<SessionUser | null>(null);

  const convexIsLoading = ref(true);
  const convexIsAuthenticated = ref(false);

  // Provide auth state (must happen on both server + client for SSR)
  const authState: AuthState = {
    isLoading,
    user,
    signIn: async () => {
      await navigateTo("/api/auth/sign-in", { external: true });
    },
    signUp: async () => {
      await navigateTo("/api/auth/sign-up", { external: true });
    },
    signOut: async () => {
      await navigateTo("/api/auth/sign-out", { external: true });
    },
    getAccessToken: async () => {
      const session = await $fetch("/api/auth/session");
      if (!session.accessToken) throw new Error("Not authenticated");
      return session.accessToken;
    },
    getUser: () => user.value,
  };

  const convexAuthState: ConvexAuthState = {
    isLoading: convexIsLoading,
    isAuthenticated: convexIsAuthenticated,
  };

  nuxtApp.vueApp.provide(AUTH_KEY, authState);
  nuxtApp.vueApp.provide(CONVEX_AUTH_KEY, convexAuthState);

  // Everything below is client-only
  if (!import.meta.client) return;

  type ConvexClientWithAuth = {
    setAuth: (
      fetchToken: () => Promise<string | null>,
      onChange?: (isAuth: boolean) => void
    ) => void;
  };

  function getConvexClient(): ConvexClientWithAuth | null {
    try {
      const ctx = nuxtApp.vueApp._context.provides["convex-vue"] as
        | { clientRef: { value: ConvexClientWithAuth | undefined } }
        | undefined;
      return ctx?.clientRef?.value ?? null;
    } catch {
      return null;
    }
  }

  async function fetchSession(): Promise<{
    user: SessionUser | null;
    accessToken: string | null;
  }> {
    try {
      return await $fetch("/api/auth/session");
    } catch {
      return { user: null, accessToken: null };
    }
  }

  function setupConvexAuth() {
    const convexClient = getConvexClient();
    if (!convexClient) {
      console.warn("[workos-authkit] ConvexClient not available");
      convexIsLoading.value = false;
      return;
    }

    convexClient.setAuth(
      async () => {
        try {
          const session = await fetchSession();
          return session.accessToken;
        } catch {
          return null;
        }
      },
      (isAuthenticated) => {
        convexIsAuthenticated.value = isAuthenticated;
        convexIsLoading.value = false;
      }
    );
  }

  function clearConvexAuth() {
    const convexClient = getConvexClient();
    convexClient?.setAuth(
      async () => null,
      (isAuth) => {
        convexIsAuthenticated.value = isAuth;
      }
    );
    convexIsAuthenticated.value = false;
    convexIsLoading.value = false;
  }

  // Initialize: fetch session from server
  fetchSession().then((session) => {
    user.value = session.user;
    isLoading.value = false;

    if (session.user) {
      setupConvexAuth();
    } else {
      clearConvexAuth();
    }
  });

  // Periodic token refresh (every 5 minutes)
  const REFRESH_INTERVAL = 5 * 60 * 1000;
  const refreshInterval = setInterval(async () => {
    const session = await fetchSession();
    user.value = session.user;
    if (!session.user) {
      clearConvexAuth();
    }
  }, REFRESH_INTERVAL);

  window.addEventListener("beforeunload", () => {
    clearInterval(refreshInterval);
  });
});
