<template>
  <div class="title-panel">
    <!-- ===== 标题文本输入 ===== -->
    <div class="title-input-row">
      <div class="text-grid">
        <a-input v-model:value="localH1" placeholder="主标题" @change="(e) => handleTextInput('h1', e.target.value)" />
        <a-input v-model:value="localH2" placeholder="副标题" @change="(e) => handleTextInput('h2', e.target.value)" />
      </div>
      <a-tooltip title="AI生成标题">
        <a-button class="ai-title-icon-btn" type="text" shape="circle" :loading="titleGenerating"
          :disabled="!canGenerateTitle" @click="$emit('generate-title')">
          <template #icon>
            <ThunderboltOutlined />
          </template>
        </a-button>
      </a-tooltip>
    </div>

    <!-- ===== 显示模式 ===== -->
    <div class="option-row">
      <span>显示时长</span>
      <a-segmented v-model:value="localDisplayMode" :options="displayModeOptions" size="small"
        @change="handleDisplayModeChange" />
      <a-input-number v-if="localDisplayMode === 'duration'" v-model:value="localDuration" :min="1" :max="60"
        addon-after="秒" size="small" style="width: 100px" @change="handleDurationChange" />
    </div>

    <!-- ===== 样式模式切换（模板/自定义） ===== -->
    <div class="seg-row">
      <span>样式模式</span>
      <a-segmented v-model:value="localMode" :options="modeOptions" size="small" @change="handleModeChange" />
    </div>

    <p class="position-hint">模板样式已预设字体和效果，可在右侧编辑预览中上下拖动标题位置。</p>

    <!-- ===== 模板列表（模板模式） ===== -->
    <div v-if="localMode === 'template'" class="preset-grid">
      <div v-for="preset in presets" :key="preset.id" class="preset-card"
        :class="{ active: config.presetId === preset.id }" type="button" @click="handleApplyPreset(preset)">
        <b>{{ preset.name }}</b>
        <div class="preset-preview">
          <img :src="getPreviewImageUrl(preset)" :alt="preset.name" loading="lazy" />
        </div>
      </div>
    </div>

    <!-- ===== 自定义样式（自定义模式） ===== -->
    <div v-else class="custom-style-form">
      <!-- 样式卡片：字体 -->
      <div class="style-card style-card-basic">
        <div class="style-card-head">
          <div>
            <strong>字体样式</strong>
            <small>字体、字号、颜色和文字样式</small>
          </div>
          <span class="card-summary">
            {{ config.style.fontSize }}/{{ Math.round((config.style.opacity ?? 1) * 100) }}%
          </span>
        </div>

        <div class="style-card-body">
          <!-- 字体 -->
          <div class="field-grid">
            <label>
              <span>字体</span>
              <a-select v-model:value="localFontFamily" size="small" show-search :filter-option="filterFont"
                popup-class-name="font-select-dropdown" @change="handleFontChange">
                <a-select-option v-for="font in systemFonts" :key="font.value" :value="font.value">
                  <span :style="getFontOptionStyle(font)">
                    {{ font.label }}
                  </span>
                </a-select-option>
              </a-select>
            </label>

            <label>
              <span>字号</span>
              <div class="slider-row">
              <a-slider v-model:value="localFontSize" :min="24" :max="160" :step="2" @change="handleFontSizeChange" />
              <span class="value-text">{{ localFontSize }}</span>
              </div>
            </label>
          </div>

          <!-- 颜色 -->
          <div class="field-grid">
            <label>
              <span>颜色</span>
              <div class="color-row">
                <input type="color" :value="localColor" @input="(e) => handleColorChange(e.target.value)"
                  class="color-picker" />
                <a-input v-model:value="localColor" size="small" @change="handleColorChange" />
              </div>
            </label>
            <label>
              <span>透明度</span>
              <div class="slider-row">
                <a-slider v-model:value="localOpacity" :min="0" :max="1" :step="0.05" @change="handleOpacityChange" />
                <span class="value-text">{{ Math.round(localOpacity * 100) }}%</span>
              </div>
            </label>
          </div>

          <!-- 透明度 -->
          <label class="full-field">
            <span>字体样式</span>
            <a-checkbox-group v-model:value="localFontStyles" :options="fontStyleOptions" size="small"
              @change="handleFontStylesChange" />
          </label>
        </div>
      </div>

      <!-- 样式卡片：位置和字间距 -->
      <div class="style-card style-card-layout">
        <div class="style-card-head">
          <div>
            <strong>位置和字间距</strong>
            <small>标题位置和字间距</small>
          </div>
          <span class="card-summary">顶部 {{ localOffsetY || 0 }}</span>
        </div>

        <div class="style-card-body">
          <!-- 字间距 -->
          <div class="field-grid">
            <label>
              <span>字间距</span>
              <div class="slider-row">
                <a-slider v-model:value="localLetterSpacing" :min="0" :max="50" :step="1"
                  @change="handleLetterSpacingChange" />
                <span class="value-text">{{ localLetterSpacing }}</span>
              </div>
            </label>

            <label>
              <span>顶部距离</span>
              <div class="slider-row">
                <a-slider v-model:value="localOffsetY" :min="0" :max="maxOffsetY" :step="10"
                  @change="handleOffsetYChange" />
                <span class="value-text">{{ localOffsetY }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- 样式卡片：描边 -->
      <div class="style-card effect-card" :class="{ active: localEnableStroke }">
        <div class="style-card-head">
          <div>
            <strong>描边</strong>
            <small>{{
              localEnableStroke
                ? getStrokeLabel(localStrokeWidth) + ' / ' + localStrokeWidth
                : '未启用'
            }}</small>
          </div>
          <a-switch v-model:checked="localEnableStroke" size="small" @change="handleStrokeToggle" />
        </div>

        <div v-if="localEnableStroke" class="style-card-body">
          <!-- 描边宽度 -->
          <div class="field-grid">
            <label>
              <span>描边宽度</span>
              <div class="slider-row">
                <a-slider v-model:value="localStrokeWidth" :min="TITLE_STROKE_WIDTH_MIN" :max="TITLE_STROKE_WIDTH_MAX"
                  :step="TITLE_STROKE_WIDTH_STEP" @change="handleStrokeWidthChange" />
                <span class="value-text">{{ localStrokeWidth }}</span>
              </div>
            </label>

            <label>
              <span>描边颜色</span>
              <div class="color-row">
                <input type="color" :value="localStrokeColor" @input="(e) => handleStrokeColorChange(e.target.value)"
                  class="color-picker" />
                <a-input v-model:value="localStrokeColor" size="small" @update:value="handleStrokeColorChange" />
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- 样式卡片：阴影 -->
      <div class="style-card effect-card" :class="{ active: localEnableShadow }">
        <div class="style-card-head">
          <div>
            <strong>阴影</strong>
            <small>{{ localEnableShadow ? shadowSummary : '未启用' }}</small>
          </div>
          <a-switch v-model:checked="localEnableShadow" size="small" @change="handleShadowToggle" />
        </div>

        <div v-if="localEnableShadow" class="style-card-body">
          <!-- 阴影距离 -->
          <div class="field-grid">
            <label>
              <span>阴影距离</span>
              <div class="slider-row">
                <a-slider v-model:value="localShadowDistance" :min="0" :max="20" :step="1"
                  @change="handleShadowDistanceChange" />
                <span class="value-text">{{ localShadowDistance }}</span>
              </div>
            </label>

            <label>
              <span>阴影透明度</span>
              <div class="slider-row">
                <a-slider v-model:value="localShadowOpacity" :min="0" :max="1" :step="0.05"
                  @change="handleShadowOpacityChange" />
                <span class="value-text">{{ Math.round(localShadowOpacity * 100) }}%</span>
              </div>
            </label>

            <label>
              <span>阴影颜色</span>
              <div class="color-row">
                <input type="color" :value="localShadowColor" @input="(e) => handleShadowColorChange(e.target.value)"
                  class="color-picker" />
                <a-input v-model:value="localShadowColor" size="small" @update:value="handleShadowColorChange" />
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- 样式卡片：背景 -->
      <div class="style-card effect-card" :class="{ active: localEnableBackground }">
        <div class="style-card-head">
          <div>
            <strong>背景</strong>
            <small>{{ localEnableBackground ? backgroundSummary : '未启用' }}</small>
          </div>
          <a-switch v-model:checked="localEnableBackground" size="small" @change="handleBackgroundToggle" />
        </div>

        <div v-if="localEnableBackground" class="style-card-body">
          <div class="field-grid">
            <label>
              <span>背景颜色</span>
              <div class="color-row">
                <input type="color" :value="localBackgroundColor"
                  @input="(e) => handleBackgroundColorChange(e.target.value)" class="color-picker" />
                <a-input v-model:value="localBackgroundColor" size="small"
                  @update:value="handleBackgroundColorChange" />
              </div>
            </label>

            <label>
              <span>背景透明度</span>
              <div class="slider-row">
                <a-slider v-model:value="localBackgroundOpacity" :min="0" :max="1" :step="0.05"
                  @change="handleBackgroundOpacityChange" />
                <span class="value-text">{{ Math.round(localBackgroundOpacity * 100) }}%</span>
              </div>
            </label>

            <label>
              <span>背景圆角</span>
              <div class="slider-row">
                <a-slider v-model:value="localBackgroundRadius" :min="0" :max="240" :step="1"
                  @change="handleBackgroundRadiusChange" />
                <span class="value-text">{{ localBackgroundRadius }}</span>
              </div>
            </label>

            <label>
              <span>背景宽度</span>
              <div class="slider-row">
                <a-slider v-model:value="localBackgroundPaddingX" :min="0" :max="120" :step="2"
                  @change="handleBackgroundPaddingXChange" />
                <span class="value-text">{{ localBackgroundPaddingX }}</span>
              </div>
            </label>

            <label>
              <span>背景高度</span>
              <div class="slider-row">
                <a-slider v-model:value="localBackgroundPaddingY" :min="0" :max="80" :step="2"
                  @change="handleBackgroundPaddingYChange" />
                <span class="value-text">{{ localBackgroundPaddingY }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ThunderboltOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  /** 标题配置对象 */
  config: {
    type: Object,
    default: () => { },
    required: true
  },
  /** 标题样式预设列表 */
  presets: {
    type: Array,
    default: () => []
  },
  /** 是否正在生成标题 */
  titleGenerating: {
    type: Boolean,
    default: false
  },
  /** 是否可以生成标题（有文案） */
  canGenerateTitle: {
    type: Boolean,
    default: false
  },
  /** 预览帧高度 */
  previewFrameHeight: {
    type: Number,
    default: 800
  }
})

