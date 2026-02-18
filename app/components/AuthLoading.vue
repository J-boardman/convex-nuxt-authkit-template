<script setup lang="ts">
const { isLoading } = useConvexAuth();
</script>

<template>
  <slot v-if="isLoading" />
</template>
