<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const items = [
  { icon: '🏠', label: '首页', to: '/' },
  { icon: '📄', label: '文案' },
  { icon: '🔊', label: '声音', to: '/voices' },
  { icon: '🎬', label: '数字人', to: '/avatars' },
  { icon: '📁', label: '素材' },
  { icon: '📋', label: '任务', to: '/tasks' },
  { icon: '👤', label: '账号', to: '/accounts' },
  { icon: '⚙', label: '设置', to: '/settings' },
  { icon: '❔', label: '帮助' }
]
</script>

<template>
  <nav class="w-14 shrink-0 bg-[#0a0a14] border-r border-white/5 flex flex-col items-center py-4 gap-2 min-h-screen">
    <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold mb-4">超</div>
    <template v-for="(it, i) in items" :key="i">
      <router-link
        v-if="it.to"
        :to="it.to"
        class="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition"
        :class="route.path === it.to ? 'bg-white/10 text-fuchsia-300' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'"
        :title="it.label"
      >{{ it.icon }}</router-link>
      <button
        v-else
        class="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition text-gray-500 hover:bg-white/5 hover:text-gray-300"
        :title="it.label"
      >{{ it.icon }}</button>
    </template>
  </nav>
</template>
