<template>
  <div class="preview-stage">
    <!-- 预览区头部：模式切换 + 操作按钮 -->
    <div class="preview-head">
      <div>
        <h3>{{ previewMode === 'rendered' ? '成片预览' : '编辑预览' }}</h3>
        <p class="preview-hint">{{ previewHint }}</p>
      </div>
      <div class="preview-actions">
        <!-- 模式切换 -->
        <a-segmented :value="previewMode" :options="modeOptions" size="small" @change="handlePreviewModeChange"
          v-if="previewMode === 'rendered'" />

        <!-- 操作按钮（仅成片模式） -->
        <template v-if="showRenderedPreview">
          <a-button size="small" type="primary" @click="emit('open-file', previewVideoPath)">
            打开
          </a-button>
          <a-button size="small" @click="emit('export-file', previewVideoPath)"> 导出 </a-button>
        </template>
      </div>
    </div>

    <div class="stage-canvas">
      <!-- 预览主体 -->
      <div ref="surfaceRef" v-if="props.sourceVideoSrc" class="media-surface" :class="{
        'rendered-surface': previewMode === 'rendered',
        'edit-surface': previewMode === 'edit',
        expanded: renderedPreviewExpanded
      }">
        <!-- 成片预览：播放视频 -->
        <template v-if="showRenderedPreview">
          <video ref="mediaRef" :src="previewVideoPath" controls controlsList="nodownload noremoteplayback"
            disablePictureInPicture muted preload="metadata" @loadedmetadata="handleMediaLoaded"
            class="preview-video" />
          <!-- 渲染脏标记 -->
          <a-badge v-if="renderedDirty" color="warning" class="dirty-badge"> 成片未更新 </a-badge>
        </template>

        <!-- 编辑预览：显示首帧 + 叠加图层 -->
        <template v-else-if="showEditPreview">
          <!-- 首帧图片或视频 -->
          <img v-if="previewFrameSrc && !previewFrameLoading" ref="frameImgRef" :src="previewFrameSrc" alt="编辑预览首帧"
            class="frame-image" @load="onFrameLoaded" />

          <video ref="mediaRef" :src="sourceVideoSrc" preload="metadata" @loadedmetadata="handleMediaLoaded"
            v-if="!frameLoaded" />

          <div v-if="previewFrameLoading" class="frame-loading">
            <a-spin tip="正在提取首帧..." />
          </div>

          <!-- 叠加层（字幕、标题、名片） -->
          <div class="overlay-layer" :style="overlayLayerStyle" ref="overlayRef">
            <!-- 字幕层 -->
            <div v-if="subtitle.enabled" class="subtitle-overlay" :style="subtitleOverlayStyle">
              <span class="subtitle-text">
                这是一条字幕
                <span v-if="keywordHighlightVisible" class="subtitle-highlight" :style="keywordHighlightStyle">
                  高亮
                </span>
              </span>
            </div>

            <!-- 标题层 -->
            <div v-if="title.enabled" class="title-overlay" :class="{
              template: templateTitlePreview,
              draggable: true
            }" :style="titleOverlayStyle" @pointerdown="handleTitlePointerDown">
              <!-- 模板标题（分层渲染） -->
              <template v-if="templateTitlePreview">
                <i v-if="titleTemplateMaskStyle" class="title-template-mask" :style="titleTemplateMaskStyle" />
                <span v-for="line in titleTemplateLines" :key="line.key" class="title-template-line"
                  :style="line.style">
                  {{ line.text }}
                </span>
              </template>
              <!-- 自定义标题 -->
              <template v-else>
                <span class="title-custom-line">{{ title.text.h1 || '主标题示例' }}</span>
                <span v-if="title.text.h2" class="title-custom-line">{{ title.text.h2 }}</span>
              </template>
            </div>

            <!-- 名片层 -->
            <div v-if="namecard.enabled" class="namecard-overlay draggable" :style="namecardOverlayStyle"
              @pointerdown="handleNamecardPointerDown">
              <b class="namecard-name">{{ namecard.name || '人物称呼' }}</b>
              <span v-for="(line, idx) in namecardIntroLines" :key="idx" class="namecard-intro">
                {{ line }}
              </span>
            </div>
          </div>
        </template>


      </div>


      <div class="empty-state" v-if="!props.sourceVideoSrc">
        <video-camera-outlined />
        <strong>暂无预览视频</strong>
        <span>选择视频源后可基于首帧预览标题、字幕</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, reactive } from 'vue'
import { PRESET_LINES_TEMPLATES, titleStylePresets } from '../../constants'
import { VideoCameraOutlined } from '@ant-design/icons-vue'

defineOptions({
  name: 'ViralStudioPreviewStage'
})

// Props
const props = defineProps({
  sourceVideoSrc: { type: String, default: '' },
  previewVideoPath: { type: String, default: '' },
  previewMode: { type: String, default: 'edit' }, // 'edit' | 'rendered'
  previewFrameSrc: { type: String, default: '' },
  // 编辑预览：首帧加载状态
  previewFrameLoading: { type: Boolean, default: true },
  renderedDirty: { type: Boolean, default: false },
  videoName: { type: String, default: '' },
  subtitle: { type: Object, required: true },
  title: { type: Object, required: true },
  namecard: { type: Object, required: true }
})

