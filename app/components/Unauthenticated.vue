<script setup lang="ts">
const { isLoading: convexIsLoading, isAuthenticated: convexIsAuthenticated } =
  useConvexAuth();
const { isLoading: authIsLoading, user } = useAuth();

const show = computed(() => {
  // If WorkOS auth resolved with no user but Convex is still loading,
  // show unauthenticated content optimistically
  if (!authIsLoading.value && !user.value && convexIsLoading.value) {
    return true;
  }
  // Once Convex finishes, defer to its state
  if (!convexIsLoading.value) {
    return !convexIsAuthenticated.value;
  }
  return false;
});
</script>

<template>
  <slot v-if="show" />
</template>
