<script setup>
defineProps({
  running: Boolean,
  progress: { type: Number, default: 0 },
  message: String,
  error: String
})
</script>

<template>
  <div v-if="running || message || error" class="mt-4">
    <div v-if="running || (progress > 0 && progress < 100)" class="mb-1">
      <div class="w-full bg-gray-100 rounded-full h-2">
        <div
          class="bg-gradient-to-r from-fuchsia-500 to-purple-600 h-2 rounded-full transition-all"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>
    <p v-if="error" class="text-sm text-red-600">✕ {{ error }}</p>
    <p v-else-if="message" class="text-sm text-gray-500">{{ message }}</p>
  </div>
</template>
