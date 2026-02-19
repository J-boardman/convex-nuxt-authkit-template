import { createClient, type User } from "@workos-inc/authkit-js";
import { AUTH_KEY, type AuthState } from "~/composables/useAuth";
import { CONVEX_AUTH_KEY, type ConvexAuthState } from "~/composables/useConvexAuth";

// The authkit-js library checks for this cookie to determine whether to attempt
// session restoration on page refresh in production. In dev mode (localhost) it
// uses localStorage instead, but in production it relies on this indicator cookie
// — which the library never sets itself. We manage it here.
const SESSION_INDICATOR_COOKIE = "workos-has-session";

function setSessionIndicatorCookie() {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_INDICATOR_COOKIE}=1; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secure}`;
}

function clearSessionIndicatorCookie() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_INDICATOR_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

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

  // Client reference — populated once createClient resolves
  type WorkOSClient = Awaited<ReturnType<typeof createClient>>;
  let workosClient: WorkOSClient | null = null;

  // Promise that resolves when the WorkOS client is ready
  let resolveClientReady: (client: WorkOSClient) => void;
  const clientReadyPromise = new Promise<WorkOSClient>((resolve) => {
    resolveClientReady = resolve;
  });

  function updateAuthState(u: User | null, orgId?: string, r?: string, perms?: string[]) {
    user.value = u;
    organizationId.value = orgId ?? null;
    role.value = r ?? null;
    permissions.value = perms ?? [];
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
      clearSessionIndicatorCookie();
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
      setSessionIndicatorCookie();
      updateAuthState(refreshedUser, orgId);
    },
    onRefreshFailure: () => {
      clearSessionIndicatorCookie();
      updateAuthState(null);
    },
  })
    .then((client) => {
      workosClient = client;

      const currentUser = client.getUser();
      updateAuthState(currentUser);
      isLoading.value = false;

      if (currentUser) {
        setSessionIndicatorCookie();
      } else {
        clearSessionIndicatorCookie();
      }

      resolveClientReady(client);
    })
    .catch((err) => {
      console.error("[workos-authkit] Failed to initialize:", err);
      isLoading.value = false;
      convexIsLoading.value = false;
    });

  return {
    provide: {
      workosClientReady: clientReadyPromise,
      workosUser: user,
      convexIsLoading,
      convexIsAuthenticated,
    },
  };
});
