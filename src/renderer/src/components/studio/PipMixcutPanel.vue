<template>
  <div class="pip-mixcut-panel">
    <!-- ===== 功能描述 ===== -->
    <p v-if="config.enabled" class="panel-desc">选择素材分类后，剪辑时按字幕自动匹配画中画。</p>

    <!-- ===== 启用状态 ===== -->
    <template v-if="config.enabled">
      <div class="field">
        <span>素材分类</span>
        <a-select v-model:value="localCategoryId" :options="categories" :loading="loading" placeholder="选择素材分类"
          @change="handleCategoryChange" />
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <a-button block @click="$emit('open-manual')"> 自定义画中画 </a-button>
        <a-button block danger @click="$emit('clear')"> 清空混剪 </a-button>
      </div>
    </template>

    <!-- ===== 未启用状态 ===== -->
    <p class="description">开启左侧开关后，可选择素材分类并手动调整字幕画中画。</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// ============================================================
// 1. Props
// ============================================================
const props = defineProps({
  /** 画中画混剪配置对象 */
  config: {
    type: Object,
    required: true
  },
  /** 素材分类列表 */
  categories: {
    type: Array,
    default: () => []
  },
  /** 是否正在加载分类 */
  loading: {
    type: Boolean,
    default: false
  },
  /** 素材缺失提示文本 */
  missingTip: {
    type: String,
    default: ''
  },
  /** 向量化提示文本 */
  vectorTip: {
    type: String,
    default: ''
  }
})

// ============================================================
// 2. Emits
// ============================================================
const emit = defineEmits([
  'change', // 分类变化：$emit('change')
  'open-manual', // 打开手动选择
  'clear' // 清空混剪
])

// ============================================================
// 3. 本地状态
// ============================================================
const localCategoryId = ref(props.config.categoryId || '')

// ============================================================
// 4. 事件处理方法
// ============================================================
function handleCategoryChange(val) {
  localCategoryId.value = val
  props.config.categoryId = val
  emit('change')
}

// ============================================================
// 5. 同步外部配置变化到本地
// ============================================================
watch(
  () => props.config.categoryId,
  (val) => {
    if (val !== undefined && val !== localCategoryId.value) {
      localCategoryId.value = val || ''
    }
  },
  { immediate: true }
)

// 暴露给父组件（如果需要）
defineExpose({
  reset: () => {
    localCategoryId.value = ''
    props.config.categoryId = ''
  }
})
</script>

<style scoped>
.pip-mixcut-panel {
  display: grid;
  gap: 14px
}

.description[data-v-2cd2a4ce],
.field span[data-v-2cd2a4ce],
.status-text {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 800
}

.description {
  margin: 0;
  line-height: 1.6
}

.field {
  display: grid;
  gap: 6px
}

.actions[data-v-2cd2a4ce],
.status-tags {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px
}

.status-text {
  margin: 0
}

.status-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: default
}

.tip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0
}

.warning-tip {
  color: var(--theme-warning);
  background: color-mix(in srgb, var(--theme-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-warning) 30%, transparent)
}

.warning-tip .tip-dot {
  background: var(--theme-warning);
  box-shadow: 0 0 5px color-mix(in srgb, var(--theme-warning) 60%, transparent)
}

.ant-btn:not(.ant-btn-dangerous) {
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--theme-secondary) 35%, transparent);
  transition: opacity .2s, box-shadow .2s
}

.ant-btn:not(.ant-btn-dangerous):hover {
  opacity: .88;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--theme-secondary) 50%, transparent)
}

.ant-btn-dangerous {
  border-radius: 8px;
  font-weight: 600;
  border-color: color-mix(in srgb, var(--theme-error) 60%, transparent);
  color: var(--theme-error) !important;
  background: color-mix(in srgb, var(--theme-error) 10%, transparent)
}

.ant-btn-dangerous:hover {
  background: color-mix(in srgb, var(--theme-error) 20%, transparent) !important;
  border-color: var(--theme-error) !important
}

.actions,
.status-tags {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
</style>