// Emits
const emit = defineEmits([
  'open-file',
  'export-file',
  'update-preview-mode',
  'update-title-offset',
  'update-namecard-position'
])

// --- Refs ---
const surfaceRef = ref(null)
const mediaRef = ref(null)
const editPreviewRef = ref(null)
const frameImgRef = ref(null)

const overlayRef = ref(null)

// --- Internal state ---
const renderedPreviewExpanded = ref(false)

// 媒体尺寸
const mediaOriginalSize = ref({ width: 0, height: 0 })
const surfaceSize = ref({ width: 0, height: 0 })
const frameLoaded = ref(false)

// 参考宽度和高度
const REFERENCE_WIDTH = 1920
const REFERENCE_HEIGHT = 1080

// --- Options ---
const modeOptions = [
  { label: '编辑预览', value: 'edit' },
  { label: '成片预览', value: 'rendered' }
]

// --- State ---
// --- Computed ---
const showRenderedPreview = computed(
  () => props.previewMode === 'rendered' && !!props.previewVideoPath
)

const handlePreviewModeChange = (newMode) => {
  emit('update-preview-mode', newMode)
}

/**
 * 编辑预览
 */
const showEditPreview = computed(() => {
  return props.previewMode === 'edit' && (!!props.previewFrameSrc || !!props.sourceVideoSrc)
})

/**
 * 预览提示
 */
const previewHint = computed(() => {
  if (showRenderedPreview.value) {
    return props.renderedDirty
      ? '当前成片不是最新配置，重新剪辑后生效'
      : props.videoName || '已生成视频'
  }
  return props.previewFrameLoading
    ? '加载首帧中...'
    : '基于视频首帧展示样式，实际效果以剪辑结果为准'
})

/**
 * 计算叠加层的定位（基于表面和媒体尺寸）
 */
const overlayLayerStyle = computed(() => {
  return {
    left: viewport.value.left + 'px',
    top: viewport.value.top + 'px',
    width: viewport.value.width + 'px',
    height: viewport.value.height + 'px'
  }
})

/**
 * 字幕样式
 */
const subtitleOverlayStyle = computed(() => {
  const config = props.subtitle.customConfig || {}
  console.log('subtitleOverlayStyle', config)

  const posX = Number(config.positionX) || 540
  const posY = Number(config.positionY) || 1500

  const leftPercent = Math.max(4, Math.min(96, (posX / 1080) * 100))
  const topPercent = Math.max(4, Math.min(96, (posY / 1920) * 100))

  console.log('leftPercent', leftPercent)
  console.log('topPercent', topPercent)

  // 3. 字体样式
  const fontStyles = config.fontStyles || []
  const fontWeight = Array.isArray(fontStyles) && fontStyles.includes('bold') ? 700 : 400
  const fontStyle = Array.isArray(fontStyles) && fontStyles.includes('italic') ? 'italic' : 'normal'

  // 4. 字号（默认 36，乘以缩放因子 minScale，最小 6px）
  const baseFontSize = config.fontSize || 36
  const fontSize = Math.max(6, baseFontSize * viewportScale.value)

  // 5. 字间距（默认 0，乘以缩放因子 minScale）
  const letterSpacing = (Number(config.letterSpacing) || 0) * viewportScale.value

  // 6. 背景（调用辅助函数生成 background CSS）
  const background = buildBackground(config)

  // 7. 描边（WebkitTextStroke）
  let webkitTextStroke = 'none'
  if (config.enableStroke && config.strokeWidth) {
    const strokeWidth = Math.max(0.5, config.strokeWidth * viewportScale.value)
    const strokeColor = config.strokeColor || '#000000'
    webkitTextStroke = `${strokeWidth}px ${strokeColor}`
  }

  // 8. 阴影（textShadow）
  let textShadow = 'none'
  if (config.enableShadow === true) {
    const distance = Math.max(0.5, (config.shadowDistance || 3) * viewportScale.value)
    const blur = Math.max(1, 16 * viewportScale.value)
    const shadowColor = config.shadowColor || 'rgba(0,0,0,0.5)'
    textShadow = `0 ${distance}px ${blur}px ${shadowColor}`
  }

  // 9. 返回完整样式对象
  return {
    left: leftPercent + '%',
    top: topPercent + '%',
    transform: 'translate(-50%, -50%)',
    color: config.color || '#FFFFFF',
    opacity: config.opacity ?? 1,
    fontFamily: config.fontFamily || 'Microsoft YaHei',
    fontSize: fontSize + 'px',
    fontWeight: String(fontWeight),
    fontStyle: fontStyle,
    letterSpacing: letterSpacing + 'px',
    lineHeight: config.lineHeight || 1.16,
    background: background,
    WebkitTextStroke: webkitTextStroke,
    textShadow: textShadow
  }
})

/**
 * 根据模板生成标题行数据
 */
