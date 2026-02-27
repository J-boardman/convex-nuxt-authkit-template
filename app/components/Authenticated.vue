<script setup lang="ts">
const { isLoading: convexIsLoading, isAuthenticated: convexIsAuthenticated } =
  useConvexAuth();
const { isLoading: authIsLoading, user } = useAuth();

const show = computed(() => {
  // If WorkOS auth resolved with a user but Convex is still confirming,
  // show content optimistically (avoids flash after SSR)
  if (!authIsLoading.value && user.value && convexIsLoading.value) {
    return true;
  }
  // Once Convex finishes, defer to its state
  if (!convexIsLoading.value) {
    return convexIsAuthenticated.value;
  }
  return false;
});
</script>

<template>
  <slot v-if="show" />
</template>
