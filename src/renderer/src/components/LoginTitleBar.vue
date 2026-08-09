<template>
  <!-- 顶部自定义标题栏 -->
  <div
    class="login-titlebar h-11 shrink-0 flex items-center justify-between bg-[#1f1f2e] border-b border-white/5 select-none">
    <!-- 左侧 Logo -->
    <div class="flex items-center gap-2 no-drag ml-[16px]">
      <span class="font-semibold text-gray-100 tracking-wide"></span>
    </div>

    <!-- 右侧 菜单 / 用户 / 窗口控制 -->
    <div class="flex items-center gap-1 no-drag shrink-0">
      <div class="window-controls">
        <button class="control-btn minimize-btn" title="最小化" @click="handleMinimizeWindow">
          <MinusOutlined />
        </button>
        <button class="control-btn maximize-btn" title="最大化" @click="handleMaximizeWindow" v-if="!isMaximized">
          <BorderOutlined />
        </button>
        <button class="control-btn maximize-btn" title="取消最大化" @click="handleUnmaximizeWindow" v-if="isMaximized">
          <CompressOutlined />
        </button>
        <button class="control-btn close-btn" title="关闭" @click="handleCloseWindow">
          <CloseOutlined />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  BorderOutlined,
  CloseOutlined,
  CompressOutlined,
  MinusOutlined
} from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 当前激活菜单（key 与路由路径对应）
const selectedKeys = ref([])

const routePathToKey = (p) => {
  const s = String(p || '').replace(/^\/+/, '')
  return s || '/'
}

// 初始化 + 监听路由变化，自动高亮当前页面对应的菜单项
selectedKeys.value = [routePathToKey(router.currentRoute.value.path)]
watch(
  () => router.currentRoute.value.path,
  (p) => {
    selectedKeys.value = [routePathToKey(p)]
  }
)

// 是否最大化
const isMaximized = ref(false)
// 是否最小化
const isMinimized = ref(false)

const handleMinimizeWindow = async () => {
  const res = await window.api.window.minimize()
  isMinimized.value = res.isMinimized
}

/**
 * 窗口最大化（window-maximize）
 */
const handleMaximizeWindow = async () => {
  const res = await window.api.window.maximize()
  isMaximized.value = res.isMaximized
}

/**
 * 窗口取消最大化（window-unmaximize）
 */
const handleUnmaximizeWindow = async () => {
  const res = await window.api.window.unmaximize()
  isMaximized.value = res.isMaximized
}

/**
 * 窗口关闭（window-close）
 */
const handleCloseWindow = async () => {
  await window.api.window.close()
}


</script>

<style lang="scss" scoped>
.login-titlebar {
  -webkit-app-region: drag;
  height: 40px;
  padding: 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;

  .arrow {
    margin-top: 2px;
  }
}

.no-drag {
  -webkit-app-region: no-drag;
}

.window-controls {
  gap: 0;
}

.control-btn,
.window-controls {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #fff;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  border-radius: 0px;
  outline: none;
}

.control-btn:hover,
.maximize-btn:hover,
.minimize-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn:hover {
  background: red;
}
</style>