const titleTemplateLines = computed(() => {
  const config = props.title
  return generateTitleRenderData(config, viewport.value)
})

/**
 * 计算视口区域（保持宽高比）
 */
const viewport = computed(() => {
  if (!surfaceRef.value) {
    console.log('surfaceRef.value is null')
    return { left: 0, top: 0, width: 0, height: 0 }
  }

  // 1. 获取容器实际尺寸
  const containerWidth = surfaceSize.value.width
  const containerHeight = surfaceSize.value.height

  // 2. 获取媒体原始分辨率（若未加载则使用默认参考值 1080x1920）
  const mediaWidth = mediaOriginalSize.value.width || 1080
  const mediaHeight = mediaOriginalSize.value.height || 1920

  // 3. 若容器尺寸无效，返回空区域
  if (!containerWidth || !containerHeight) {
    return { left: 0, top: 0, width: 0, height: 0 }
  }

  // 4. 计算宽高比
  const containerRatio = containerWidth / containerHeight
  const mediaRatio = mediaWidth / mediaHeight

  // 5. 根据宽高比决定适配方式（contain 策略）
  if (containerRatio > mediaRatio) {
    // 容器更宽 → 上下填满，左右留白
    const height = containerHeight
    const width = height * mediaRatio
    const left = (containerWidth - width) / 2
    return { left, top: 0, width, height }
  } else {
    // 容器更高 → 左右填满，上下留白
    const width = containerWidth
    const height = width / mediaRatio
    const top = (containerHeight - height) / 2
    return { left: 0, top, width, height }
  }
})

/**
 * 计算视口缩放因子
 */
const viewportScale = computed(() => {
  const view = viewport.value // 视频画面在容器中的适配区域
  const media = mediaOriginalSize.value // 媒体原始分辨率

  // 取 viewport 宽度与媒体宽度的比值，或 viewport 高度与媒体高度的比值
  // 通常取两者中的较小值，以保证标题在所有方向上都不被裁切
  const scaleX = view.width / (media.width || 1080)
  const scaleY = view.height / (media.height || 1920)
  return Math.min(scaleX, scaleY) // 或使用统一缩放
})

const POSITION_MAP = {
  topLeft: { left: '8%', top: '8%', transform: 'none' },
  topCenter: { left: '50%', top: '8%', transform: 'translateX(-50%)' },
  topRight: { right: '8%', top: '8%', transform: 'none' },
  center: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
  bottomLeft: { left: '8%', bottom: '8%', transform: 'none' },
  bottomCenter: { left: '50%', bottom: '8%', transform: 'translateX(-50%)' },
  bottomRight: { right: '8%', bottom: '8%', transform: 'none' }
}

/**
 * 标题样式 custom
 */
const titleOverlayStyle = computed(() => {
  const config = props.title
  const style = config.style || {}

  if (config.mode === 'template') {
    return {
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%',
      transform: 'none',
      background: 'transparent',
      color: 'inherit',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      textShadow: 'none',
      WebkitTextStroke: 'none'
    }
  }

  // 2. 获取基础定位（根据 position 字段）
  const position = style.position || 'topCenter'
  const basePosition = POSITION_MAP[position] || POSITION_MAP['topCenter']

  const offsetY = Number(style.offsetY)
  const mediaHeight = mediaOriginalSize.value.height || 1920

  // 根据是否有效数值，决定使用百分比还是原始值
  const topValue = Number.isFinite(offsetY)
    ? Math.max(2, Math.min(86, (offsetY / mediaHeight) * 100)) + '%'
    : basePosition.top

  const scale = viewportScale.value

  // 5. 背景内边距
  const paddingX = Math.max(0, Number(style.backgroundPaddingX ?? 24) || 0)
  const paddingY = Math.max(0, Number(style.backgroundPaddingY ?? 12) || 0)

  // 6. 圆角
  const borderRadius = Math.max(0, Number(style.backgroundRadius ?? 18) || 0)

  // 7. 构建样式对象
  const result = {
    ...basePosition,
    top: topValue,
    bottom: topValue ? undefined : basePosition.bottom,
    minWidth: '0',
    padding: `${paddingY * scale}px ${paddingX * scale}px`,
    borderRadius: `${borderRadius * scale}px`,
    color: style.color || '#FFFFFF',
    opacity: style.opacity ?? 1,
    fontFamily: style.fontFamily || 'Microsoft YaHei',
    fontSize: `${Math.max(12, (style.fontSize || 56) * scale)}px`,
    fontWeight: style.fontStyles?.includes('bold') || style.bold ? 700 : style.fontWeight || 400,
    fontStyle: style.fontStyles?.includes('italic') || style.italic ? 'italic' : 'normal',
    textDecoration:
      style.fontStyles?.includes('underline') || style.underline ? 'underline' : 'none',
    lineHeight: 1,
    letterSpacing: `${(Number(style.letterSpacing) || 0) * scale}px`,
    background: buildBackground(style),
    textShadow: buildTextShadow(style, scale),
    WebkitTextStroke: buildTextStroke(style, scale)
  }

  return result
})

