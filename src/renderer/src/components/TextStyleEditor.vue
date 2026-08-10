<template>
  <div class="text-style-editor">
    <!-- ==================== 第一部分：字体与字号 ==================== -->
    <div class="editor-section">
      <div class="section-title">字体与字号</div>
      <a-row :gutter="8" align="middle">
        <a-col :span="14">
          <a-select
            :value="style.fontFamily"
            :options="displayFonts"
            :field-names="{ label: 'label', value: 'value' }"
            style="width: 100%"
            size="small"
            :option-label-prop="'label'"
            :dropdown-style="fontDropdownStyle"
            @change="(v) => updateStyle('fontFamily', v)"
          >
            <template #default>
              <span :style="{ fontFamily: currentFontCSS }">
                {{ style.fontFamily || '选择字体' }}
              </span>
            </template>
            <template #option="{ value, label }">
              <span :style="{ fontFamily: `'${value}', sans-serif` }">{{ label }}</span>
            </template>
          </a-select>
        </a-col>
        <a-col :span="10">
          <div class="slider-with-input">
            <a-slider :value="Number(style.fontSize) || 12" :min="12" :max="200" style="flex: 1"
              @change="(v) => updateStyle('fontSize', v)" />
            <a-input-number :value="Number(style.fontSize) || 12" :min="12" :max="200" :step="1" size="small"
              style="width: 64px" @change="(v) => updateStyle('fontSize', v)" />
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- ==================== 第二部分：颜色与透明度 ==================== -->
    <div class="editor-section">
      <div class="section-title">颜色与透明度</div>
      <a-row :gutter="8" align="middle">
        <a-col :span="12">
          <div class="color-row">
            <input type="color" class="color-swatch" :value="style.color || '#FFFFFF'"
              @input="(e) => updateStyle('color', e.target.value)" />
            <a-input :value="style.color || '#FFFFFF'" size="small"
              @change="(e) => updateStyle('color', e.target.value)" />
          </div>
        </a-col>
        <a-col :span="12">
          <div class="slider-with-label">
            <span class="lbl">透明度</span>
            <a-slider :value="Number(style.opacity ?? 1)" :min="0" :max="1" :step="0.05" style="flex: 1"
              @change="(v) => updateStyle('opacity', v)" />
            <span class="val">{{ Math.round((style.opacity ?? 1) * 100) }}%</span>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- ==================== 第三部分：字体样式与对齐 ==================== -->
    <div class="editor-section">
      <div class="section-title">样式与对齐</div>
      <a-row :gutter="8" align="middle">
        <a-col :span="14">
          <a-checkbox-group :value="style.fontStyles || []" @change="(v) => setFontStyles(v)">
            <a-checkbox value="bold">粗体</a-checkbox>
            <a-checkbox value="italic">斜体</a-checkbox>
            <a-checkbox value="underline">下划线</a-checkbox>
          </a-checkbox-group>
        </a-col>
        <a-col :span="10">
          <a-segmented :value="style.align || 'center'" :options="alignOptions" block
            @change="(v) => updateStyle('align', v)" />
        </a-col>
      </a-row>
    </div>

    <!-- ==================== 第四部分：描边 ==================== -->
    <div class="editor-section">
      <div class="section-title">
        <a-switch :checked="!!style.stroke?.enabled" size="small" @change="(v) => updateStroke('enabled', v)" />
        <span class="lbl-inline">描边</span>
        <span v-if="style.stroke?.enabled" class="summary">{{ style.stroke?.color || '#000000' }}</span>
      </div>
      <div v-if="style.stroke?.enabled" class="subsection">
        <a-row :gutter="8" align="middle">
          <a-col :span="12">
            <div class="color-row">
              <input type="color" class="color-swatch" :value="style.stroke?.color || '#000000'"
                @input="(e) => updateStroke('color', e.target.value)" />
              <a-input :value="style.stroke?.color || '#000000'" size="small"
                @change="(e) => updateStroke('color', e.target.value)" />
            </div>
          </a-col>
          <a-col :span="12">
            <div class="slider-with-label">
              <span class="lbl">粗细</span>
              <a-slider :value="Number(style.stroke?.width || 0)" :min="0" :max="20" :step="0.5" style="flex: 1"
                @change="(v) => updateStroke('width', v)" />
              <span class="val">{{ style.stroke?.width || 0 }}</span>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- ==================== 第五部分：阴影 ==================== -->
    <div class="editor-section">
      <div class="section-title">
        <a-switch :checked="!!style.shadow?.enabled" size="small" @change="(v) => updateShadow('enabled', v)" />
        <span class="lbl-inline">阴影</span>
        <span v-if="style.shadow?.enabled" class="summary">
          {{ Math.round((style.shadow?.opacity ?? 0.5) * 100) }}% / {{ style.shadow?.blur || 0 }}px
        </span>
      </div>
      <div v-if="style.shadow?.enabled" class="subsection">
        <a-row :gutter="8" align="middle">
          <a-col :span="8">
            <input type="color" class="color-swatch" :value="style.shadow?.color || '#000000'"
              @input="(e) => updateShadow('color', e.target.value)" />
          </a-col>
          <a-col :span="8">
            <div class="slider-with-label">
              <span class="lbl">距离</span>
              <a-slider :value="Number(style.shadow?.distance || 0)" :min="0" :max="30" :step="1" style="flex: 1"
                @change="(v) => updateShadow('distance', v)" />
            </div>
          </a-col>
          <a-col :span="8">
            <div class="slider-with-label">
              <span class="lbl">模糊</span>
              <a-slider :value="Number(style.shadow?.blur || 0)" :min="0" :max="30" :step="1" style="flex: 1"
                @change="(v) => updateShadow('blur', v)" />
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="8" align="middle" style="margin-top: 8px">
          <a-col :span="24">
            <div class="slider-with-label">
              <span class="lbl">不透明度</span>
              <a-slider :value="Number(style.shadow?.opacity ?? 0.5)" :min="0" :max="1" :step="0.05" style="flex: 1"
                @change="(v) => updateShadow('opacity', v)" />
              <span class="val">{{ Math.round((style.shadow?.opacity ?? 0.5) * 100) }}%</span>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- ==================== 第六部分：背景 ==================== -->
    <div class="editor-section">
      <div class="section-title">
        <a-switch :checked="!!style.background?.enabled" size="small" @change="(v) => updateBackground('enabled', v)" />
        <span class="lbl-inline">背景</span>
        <span v-if="style.background?.enabled" class="summary">
          {{ Math.round((style.background?.opacity ?? 0.7) * 100) }}% / R{{
            style.background?.radius || 0
          }}
        </span>
      </div>
      <div v-if="style.background?.enabled" class="subsection">
        <a-row :gutter="8" align="middle">
          <a-col :span="8">
            <div class="color-row">
              <input type="color" class="color-swatch" :value="style.background?.color || '#000000'"
                @input="(e) => updateBackground('color', e.target.value)" />
              <a-input :value="style.background?.color || '#000000'" size="small"
                @change="(e) => updateBackground('color', e.target.value)" />
            </div>
          </a-col>
          <a-col :span="8">
            <div class="slider-with-label">
              <span class="lbl">透明度</span>
              <a-slider :value="Number(style.background?.opacity ?? 0.7)" :min="0" :max="1" :step="0.05" style="flex: 1"
                @change="(v) => updateBackground('opacity', v)" />
            </div>
          </a-col>
          <a-col :span="8">
            <div class="slider-with-label">
              <span class="lbl">圆角</span>
              <a-slider :value="Number(style.background?.radius || 0)" :min="0" :max="50" :step="1" style="flex: 1"
                @change="(v) => updateBackground('radius', v)" />
            </div>
          </a-col>
        </a-row>
        <a-row :gutter="8" align="middle" style="margin-top: 8px">
          <a-col :span="12">
            <div class="slider-with-label">
              <span class="lbl">内边距 X</span>
              <a-slider
                v-model:value="paddingXLocal"
                :min="0"
                :max="60"
                :step="1"
                style="flex: 1"
                @change="(v) => updateBackground('paddingX', v)"
              />
            </div>
          </a-col>
          <a-col :span="12">
            <div class="slider-with-label">
              <span class="lbl">内边距 Y</span>
              <a-slider
                v-model:value="paddingYLocal"
                :min="0"
                :max="40"
                :step="1"
                style="flex: 1"
                @change="(v) => updateBackground('paddingY', v)"
              />
            </div>
          </a-col>
        </a-row>
        <div v-if="textBoundsHint && textBoundsHint.width > 0" class="bg-preview">
          <span class="lbl">背景尺寸预览：</span>
          <span class="val">
            {{ Math.round(textBoundsHint.width + (style.background?.paddingX || 12) * 2) }} ×
            {{ Math.round(textBoundsHint.height + (style.background?.paddingY || 8) * 2) }}
          </span>
        </div>
      </div>
    </div>

    <!-- ==================== 第七部分：间距与位置 ==================== -->
    <div class="editor-section">
      <div class="section-title">间距与位置</div>
      <a-row :gutter="8" align="middle">
        <a-col :span="12">
          <div class="slider-with-label">
            <span class="lbl">字间距</span>
            <a-slider :value="Number(style.letterSpacing || 0)" :min="-5" :max="30" :step="1" style="flex: 1"
              @change="(v) => updateStyle('letterSpacing', v)" />
            <span class="val">{{ style.letterSpacing || 0 }}</span>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="slider-with-label">
            <span class="lbl">行高</span>
            <a-slider :value="Number(style.lineHeight || 1.3)" :min="1" :max="2.5" :step="0.05" style="flex: 1"
              @change="(v) => updateStyle('lineHeight', v)" />
            <span class="val">{{ (style.lineHeight || 1.3).toFixed(2) }}</span>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="8" align="middle" style="margin-top: 8px">
        <a-col :span="12">
          <div class="slider-with-label">
            <span class="lbl">位置 X</span>
            <a-slider :value="Number(style.offsetX ?? 0)" :min="-200" :max="200" :step="2" style="flex: 1"
              @change="(v) => updateStyle('offsetX', v)" />
            <span class="val">{{ style.offsetX ?? 0 }}</span>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="slider-with-label">
            <span class="lbl">位置 Y</span>
            <a-slider :value="Number(style.offsetY ?? 0)" :min="-200" :max="200" :step="2" style="flex: 1"
              @change="(v) => updateStyle('offsetY', v)" />
            <span class="val">{{ style.offsetY ?? 0 }}</span>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// 字体下拉面板：限制高度滚动；单条高度让中文字号显示得舒服
