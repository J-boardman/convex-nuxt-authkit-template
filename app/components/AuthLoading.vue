<script setup lang="ts">
const { isLoading } = useAuth();
</script>

<template>
  <slot v-if="isLoading" />
</template>
