<script setup lang="ts">
const { isLoading, isAuthenticated } = useConvexAuth();
</script>

<template>
  <slot v-if="!isLoading && isAuthenticated" />
</template>
