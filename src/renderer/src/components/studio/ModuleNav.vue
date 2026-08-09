<template>
  <nav class="module-nav">
    <div v-for="module in modules" :key="module.key" class="nav-item" :class="{
      active: activeKey === module.key,
      disabled: !module.enabled
    }">
      <!-- 模块按钮：点击切换激活 -->
      <button class="nav-select" type="button" @click="$emit('select', module.key)">
        <span class="copy">
          <b>{{ module.title }}</b>
          <small :title="module.summary">
            {{ module.summary }}
          </small>
        </span>
      </button>

      <!-- 开关（仅当 switchable 为 true 时显示） -->
      <span v-if="module.switchable !== false" class="switch-wrap">
        <a-switch :checked="!!module.enabled" size="small" @change="(val) => $emit('toggle', module.key, val)" />
      </span>
    </div>
  </nav>
</template>

<script setup>
// ============================================================
// 1. Props
// ============================================================
defineProps({
  /** 模块列表 */
  modules: {
    type: Array,
    required: true,
    validator: (val) =>
      val.every(
        (item) =>
          item.key && typeof item.key === 'string' && item.title && typeof item.title === 'string'
      )
  },
  /** 当前激活的模块 key */
  activeKey: {
    type: String,
    required: true
  }
})

// ============================================================
// 2. Emits
// ============================================================
defineEmits([
  'select', // 选中模块：$emit('select', moduleKey)
  'toggle' // 切换开关：$emit('toggle', moduleKey, enabled)
])
</script>

<style scoped>
.module-nav {
  min-height: 0;
  padding: 12px;
  display: grid;
  align-content: start;
  gap: 10px;
  overflow-y: auto;
  border-radius: 20px;
  border: 1px solid var(--theme-overlay-light);
  background: color-mix(in srgb, var(--theme-overlay-light) 84%, transparent)
}

.nav-item {
  position: relative;
  width: 100%;
  min-height: 68px;
  padding: 11px 12px;
  color: var(--theme-text-secondary);
  border: 1px solid transparent;
  border-radius: 15px;
  background: transparent;
  text-align: left
}

.nav-select {
  width: 100%;
  min-width: 0;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left
}

.switch-wrap {
  position: absolute;
  top: 13px;
  right: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center
}

.nav-item.active {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-info) 38%, transparent);
  background: color-mix(in srgb, var(--theme-primary) 16%, transparent)
}

.nav-item.disabled {
  opacity: .62
}



.copy {
  min-width: 0;
  display: grid;
  gap: 6px
}

.copy b {
  padding-right: 48px;
  font-size: var(--app-font-size-body);
  font-weight: 900
}

.copy small {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.35
}

.module-nav .ant-switch-checked {
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary))
}
</style>
