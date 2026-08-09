<template>
  <div class="namecard-panel">
    <!-- ===== 基本信息 ===== -->
    <div class="basic-info">
      <!-- 称呼 -->
      <div class="field-row">
        <span class="field-label">称呼</span>
        <a-input v-model:value="localName" placeholder="人物称呼" @update:value="handleNameChange" />
      </div>

      <!-- 简介 -->
      <div class="field-row">
        <span class="field-label">简介</span>
        <a-textarea v-model:value="localSubtitle" placeholder="简单介绍，可输入多行" :auto-size="{ minRows: 2, maxRows: 5 }"
          @update:value="handleSubtitleChange" />
      </div>
    </div>

    <!-- ===== 显示时长 ===== -->
    <div class="display-mode-row">
      <span class="field-label">显示时长</span>
      <a-segmented v-model:value="localDisplayMode" :options="displayModeOptions" size="small"
        @change="handleDisplayModeChange" />
      <a-input-number v-if="localDisplayMode === 'duration'" v-model:value="localDuration" :min="1" :max="60"
        addon-after="秒" size="small" style="width: 100px" @change="handleDurationChange" />
    </div>

    <!-- ===== 位置控制 ===== -->
    <div class="style-card style-card-layout">
      <div class="style-card-head">
        <div>
          <strong>位置</strong>
          <small>可在右侧编辑预览中拖动调整</small>
        </div>
      </div>
      <div class="style-card-body">
        <div class="field-row">
          <label>左侧距离</label>
          <a-slider v-model:value="localOffsetX" :min="0" :max="900" :step="2" @change="handleOffsetXChange" />
          <span class="value-text">{{ localOffsetX }}</span>
        </div>
        <div class="field-row">
          <label>底部距离</label>
          <a-slider v-model:value="localOffsetY" :min="0" :max="1600" :step="2" @change="handleOffsetYChange" />
          <span class="value-text">{{ localOffsetY }}</span>
        </div>
      </div>
    </div>

    <!-- ===== 文字样式 ===== -->
    <div class="style-card style-card-text">
      <div class="style-card-head">
        <div>
          <strong>文字样式</strong>
          <small>字体、颜色、透明度和间距</small>
        </div>
      </div>
      <div class="style-card-body">
        <!-- 字体 -->
        <div class="field-row">
          <label>字体</label>
          <a-select v-model:value="localFontFamily" size="small" show-search :filter-option="filterFont"
            popup-class-name="font-select-dropdown" @change="handleFontChange">
            <a-select-option v-for="font in systemFonts" :key="font.value" :value="font.value">
              <span :style="getFontOptionStyle(font)">
                {{ font.label }}
              </span>
            </a-select-option>
          </a-select>
        </div>

        <!-- 字号 -->
        <div class="field-row">
          <label>字号</label>
          <a-slider v-model:value="localFontSize" :min="18" :max="80" :step="1" @change="handleFontSizeChange" />
          <span class="value-text">{{ localFontSize }}</span>
        </div>

        <!-- 文字颜色 -->
        <div class="field-row">
          <label>文字颜色</label>
          <div class="color-row">
            <input type="color" :value="localTextColor" @input="(e) => handleTextColorChange(e.target.value)"
              class="color-picker" />
            <a-input v-model:value="localTextColor" size="small" @update:value="handleTextColorChange" />
          </div>
        </div>

        <!-- 文字透明度 -->
        <div class="field-row">
          <label>文字透明度</label>
          <a-slider v-model:value="localOpacity" :min="0" :max="1" :step="0.05" @change="handleOpacityChange" />
          <span class="value-text">{{ Math.round(localOpacity * 100) }}%</span>
        </div>

        <!-- 字间距 -->
        <div class="field-row">
          <label>字间距</label>
          <a-slider v-model:value="localLetterSpacing" :min="0" :max="30" :step="1"
            @change="handleLetterSpacingChange" />
          <span class="value-text">{{ localLetterSpacing }}</span>
        </div>

        <!-- 行间距 -->
        <div class="field-row">
          <label>行间距</label>
          <a-slider v-model:value="localLineSpacing" :min="0" :max="40" :step="1" @change="handleLineSpacingChange" />
          <span class="value-text">{{ localLineSpacing }}</span>
        </div>

        <!-- 称呼加粗 -->
        <div class="field-row">
          <a-switch v-model:checked="localNameBold" size="small" @change="handleNameBoldChange" />
          <span>称呼加粗</span>
        </div>
      </div>
    </div>

    <!-- ===== 背景样式 ===== -->
    <div class="style-card style-card-background">
      <div class="style-card-head">
        <div>
          <strong>背景</strong>
          <small>颜色、透明度、宽度、高度和圆角</small>
        </div>
      </div>
      <div class="style-card-body">
        <!-- 背景颜色 -->
        <div class="field-row">
          <label>背景颜色</label>
          <div class="color-row">
            <input type="color" :value="localBackgroundColor"
              @input="(e) => handleBackgroundColorChange(e.target.value)" class="color-picker" />
            <a-input v-model:value="localBackgroundColor" size="small" @update:value="handleBackgroundColorChange" />
          </div>
        </div>

        <!-- 背景透明度 -->
        <div class="field-row">
          <label>背景透明度</label>
          <a-slider v-model:value="localBackgroundOpacity" :min="0" :max="1" :step="0.05"
            @change="handleBackgroundOpacityChange" />
          <span class="value-text">{{ Math.round(localBackgroundOpacity * 100) }}%</span>
        </div>

        <!-- 背景宽度（内边距 X） -->
        <div class="field-row">
          <label>背景宽度</label>
          <a-slider v-model:value="localBackgroundPaddingX" :min="0" :max="120" :step="2"
            @change="handleBackgroundPaddingXChange" />
          <span class="value-text">{{ localBackgroundPaddingX }}</span>
        </div>

        <!-- 背景高度（内边距 Y） -->
        <div class="field-row">
          <label>背景高度</label>
          <a-slider v-model:value="localBackgroundPaddingY" :min="0" :max="80" :step="2"
            @change="handleBackgroundPaddingYChange" />
          <span class="value-text">{{ localBackgroundPaddingY }}</span>
        </div>

        <!-- 背景圆角 -->
        <div class="field-row">
          <label>背景圆角</label>
          <a-slider v-model:value="localBackgroundRadius" :min="0" :max="120" :step="1"
            @change="handleBackgroundRadiusChange" />
          <span class="value-text">{{ localBackgroundRadius }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// ============================================================
// 1. Props
// ============================================================
const props = defineProps({
  /** 名片配置对象 */
  config: {
    type: Object,
    required: true,
  },
})

// ============================================================
// 2. 常量
// ============================================================
const displayModeOptions = [
  { label: '一直显示', value: 'always' },
  { label: '显示几秒', value: 'duration' },
]

// ============================================================
// 3. 本地状态（与 config 同步）
// ============================================================
const localName = ref(props.config.name || '')
const localSubtitle = ref(props.config.subtitle || '')
const localDisplayMode = ref(props.config.displayMode || 'always')
const localDuration = ref(props.config.duration || 5)
const localOffsetX = ref(props.config.style?.offsetX ?? 64)
const localOffsetY = ref(props.config.style?.offsetY ?? 96)
const localFontFamily = ref(props.config.style?.fontFamily || '微软雅黑')
const localFontSize = ref(props.config.style?.fontSize || 28)
const localTextColor = ref(props.config.style?.textColor || '#FFFFFF')
const localOpacity = ref(props.config.style?.opacity ?? 1)
const localLetterSpacing = ref(props.config.style?.letterSpacing || 0)
const localLineSpacing = ref(props.config.style?.lineSpacing || 2)
const localNameBold = ref(props.config.style?.nameBold ?? true)
const localBackgroundColor = ref(props.config.style?.backgroundColor || '#000000')
const localBackgroundOpacity = ref(props.config.style?.backgroundOpacity || 0.52)
const localBackgroundPaddingX = ref(props.config.style?.backgroundPaddingX || 18)
const localBackgroundPaddingY = ref(props.config.style?.backgroundPaddingY || 12)
const localBackgroundRadius = ref(props.config.style?.backgroundRadius || 0)

// ============================================================
// 4. 计算属性
// ============================================================
const systemFonts = ref([
  { label: '微软雅黑', value: '微软雅黑', fontFamily: '微软雅黑' },
  { label: '黑体', value: '黑体', fontFamily: '黑体' },
  { label: 'Arial', value: 'Arial', fontFamily: 'Arial' },
])

// ============================================================
// 5. 工具函数
// ============================================================
function filterFont(input, option) {
  const search = String(input).toLowerCase()
  const label = String(option?.label || '').toLowerCase()
  return label.includes(search)
}

function getFontOptionStyle(font) {
  return {
    fontFamily: `"${font.fontFamily || font.value}"`,
  }
}

// ============================================================
// 6. 事件处理方法
// ============================================================

// ----- 基本信息 -----
function handleNameChange(val) {
  localName.value = val
  props.config.name = val
}

function handleSubtitleChange(val) {
  localSubtitle.value = val
  props.config.subtitle = val
}

// ----- 显示时长 -----
function handleDisplayModeChange(mode) {
  localDisplayMode.value = mode
  props.config.displayMode = mode
}

function handleDurationChange(val) {
  localDuration.value = val
  props.config.duration = val
}

// ----- 位置 -----
function handleOffsetXChange(val) {
  localOffsetX.value = val
  props.config.style.offsetX = val
}

function handleOffsetYChange(val) {
  localOffsetY.value = val
  props.config.style.offsetY = val
}

// ----- 字体 -----
function handleFontChange(val) {
  localFontFamily.value = val
  props.config.style.fontFamily = val
}

function handleFontSizeChange(val) {
  localFontSize.value = val
  props.config.style.fontSize = val
}

// ----- 文字颜色和透明度 -----
function handleTextColorChange(val) {
  localTextColor.value = val
  props.config.style.textColor = val
}

function handleOpacityChange(val) {
  localOpacity.value = val
  props.config.style.opacity = val
}

// ----- 间距 -----
function handleLetterSpacingChange(val) {
  localLetterSpacing.value = val
  props.config.style.letterSpacing = val
}

function handleLineSpacingChange(val) {
  localLineSpacing.value = val
  props.config.style.lineSpacing = val
}

// ----- 称呼加粗 -----
function handleNameBoldChange(val) {
  localNameBold.value = val
  props.config.style.nameBold = val
}

// ----- 背景 -----
function handleBackgroundColorChange(val) {
  localBackgroundColor.value = val
  props.config.style.backgroundColor = val
}

function handleBackgroundOpacityChange(val) {
  localBackgroundOpacity.value = val
  props.config.style.backgroundOpacity = val
}

function handleBackgroundPaddingXChange(val) {
  localBackgroundPaddingX.value = val
  props.config.style.backgroundPaddingX = val
}

function handleBackgroundPaddingYChange(val) {
  localBackgroundPaddingY.value = val
  props.config.style.backgroundPaddingY = val
}

function handleBackgroundRadiusChange(val) {
  localBackgroundRadius.value = val
  props.config.style.backgroundRadius = val
}

// ============================================================
// 7. 同步函数：从 config 同步到本地状态
// ============================================================
function syncLocalFromConfig() {
  const style = props.config.style || {}
  localName.value = props.config.name || ''
  localSubtitle.value = props.config.subtitle || ''
  localDisplayMode.value = props.config.displayMode || 'always'
  localDuration.value = props.config.duration || 5
  localOffsetX.value = style.offsetX ?? 64
  localOffsetY.value = style.offsetY ?? 96
  localFontFamily.value = style.fontFamily || '微软雅黑'
  localFontSize.value = style.fontSize || 28
  localTextColor.value = style.textColor || '#FFFFFF'
  localOpacity.value = style.opacity ?? 1
  localLetterSpacing.value = style.letterSpacing || 0
  localLineSpacing.value = style.lineSpacing || 2
  localNameBold.value = style.nameBold ?? true
  localBackgroundColor.value = style.backgroundColor || '#000000'
  localBackgroundOpacity.value = style.backgroundOpacity || 0.52
  localBackgroundPaddingX.value = style.backgroundPaddingX || 18
  localBackgroundPaddingY.value = style.backgroundPaddingY || 12
  localBackgroundRadius.value = style.backgroundRadius || 0
}

// ============================================================
// 8. 加载系统字体
// ============================================================
async function loadSystemFonts() {
  try {
    if (window.api?.font?.getAvailable) {
      const result = await window.api.font.getAvailable()
      if (result.success && Array.isArray(result.data)) {
        const fonts = result.data.map(f => ({
          label: f.displayName || f.fontName || f.fullFontName || f.fontFamily || '未知字体',
          value: f.displayName || f.fontName || f.fontFamily || f.fontName,
          fontFamily: f.fontFamily || f.fontName || f.displayName,
          fontPath: f.path,
        })).filter(f => f.value)
        if (fonts.length) systemFonts.value = fonts
      }
    }
  } catch (e) {
    console.warn('加载系统字体失败:', e)
  }
}

// ============================================================
// 9. 生命周期
// ============================================================
onMounted(() => {
  loadSystemFonts()
  syncLocalFromConfig()
})

// ============================================================
// 10. 监听外部 config 变化
// ============================================================
watch(
  () => props.config,
  () => {
    syncLocalFromConfig()
  },
  { deep: true }
)

// 暴露给父组件（如果需要）
defineExpose({
  syncLocalFromConfig,
})
</script>

<style scoped>
.namecard-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

/* ===== 基本信息 / 显示时长 / 样式卡片 ===== */
.basic-info,
.display-mode-row,
.style-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: border-color 0.18s ease;
}