const maxOffsetY = ref(800)

// ============================================================
// 2. Emits
// ============================================================
const emit = defineEmits([
  'apply-preset', // 应用预设样式
  'generate-title', // AI 生成标题
  'text-edited', // 标题文本被手动编辑
  'offset-update' // 偏移量更新
])

const getPreviewImageUrl = (preset) => {
  return `https://static-1251729840.cos.ap-guangzhou.myqcloud.com/ai/preview/title/${preset.id}.png`
}

const TITLE_STROKE_WIDTH_MIN = 0
const TITLE_STROKE_WIDTH_MAX = 6
const TITLE_STROKE_WIDTH_STEP = 0.5

const modeOptions = [
  { label: '模板', value: 'template' },
  { label: '自定义', value: 'custom' }
]

const displayModeOptions = [
  { label: '一直显示', value: 'always' },
  { label: '显示几秒', value: 'duration' }
]

const fontStyleOptions = [
  { label: '加粗', value: 'bold' },
  { label: '斜体', value: 'italic' },
  { label: '下划线', value: 'underline' }
]

// ============================================================
// 4. 本地状态（与 config 同步）
// ============================================================
const localH1 = ref(props.config.text?.h1 || '')
const localH2 = ref(props.config.text?.h2 || '')
const localMode = ref(props.config.mode || 'template')
const localDisplayMode = ref(props.config.displayMode || 'always')
const localDuration = ref(props.config.duration || 3)
const localPresetId = ref(props.config.presetId || 'default')

