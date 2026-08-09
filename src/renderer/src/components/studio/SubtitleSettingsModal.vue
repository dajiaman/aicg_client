<template>
  <a-modal
    v-model:open="localOpen"
    title="字幕样式设置"
    :width="modalWidth || 560"
    wrap-class-name="subtitle-modal-wrapper"
    :body-style="{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }"
    :mask-closable="true"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="subtitle-settings">
      <!-- ===== 基础样式 ===== -->
      <div class="settings-section">
        <h4 class="section-title">基础样式</h4>

        <!-- 字体 -->
        <div class="setting-row">
          <label>字体</label>
          <a-select
            v-model:value="localFontFamily"
            show-search
            :filter-option="filterFont"
            popup-class-name="font-select-dropdown"
            placeholder="选择字体"
          >
            <a-select-option v-for="font in systemFonts" :key="font.value" :value="font.value">
              <span :style="{ fontFamily: `'${font.fontFamily || font.value}'` }">
                {{ font.label }}
              </span>
            </a-select-option>
          </a-select>
        </div>

        <!-- 字号 -->
        <div class="setting-row">
          <label>字号</label>
          <a-slider v-model:value="localFontSize" :min="12" :max="120" :step="1" style="flex: 1" />
          <span class="value-text">{{ localFontSize }}</span>
        </div>

        <!-- 颜色 -->
        <div class="setting-row">
          <label>颜色</label>
          <div class="color-row">
            <input
              type="color"
              :value="localColor"
              @input="(e) => (localColor = e.target.value)"
              class="color-picker"
            />
            <a-input v-model:value="localColor" style="flex: 1" />
          </div>
        </div>

        <!-- 透明度 -->
        <div class="setting-row">
          <label>透明度</label>
          <a-slider v-model:value="localOpacity" :min="0" :max="1" :step="0.05" style="flex: 1" />
          <span class="value-text">{{ Math.round(localOpacity * 100) }}%</span>
        </div>

        <!-- 字间距 -->
        <div class="setting-row">
          <label>字间距</label>
          <a-slider
            v-model:value="localLetterSpacing"
            :min="0"
            :max="20"
            :step="0.5"
            style="flex: 1"
          />
          <span class="value-text">{{ localLetterSpacing }}</span>
        </div>

        <!-- 行高 -->
        <div class="setting-row">
          <label>行高</label>
          <a-slider
            v-model:value="localLineHeight"
            :min="1"
            :max="3"
            :step="0.05"
            style="flex: 1"
          />
          <span class="value-text">{{ localLineHeight.toFixed(2) }}</span>
        </div>

        <!-- 字体样式（加粗/斜体） -->
        <div class="setting-row">
          <label>样式</label>
          <a-checkbox-group v-model:value="localFontStyles">
            <a-checkbox value="bold">加粗</a-checkbox>
            <a-checkbox value="italic">斜体</a-checkbox>
          </a-checkbox-group>
        </div>
      </div>

      <!-- ===== 描边 ===== -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title">描边</h4>
          <a-switch v-model:checked="localEnableStroke" />
        </div>

        <template v-if="localEnableStroke">
          <div class="setting-row">
            <label>描边宽度</label>
            <a-slider
              v-model:value="localStrokeWidth"
              :min="0"
              :max="12"
              :step="0.5"
              style="flex: 1"
            />
            <span class="value-text">{{ localStrokeWidth }}</span>
          </div>
          <div class="setting-row">
            <label>描边颜色</label>
            <div class="color-row">
              <input
                type="color"
                :value="localStrokeColor"
                @input="(e) => (localStrokeColor = e.target.value)"
                class="color-picker"
              />
              <a-input v-model:value="localStrokeColor" style="flex: 1" />
            </div>
          </div>
        </template>
        <div v-else class="disabled-hint">未启用描边</div>
      </div>

      <!-- ===== 阴影 ===== -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title">阴影</h4>
          <a-switch v-model:checked="localEnableShadow" />
        </div>

        <template v-if="localEnableShadow">
          <div class="setting-row">
            <label>阴影距离</label>
            <a-slider
              v-model:value="localShadowDistance"
              :min="0"
              :max="20"
              :step="1"
              style="flex: 1"
            />
            <span class="value-text">{{ localShadowDistance }}</span>
          </div>
          <div class="setting-row">
            <label>阴影模糊</label>
            <a-slider
              v-model:value="localShadowBlur"
              :min="0"
              :max="30"
              :step="1"
              style="flex: 1"
            />
            <span class="value-text">{{ localShadowBlur }}</span>
          </div>
          <div class="setting-row">
            <label>阴影透明度</label>
            <a-slider
              v-model:value="localShadowOpacity"
              :min="0"
              :max="1"
              :step="0.05"
              style="flex: 1"
            />
            <span class="value-text">{{ Math.round(localShadowOpacity * 100) }}%</span>
          </div>
          <div class="setting-row">
            <label>阴影颜色</label>
            <div class="color-row">
              <input
                type="color"
                :value="localShadowColor"
                @input="(e) => (localShadowColor = e.target.value)"
                class="color-picker"
              />
              <a-input v-model:value="localShadowColor" style="flex: 1" />
            </div>
          </div>
        </template>
        <div v-else class="disabled-hint">未启用阴影</div>
      </div>

      <!-- ===== 背景 ===== -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title">背景</h4>
          <a-switch v-model:checked="localEnableBackground" />
        </div>

        <template v-if="localEnableBackground">
          <div class="setting-row">
            <label>背景类型</label>
            <a-radio-group v-model:value="localBackgroundType">
              <a-radio-button value="rect">矩形</a-radio-button>
              <a-radio-button value="none">无</a-radio-button>
            </a-radio-group>
          </div>
          <div class="setting-row">
            <label>背景颜色</label>
            <div class="color-row">
              <input
                type="color"
                :value="localBackgroundColor"
                @input="(e) => (localBackgroundColor = e.target.value)"
                class="color-picker"
              />
              <a-input v-model:value="localBackgroundColor" style="flex: 1" />
            </div>
          </div>
          <div class="setting-row">
            <label>背景透明度</label>
            <a-slider
              v-model:value="localBackgroundOpacity"
              :min="0"
              :max="1"
              :step="0.05"
              style="flex: 1"
            />
            <span class="value-text">{{ Math.round(localBackgroundOpacity * 100) }}%</span>
          </div>
          <div class="setting-row">
            <label>背景圆角</label>
            <a-slider
              v-model:value="localBackgroundRadius"
              :min="0"
              :max="40"
              :step="1"
              style="flex: 1"
            />
            <span class="value-text">{{ localBackgroundRadius }}</span>
          </div>
          <div class="setting-row">
            <label>内边距（左右）</label>
            <a-slider
              v-model:value="localBackgroundPaddingX"
              :min="0"
              :max="60"
              :step="2"
              style="flex: 1"
            />
            <span class="value-text">{{ localBackgroundPaddingX }}</span>
          </div>
          <div class="setting-row">
            <label>内边距（上下）</label>
            <a-slider
              v-model:value="localBackgroundPaddingY"
              :min="0"
              :max="40"
              :step="2"
              style="flex: 1"
            />
            <span class="value-text">{{ localBackgroundPaddingY }}</span>
          </div>
        </template>
        <div v-else class="disabled-hint">未启用背景</div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

