<script setup lang="ts">
import { api } from "~~/convex/_generated/api";
const { data: tasks } = useConvexQuery(api.tasks.get);
const { mutate: createTask } = useConvexMutation(api.tasks.create);
const { mutate: toggleCompletion } = useConvexMutation(api.tasks.toggleCompletion);
const { mutate: removeTask } = useConvexMutation(api.tasks.remove);

const newTask = ref("");

function handleCreateTask() {
  if (!newTask.value.trim()) return;
  createTask({ text: newTask.value });
  newTask.value = "";
}
</script>

<template>
  <h2>Tasks</h2>
  <form @submit.prevent="handleCreateTask">
    <input v-model="newTask" placeholder="Add a new task" />
    <button type="submit">Add</button>
  </form>
  <ul>
    <li v-for="task in tasks" :key="task._id">
      <input type="checkbox" v-model="task.isCompleted" @change="toggleCompletion({ id: task._id })" />
      <span :class="{ 'completed-task': task.isCompleted }">{{ task.text }}</span>
      <button @click="removeTask({ id: task._id })">x</button>
    </li>
  </ul>
</template>

<style scoped>
form {
  display: flex;
}

li {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.completed-task {
  text-decoration: line-through;
}
</style>