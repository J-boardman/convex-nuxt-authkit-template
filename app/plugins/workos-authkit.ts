import { AUTH_KEY, type AuthState } from "~/composables/useAuth";
import {
  CONVEX_AUTH_KEY,
  type ConvexAuthState,
} from "~/composables/useConvexAuth";
import type { SessionUser } from "~~/server/utils/auth";

export default defineNuxtPlugin(async (nuxtApp) => {
  const isLoading = ref(true);
  const user = ref<SessionUser | null>(null);

  const convexIsLoading = ref(true);
  const convexIsAuthenticated = ref(false);

  // SSR -> client state transfer for session data
  const ssrSession = useState<{
    user: SessionUser | null;
    accessToken: string | null;
  } | null>("workos-session", () => null);

  // Resolve session during SSR from the cookie (no HTTP round trip)
  if (import.meta.server) {
    const event = useRequestEvent();
    if (event) {
      try {
        const { getSession } = await import("~~/server/utils/auth");
        const session = await getSession(event);
        if (session) {
          ssrSession.value = {
            user: session.user,
            accessToken: session.accessToken,
          };
          user.value = session.user;
        }
      } catch {
        // Cookie invalid or getSession failed; leave as null
      }
    }
    isLoading.value = false;
  }

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
      if (import.meta.server) {
        if (ssrSession.value?.accessToken) return ssrSession.value.accessToken;
        throw new Error("Not authenticated");
      }
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

  // Token cache to avoid duplicate fetches
  let cachedAccessToken: string | null =
    ssrSession.value?.accessToken ?? null;
  let tokenCacheTimestamp = cachedAccessToken ? Date.now() : 0;
  const TOKEN_CACHE_TTL = 30_000; // 30 seconds

  async function fetchSession(): Promise<{
    user: SessionUser | null;
    accessToken: string | null;
  }> {
    try {
      const result = await $fetch("/api/auth/session");
      cachedAccessToken = result.accessToken;
      tokenCacheTimestamp = Date.now();
      return result;
    } catch {
      cachedAccessToken = null;
      return { user: null, accessToken: null };
    }
  }

  async function getCachedOrFetchToken(): Promise<string | null> {
    if (
      cachedAccessToken &&
      Date.now() - tokenCacheTimestamp < TOKEN_CACHE_TTL
    ) {
      return cachedAccessToken;
    }
    const session = await fetchSession();
    return session.accessToken;
  }

  function setupConvexAuth() {
    const convexClient = getConvexClient();
    if (!convexClient) {
      console.warn("[workos-authkit] ConvexClient not available");
      convexIsLoading.value = false;
      return;
    }

    convexClient.setAuth(getCachedOrFetchToken, (isAuthenticated) => {
      convexIsAuthenticated.value = isAuthenticated;
      convexIsLoading.value = false;
    });
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

  // Initialize from SSR-transferred state (no fetch needed)
  if (ssrSession.value) {
    user.value = ssrSession.value.user;
    isLoading.value = false;
    if (ssrSession.value.user) {
      setupConvexAuth();
    } else {
      clearConvexAuth();
    }
  } else {
    // Fallback: no SSR data (e.g., client-only navigation)
    isLoading.value = true;
    fetchSession().then((session) => {
      user.value = session.user;
      isLoading.value = false;
      if (session.user) {
        setupConvexAuth();
      } else {
        clearConvexAuth();
      }
    });
  }

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
