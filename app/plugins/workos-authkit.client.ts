import { createClient, type User } from "@workos-inc/authkit-js";
import { AUTH_KEY, type AuthState } from "~/composables/useAuth";
import { CONVEX_AUTH_KEY, type ConvexAuthState } from "~/composables/useConvexAuth";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const clientId = config.public.workosClientId as string;
  const redirectUri = config.public.workosRedirectUri as string;

  // Reactive auth state
  const isLoading = ref(true);
  const user = ref<User | null>(null);
  const organizationId = ref<string | null>(null);
  const role = ref<string | null>(null);
  const permissions = ref<string[]>([]);

  // Convex auth state
  const convexIsLoading = ref(true);
  const convexIsAuthenticated = ref(false);

  // Delegate holder — methods proxy to real client once initialized
  type WorkOSClient = Awaited<ReturnType<typeof createClient>>;
  let workosClient: WorkOSClient | null = null;

  // ConvexClient (simple_client) only has setAuth, no clearAuth.
  // To clear auth, call setAuth with a fetcher that returns null.
  type ConvexClientWithAuth = {
    setAuth: (fetchToken: () => Promise<string | null>, onChange?: (isAuth: boolean) => void) => void;
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

  function updateAuthState(u: User | null, orgId?: string, r?: string, perms?: string[]) {
    user.value = u;
    organizationId.value = orgId ?? null;
    role.value = r ?? null;
    permissions.value = perms ?? [];
  }

  function clearConvexAuth() {
    const convexClient = getConvexClient();
    convexClient?.setAuth(async () => null, (isAuth) => {
      convexIsAuthenticated.value = isAuth;
    });
    convexIsAuthenticated.value = false;
    convexIsLoading.value = false;
  }

  function setupConvexAuth(client: WorkOSClient) {
    const convexClient = getConvexClient();
    if (!convexClient) {
      console.warn("[workos-authkit] ConvexClient not available");
      convexIsLoading.value = false;
      return;
    }

    convexClient.setAuth(
      async () => {
        try {
          return await client.getAccessToken();
        } catch {
          return null;
        }
      },
      (isAuthenticated) => {
        convexIsAuthenticated.value = isAuthenticated;
        convexIsLoading.value = false;
      },
    );
  }

  // Provide auth state
  const authState: AuthState = {
    isLoading,
    user,
    organizationId,
    role,
    permissions,
    signIn: async (opts) => {
      if (workosClient) await workosClient.signIn(opts);
    },
    signUp: async (opts) => {
      if (workosClient) await workosClient.signUp(opts);
    },
    signOut: () => {
      workosClient?.signOut();
    },
    getAccessToken: async () => {
      if (!workosClient) throw new Error("WorkOS client not initialized");
      return workosClient.getAccessToken();
    },
    getUser: () => user.value,
  };

  const convexAuthState: ConvexAuthState = {
    isLoading: convexIsLoading,
    isAuthenticated: convexIsAuthenticated,
  };

  nuxtApp.vueApp.provide(AUTH_KEY, authState);
  nuxtApp.vueApp.provide(CONVEX_AUTH_KEY, convexAuthState);

  // Initialize WorkOS client
  createClient(clientId, {
    redirectUri,
    onRefresh: ({ user: refreshedUser, organizationId: orgId }) => {
      updateAuthState(refreshedUser, orgId);
    },
    onRefreshFailure: () => {
      updateAuthState(null);
      clearConvexAuth();
    },
  }).then((client) => {
    workosClient = client;

    const currentUser = client.getUser();
    updateAuthState(currentUser);
    isLoading.value = false;

    if (currentUser) {
      setupConvexAuth(client);
    } else {
      clearConvexAuth();
    }
  }).catch((err) => {
    console.error("[workos-authkit] Failed to initialize:", err);
    isLoading.value = false;
    clearConvexAuth();
  });
});
