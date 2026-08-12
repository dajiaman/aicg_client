<template>
  <!-- 顶部自定义标题栏 -->
  <div class="custom-titlebar">
    <!-- 左侧 Logo -->
    <div class="titlebar-left">
      <div class="app-icon"></div>
      <span class="app-title"></span>
    </div>

    <!-- 右侧 菜单 / 用户 / 窗口控制 -->
    <div class="titlebar-right">
      <a-dropdown>
        <div @click.prevent class="nav-menu-btn">
          <AppstoreOutlined class="nav-menu-icon" />
          <span class="nav-menu-label">菜单</span>
          <DownOutlined :style="{ fontSize: '10px' }" class="nav-menu-arrow" />
        </div>
        <template #overlay>
          <a-menu class="nav-dropdown-menu" v-model:selectedKeys="selectedKeys">
            <a-menu-item key="/">
              <a href="javascript:;" @click="navItemClick('/')">
                <PlusOutlined class="menu-item-icon" />
                新工作流
              </a>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="voices">
              <a href="javascript:;" @click="navItemClick('voices')">
                <SoundOutlined class="menu-item-icon" />
                声音管理
              </a>
            </a-menu-item>
            <a-menu-item key="avatars">
              <a href="javascript:;" @click="navItemClick('avatars')">
                <UserOutlined class="menu-item-icon" />
                形象管理
              </a>
            </a-menu-item>
            <a-menu-item key="materials">
              <a href="javascript:;" @click="navItemClick('materials')">
                <FolderOutlined class="menu-item-icon" />
                素材管理
              </a>
            </a-menu-item>
            <a-menu-item key="tasks">
              <a href="javascript:;" @click="navItemClick('tasks')">
                <CarryOutOutlined class="menu-item-icon" />
                任务中心
              </a>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="accounts">
              <a href="javascript:;" @click="navItemClick('accounts')">
                <TeamOutlined class="menu-item-icon" />
                账号管理
              </a>
            </a-menu-item>
            <a-menu-item key="settings">
              <a href="javascript:;" @click="navItemClick('settings')">
                <SettingOutlined class="menu-item-icon" />
                设置
              </a>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>

      <a-dropdown placement="bottomRight">
        <div @click.prevent class="user-section">
          <a-avatar class="user-avatar-img" style="width: 32px; height: 32px; line-height: 32px; font-size: 18px">
            {{ displayName.slice(0, 1).toUpperCase() }}
          </a-avatar>
          <span class="user-name">{{ displayName }}</span>
          <DownOutlined :style="{ fontSize: '10px' }" class="dropdown-icon" />
        </div>
        <template #overlay>
          <a-menu class="user-dropdown-menu">
            <a-menu-item>
              <router-link :to="{ path: '/profile' }">
                <UserOutlined />
                编辑资料
              </router-link>
            </a-menu-item>
            <a-menu-item>
              <router-link :to="{ path: '/member' }">
                <CrownOutlined />
                会员中心
              </router-link>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item danger @click.stop="handleLogout">
              <span>
                <LogoutOutlined />
                退出登录
              </span>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>

      <div class="window-controls">
        <button class="control-btn minimize-btn" title="最小化" @click="handleMinimizeWindow" tabindex="0">
          <MinusOutlined />
        </button>
        <button class="control-btn maximize-btn" title="最大化" @click="handleMaximizeWindow" v-if="!isMaximized">
          <BorderOutlined />
        </button>
        <button class="control-btn maximize-btn" title="取消最大化" @click="handleUnmaximizeWindow" v-if="isMaximized"
          tabindex="0">
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
  AppstoreOutlined,
  BorderOutlined,
  CarryOutOutlined,
  CloseOutlined,
  CompressOutlined,
  CrownOutlined,
  DownOutlined,
  FolderOutlined,
  LogoutOutlined,
  MinusOutlined,
  PlusOutlined,
  SettingOutlined,
  SoundOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { Modal } from 'ant-design-vue'

const router = useRouter()
const authStore = useAuthStore()

const displayName = computed(() => {
  return authStore.displayName || '用户'
})

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
  Modal.confirm({
    title: '确认关闭',
    content: '确认要关闭应用程序吗？',
    okText: '确认',
    okType: 'danger',
    onOk: async () => {
      await window.api.window.close()
    }
  })
}

/**
 * 导航栏点击事件
 * @param {string} path - 导航路径
 */
const navItemClick = (path) => {
  router.push({
    path
  })
}

/**
 * 退出登录
 */
const handleLogout = async () => {



  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>
