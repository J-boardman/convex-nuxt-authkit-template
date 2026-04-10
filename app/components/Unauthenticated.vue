<script setup lang="ts">
const { isLoading, isAuthenticated } = useAuth();
</script>

<template>
  <slot v-if="!isLoading && !isAuthenticated" />
</template>