// ============================================================
// 1. Props
// ============================================================
const props = defineProps({
  /** 弹窗是否打开（v-model:open） */
  open: {
    type: Boolean,
    default: false
  },
  /** 初始配置（从 config.subtitle.customConfig 传入） */
  initialConfig: {
    type: Object,
    default: () => ({})
  },
  /** 弹窗宽度 */
  modalWidth: {
    type: Number,
    default: 800
  }
})

// ============================================================
// 2. Emits
// ============================================================
const emit = defineEmits([
  'update:open', // v-model:open 更新
  'confirm', // 确认保存
  'cancel' // 取消
])

// ============================================================
// 3. 本地状态（从 initialConfig 初始化）
// ============================================================
const localOpen = ref(props.open)
const localFontFamily = ref(props.initialConfig?.fontFamily || '微软雅黑')
const localFontSize = ref(props.initialConfig?.fontSize || 48)
const localColor = ref(props.initialConfig?.color || '#FFFFFF')
const localOpacity = ref(props.initialConfig?.opacity ?? 1)
const localLetterSpacing = ref(props.initialConfig?.letterSpacing || 0)
const localLineHeight = ref(props.initialConfig?.lineHeight || 1.2)
const localFontStyles = ref(props.initialConfig?.fontStyles || ['bold'])