/**
 * 构建背景样式
 */
const buildBackground = (config) => {
  if (config.backgroundType !== 'solid') {
    return 'transparent'
  }
  // 获取背景颜色和透明度
  const color = config.backgroundColor || '#000000'
  const opacity = config.backgroundOpacity ?? 0.7

  // 如果颜色已经是 rgba 或 rgb，直接返回
  if (/^rgba?\(/i.test(color)) {
    return color
  }

  // 处理十六进制颜色
  let hex = color
  if (!hex.startsWith('#')) {
    hex = '#' + hex
  }
  // 验证是否为有效的 6 位十六进制颜色（包括简写？这里只匹配 6 位）
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    // 如果不是有效的 hex，返回原始颜色（可能无效）
    return hex
  }

  // 将十六进制转换为 rgba
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const a = Math.min(1, Math.max(0, opacity))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * 计算名片叠加层的样式
 */
const namecardOverlayStyle = computed(() => {
  // 1. 获取名片样式配置
  const style = props.namecard.style || {}

  // 2. 从 viewport 获取宽高缩放因子
  const { scaleX, scaleY } = getViewportScales(viewport.value)
  const horizontalScale = scaleX || viewportScale.value // 水平缩放
  const verticalScale = scaleY || viewportScale.value // 垂直缩放

  // 3. 计算位置偏移（相对于画布左下角）
  const offsetX = Math.max(0, Number(style.offsetX) || 0) * horizontalScale
  const offsetY = Math.max(0, Number(style.offsetY) || 0) * verticalScale

  // 4. 字体大小（默认 28px，垂直缩放）
  const baseFontSize = Number(style.fontSize) || 28
  const fontSize = Math.max(8, baseFontSize * verticalScale)

  // 5. 内边距（水平用 horizontalScale，垂直用 verticalScale * 修正因子）
  const paddingXBase = Number(style.backgroundPaddingX ?? 18) || 0
  const paddingYBase = Number(style.backgroundPaddingY ?? 12) || 0
  // 修正因子：使垂直内边距与字号成比例，但限制范围（0.6 ~ 2）
  const paddingYFactor = Math.min(Math.max(fontSize / 24, 0.6), 2)
  const paddingX = Math.max(0, paddingXBase * horizontalScale)
  const paddingY = Math.max(0, paddingYBase * paddingYFactor * verticalScale)

  // 6. 行间距（默认 2px，垂直缩放）
  const gap = Math.max(0, Number(style.lineSpacing ?? 2) || 0) * verticalScale

  // 7. 圆角（使用水平与垂直缩放中较小值）
  const borderRadiusBase = Number(style.backgroundRadius ?? 0) || 0
  const borderRadius = Math.max(0, borderRadiusBase * Math.min(horizontalScale, verticalScale))

  // 8. 文字颜色（默认白色）
  const textColor = style.textColor || '#FFFFFF'
  // 文字透明度（默认 1）
  const textOpacity = style.opacity ?? 1
  const textColorWithOpacity = hexToRgba(textColor, textOpacity)

  // 9. 背景颜色（默认黑色，透明度 0.52）
  const bgColor = style.backgroundColor || '#000000'
  const bgOpacity = style.backgroundOpacity ?? 0.52
  const background = hexToRgba(bgColor, bgOpacity)

  // 10. 姓名加粗（CSS 自定义属性）
  const nameBoldWeight = style.nameBold === true ? 400 : 700

  // 11. 返回完整样式对象
  return {
    left: offsetX + 'px', // 从左偏移（相对于画布左下角）
    bottom: offsetY + 'px', // 从下偏移
    transform: 'none', // 无变换
    color: textColorWithOpacity, // 文字颜色（含透明度）
    background: background, // 背景颜色
    padding: `${paddingY}px ${paddingX}px`, // 内边距（上下，左右）
    borderRadius: borderRadius + 'px',
    fontFamily: style.fontFamily || 'Microsoft YaHei',
    fontSize: fontSize + 'px',
    letterSpacing: Math.max(0, Number(style.letterSpacing) || 0) * horizontalScale + 'px',
    gap: gap + 'px', // 行间距（flex gap）
    '--namecard-name-weight': nameBoldWeight // CSS 自定义属性控制姓名加粗
  }
})

/**
 * 从 viewport 中获取水平和垂直缩放因子
 * @param viewport - 视频画面在容器中的适配区域（包含 left, top, width, height）
 * @param mediaWidth - 媒体原始宽度（默认 1920）
 * @param mediaHeight - 媒体原始高度（默认 1080）
 * @returns { scaleX, scaleY } 水平和垂直缩放因子
 */
function getViewportScales(viewport) {
  const mediaWidth = mediaOriginalSize.value.width || 1920
  const mediaHeight = mediaOriginalSize.value.height || 1080

  const scaleX = viewport.width / mediaWidth
  const scaleY = viewport.height / mediaHeight
  return { scaleX, scaleY }
}

/**
 * 将十六进制颜色字符串转换为 rgba 格式
 * @param hex - 十六进制颜色（如 '#FFFFFF' 或 'FFFFFF'）
 * @param alpha - 透明度（0~1），默认 1
 * @returns rgba 字符串，如 'rgba(255,255,255,0.8)'
 */
function hexToRgba(hex, alpha = 1) {
  // 1. 如果传入无效值，返回 transparent（透明）
  if (!hex) return 'transparent'

  // 2. 去除可能的 # 前缀
  let cleanHex = hex.replace('#', '')

  // 3. 处理缩写形式（如 #FFF -> #FFFFFF）
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('')
  }

  // 4. 确保长度为 6（若不足则补 0）
  if (cleanHex.length < 6) {
    cleanHex = cleanHex.padEnd(6, '0')
  }

  // 5. 解析 RGB 分量
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // 6. 限制 alpha 在 0~1 之间
  const a = Math.max(0, Math.min(1, alpha))

  // 7. 返回 rgba 字符串
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// 模板标题相关
const templateTitlePreview = computed(() => props.title.mode === 'template')

/**
 * 模板标题遮罩样式
 */
const titleTemplateMaskStyle = computed(() => {
  const config = props.title
  const canvasSize = { height: viewport.value.height }
  return getTitleTemplateMaskStyle(config, canvasSize)
})

/**
 * 生成标题模板的遮罩样式
 * @param config - 标题配置（包含 presetId, style, text）
 * @param canvasSize - 实际画布尺寸（含 height）
 * @returns 遮罩样式对象，若无遮罩则返回 null
 */
const getTitleTemplateMaskStyle = (config, canvasSize) => {
  // 1. 获取预设行配置并应用垂直偏移
  const presetLines = getPresetLines(config.presetId)
  const adjustedLines = applyOffset(presetLines, config.style?.offsetY || 0)

  // 2. 如果预设没有 mask 且用户未开启背景，则无需遮罩
  if (!adjustedLines.mask && !config.style?.enableBackground) {
    return null
  }

  const text = config.text || {}
  const style = config.style || {}

  // 3. 计算垂直缩放因子（参考高度 1080）
  const refHeight = 1080
  const actualHeight = Number(canvasSize.height) || refHeight
  const yScale = actualHeight / refHeight

  // 4. 确定 h1 和 h2 的行配置（仅当对应文本存在时才使用）
  const h1Line = text.h1 || !text.h2 ? adjustedLines.h1 : null
  const h2Line = text.h2 ? adjustedLines.h2 : null

  // 至少需要一行标题才能计算遮罩
  const firstLine = h1Line || h2Line
  const lastLine = h2Line || h1Line
  if (!firstLine || !lastLine) return null

  // 5. 获取遮罩的上下内边距（来自预设，默认 20）
  const paddingTop = (adjustedLines.mask?.paddingTop || 20) * yScale
  const paddingBottom = (adjustedLines.mask?.paddingBottom || 20) * yScale

  // 6. 计算遮罩的顶部 Y 坐标
  //    = 第一行文字顶部 - paddingTop
  const firstLineY = firstLine.y * yScale
  const firstLineHalfHeight = ((firstLine.fontSize || 70) * yScale) / 2
  const maskTop = firstLineY - firstLineHalfHeight - paddingTop

  // 7. 计算遮罩的底部 Y 坐标
  //    = 最后一行文字底部 + paddingBottom
  const lastLineY = lastLine.y * yScale
  const lastLineHalfHeight = ((lastLine.fontSize || 70) * yScale) / 2
  const maskBottom = lastLineY + lastLineHalfHeight + paddingBottom

  // 8. 限制遮罩不超出画布顶部和底部
  const top = Math.max(0, maskTop)
  const height = Math.max(0, maskBottom - maskTop)

  // 9. 返回遮罩样式
  return {
    position: 'absolute',
    left: '0',
    right: '0',
    top: `${top}px`,
    height: `${height}px`,
    background: style.backgroundColor || 'rgba(0,0,0,0.7)',
    pointerEvents: 'none' // 允许鼠标穿透点击标题
  }
}

// 关键词高亮（简化）
const keywordHighlightVisible = computed(() => props.subtitle.highlightKeywords)
const keywordHighlightStyle = computed(() => ({
  color: '#FFD83B',
  fontWeight: 'bold',
  textDecoration: 'underline'
}))

/**
 * 处理帧图片加载
 */
function handleMediaLoaded() {
  updateMediaOriginalSize()
  updateSurfaceSize()
}

/**
 * 更新媒体原始尺寸
 */
const updateMediaOriginalSize = () => {
  if (!mediaRef.value) return
  const mediaElement = mediaRef.value
  if (!mediaElement) return
  // 尝试获取原始宽度（图片 naturalWidth，视频 videoWidth）
  const naturalWidth = mediaElement.naturalWidth || mediaElement.videoWidth || 0
  // 尝试获取原始高度（图片 naturalHeight，视频 videoHeight）
  const naturalHeight = mediaElement.naturalHeight || mediaElement.videoHeight || 0
  // 只有获取到有效尺寸时才更新
  if (naturalWidth > 0 && naturalHeight > 0) {
    mediaOriginalSize.value = {
      width: naturalWidth,
      height: naturalHeight
    }
  }
}

/**
 * 更新 surface 尺寸信息
 */
function updateSurfaceSize() {
  nextTick(() => {
    if (surfaceRef.value) {
      const rect = surfaceRef.value.getBoundingClientRect()
      surfaceSize.value = {
        width: rect.width,
        height: rect.height
      }
    }
  })
}

/**
 * 图片加载完成时更新尺寸
 */
function onFrameLoaded() {
  frameLoaded.value = true
}

/**
 * 将实际画布上的偏移量映射到参考高度 1080 的等效值
 * @param offset 实际画布上的像素偏移（如拖拽产生的 clientY 偏移）
 * @param actualHeight 实际画布的高度（像素）
 * @returns 映射后的参考坐标（基于 1080 高度）
 *  _0x4971d0
 *
 */
function mapOffsetToReference(offset, actualHeight) {
  const height = Number(actualHeight) || 1080 // 默认参考高度
  const clamped = Math.max(0, Math.min(height, Number(offset) || 0))
  return Math.round((clamped / height) * 1080)
}

/**
 * 根据模板生成标题行数据
 * _0x10f8a9
 *
 */
const generateTitleRenderData = (config, viewportSize) => {
  const { style, text, presetId } = config

  // 1. 获取预设行配置
  const presetLines = getPresetLines(presetId)
  // 2. 应用垂直偏移
  const adjustedLines = applyOffset(presetLines, style.offsetY || 0)

  // 3. 计算缩放
  const xScale = viewportSize.width / REFERENCE_WIDTH

  // fontSize, 使用yScale缩放
  // 参考 1080
  const yScale = viewportSize.height / REFERENCE_HEIGHT

  const rows = []

  const hasH1 = text.h1 && text.h1.trim()
  const hasH2 = text.h2 && text.h2.trim()

  if (!(!hasH1 && hasH2)) {
    const buildStyle1 = buildLineStyle({
      line: adjustedLines.h1,
      style,
      color: style.color || '#ffffff',
      mediaWidth: surfaceSize.width,
      xScale,
      yScale
    })

    rows.push({
      key: Math.random(),
      type: 'h1',
      text: hasH1 ? text.h1 : '主标题示例',
      style: buildStyle1
    })
  }

  if (hasH2) {
    const buildStyle2 = buildLineStyle({
      line: adjustedLines.h2,
      style,
      color: style.secondaryColor || style.color || '#FFFFFF',
      mediaWidth: surfaceSize.width,
      xScale,
      yScale
    })

    rows.push({
      key: Math.random(),
      type: 'h2',
      text: text.h2,
      style: buildStyle2
    })
  }

  return rows
}

/**
 * 获取标题预设行配置
 */
const getPresetLines = (presetId) => {
  console.log('getPresetLines', 'presetId', presetId)
  return PRESET_LINES_TEMPLATES[presetId] || {}
}

/**
 * 应用垂直偏移
 */
const applyOffset = (lines, offsetY) => {
  console.log('applyOffset', 'lines', lines, 'offsetY', offsetY)
  const result = {
    ...lines,
    h1: {
      ...lines.h1
    },
    h2: {
      ...lines.h2
    }
  }

  const offset = Number(offsetY)
  if (!Number.isFinite(offset)) {
    return result
  }

  // 计算偏移量：实际偏移 = offsetY - 原 h1 的 y 坐标
  // 这表示用户调整的是“相对于预设 h1 位置”的偏移量
  const delta = offset - lines.h1.y

  // 将 h1 和 h2 的 y 坐标都加上这个差值
  result.h1.y = lines.h1.y + delta
  result.h2.y = lines.h2.y + delta

  // 如果有遮罩配置，也同步偏移
  if (lines.mask) {
    result.mask = {
      ...lines.mask,
      y: lines.mask.y + delta
    }
  }

  return result
}

/**
 * 构建标题行样式 _0xa64be5
 */
const buildLineStyle = ({ line, style, color, mediaWidth, xScale, yScale }) => {
  const MAX_WIDTH_RATIO = 0.92
  const MIN_WIDTH = 40
  const maxWidth = Math.max(MIN_WIDTH, mediaWidth * MAX_WIDTH_RATIO)

  // 计算水平偏移
  const offsetX = (line.x || 0) * xScale
  const left = `calc(50% + ${offsetX}px)`

  // 垂直位置
  const top = line.y * yScale + 'px'

  // 字号
  const baseFontSize = line.fontSize || 36
  const fontScale = yScale
  const fontSize = Math.max(12, baseFontSize * fontScale)

  const fontFamily = style.fontFamily || 'Microsoft YaHei'

  let fontWeight = 400

  if (line.fontWeight) {
    fontWeight = line.fontWeight
  } else if (line.bold) {
    fontWeight = style.fontWeight || 700
  } else {
    fontWeight = style.fontWeight || 400
  }

  //  字体样式（斜体）
  const fontStyle =
    line.italic || (Array.isArray(style.fontStyles) && style.fontStyles.includes('italic'))
      ? 'italic'
      : 'normal'

  //  描边
  const textStroke = buildTextStroke(style, yScale)
  //  阴影
  const textShadow = buildTextShadow(style, yScale)

  return {
    position: 'absolute',
    left,
    top,
    width: maxWidth + 'px',
    maxWidth: maxWidth + 'px',
    transform: 'translate(-50%, -50%)',
    color: color || '#ffffff',
    fontFamily: fontFamily + ', sans-serif',
    fontSize: fontSize + 'px',
    fontWeight: String(fontWeight),
    fontStyle: fontStyle,
    lineHeight: style.lineHeight || '1.2',
    letterSpacing: '0',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    WebkitTextStroke: textStroke,
    textShadow: textShadow
  }
}

/**
 * 构建文本描边样式
 */
const buildTextStroke = (style, yScale) => {
  const enableStroke = Boolean(style.enableStroke) || false
  console.log('buildTextStroke', 'style', style, 'yScale', yScale, 'enableStroke', enableStroke)

  if (!enableStroke) {
    return 'none'
  }

  if (!style.strokeWidth) {
    return 'none'
  }

  const strokeWidth = Math.max(0.5, style.strokeWidth * yScale)
  const strokeColor = style.strokeColor || '#000000'
  return `${strokeWidth}px ${strokeColor}`
}

/**
 * 构建文本阴影样式
 */
const buildTextShadow = (style, yScale) => {
  if (!style.enableShadow) {
    return 'none'
  }

  const distance = Math.max(1, (style.shadowDistance || 3) * yScale)
  const blur = Math.max(2, 16 * yScale)
  const color = style.shadowColor || 'rgba(0,0,0,0.5)'
  // 阴影偏移量 X=0（水平不偏移），Y=distance，模糊半径=blur
  return `0 ${distance}px ${blur}px ${color}`
}

/**
 * 切换
 */
function toggleRenderedPreviewExpanded() {
  renderedPreviewExpanded.value = !renderedPreviewExpanded.value
  nextTick(updateSurfaceSize)
}

/**
 * 标题指针按下
 *
 */
function handleTitlePointerDown(event) {
  // 1. 检查标题模式是否支持拖拽（仅 template 或 custom）
  const titleMode = props.title.mode
  if (!['template', 'custom'].includes(titleMode)) {
    return
  }

  const container = surfaceRef.value
  if (!container) return

  // 3. 阻止默认事件（防止文本选择等）
  event.preventDefault()
  // 捕获指针，确保后续事件不丢失
  event.currentTarget?.setPointerCapture(event.pointerId)

  function onPointerMove(ev) {
    const containerRect = container.getBoundingClientRect()
    const view = viewport.value

    if (!view.height) {
      console.warn('viewport.height 为空，无法计算偏移量')
      return
    }

    // 计算鼠标相对于容器顶部的偏移，再减去 viewport 的 top，得到相对于视频画面顶部的偏移
    const offsetYInViewport = ev.clientY - containerRect.top - view.top

    // 限制偏移范围：最小 24px，最大（viewport高度 - 72px），防止标题被拖到画面外
    const clampedOffsetY = Math.max(24, Math.min(view.height - 72, offsetYInViewport))

    let mappedOffsetY
    if (titleMode === 'template') {
      mappedOffsetY = mapOffsetToReference(clampedOffsetY, view.height)
    } else {
      // custom 模式：使用另一个映射函数（可能考虑了额外偏移）
      mappedOffsetY = Math.round((clampedOffsetY / view.height) * 1920)
    }

    console.log('mappedOffsetY', mappedOffsetY)
    // 发出更新事件，父组件会更新 title.style.offsetY
    emit('update-title-offset', mappedOffsetY)
  }

  // 注册全局 pointermove 事件
  window.addEventListener('pointermove', onPointerMove)
  // 6. 注册 pointerup 事件（一次有效），用于清理
  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }
  window.addEventListener('pointerup', onPointerUp, { once: true })

  // 7. 立即触发一次移动，使拖拽开始时不跳变
  // onPointerMove(event)
}

