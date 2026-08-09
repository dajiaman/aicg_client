<script setup>
import {
  SettingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
import { markRaw, ref } from 'vue'

import GeneralTab from './components/GeneralTab.vue'
import AiTab from './components/AiTab.vue'
import UpdateTab from './components/UpdateTab.vue'
import PromptTab from './components/PromptTab.vue'
import DataTab from './components/DataTab.vue'

const tab = ref('general')

function switchTab(t) {
  tab.value = t
}

const sidebarNav = [
  {
    key: 'general',
    label: '常规设置',
    icon: markRaw(SettingOutlined)
  },
  { key: 'models', label: '模型设置', icon: markRaw(AppstoreOutlined) },
  { key: 'prompts', label: '提示词管理', icon: markRaw(FileTextOutlined) },
  { key: 'data', label: '数据设置', icon: markRaw(DatabaseOutlined) },
  { key: 'update', label: '软件更新', icon: markRaw(SyncOutlined) }
]

const tabMeta = {
  general: { title: '常规设置' },
  models: { title: '模型设置' },
  prompts: { title: '提示词管理' },
  data: { title: '数据设置' },
  update: { title: '软件更新' }
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-layout">
      <!-- 侧边导航 -->
      <aside class="settings-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-badge">
            <SettingOutlined />
          </div>
          <div class="sidebar-title">
            <div class="sidebar-name">设置中心</div>
          </div>
        </div>

        <!-- 侧边导航列表 -->
        <nav class="sidebar-nav">
          <button
            v-for="item in sidebarNav"
            :key="item.key"
            class="nav-item"
            :class="{ 'is-active': tab === item.key }"
            @click="switchTab(item.key)"
          >
            <span class="nav-icon">
              <component :is="item.icon" />
            </span>
            <span class="nav-text">
              <span class="nav-label">{{ item.label }}</span>
            </span>
            <span v-if="tab === item.key" class="nav-active-dot" />
          </button>
        </nav>
      </aside>

      <!-- 右侧内容 -->
      <main class="settings-main">
        <div class="page">
          <!-- 统一页头：图标徽章 + eyebrow + 标题 + 副标题 -->
          <header class="page-header">
            <div class="form-header">
              <div class="form-header-icon">
                <component :is="sidebarNav.find((i) => i.key === tab)?.icon" />
              </div>
              <div class="form-header-text">
                <div class="form-header-eyebrow">SETTINGS / {{ tab.toUpperCase() }}</div>
                <div class="form-header-title">{{ tabMeta[tab].title }}</div>
              </div>
            </div>
          </header>

          <!-- 常规设置 -->
          <section v-show="tab === 'general'" class="card-accent">
            <GeneralTab />
          </section>

          <!-- 模型设置 -->
          <section v-show="tab === 'models'" class="card-accent">
            <AiTab />
          </section>

          <!-- 提示词管理 -->
          <section v-show="tab === 'prompts'" class="card-accent">
            <PromptTab />
          </section>

          <!-- 数据设置 -->
          <section v-show="tab === 'data'" class="card-accent">
            <DataTab />
          </section>

          <!-- 软件更新 -->
          <section v-show="tab === 'update'" class="card-accent">
            <UpdateTab />
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  height: 100%;
  background: var(--bg-app);
  color: #e5e7eb;
  overflow: hidden;
}

.settings-layout {
  display: flex;
  height: 100%;
}

/* ============================================================
   侧边导航
   ============================================================ */
.settings-sidebar {
  width: 264px;
  flex-shrink: 0;
  background: var(--bg-deep);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 侧栏顶部品牌光晕装饰 */
.settings-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;

  pointer-events: none;
}

.sidebar-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 18px;
  color: var(--brand-soft);
  background: linear-gradient(135deg, var(--brand-tint-medium) 0%, rgba(147, 51, 234, 0.15) 100%);
  border: 1px solid var(--brand-tint-strong);
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.12);
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sidebar-eyebrow {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--brand);
  font-weight: 600;
}

.sidebar-name {
  font-size: 15px;
  font-weight: 600;
  color: #f3f4f6;
}

.sidebar-nav {
  flex: 1;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  text-align: left;
  color: #9ca3af;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--white-alpha-04);
  color: #e5e7eb;
  border-color: var(--white-alpha-06);
}

.nav-item.is-active {
  background: linear-gradient(135deg, var(--brand-tint-soft) 0%, rgba(147, 51, 234, 0.1) 100%);
  border-color: rgba(217, 70, 239, 0.4);
  color: var(--brand-faint);
  box-shadow: 0 4px 16px rgba(217, 70, 239, 0.12);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 15px;
  background: var(--white-alpha-04);
  border: 1px solid var(--white-alpha-06);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.nav-item:hover .nav-icon {
  background: var(--white-alpha-08);
  color: var(--brand-soft);
}

.nav-item.is-active .nav-icon {
  background: var(--brand-gradient);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(217, 70, 239, 0.35);
}

.nav-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.nav-label {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}

.nav-desc {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item.is-active .nav-desc {
  color: rgba(245, 208, 254, 0.7);
}

/* 激活态右侧细线指示 */
.nav-active-dot {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--brand-soft);
  box-shadow: 0 0 8px rgba(240, 171, 252, 0.7);
}

.sidebar-footer {
  padding: 14px 20px 18px;
  border-top: 1px solid var(--border-subtle);
}

.brand-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--accent-tint-faint);
  border: 1px solid rgba(34, 211, 238, 0.2);
  font-size: 11px;
  color: var(--accent-soft);
  font-weight: 500;
}

.brand-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.7);
}

/* ============================================================
   右侧主内容
   ============================================================ */
.settings-main {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

/* 右侧顶部背景渐变 */
.settings-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 280px;
  background: radial-gradient(ellipse at top right, rgba(147, 51, 234, 0.1) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.settings-main .page {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 32px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 数据设置占位 */
.data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 80px 20px;
  text-align: center;
}

.placeholder-icon {
  font-size: 48px;
  color: rgba(217, 70, 239, 0.35);
  margin-bottom: 8px;
}

.placeholder-title {
  font-size: 15px;
  font-weight: 600;
  color: #d1d5db;
}

.placeholder-desc {
  font-size: 12px;
  color: #6b7280;
}

/* 滚动条样式 */
.sidebar-nav::-webkit-scrollbar,
.settings-main::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.sidebar-nav::-webkit-scrollbar-thumb,
.settings-main::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover,
.settings-main::-webkit-scrollbar-thumb:hover {
  background: rgba(217, 70, 239, 0.3);
}

.sidebar-nav::-webkit-scrollbar-track,
.settings-main::-webkit-scrollbar-track {
  background: transparent;
}

/* 响应式：小屏时收窄侧栏 */
@media (max-width: 1100px) {
  .settings-sidebar {
    width: 220px;
  }

  .nav-desc {
    display: none;
  }
}

@media (max-width: 900px) {
  .settings-sidebar {
    width: 72px;
  }

  .sidebar-title,
  .nav-text,
  .brand-tag-text,
  .nav-active-dot {
    display: none;
  }

  .sidebar-header {
    justify-content: center;
    padding: 18px 12px;
  }

  .nav-item {
    justify-content: center;
    padding: 12px 8px;
  }

  .sidebar-footer {
    display: flex;
    justify-content: center;
  }
}
</style>