// 样式属性
const localFontFamily = ref(props.config.style?.fontFamily || '微软雅黑')
const localFontSize = ref(props.config.style?.fontSize || 56)
const localColor = ref(props.config.style?.color || '#FFFFFF')
const localOpacity = ref(props.config.style?.opacity ?? 1)
const localLetterSpacing = ref(props.config.style?.letterSpacing || 0)
const localOffsetY = ref(props.config.style?.offsetY || 120)
const localFontStyles = ref(props.config.style?.fontStyles || ['bold'])

// 描边
const localEnableStroke = ref(props.config.style?.enableStroke ?? true)
const localStrokeWidth = ref(props.config.style?.strokeWidth || 2)
const localStrokeColor = ref(props.config.style?.strokeColor || '#000000')

// 阴影
const localEnableShadow = ref(props.config.style?.enableShadow ?? false)
const localShadowDistance = ref(props.config.style?.shadowDistance || 3)
const localShadowOpacity = ref(props.config.style?.shadowOpacity || 0.45)
const localShadowColor = ref(props.config.style?.shadowColor || '#000000')

// 背景
const localEnableBackground = ref(props.config.style?.enableBackground ?? false)
const localBackgroundColor = ref(props.config.style?.backgroundColor || '#000000')
const localBackgroundOpacity = ref(props.config.style?.backgroundOpacity || 0.38)
const localBackgroundRadius = ref(props.config.style?.backgroundRadius || 18)
const localBackgroundPaddingX = ref(props.config.style?.backgroundPaddingX || 24)
const localBackgroundPaddingY = ref(props.config.style?.backgroundPaddingY || 12)