/**
 * 名片指针按下
 */
function handleNamecardPointerDown(event) { }

// 暴露给父组件的方法（用于更新尺寸）
defineExpose({
  updateSurfaceSize
})

// --- Watch ---
watch(
  () => props.previewFrameSrc,
  () => {
    if (props.previewFrameSrc) {
      nextTick(updateSurfaceSize)
    }
  }
)

watch(
  () => props.sourceVideoSrc,
  () => {
    if (props.sourceVideoSrc) {
      nextTick(updateSurfaceSize)
    }
  }
)

// 监听预览模式变化，更新尺寸
watch(
  () => props.previewMode,
  () => {
    nextTick(updateSurfaceSize)
  }
)

// --- Lifecycle ---
let resizeObserver = null
onMounted(() => {
  updateSurfaceSize()
  if (surfaceRef.value) {
    resizeObserver = new ResizeObserver(updateSurfaceSize)
    resizeObserver.observe(surfaceRef.value)
  }
  window.addEventListener('resize', updateSurfaceSize)
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  window.removeEventListener('resize', updateSurfaceSize)
})
</script>

<style lang="scss" scoped>
.preview-stage {
  min-height: 0;
  height: 100%;
  padding: 18px;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  border: 1px solid var(--theme-overlay-light);
  background: color-mix(in srgb, var(--theme-overlay-light) 84%, transparent);
  overflow: hidden
}