// 描边
const localEnableStroke = ref(props.initialConfig?.enableStroke ?? true)
const localStrokeWidth = ref(props.initialConfig?.strokeWidth || 0)
const localStrokeColor = ref(props.initialConfig?.strokeColor || '#000000')

// 阴影
const localEnableShadow = ref(props.initialConfig?.enableShadow ?? false)
const localShadowDistance = ref(props.initialConfig?.shadowDistance || 3)
const localShadowBlur = ref(props.initialConfig?.shadowBlur || 0)
const localShadowOpacity = ref(props.initialConfig?.shadowOpacity || 0.45)
const localShadowColor = ref(props.initialConfig?.shadowColor || '#000000')

// 背景
const localEnableBackground = ref(props.initialConfig?.enableBackground ?? false)
const localBackgroundType = ref(props.initialConfig?.backgroundType || 'rect')
const localBackgroundColor = ref(props.initialConfig?.backgroundColor || '#000000')
const localBackgroundOpacity = ref(props.initialConfig?.backgroundOpacity || 0.7)
const localBackgroundRadius = ref(props.initialConfig?.backgroundRadius || 0)
const localBackgroundPaddingX = ref(props.initialConfig?.backgroundPaddingX || 18)
const localBackgroundPaddingY = ref(props.initialConfig?.backgroundPaddingY || 12)

// ============================================================
// 4. 计算属性：系统字体列表
// ============================================================
const systemFonts = ref([])

// ============================================================
// 5. 工具函数
// ============================================================
function filterFont(input, option) {
  const search = String(input).toLowerCase()
  const label = String(option?.label || '').toLowerCase()
  return label.includes(search)
}

const builtin = [
  { label: '微软雅黑', value: '微软雅黑', fontFamily: '微软雅黑' },
  { label: '黑体', value: '黑体', fontFamily: '黑体' },
  { label: '宋体', value: '宋体', fontFamily: '宋体' },
  { label: '仿宋', value: '仿宋', fontFamily: '仿宋' },
  { label: 'Arial', value: 'Arial', fontFamily: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman', fontFamily: 'Times New Roman' }
]

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

// ============================================================
// 7. 事件处理
// ============================================================
function handleConfirm() {
  // 构建配置对象
  const config = {
    fontFamily: localFontFamily.value,
    fontSize: localFontSize.value,
    color: localColor.value,
    opacity: localOpacity.value,
    letterSpacing: localLetterSpacing.value,
    lineHeight: localLineHeight.value,
    fontStyles: [...localFontStyles.value],
    enableStroke: localEnableStroke.value,
    strokeWidth: localStrokeWidth.value,
    strokeColor: localStrokeColor.value,
    enableShadow: localEnableShadow.value,
    shadowDistance: localShadowDistance.value,
    shadowBlur: localShadowBlur.value,
    shadowOpacity: localShadowOpacity.value,
    shadowColor: localShadowColor.value,
    enableBackground: localEnableBackground.value,
    backgroundType: localBackgroundType.value,
    backgroundColor: localBackgroundColor.value,
    backgroundOpacity: localBackgroundOpacity.value,
    backgroundRadius: localBackgroundRadius.value,
    backgroundPaddingX: localBackgroundPaddingX.value,
    backgroundPaddingY: localBackgroundPaddingY.value
  }
  emit('confirm', config)
  emit('update:open', false)
  localOpen.value = false
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
  localOpen.value = false
}

// ============================================================
// 8. 同步外部 open 变化
// ============================================================
watch(
  () => props.open,
  (val) => {
    localOpen.value = val
    if (val) {
      // 打开时重新加载字体
      loadSystemFonts()
      // 从 initialConfig 刷新本地状态
      const cfg = props.initialConfig || {}
      localFontFamily.value = cfg.fontFamily || '微软雅黑'
      localFontSize.value = cfg.fontSize || 48
      localColor.value = cfg.color || '#FFFFFF'
      localOpacity.value = cfg.opacity ?? 1
      localLetterSpacing.value = cfg.letterSpacing || 0
      localLineHeight.value = cfg.lineHeight || 1.2
      localFontStyles.value = cfg.fontStyles || ['bold']
      localEnableStroke.value = cfg.enableStroke ?? true
      localStrokeWidth.value = cfg.strokeWidth || 0
      localStrokeColor.value = cfg.strokeColor || '#000000'
      localEnableShadow.value = cfg.enableShadow ?? false
      localShadowDistance.value = cfg.shadowDistance || 3
      localShadowBlur.value = cfg.shadowBlur || 0
      localShadowOpacity.value = cfg.shadowOpacity || 0.45
      localShadowColor.value = cfg.shadowColor || '#000000'
      localEnableBackground.value = cfg.enableBackground ?? false
      localBackgroundType.value = cfg.backgroundType || 'rect'
      localBackgroundColor.value = cfg.backgroundColor || '#000000'
      localBackgroundOpacity.value = cfg.backgroundOpacity || 0.7
      localBackgroundRadius.value = cfg.backgroundRadius || 0
      localBackgroundPaddingX.value = cfg.backgroundPaddingX || 18
      localBackgroundPaddingY.value = cfg.backgroundPaddingY || 12
    }
  },
  { immediate: true }
)

watch(
  () => localOpen,
  (val) => {
    if (val !== props.open) {
      emit('update:open', val)
    }
  }
)

// ============================================================
// 9. 生命周期
// ============================================================
onMounted(() => {
  loadSystemFonts()
})
</script>

<style scoped>
.subtitle-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #f3f4f6;
}