const fontDropdownStyle = {
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '4px 0'
}

// 当前选中字体 → CSS font-family 字符串（供 :style 与 v-bind 使用）
const currentFontCSS = computed(() => {
  const f = props.modelValue?.fontFamily
  return f ? `'${f}', sans-serif` : 'inherit'
})

// ==================== Props ====================
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  textBoundsHint: {
    type: Object,
    default: () => ({ width: 0, height: 0 })
  },
  bgMaxSize: {
    type: Object,
    default: () => ({ width: 1080, height: 1920 })
  }
})

const emit = defineEmits(['update:modelValue'])

const systemFonts = ref([])
const builtinFonts = [
  { label: '微软雅黑', value: '微软雅黑' },
  { label: '思源黑体', value: '思源黑体' },
  { label: '思源宋体', value: '思源宋体' },
  { label: '方正粗黑宋简体', value: '方正粗黑宋简体' },
  { label: '方正书宋简体', value: '方正书宋简体' },
  { label: '优设标题黑', value: '优设标题黑' },
  { label: '东方大楷', value: '东方大楷' },
  { label: '江城斜黑体', value: '江城斜黑体' },
  { label: '江城律动宋', value: '江城律动宋' },
  { label: '荆南波波黑', value: '荆南波波黑' },
  { label: '三极行楷简体', value: '三极行楷简体' },
  { label: '杨任东竹石体', value: '杨任东竹石体' },
  { label: '霞鹜文楷', value: '霞鹜文楷' },
  { label: '阿里普惠体', value: '阿里普惠体' },
  { label: '源样明体', value: '源样明体' },
  { label: '黑体', value: '黑体' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
]

const displayFonts = computed(() => {
  const all = [...builtinFonts]
  for (const font of systemFonts.value) {
    if (!all.some((f) => f.value === font.value)) {
      all.push(font)
    }
  }
  return all
})

// 本地样式代理（v-model）
const style = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 对齐三档配置（a-segmented 用 string value）
const alignOptions = [
  { label: '左', value: 'left' },
  { label: '中', value: 'center' },
  { label: '右', value: 'right' },
]



// 背景内边距 X / Y（slider 用本地 ref 双向绑定，避免拖动时跳回原值）
const paddingXLocal = ref(Number(props.modelValue.background?.paddingX) || 12)
const paddingYLocal = ref(Number(props.modelValue.background?.paddingY) || 8)
watch(
  () => props.modelValue.background?.paddingX,
  (v) => {
    const n = Number(v) || 12
    if (n !== paddingXLocal.value) paddingXLocal.value = n
  }
)
watch(
  () => props.modelValue.background?.paddingY,
  (v) => {
    const n = Number(v) || 8
    if (n !== paddingYLocal.value) paddingYLocal.value = n
  }
)

const setFontStyles = (next) => {
  emit('update:modelValue', {
    ...style.value,
    fontStyles: Array.isArray(next) ? next : [],
  })
}

// 更新顶层属性
const updateStyle = (key, val) => {
  emit('update:modelValue', {
    ...style.value,
    [key]: val,
  })
}

// 更新描边
const updateStroke = (key, val) => {
  const currentStroke = style.value.stroke || {}
  emit('update:modelValue', {
    ...style.value,
    stroke: { ...currentStroke, [key]: val },
  })
}


// 更新阴影
const updateShadow = (key, val) => {
  const currentShadow = style.value.shadow || {}
  emit('update:modelValue', {
    ...style.value,
    shadow: { ...currentShadow, [key]: val },
  })
}

// 更新背景
const updateBackground = (key, val) => {
  const currentBg = style.value.background || {}
  emit('update:modelValue', {
    ...style.value,
    background: { ...currentBg, [key]: val },
  })
}

// ==================== 导出方法 ====================
defineExpose({
  style,
  updateStyle,
  updateStroke,
  updateShadow,
  updateBackground,
})
</script>

<style scoped>
.text-style-editor {
  padding: 4px 0;
}

.editor-section {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.editor-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #e2e2ea;
}

.section-title .lbl-inline {
  font-weight: normal;
  color: #b9b9c7;
}

.section-title .summary {
  font-size: 12px;
  color: #8a8aa3;
  margin-left: auto;
}

.subsection {
  padding: 6px 0 2px 0;
  border-left: 2px solid #d946ef;
  padding-left: 12px;
  margin-left: 4px;
}

/* 颜色行：swatch + input 横向并排 */
.color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-row .color-swatch {
  flex-shrink: 0;
}

/* 颜色选择 swatch（原生 input type=color）*/
.color-swatch {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-swatch::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-swatch::-webkit-color-swatch {
  border-radius: 2px;
  border: none;
}

.color-swatch::-moz-color-swatch {
  border-radius: 2px;
  border: none;
}

/* slider + label/val 行内排版 */
.slider-with-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.slider-with-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lbl {
  font-size: 12px;
  color: #b9b9c7;
  white-space: nowrap;
  min-width: 40px;
  flex-shrink: 0;
}

.val {
  font-size: 12px;
  color: #e2e2ea;
  min-width: 30px;
  text-align: right;
  flex-shrink: 0;
}

/* 背景尺寸预览 */
.bg-preview {
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  font-size: 12px;
  color: #b9b9c7;
}

.bg-preview .val {
  color: #f0abfc;
  font-weight: 500;
}

/* ant-design-vue 暗色覆盖 —— 让 slider/select 适配深色面板 */
:deep(.ant-slider .ant-slider-rail) {
  background: rgba(255, 255, 255, 0.14);
}

:deep(.ant-slider .ant-slider-track) {
  background: #d946ef;
}

:deep(.ant-slider .ant-slider-handle::after) {
  box-shadow: 0 0 0 2px #d946ef;
  background: #fff;
}

:deep(.ant-select-single) {
  font-size: 12px;
}

:deep(.ant-checkbox + span) {
  color: #b9b9c7;
}

:deep(.ant-segmented) {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

:deep(.ant-segmented-item-selected) {
  background: #d946ef !important;
  color: #fff !important;
}

/* 字体下拉项：稍大字号 + 上下 padding，方便预览字体 */
:deep(.ant-select-dropdown .ant-select-item-option) {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.4;
}

:deep(.ant-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled)) {
  background: rgba(217, 70, 239, 0.12);
}

/* 选中态的 select 显示文字：跟随当前字体 */
:deep(.ant-select-selection-item) {
  font-size: 13px;
  line-height: 1.4;
  font-family: v-bind('currentFontCSS');
}
</style>