.preview-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px
}

.preview-head>div:first-child {
  min-width: 0;
  flex: 1 1 180px
}

.preview-head h3 {
  margin: 0;
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title);
  font-weight: 900
}

.preview-head p {
  margin: 4px 0 0;
  max-width: 100%;
  color: var(--theme-text-muted);
  font-size: var(--app-font-size-caption);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap
}

.preview-actions {
  min-width: 0;
  max-width: 100%;
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px
}

.preview-actions .ant-btn,
.preview-actions .ant-segmented,
.preview-actions .ant-tag {
  flex: 0 0 auto
}

.stage-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  margin-top: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 18px;
  background: color-mix(in srgb, var(--theme-background) 70%, transparent);
  border: 1px solid var(--theme-overlay-light)
}

.media-surface {
  position: relative;
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000
}

.media-surface img,
.media-surface video {
  width: 100%;
  height: 100%;
  display: block;
  background: #000;
  -o-object-fit: contain;
  object-fit: contain
}

.rendered-surface.expanded {
  position: fixed;
  inset: 54px 40px 34px;
  z-index: 9999;
  width: auto;
  height: auto;
  padding: 38px 44px;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--theme-overlay-light) 72%, transparent);
  background: color-mix(in srgb, var(--theme-background) 58%, transparent);
  box-shadow: 0 24px 80px rgba(0, 0, 0, .42);
  backdrop-filter: blur(22px) saturate(1.22);
  -webkit-backdrop-filter: blur(22px) saturate(1.22)
}

