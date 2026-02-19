import type { User } from "@workos-inc/authkit-js";
import type { createClient } from "@workos-inc/authkit-js";
import type { ConvexClient } from "convex/browser";
import { useConvexClient } from "convex-vue";

type WorkOSClient = Awaited<ReturnType<typeof createClient>>;

// Simple Convex auth bridge — inspired by the Clerk example.
// Waits for WorkOS to initialize, then calls convex.setAuth(getToken).
export default defineNuxtPlugin(async (nuxtApp) => {
  const workosClientReady = nuxtApp.$workosClientReady as Promise<WorkOSClient>;
  const workosUser = nuxtApp.$workosUser as Ref<User | null>;
  const convexIsLoading = nuxtApp.$convexIsLoading as Ref<boolean>;
  const convexIsAuthenticated = nuxtApp.$convexIsAuthenticated as Ref<boolean>;

  // runWithContext ensures inject() inside useConvexClient resolves correctly.
  // useConvexClient is synchronous so the cast is safe.
  const convexClient = nuxtApp.runWithContext(() => useConvexClient()) as ConvexClient;

  let workosClient: WorkOSClient;
  try {
    workosClient = await workosClientReady;
  } catch {
    convexIsLoading.value = false;
    return;
  }

  function bridgeAuth(authenticated: boolean) {
    if (authenticated) {
      convexClient.setAuth(
        async () => {
          try {
            return await workosClient.getAccessToken();
          } catch {
            return null;
          }
        },
        (isAuth: boolean) => {
          convexIsAuthenticated.value = isAuth;
          convexIsLoading.value = false;
        },
      );
    } else {
      convexClient.setAuth(
        async () => null,
        (isAuth: boolean) => {
          convexIsAuthenticated.value = isAuth;
          convexIsLoading.value = false;
        },
      );
    }
  }

  // Initial bridge
  bridgeAuth(!!workosClient.getUser());

  // Re-bridge on sign-in/sign-out
  watch(workosUser, (newUser) => {
    bridgeAuth(!!newUser);
  });
});
