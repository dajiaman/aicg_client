<script setup>
defineProps({ src: String, label: String })
</script>

<template>
  <div v-if="src">
    <p v-if="label" class="label">{{ label }}</p>
    <video :src="src" controls class="w-full max-w-md rounded-lg border border-gray-200 bg-black"></video>
  </div>
</template>