.basic-info:hover,
.display-mode-row:hover,
.style-card:hover {
  border-color: rgba(217, 70, 239, 0.25);
}

/* ===== 基本信息 ===== */
.basic-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-label {
  font-size: 13px;
  color: #9ca3af;
  font-weight: 500;
  min-width: 60px;
  flex-shrink: 0;
}

.field-row .ant-input,
.field-row .ant-textarea {
  flex: 1;
}

/* ===== 显示时长 ===== */
.display-mode-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
}

/* ===== 样式卡片 ===== */
.style-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.style-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.style-card-head strong {
  font-size: 13px;
  color: #e5e7eb;
  font-weight: 600;
}

.style-card-head small {
  font-size: 12px;
  color: #6b7280;
  font-weight: normal;
  display: block;
  margin-top: 2px;
}

.style-card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row label {
  font-size: 13px;
  color: #9ca3af;
  min-width: 70px;
  flex-shrink: 0;
  font-weight: 500;
}

.field-row .ant-select {
  flex: 1;
  min-width: 80px;
}

.field-row .ant-slider {
  flex: 1;
  min-width: 60px;
}

.value-text {
  font-size: 13px;
  color: #f3f4f6;
  min-width: 32px;
  text-align: right;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.color-picker {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 2px;
  cursor: pointer;
  background: #1c1c2a;
}

.color-row .ant-input {
  flex: 1;
}

/* 开关行 */
.field-row .ant-switch+span {
  font-size: 13px;
  color: #d1d5db;
  margin-left: 8px;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .field-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .field-row label {
    min-width: 60px;
    font-size: 12px;
  }

  .display-mode-row {
    gap: 8px;
  }

  .field-row .ant-select {
    min-width: 60px;
  }

  .value-text {
    min-width: 28px;
    font-size: 12px;
  }

  .color-row .ant-input {
    min-width: 60px;
  }
}
</style>