/* ===== 设置区块（暗色卡） ===== */
.settings-section {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #f3f4f6;
}

/* ===== 设置行 ===== */
.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.setting-row label {
  font-size: 13px;
  color: #9ca3af;
  min-width: 70px;
  flex-shrink: 0;
}

.setting-row :deep(.ant-select) {
  flex: 1;
  min-width: 80px;
}

.setting-row :deep(.ant-slider) {
  flex: 1;
  min-width: 60px;
}

.setting-row :deep(.ant-radio-group) {
  flex: 1;
}

.value-text {
  font-size: 13px;
  color: #f3f4f6;
  min-width: 40px;
  text-align: right;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

/* ===== 颜色选择器 ===== */
.color-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
  background: transparent;
}

.color-row :deep(.ant-input) {
  flex: 1;
}

/* ===== 禁用提示 ===== */
.disabled-hint {
  font-size: 13px;
  color: #6b7280;
  padding: 8px 0 2px 0;
  font-style: italic;
  margin-top: 8px;
}

/* ===== 复选框组 ===== */
.setting-row :deep(.ant-checkbox-group) {
  display: flex;
  gap: 12px;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .setting-row {
    flex-wrap: wrap;
    gap: 6px;
  }

  .setting-row label {
    min-width: 60px;
    font-size: 12px;
  }

  .value-text {
    min-width: 32px;
    font-size: 12px;
  }

  .settings-section {
    padding: 10px 12px;
  }
}
</style>

<!-- ============================================================
     非 scoped：覆盖 a-modal 自身的暗色化
     ============================================================ -->
<style>
.subtitle-modal-wrapper .ant-modal-content {
  background: #15152a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0;
}

.subtitle-modal-wrapper .ant-modal-close {
  color: rgba(255, 255, 255, 0.6);
}

.subtitle-modal-wrapper .ant-modal-close:hover {
  color: #f3f4f6;
  background: rgba(255, 255, 255, 0.08);
}

.subtitle-modal-wrapper .ant-modal-header {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 20px;
  margin: 0;
}

.subtitle-modal-wrapper .ant-modal-title {
  color: #f3f4f6;
  font-size: 15px;
  font-weight: 600;
}

.subtitle-modal-wrapper .ant-modal-body {
  background: #15152a;
  color: #e5e7eb;
  padding: 20px 24px;
}

.subtitle-modal-wrapper .ant-modal-footer {
  background: #15152a;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 20px;
  border-radius: 0 0 14px 14px;
}

.subtitle-modal-wrapper .ant-modal-footer .ant-btn-primary {
  background: linear-gradient(135deg, #d946ef 0%, #9333ea 100%);
  border-color: transparent;
  box-shadow: none;
}

.subtitle-modal-wrapper .ant-modal-footer .ant-btn-primary:hover {
  background: linear-gradient(135deg, #e879f9 0%, #a855f7 100%);
  border-color: transparent;
}

.subtitle-modal-wrapper .ant-modal-footer .ant-btn:not(.ant-btn-primary) {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  color: #e5e7eb;
}

.subtitle-modal-wrapper .ant-modal-footer .ant-btn:not(.ant-btn-primary):hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #f3f4f6;
}
</style>
