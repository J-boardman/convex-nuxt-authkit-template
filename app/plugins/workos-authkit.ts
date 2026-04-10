import { useConvexClient } from "convex-vue";
import { AUTH_KEY, type AuthState } from "~/composables/useAuth";
import type { SessionUser } from "~~/server/utils/auth";

export default defineNuxtPlugin((nuxtApp) => {
  const isLoading = ref(true);
  const isAuthenticated = ref(false);
  const user = ref<SessionUser | null>(null);

  const authState: AuthState = {
    isLoading,
    isAuthenticated,
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
  };

  nuxtApp.vueApp.provide(AUTH_KEY, authState);

  const convex = useConvexClient();

  convex.setAuth(
    async () => {
      try {
        const { user: u, accessToken } = await $fetch("/api/auth/session");
        user.value = u;
        return accessToken ?? null;
      } catch {
        user.value = null;
        return null;
      }
    },
    (isAuth) => {
      isAuthenticated.value = isAuth;
      isLoading.value = false;
    },
  );
});
