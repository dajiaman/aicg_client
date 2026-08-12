<template>
  <div class="card space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold">当前版本</div>
        <div class="text-sm text-gray-400">v{{ appVersion }}</div>
      </div>
      <a-button size="large" type="primary" class="btn-primary" @click="checkUpdate">检查更新 </a-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const appVersion = ref('0.0.1')
const checking = ref(false)

onMounted(async () => {
  const res = await window.api.file.getAppInfo()
  console.log(res)

  if (res.success) {
    appVersion.value = res.data.version
  }
})

const checkUpdate = async () => {
  //void
}
</script>