.rendered-surface.expanded:before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 18% 12%, hsla(0, 0%, 100%, .12), transparent 34%), linear-gradient(135deg, hsla(0, 0%, 100%, .08), hsla(0, 0%, 100%, .02));
  pointer-events: none
}

.rendered-surface.expanded video {
  position: relative;
  z-index: 1;
  width: auto;
  height: auto;
  max-width: calc(100vw - 128px);
  max-height: calc(100vh - 150px);
  border-radius: 18px;
  box-shadow: 0 18px 52px rgba(0, 0, 0, .48)
}

.window-fullscreen-action {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 8;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: hsla(0, 0%, 100%, .92);
  background: rgba(0, 0, 0, .42);
  border: 1px solid hsla(0, 0%, 100%, .22);
  border-radius: 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity .16s ease, background .16s ease, border-color .16s ease
}

.rendered-surface.expanded .window-fullscreen-action,
.rendered-surface:hover .window-fullscreen-action,
.window-fullscreen-action:focus-visible {
  opacity: 1
}

.rendered-surface.expanded .window-fullscreen-action {
  right: 28px;
  top: 28px;
  z-index: 2;
  background: rgba(12, 14, 24, .62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px)
}

.window-fullscreen-action:hover {
  background: rgba(0, 0, 0, .62);
  border-color: hsla(0, 0%, 100%, .42)
}

