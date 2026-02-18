<script setup lang="ts">

const { user, signIn, signOut } = useAuth();

</script>

<template>
  <div>
    <h1>Convex 🤝 Nuxt 🤝 WorkOS AuthKit</h1>

    <AuthLoading>
      <p>Loading...</p>
    </AuthLoading>

    <Unauthenticated>
      <button @click="signIn()">Sign In</button>
    </Unauthenticated>

    <Authenticated>
      <p>Signed in as {{ user?.email }}</p>
      <button @click="signOut()">Sign Out</button>
      <TaskList />
    </Authenticated>
  </div>
</template>