// ============================================================
// 5. 计算属性
// ============================================================
const shadowSummary = computed(() => {
  return `${localShadowColor.value} / ${localShadowDistance.value}px / ${Math.round(localShadowOpacity.value * 100)}%`
})

/**
 * 背景样式摘要
 */
const backgroundSummary = computed(() => {
  return `${localBackgroundColor.value} / ${Math.round(localBackgroundOpacity.value * 100)}% / ${localBackgroundPaddingX.value}x${localBackgroundPaddingY.value}`
})

const systemFonts = ref([])

const builtin = [
  { label: '微软雅黑', value: '微软雅黑', fontFamily: '微软雅黑' },
  { label: '黑体', value: '黑体', fontFamily: '黑体' },
  { label: '宋体', value: '宋体', fontFamily: '宋体' },
  { label: '仿宋', value: '仿宋', fontFamily: '仿宋' },
  { label: 'Arial', value: 'Arial', fontFamily: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman', fontFamily: 'Times New Roman' }
]

// ============================================================
// 6. 工具函数
// ============================================================
function getStrokeLabel(width) {
  if (width === 0) return '无描边'
  if (width <= 2) return '细描边'
  if (width <= 4) return '标准描边'
  return '粗描边'
}

function filterFont(input, option) {
  const search = String(input).toLowerCase()
  const label = String(option?.label || '').toLowerCase()
  return label.includes(search)
}

function getFontOptionStyle(font) {
  return {
    fontFamily: `"${font.fontFamily || font.value}"`
  }
}

// ----- 文本输入 -----
function handleTextInput(field, value) {
  if (field === 'h1') {
    localH1.value = value
    props.config.text.h1 = value
  } else {
    localH2.value = value
    props.config.text.h2 = value
  }
  emit('text-edited')
}

// ----- 显示模式 -----
function handleDisplayModeChange(mode) {
  localDisplayMode.value = mode
  props.config.displayMode = mode
}

function handleDurationChange(val) {
  localDuration.value = val
  props.config.duration = val
}

// ----- 模式切换 -----
function handleModeChange(mode) {
  localMode.value = mode
  props.config.mode = mode
}

// ----- 预设应用 -----
function handleApplyPreset(preset) {
  localPresetId.value = preset.id
  props.config.presetId = preset.id
  if (preset.style) {
    // 修复：先清空旧 style 字段，避免上一个预设没定义、当前预设也没带的字段（如 shadowColor/backgroundOpacity）残留导致切换后样式"残留"
    for (const key in props.config.style) delete props.config.style[key]
    Object.assign(props.config.style, preset.style)
    // 同步本地状态
    syncLocalFromConfig()
  }
  emit('apply-preset', preset)
}

// ----- 字体 -----
function handleFontChange(val) {
  localFontFamily.value = val
  props.config.style.fontFamily = val
}

/**
 * 字体大小
 */
function handleFontSizeChange(val) {
  localFontSize.value = val
  props.config.style.fontSize = val
}

// ----- 颜色和透明度 -----
function handleColorChange(val) {
  localColor.value = val
  props.config.style.color = val
}

/**
 * 透明度
 */
function handleOpacityChange(val) {
  localOpacity.value = val
  props.config.style.opacity = val
}

// ----- 字间距和位置 -----
function handleLetterSpacingChange(val) {
  localLetterSpacing.value = val
  props.config.style.letterSpacing = val
}

/**
 * 偏移量
 */
function handleOffsetYChange(val) {
  localOffsetY.value = val
  emit('offset-update', val) // 如果需要
}

// ----- 字体样式（加粗/斜体/下划线） -----
/**
 * 字体样式
 */
function handleFontStylesChange(values) {
  localFontStyles.value = values
  props.config.style.fontStyles = values
  // 兼容旧版 fontWeight 字段
  props.config.style.fontWeight = values.includes('bold') ? 'bold' : 'normal'
  props.config.style.italic = values.includes('italic')
  props.config.style.underline = values.includes('underline')
}

// ----- 描边 -----
/**
 * 描边
 */
function handleStrokeToggle(val) {
  localEnableStroke.value = val
  props.config.style.enableStroke = val
}
/**
 * 描边宽度
 */
function handleStrokeWidthChange(val) {
  localStrokeWidth.value = val
  props.config.style.strokeWidth = val
}
/**
 * 描边颜色
 */
function handleStrokeColorChange(val) {
  localStrokeColor.value = val
  props.config.style.strokeColor = val
}

// ----- 阴影 -----
function handleShadowToggle(val) {
  localEnableShadow.value = val
  props.config.style.enableShadow = val
}
/**
 * 阴影距离
 */
function handleShadowDistanceChange(val) {
  localShadowDistance.value = val
  props.config.style.shadowDistance = val
}
/**
 * 阴影透明度
 */
function handleShadowOpacityChange(val) {
  localShadowOpacity.value = val
  props.config.style.shadowOpacity = val
}
/**
 * 阴影颜色
 */
function handleShadowColorChange(val) {
  localShadowColor.value = val
  props.config.style.shadowColor = val
}

// ----- 背景 -----
function handleBackgroundToggle(val) {
  localEnableBackground.value = val
  props.config.style.enableBackground = val
}
/**
 * 背景颜色
 */
function handleBackgroundColorChange(val) {
  localBackgroundColor.value = val
  props.config.style.backgroundColor = val
}
/**
 * 背景透明度
 */
function handleBackgroundOpacityChange(val) {
  localBackgroundOpacity.value = val
  props.config.style.backgroundOpacity = val
}
/**
 * 背景圆角
 */
function handleBackgroundRadiusChange(val) {
  localBackgroundRadius.value = val
  props.config.style.backgroundRadius = val
}
/**
 * 背景圆角
 */
function handleBackgroundPaddingXChange(val) {
  localBackgroundPaddingX.value = val
  props.config.style.backgroundPaddingX = val
}
/**
 * 背景圆角
 */
function handleBackgroundPaddingYChange(val) {
  localBackgroundPaddingY.value = val
  props.config.style.backgroundPaddingY = val
}

// ============================================================
// 8. 同步函数：从 config 同步到本地状态
// ============================================================
function syncLocalFromConfig() {
  const style = props.config.style || {}
  localFontFamily.value = style.fontFamily || '微软雅黑'
  localFontSize.value = style.fontSize || 56
  localColor.value = style.color || '#FFFFFF'
  localOpacity.value = style.opacity ?? 1
  localLetterSpacing.value = style.letterSpacing || 0
  localOffsetY.value = style.offsetY || 120
  localFontStyles.value = style.fontStyles || ['bold']

  localEnableStroke.value = style.enableStroke ?? true
  localStrokeWidth.value = style.strokeWidth || 2
  localStrokeColor.value = style.strokeColor || '#000000'

  localEnableShadow.value = style.enableShadow ?? false
  localShadowDistance.value = style.shadowDistance || 3
  localShadowOpacity.value = style.shadowOpacity || 0.45
  localShadowColor.value = style.shadowColor || '#000000'

  localEnableBackground.value = style.enableBackground ?? false
  localBackgroundColor.value = style.backgroundColor || '#000000'
  localBackgroundOpacity.value = style.backgroundOpacity || 0.38
  localBackgroundRadius.value = style.backgroundRadius || 18
  localBackgroundPaddingX.value = style.backgroundPaddingX || 24
  localBackgroundPaddingY.value = style.backgroundPaddingY || 12
}

// ============================================================
// 6. 加载系统字体
// ============================================================
async function loadSystemFonts() {
  try {
    if (window.api?.font?.getAvailable) {
      const result = await window.api.font.getAvailable()
      if (result.success && Array.isArray(result.data)) {
        const fonts = result.data
          .map((f) => ({
            label: f.displayName || f.fontName || f.fullFontName || f.fontFamily || '未知字体',
            value: f.displayName || f.fontName || f.fontFamily || f.fontName,
            fontFamily: f.fontFamily || f.fontName || f.displayName,
            fontPath: f.path
          }))
          .filter((f) => f.value)

        if (fonts.length) systemFonts.value = [...builtin, ...fonts]
      }
    }
  } catch (e) {
    console.warn('加载系统字体失败:', e)
  }
}

onMounted(() => {
  // 初始同步
  syncLocalFromConfig()
  loadSystemFonts()
  localH1.value = props.config.text?.h1 || ''
  localH2.value = props.config.text?.h2 || ''
  localMode.value = props.config.mode || 'template'
  localDisplayMode.value = props.config.displayMode || 'always'
  localDuration.value = props.config.duration || 3
})

// ============================================================
// 11. 监听外部 config 变化
// ============================================================
watch(
  () => props.config,
  () => {
    syncLocalFromConfig()
    localH1.value = props.config.text?.h1 || ''
    localH2.value = props.config.text?.h2 || ''
    localMode.value = props.config.mode || 'template'
    localDisplayMode.value = props.config.displayMode || 'always'
    localDuration.value = props.config.duration || 3
  },
  { deep: true }
)

watch(
  () => props.previewFrameHeight,
  (newHeight) => {
    console.log('newHeight', newHeight)
    maxOffsetY.value = newHeight
  },
  {
    immediate: true
  }
)

// 暴露给父组件（如果需要）
defineExpose({
  syncLocalFromConfig
})
</script>

<style scoped>
.title-panel {
  display: grid;
  gap: 12px
}

.seg-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px
}

