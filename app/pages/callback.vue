<script setup lang="ts">
const { isLoading } = useAuth();
const router = useRouter();

watch(isLoading, (loading) => {
  if (!loading) {
    router.replace("/");
  }
});
</script>

<template>
  <div>Completing sign in...</div>
</template>
