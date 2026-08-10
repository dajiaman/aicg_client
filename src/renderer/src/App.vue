<script setup>
import { useRouter } from 'vue-router'
import { ConfigProvider, theme } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { onMounted } from 'vue'
import { useThemeStore } from './store/theme'
import { useAuthStore } from './store/auth'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  // 用户登录状态检查
  authStore.getProfile().then((res) => {
    if (!res.success) {
      router.push('/login')
    }
  })

  window.api.oem.getInfo().then((res) => {
    if (res.success) {
      themeStore.init(res.data.id)
    }
  })
})

// 暗色主题 token
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgBase: '#23233a',
    colorPrimary: '#d946ef',
    colorInfo: '#d946ef',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorTextBase: '#f3f4f6',
    colorBgElevated: '#28284a',
    colorBorder: 'rgba(255,255,255,0.12)',
    colorBorderSecondary: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    fontFamily: 'inherit',
    controlHeight: 36
  }
}
</script>

<template>
  <ConfigProvider :input="{ autocomplete: 'off', spellcheck: false, autocorrect: 'off' }" :wave="{ disabled: true }"
    :locale="zhCN">
    <router-view></router-view>
  </ConfigProvider>
</template>