.position-hint,
.seg-row span {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption)
}

.seg-row span {
  flex: 0 0 72px;
  font-weight: 900
}

.position-hint {
  margin: -2px 0 0;
  line-height: 1.7
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px
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
  text-align: left
}

.preset-card.active {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-info) 58%, transparent);
  background: color-mix(in srgb, var(--theme-primary) 18%, transparent)
}

.preset-card b {
  min-width: 0;
  font-size: var(--app-font-size-body);
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis
}

.preset-preview {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 10px;
  background: rgba(0, 0, 0, .26)
}

.preset-preview img {
  width: 100%;
  height: 100%;
  display: block;
  -o-object-fit: contain;
  object-fit: contain
}

.text-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px
}

.title-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center
}

.ai-title-icon-btn {
  width: 32px;
  height: 32px;
  color: var(--theme-text-muted);
  border: 1px solid color-mix(in srgb, var(--theme-overlay-light) 70%, transparent);
  background: color-mix(in srgb, var(--theme-background-light) 34%, transparent)
}

.ai-title-icon-btn:focus,
.ai-title-icon-btn:hover {
  color: var(--theme-text-primary);
  border-color: color-mix(in srgb, var(--theme-info) 45%, transparent);
  background: color-mix(in srgb, var(--theme-info) 12%, transparent)
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap
}

