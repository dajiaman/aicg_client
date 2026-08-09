<template>
  <div class="subtitle-panel">
    <!-- ===== 模式切换（模板 / 自定义） ===== -->
    <div class="seg-row">
      <span>字幕样式</span>
      <a-segmented
        v-model:value="localMode"
        :options="modeOptions"
        size="small"
        @change="handleModeChange"
      />
    </div>

    <!-- ===== 关键词高亮（仅模板模式可用） ===== -->
    <div v-if="localMode === 'template'" class="toggle-row">
      <a-checkbox
        v-model="localHighlight"
        :disabled="!keywordHighlightSupported"
        size="small"
        @change="handleHighlightChange"
      >
        智能高亮关键词
      </a-checkbox>
    </div>

    <!-- ===== 模板列表（模板模式） ===== -->
    <div v-if="localMode === 'template'" class="field">
      <span>选择样式模板</span>
      <div class="preset-grid">
        <button
          v-for="preset in presets"
          :key="preset.id"
          class="preset-card"
          :class="{ active: config.presetId === preset.id }"
          type="button"
          @click="handleApplyPreset(preset)"
        >
          <b>{{ preset.name }}</b>
          <!-- 预览图或文字预览 -->
          <div class="preset-preview">
            <img :src="getPreviewImageUrl(preset)" :alt="preset.name" loading="lazy" />
          </div>
        </button>
      </div>
    </div>

    <div class="field" v-if="localMode === 'template'">
      <span>上下位置</span>
      <div class="offset-row">
        <a-slider
          v-model:value="localOffsetY"
          :min="-200"
          :max="600"
          :step="10"
          class="offset-slider"
          @change="handleOffsetChange"
        />
        <span class="offset-value">{{ offsetLabel }}</span>
      </div>
    </div>

    <!-- ===== 自定义样式（自定义模式） ===== -->
    <div v-if="localMode !== 'template'" class="custom-row">
      <div>
        <span>自定义样式</span>
        <b>按字体、颜色、位置等细节自由调整</b>
      </div>
      <a-button type="primary" ghost size="small" @click="$emit('open-settings')">
        调整样式
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ============================================================
// 1. Props
// ============================================================
const props = defineProps({
  /** 字幕配置对象 */
  config: {
    type: Object,
    required: true
  },
  /** 字幕样式预设列表 */
  presets: {
    type: Array,
    default: () => []
  }
})

// ============================================================
// 2. Emits
// ============================================================
const emit = defineEmits([
  'open-settings', // 打开字幕设置弹窗
  'apply-preset' // 应用预设样式
])

// ============================================================
// 3. 本地状态
// ============================================================
const localMode = ref(props.config.mode || 'template')
const localHighlight = ref(props.config.highlightKeywords ?? false)
const localOffsetY = ref(props.config.offsetY || 0)

// ============================================================
// 4. 计算属性
// ============================================================
/** 模式选项 */
const modeOptions = [
  { label: '模板', value: 'template' },
  { label: '自定义', value: 'custom' }
]

const getPreviewImageUrl = (preset) => {
  return `https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/subtitle/${preset.id}.gif`
}

/** 当前选中的预设是否支持关键词高亮 */
const keywordHighlightSupported = computed(() => {
  if (localMode.value !== 'template') return false
  const preset = props.presets.find((p) => p.id === props.config.presetId)
  if (!preset) return false
  // 支持高亮的预设 ID 列表（来自原始 _0x9fe161）
  const supportedIds = [
    '3d_flip',
    'cartoon_yellow',
    'cute_pink',
    'energy_pink_yellow',
    'scrolling_4lines',
    'simple_yellow_white',
    'yellow_white_bounce',
    'yellow_white_calligraphy',
    'yellow_white_italic',
    'yellow_white_split',
    'yellow_white_xingkai_shadow',
    'yellow_white_serif'
  ]
  return supportedIds.includes(preset.id)
})

/** 偏移量显示文本 */
const offsetLabel = computed(() => {
  const val = localOffsetY.value
  if (val === 0) return '默认'
  if (val > 0) return '下移 ' + val
  return '上移 ' + Math.abs(val)
})

// ============================================================
// 5. 事件处理方法
// ============================================================
/** 模式切换 */
const handleModeChange = (mode) => {
  localMode.value = mode
  // 同步到父组件配置
  props.config.mode = mode
}

/** 关键词高亮切换 */
const handleHighlightChange = (checked) => {
  localHighlight.value = checked
  props.config.highlightKeywords = checked
}

/** 应用预设样式 */
const handleApplyPreset = (preset) => {
  emit('apply-preset', preset)
}

/** 偏移量变化 */
const handleOffsetChange = (value) => {
  localOffsetY.value = value
  props.config.offsetY = value
}

// ============================================================
// 6. 监听外部配置变化
// ============================================================
watch(
  () => props.config.mode,
  (val) => {
    if (val && val !== localMode.value) {
      localMode.value = val
    }
  },
  { immediate: true }
)

watch(
  () => props.config.highlightKeywords,
  (val) => {
    if (val !== undefined && val !== localHighlight.value) {
      localHighlight.value = val
    }
  },
  { immediate: true }
)

watch(
  () => props.config.offsetY,
  (val) => {
    if (val !== undefined && val !== localOffsetY.value) {
      localOffsetY.value = val
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.subtitle-panel {
  display: grid;
  gap: 12px;
}

.seg-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.custom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.custom-row div,
.field {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preset-card {
  min-height: 0;
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--theme-text-secondary);
  border: 1px solid var(--theme-overlay-light);
  border-radius: 14px;
  background: color-mix(in srgb, var(--theme-background-light) 44%, transparent);
  cursor: pointer;
  text-align: left;
}

.preset-card.active {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-info) 58%, transparent);
  background: color-mix(in srgb, var(--theme-primary) 18%, transparent);
}

.preset-card b {
  min-width: 0;
  font-size: var(--app-font-size-body);
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-preview {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.26);
}

.preset-preview img {
  width: 100%;
  height: 100%;
  display: block;
  -o-object-fit: contain;
  object-fit: contain;
}

.preset-card em {
  align-self: end;
  color: gold;
  font-style: normal;
  font-weight: 900;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.42);
}

.custom-row span,
.field span,
.seg-row span {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900;
}

.seg-row span {
  flex: 0 0 72px;
}

.field .ant-select {
  width: 100%;
}

.offset-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.offset-slider {
  flex: 1;
  min-width: 0;
}

.offset-row .value-text {
  flex: 0 0 auto;
  min-width: 48px;
  color: var(--theme-text-secondary);
  font-size: var(--app-font-size-caption);
  text-align: right;
}

.custom-row b {
  font-size: var(--app-font-size-meta);
}

.custom-row b,
.toggle-row {
  color: var(--theme-text-secondary);
}

.toggle-row .ant-checkbox-wrapper-disabled {
  color: var(--theme-text-muted) !important;
  opacity: 0.75;
}

.toggle-row .ant-checkbox-wrapper-disabled .ant-checkbox-inner {
  border-color: color-mix(in srgb, var(--theme-text-muted) 50%, transparent) !important;
  background: transparent !important;
}


</style>


<style>
.ant-segmented {
  background: color-mix(in srgb, var(--theme-background-lighter) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-secondary) 25%, transparent);
  border-radius: 8px;
  padding: 3px;
  color: var(--theme-text-muted);
}

.ant-segmented-item {
  color: var(--theme-text-muted);
  border-radius: 6px;
  transition: color 0.2s;
}

.ant-segmented-item-selected {
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 6px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--theme-secondary) 35%, transparent);
}</style>