.window-fullscreen-action svg {
  font-size: var(--app-font-size-card-title)
}

.overlay-layer {
  position: absolute;
  z-index: 4;
  pointer-events: none
}

.frame-loading {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-items: center;
  color: hsla(0, 0%, 100%, .82);
  background: rgba(0, 0, 0, .32);
  font-size: var(--app-font-size-caption)
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  color: var(--theme-text-muted);
  text-align: center
}

.empty-state svg {
  font-size: 44px
}

.empty-state strong {
  color: var(--theme-text-primary);
  font-size: var(--app-font-size-card-title)
}

.namecard-overlay,
.subtitle-overlay,
.title-overlay {
  position: absolute;
  z-index: 4;
  pointer-events: none
}

.subtitle-overlay {
  max-width: 88%;
  padding: .18em .42em;
  border-radius: .26em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  transform: translate(-50%, -50%)
}

.subtitle-highlight {
  color: gold
}

.title-overlay {
  min-width: 5em;
  padding: .16em .36em;
  display: grid;
  gap: 2px;
  border-radius: 999px;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, .45)
}

.title-overlay.template {
  min-width: 0;
  padding: 0;
  display: block;
  border-radius: 0
}

.namecard-overlay.draggable,
.title-overlay.draggable,
.title-overlay.template {
  pointer-events: auto;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none
}

.title-overlay.draggable,
.title-overlay.template {
  cursor: ns-resize
}

.namecard-overlay.draggable {
  cursor: move
}

.title-template-line {
  z-index: 1;
  display: block
}

.title-custom-line {
  display: block;
  font: inherit;
  color: inherit;
  opacity: 1;
  white-space: nowrap
}
</style>