.option-row span {
  flex: 0 0 72px;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900
}

.custom-style-form {
  display: grid;
  gap: 10px
}

.style-card {
  position: relative;
  display: grid;
  gap: 10px;
  padding: 11px 12px 12px 14px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--theme-overlay-light) 78%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--theme-background-light) 50%, transparent)
}

.effect-card {
  background: color-mix(in srgb, var(--theme-background-light) 34%, transparent)
}

.effect-card.active {
  background: color-mix(in srgb, var(--theme-info) 9%, var(--theme-background-light));
  border-color: color-mix(in srgb, var(--theme-info) 34%, var(--theme-overlay-light))
}

.style-card-head {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px
}

.style-card-head>div {
  min-width: 0;
  display: grid;
  gap: 2px
}

.style-card-head strong {
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-meta);
  font-weight: 900
}

.card-summary,
.style-card-head small {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-micro);
  line-height: 1.4
}

.style-card-head small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap
}

.card-summary {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-overlay-light) 74%, transparent);
  font-variant-numeric: tabular-nums
}

.style-card-body {
  display: grid;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--theme-overlay-light) 66%, transparent)
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px
}

.field-grid label,
.full-field {
  min-width: 0;
  display: grid;
  gap: 6px
}

.field-grid span,
.full-field span,
.switch-row span {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-weight: 900
}

.color-row {
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 6px;
  align-items: center
}

.color-row input[type=color] {
  width: 34px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent
}

.slider-row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 8px;
  align-items: center
}

.slider-row .ant-slider {
  margin: 4px 0
}

.value-text {
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  font-variant-numeric: tabular-nums;
  text-align: right
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px
}

.ant-input::-moz-placeholder {
  color: var(--theme-text-secondary);
  opacity: .45
}

.ant-input::placeholder {
  color: var(--theme-text-secondary);
  opacity: .45
}

.ant-segmented {
  background: color-mix(in srgb, var(--theme-background-lighter) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-secondary) 25%, transparent);
  border-radius: 8px;
  padding: 3px;
  color: var(--theme-text-muted)
}

.ant-segmented-item {
  color: var(--theme-text-muted);
  border-radius: 6px;
  transition: color .2s
}

.ant-segmented-item:hover:not(.ant-segmented-item-selected) {
  color: var(--theme-text-secondary);
  background: color-mix(in srgb, var(--theme-overlay-medium) 60%, transparent)
}

.ant-segmented-item-selected {
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 6px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--theme-secondary) 35%, transparent)
}

.ant-segmented-item-label {
  color: inherit
}

.ant-segmented-thumb {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 6px
}
</style>
