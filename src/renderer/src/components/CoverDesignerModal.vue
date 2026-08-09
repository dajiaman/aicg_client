<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import CoverTemplateThumbnail from '../components/CoverTemplateThumbnail.vue'
import TextStyleEditor from '../components/TextStyleEditor.vue'
import { TEMPLATES } from '../constants/cover_templates'
import { wrapText } from '../utils/wrapText'
import { pathJoin } from '../utils/index'
import { message } from 'ant-design-vue'
import { hexToRgb, normalizeUrl } from '../utils/index'
import { CheckOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue'

defineOptions({
  name: 'CoverDesignerModal'
})

const props = defineProps({
  // 视频路径
  videoPath: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  titleMain: {
    type: String,
    default: ''
  },
  titleSub: {
    type: String,
    default: ''
  },
  initialConfig: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['dirty-change', 'confirm', 'update:open', 'cancel'])

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920
const DEFAULT_TEMPLATE_ID = 'default'

function generateId() {
  return 'layer_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

/**
 * 获取遮罩渐变停止点
 */
function getGradientStops(direction, color1, alpha1, color2, alpha2) {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  return [0, `rgba(${rgb1}, ${alpha1})`, 1, `rgba(${rgb2}, ${alpha2})`]
}

const onDirtyChange = (dirty) => {
  emit('dirty-change', dirty)
}

/**
 * 文本样式变更时触发
 * @param {Object} newStyle - 新的文本样式
 */
const onStyleChange = (newStyle) => {
  console.log('newStyle', newStyle)
  markDirty()
  forceRefresh()
}

const visible = ref(open)

// 当前激活的右侧 Tab（模板 / 封面来源 / 文本图层 / 遮罩）
const activeTab = ref('template')
// 封面来源模式
const sourceMode = ref('auto')
const titleText = ref(props.title || props.titleMain || '输入标题')

const currentTemplateId = ref('')
const defaultTemplateId = ref(DEFAULT_TEMPLATE_ID)
const defaultTemplateSaving = ref(false)
const frameLoading = ref(false)
const saving = ref(false)
const isDirty = ref(false)

const mediaSize = ref({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT
})

// 画布尺寸
const canvasW = ref(CANVAS_WIDTH)
const canvasH = ref(CANVAS_HEIGHT)

// 背景
const bgImage = ref(null)
const backgroundSrc = ref('')

// 遮罩配置
const currentMask = reactive({
  enabled: true,
  type: 'rect',
  x: 0,
  y: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  color: '#000000',
  opacity: 0.5,
  radius: 0,
  stroke: { enabled: false, color: '#FFFFFF', width: 0 },
  fillLinearGradientStartPoint: null,
  fillLinearGradientEndPoint: null,
  fillLinearGradientColorStops: null
})

/**
 * 遮罩渐变配置
 */
const maskGradient = reactive({
  color1: '#000000',
  alpha1: 0,
  color2: '#000000',
  alpha2: 1
})

// 文本图层
const textLayers = ref([])
const selectedId = ref(null)

// 当前选中的图层（文本或形状）
const activeLayer = computed(() => {
  if (!selectedId.value) return null
  if (selectedId.value === 'mask') return null
  return textLayers.value.find((l) => l.id === selectedId.value) || null
})

/**
 * 当前选中文本图层的边界信息（逻辑像素）
 * 用于样式编辑器显示文字区域大小、背景框预览等
 */
const activeLayerTextBounds = computed(() => {
  // 1. 如果没有选中的文本图层，返回空尺寸
  if (!selectedId.value) {
    return { width: 0, height: 0 }
  }

  // 2. 查找当前选中的图层
  const layer = textLayers.value.find((l) => l.id === selectedId.value)
  if (!layer || !layer.text) {
    return { width: 0, height: 0 }
  }

  // 3. 获取图层样式
  const style = layer.style || {}
  const fontSize = style.fontSize || 60
  const fontFamily = style.fontFamily || '微软雅黑'
  const fontStyles = style.fontStyles || []
  const isBold = fontStyles.includes('bold') || style.bold
  const isItalic = fontStyles.includes('italic') || style.italic
  const fontWeight = isBold ? 'bold' : 'normal'
  const fontStyle = isItalic ? 'italic' : 'normal'
  const letterSpacing = style.letterSpacing || 0
  const lineHeight = style.lineHeight || 1.3

  // 4. 计算最大宽度（优先使用背景宽度，否则取画布宽度的 90%）
  const maxWidth =
    style.background?.enabled && style.background.width
      ? style.background.width
      : canvasW.value * 0.9

  // 5. 使用 wrapText 获取换行结果（复用已实现的函数）
  const { lines, maxLineWidth, totalHeight } = wrapText(
    layer.text,
    fontSize,
    fontFamily,
    fontStyle,
    fontWeight,
    maxWidth,
    letterSpacing,
    lineHeight
  )

  // 6. 返回边界尺寸
  return {
    width: Math.ceil(maxLineWidth),
    height: Math.ceil(totalHeight),
    lines: lines.length,
    maxLineWidth: Math.ceil(maxLineWidth),
    totalHeight: Math.ceil(totalHeight)
  }
})

const bgMaxSize = computed(() => ({
  width: canvasW.value,
  height: canvasH.value
}))

// 形状图层
const shapes = ref([])

/**
 * 所有封面模板
 */
const coverTemplates = computed(() => TEMPLATES)

// Konva 引用
const stageRef = ref(null)
const stageWrapperRef = ref(null)
const maskRef = ref(null)
const transformerRef = ref(null)
const bgLayerRef = ref(null)
const videoRef = ref(null)

// 视频相关
const videoDuration = ref(0)
// 视频当前时间
const videoTime = ref(0)
// 用户拖动 slider 时置 true，阻塞 timeupdate 对 videoTime 的覆盖；seeked 后重置
const videoSeeking = ref(false)

// 开发模式
const isDevelopment = ref(import.meta.env?.MODE === 'development')

// 舞台显示缩放（根据 stageWrapperRef 实际大小自适应 fit）
const displayScale = ref(0.35)

/**
 * 根据 stageWrapperRef 的可用尺寸，计算保持画布比例的适配缩放
 * 取 (可用宽 / canvasW, 可用高 / canvasH) 的最小值，并在四周留 16px padding
 */
function updateStageFit() {
  const wrapper = stageWrapperRef.value
  if (!wrapper) return
  const padding = 16
  const availW = wrapper.clientWidth - padding * 2
  const availH = wrapper.clientHeight - padding * 2
  if (availW <= 0 || availH <= 0) return
  const scale = Math.min(availW / canvasW.value, availH / canvasH.value)
  displayScale.value = scale > 0 ? scale : 0.35
}

// 舞台配置（显示尺寸 = 逻辑尺寸 × 适配缩放，内部逻辑坐标仍是 canvasW × canvasH）
const stageConfig = computed(() => ({
  width: canvasW.value * displayScale.value,
  height: canvasH.value * displayScale.value,
  scaleX: displayScale.value,
  scaleY: displayScale.value
}))

// 背景占位配置
const bgPlaceholderConfig = computed(() => ({
  x: 0,
  y: 0,
  width: canvasW.value,
  height: canvasH.value,
  fillLinearGradientStartPoint: { x: 0, y: 0 },
  fillLinearGradientEndPoint: { x: 0, y: canvasH.value },
  fillLinearGradientColorStops: [0, '#383838', 1, '#141414'],
  listening: true
}))

// 背景图片配置
const bgImageConfig = computed(() => ({
  image: bgImage.value,
  x: 0,
  y: 0,
  width: canvasW.value,
  height: canvasH.value,
  listening: true
}))

/**
 * 遮罩矩形配置
 */
const maskRectConfig = computed(() => {
  if (!currentMask.enabled) return {}
  const mask = currentMask

  const hasStroke = mask.stroke && mask.stroke.enabled && mask.stroke.width > 0
  const config = {
    x: mask.x,
    y: mask.y,
    width: mask.width,
    height: mask.height,
    rotation: mask.rotation || 0,
    opacity: mask.opacity,
    cornerRadius: mask.radius,
    draggable: true,
    name: 'mask-rect'
  }

  if (mask.fillLinearGradientColorStops) {
    config.fillLinearGradientStartPoint = mask.fillLinearGradientStartPoint || { x: 0, y: 0 }
    config.fillLinearGradientEndPoint = mask.fillLinearGradientEndPoint || {
      x: 0,
      y: mask.height
    }
    config.fillLinearGradientColorStops = mask.fillLinearGradientColorStops
  } else {
    config.fill = mask.color
  }

  if (hasStroke) {
    config.stroke = mask.stroke.color
    config.strokeWidth = mask.stroke.width
    config.strokeEnabled = true
  }
  return config
})

// 变换器配置
const transformerConfig = computed(() => ({
  rotateEnabled: true,
  keepRatio: selectedId.value !== 'mask',
  enabledAnchors:
    selectedId.value === 'mask'
      ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
      : [
          'top-left',
          'top-center',
          'top-right',
          'middle-left',
          'middle-right',
          'bottom-left',
          'bottom-center',
          'bottom-right'
        ],
  anchorSize: 8,
  borderStroke: '#1890ff',
  anchorStroke: '#1890ff',
  anchorFill: '#ffffff',
  boundBoxFunc: (oldBox, newBox) => {
    if (newBox.width < 20 || newBox.height < 20) return oldBox
    return newBox
  }
}))

/**
 * 应用模板
 * @param templateId - 模板 ID
 */
const applyTemplate = (templateId) => {
  const tpl = TEMPLATES.find((t) => t.id === templateId)
  if (!tpl) return
  currentTemplateId.value = templateId

  // 计算缩放比例（适配当前画布）
  const scaleX = canvasW.value / 1080
  const scaleY = canvasH.value / 1920
  const scale = Math.min(scaleX, scaleY)

  // 1. 应用遮罩
  if (tpl.mask) {
    Object.assign(currentMask, {
      enabled: tpl.mask.enabled !== false,
      type: tpl.mask.type || 'rect',
      x: Math.round((tpl.mask.x || 0) * scaleX),
      y: Math.round((tpl.mask.y || 0) * scaleY),
      width: Math.round((tpl.mask.width || 1080) * scaleX),
      height: Math.round((tpl.mask.height || 1920) * scaleY),
      color: tpl.mask.color || '#000000',
      opacity: tpl.mask.opacity ?? 0.5,
      radius: Math.round((tpl.mask.radius || 0) * scale),
      stroke: {
        enabled: !!tpl.mask.stroke?.enabled,
        color: tpl.mask.stroke?.color || '#FFFFFF',
        width: (tpl.mask.stroke?.width || 0) * scale
      },
      fillLinearGradientStartPoint: tpl.mask.fillLinearGradientStartPoint
        ? {
            x: tpl.mask.fillLinearGradientStartPoint.x * scaleX,
            y: tpl.mask.fillLinearGradientStartPoint.y * scaleY
          }
        : null,
      fillLinearGradientEndPoint: tpl.mask.fillLinearGradientEndPoint
        ? {
            x: tpl.mask.fillLinearGradientEndPoint.x * scaleX,
            y: tpl.mask.fillLinearGradientEndPoint.y * scaleY
          }
        : null,
      fillLinearGradientColorStops: tpl.mask.fillLinearGradientColorStops
        ? [...tpl.mask.fillLinearGradientColorStops]
        : null
    })
  } else {
    currentMask.enabled = false
  }

  // 2. 应用形状图层
  shapes.value = (tpl.shapes || []).map((s) => ({
    ...s,
    x: Math.round((s.x || 0) * scaleX),
    y: Math.round((s.y || 0) * scaleY),
    width: Math.round((s.width || 0) * scaleX),
    height: Math.round((s.height || 0) * scaleY),
    radius: Math.round((s.radius || 0) * scale)
  }))

  // 3. 应用文本图层（替换占位符并缩放样式）
  textLayers.value = (tpl.textLayers || []).map((layer) => {
    const style = JSON.parse(JSON.stringify(layer.style || {}))
    // 缩放坐标、字号、间距、描边等
    style.x = Math.round((style.x || 0) * scaleX)
    style.y = Math.round((style.y || 0) * scaleY)
    style.fontSize = Math.max(10, Math.ceil((style.fontSize || 60) * scale))
    style.letterSpacing = (style.letterSpacing || 0) * scale
    if (style.stroke) style.stroke.width = (style.stroke.width || 0) * scale
    if (style.shadow) {
      style.shadow.blur = (style.shadow.blur || 0) * scale
      style.shadow.distance = (style.shadow.distance || 0) * scale
    }

    if (style.background) {
      style.background.radius = (style.background.radius || 0) * scale
      if (style.background.width)
        style.background.width = Math.round(style.background.width * scaleX)
      if (style.background.height)
        style.background.height = Math.round(style.background.height * scaleY)
    }

    // 替换占位符
    let text = layer.text || ''
    text = text.replace(/\{titleMain\}/g, props.titleMain || props.title || '主标题')
    text = text.replace(/\{titleSub\}/g, props.titleSub || '副标题')
    text = text.replace(/\{title\}/g, props.title || '输入标题')

    return {
      id: layer.id || 'layer_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      text,
      style
    }
  })

  selectedId.value = null
  markDirty()
  nextTick(() => {
    stageRef.value?.getNode()?.getLayer()?.draw()
  })
}

// 切换默认模板：已默认则取消（回到系统内置默认），否则设为默认
const toggleDefaultTemplate = async (id) => {
  const next = defaultTemplateId.value === id ? DEFAULT_TEMPLATE_ID : id
  defaultTemplateId.value = next
  defaultTemplateSaving.value = true
  try {
    await window.api.config.set('cover.defaultTemplateId', next, 'cover', '封面设计默认模板')
  } finally {
    defaultTemplateSaving.value = false
  }
}

/**
 * 加载默认模板ID
 */
const loadDefaultTemplate = async () => {
  try {
    const result = await window.api.config.get('cover.defaultTemplateId')
    console.log('result:', result)
    if (result?.success) {
      const id = result.data || DEFAULT_TEMPLATE_ID
      defaultTemplateId.value = id

      // 如果当前没有模板，应用默认
      if (!currentTemplateId.value) {
        applyTemplate(id)
      }
    }
  } catch (e) {
    console.warn('加载默认模板失败:', e)
  }
}

/**
 * 添加文本图层
 */
const addTextLayer = () => {
  const newLayer = {
    id: generateId(),
    text: '新增文本',
    style: {
      fontFamily: '微软雅黑',
      fontSize: 60,
      color: '#000',
      align: 'center',
      x: canvasW.value / 2,
      y: canvasH.value / 2 + 60 * textLayers.value.length,
      rotation: 0,
      stroke: { enabled: false, color: '#000000', width: 0 },
      shadow: { enabled: false, color: '#000000', blur: 0, distance: 0, opacity: 0.5 },
      background: {
        enabled: false,
        color: '#000000',
        opacity: 0.7,
        radius: 0,
        width: null,
        height: null
      }
    }
  }

  textLayers.value.push(newLayer)
  selectItem(newLayer.id)
  markDirty()
}

// 文本节点引用
const textRefs = reactive({})

/**
 * 确认生成封面
 */
const handleConfirm = async () => {
  if (saving.value) return
  try {
    saving.value = true
    const stage = stageRef.value?.getNode()
    if (!stage) {
      console.error('舞台未就绪')
      throw new Error('舞台未就绪')
    }

    const stageWidth = stage.width() / stage.scaleX()
    const stageHeight = stage.height() / stage.scaleY()

    // 实际需要导出的尺寸是 canvasW × canvasH
    const scaleX = canvasW.value / stageWidth
    const scaleY = canvasH.value / stageHeight
    const pixelRatio = Math.min(scaleX, scaleY)

    const dataUrl = stage.toDataURL({
      mimeType: 'image/jpeg',
      quality: 0.92,
      pixelRatio: pixelRatio
    })

    if (!dataUrl) {
      throw new Error('导出图片为空')
    }

    const result = await window.api.cover.saveTempImage({
      dataUrl: dataUrl,
      ext: 'jpg'
    })

    if (!result?.success) {
      throw new Error(result?.error || '保存封面失败')
    }

    emit('confirm', {
      coverUrl: result.data.fileUrl,
      coverPath: result.data.filePath,
      designerConfig: {
        templateId: currentTemplateId.value,
        mask: JSON.parse(JSON.stringify(currentMask)),
        shapes: JSON.parse(JSON.stringify(shapes.value)),
        textLayers: JSON.parse(JSON.stringify(textLayers.value)),
        backgroundSrc: backgroundSrc.value,
        canvasW: canvasW.value,
        canvasH: canvasH.value
      }
    })
    // 清除脏状态
    isDirty.value = false
    onDirtyChange(false)
    message.success('封面生成成功')
    visible.value = false
  } catch (err) {
    console.error('导出封面失败:', err)
    message.error('生成封面失败：' + err.message)
  } finally {
    saving.value = false
  }
}

// 切换遮罩启用状态
const toggleMask = (enabled) => {
  currentMask.enabled = !!enabled

  if (enabled && !currentMask.width) {
    currentMask.x = 0
    currentMask.y = 0
    currentMask.width = canvasW.value
    currentMask.height = canvasH.value
  }

  markDirty()
  forceRefresh()
}

/**
 * 切换遮罩渐变启用状态
 */
function toggleMaskGradient(enabled) {
  if (enabled) {
    currentMask.fillLinearGradientStartPoint = { x: 0, y: 0 }
    currentMask.fillLinearGradientEndPoint = { x: 0, y: currentMask.height || CANVAS_HEIGHT }
    const stops = getGradientStops(
      'tb',
      maskGradient.color1,
      maskGradient.alpha1,
      maskGradient.color2,
      maskGradient.alpha2
    )
    currentMask.fillLinearGradientColorStops = stops
  } else {
    currentMask.fillLinearGradientStartPoint = null
    currentMask.fillLinearGradientEndPoint = null
    currentMask.fillLinearGradientColorStops = null
  }
  markDirty()
}

/**
 * 设置遮罩渐变方向
 */
const setGradientDirection = (dir) => {
  const stops = currentMask.fillLinearGradientColorStops
  if (!stops || stops.length < 4) return
  const w = currentMask.width || CANVAS_WIDTH
  const h = currentMask.height || 600
  if (dir === 'tb') {
    currentMask.fillLinearGradientStartPoint = { x: 0, y: 0 }
    currentMask.fillLinearGradientEndPoint = { x: 0, y: h }
  } else if (dir === 'bt') {
    currentMask.fillLinearGradientStartPoint = { x: 0, y: h }
    currentMask.fillLinearGradientEndPoint = { x: 0, y: 0 }
  } else if (dir === 'lr') {
    currentMask.fillLinearGradientStartPoint = { x: 0, y: 0 }
    currentMask.fillLinearGradientEndPoint = { x: w, y: 0 }
  } else if (dir === 'rl') {
    currentMask.fillLinearGradientStartPoint = { x: w, y: 0 }
    currentMask.fillLinearGradientEndPoint = { x: 0, y: 0 }
  }

  markDirty()
}

/**
 * 反转遮罩渐变颜色
 */
const reverseGradientColors = () => {
  const tmpColor = maskGradient.color1
  const tmpAlpha = maskGradient.alpha1
  maskGradient.color1 = maskGradient.color2
  maskGradient.alpha1 = maskGradient.alpha2
  maskGradient.color2 = tmpColor
  maskGradient.alpha2 = tmpAlpha

  if (currentMask.fillLinearGradientColorStops) {
    const stops = getGradientStops(
      'tb',
      maskGradient.color1,
      maskGradient.alpha1,
      maskGradient.color2,
      maskGradient.alpha2
    )
    currentMask.fillLinearGradientColorStops = stops
  }

  markDirty()
}

/**
 * 当前选中的封面模板
 */
const currentTemplate = computed(
  () => TEMPLATES.find((t) => t.id === currentTemplateId.value) || TEMPLATES[0]
)

/**
 * 上传图片作为封面
 */
async function onUploadImage(file) {
  frameLoading.value = true
  try {
    const reader = new FileReader()
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const result = await window.api.cover.saveTempImage(dataUrl)
    if (result.success) {
      backgroundSrc.value = result.data.fileUrl
      await loadBackgroundImage(backgroundSrc.value)
      markDirty()
      console.log('已使用上传图片作为封面')
    } else {
      console.error('上传失败：' + result.error)
    }
  } catch (e) {
    console.error('上传异常：' + e.message)
  } finally {
    frameLoading.value = false
  }
  return false // 阻止默认上传行为
}

/**
 * 标记脏状态
 */
const markDirty = () => {
  isDirty.value = true
  onDirtyChange(true)
}

/**
 * 获取视频抽帧输出路径
 */
const getFrameOutputPath = async () => {
  const res = await window.api.file.getTempPath()
  return pathJoin(res.data.tempDir, 'video_frames', `${Date.now()}_frame.jpg`)
}

/**
 * 从视频抽帧
 */
const refreshAutoFrame = async () => {
  const videoPath = props.videoPath
  if (!videoPath) {
    console.error('视频路径不能为空')
    return
  }

  frameLoading.value = true
  try {
    const result = await window.api.cover.extractFrame({
      videoPath: videoPath
    })
    if (result.success) {
      await loadBackgroundImage(result.data.framePath)
      markDirty()
    }
  } catch (error) {
    console.error('视频抽帧失败:', error)
  } finally {
    frameLoading.value = false
  }
}

// 时间轴选帧相关
const onVideoLoadedMeta = () => {
  if (videoRef.value) {
    videoDuration.value = videoRef.value.duration || 0
  }
}

/**
 * 视频播放时间改变
 */
const onVideoSeeked = () => {
  // seeked 完成后复位 videoSeeking，恢复 timeupdate 同步
  videoSeeking.value = false
  if (videoRef.value) {
    videoTime.value = videoRef.value.currentTime || 0
  }
}

/**
 * 视频 timeupdate：把 videoTime 同步给 slider 显示
 */
const onVideoTimeUpdate = () => {
  if (videoRef.value && !videoSeeking.value) {
    videoTime.value = videoRef.value.currentTime || 0
  }
}

/**
 * 时间轴选帧
 * @param time - 时间轴选帧时间（秒）
 */
const onTimelineChange = (time) => {
  videoTime.value = time
  if (videoRef.value) {
    videoSeeking.value = true
    videoRef.value.currentTime = time
  }
}

/**
 * 按指定秒数抽帧作封面：调用主进程 ffmpeg 抽帧 + loadBackground
 */
const captureFromTime = async (time) => {
  if (!videoPath) {
    console.error('视频路径不能为空')
    return
  }
  frameLoading.value = true
  try {
    const outputPath = await getFrameOutputPath()
    // 按指定时间抽帧作封面
    const result = await window.api.cover.extractFrame(videoPath, outputPath, time)
    console.log('extractFrame result:', result)
    if (result?.success) {
      await loadBackgroundImage(result.data.framePath)
      markDirty()
    } else if (result?.error) {
      console.error('抽帧失败:', result.error)
    }
  } catch (e) {
    console.error('抽帧异常:', e)
  } finally {
    frameLoading.value = false
  }
}

/**
 * 保存当前视频帧为临时图片
 */
const captureCurrentFrame = async () => {
  if (!videoRef.value) return
  frameLoading.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.value.videoWidth
    canvas.height = videoRef.value.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const result = await window.api.cover.saveTempImage({ dataUrl, ext: 'jpg' })
    if (result?.success) {
      await loadBackgroundImage(result.data.fileUrl)
      markDirty()
    }
  } catch (e) {
    console.error('保存帧失败:', e)
  } finally {
    frameLoading.value = false
  }
}

/**
 * 选中图层
 * @param id
 */
const selectItem = (id) => {
  selectedId.value = id
  if (id === 'mask') {
    activeTab.value = 'mask'
  } else if (id) {
    activeTab.value = 'text'
  }

  nextTick(() => {
    const stage = stageRef.value.getNode()
    const transformer = transformerRef.value?.getNode()

    if (!stage || !transformer) {
      console.warn('Stage 或 Transformer 未就绪')
      return
    }

    let targetNode = null

    // 1. 从注册的组件获取
    const comp = textRefs?.[id]
    if (comp && typeof comp.getNode === 'function') {
      targetNode = comp.getNode()
    }

    // 2. 通过名称在 Stage 中查找
    if (!targetNode) {
      targetNode = stage.findOne('.text-' + id)
      if (!targetNode) {
        // 尝试查找所有文本节点并匹配 id（备用）
        const allTexts = stage.find('Text')
        targetNode = allTexts.find((t) => t.name() === 'text-' + id)
      }
    }

    // 3. 如果是遮罩
    if (id === 'mask' && maskRef.value) {
      targetNode = maskRef.value.getNode()
    }

    console.log('targetNode', targetNode)

    if (targetNode) {
      transformer.nodes([targetNode])
      transformer.getLayer().draw()
      console.log('✅ Transformer 已绑定节点:', targetNode)
    } else {
      transformer.nodes([])
      transformer.getLayer().draw()
      console.warn('⚠️ 未找到节点，id:', id)
    }
  })
}

/**
 * 强制重绘 Konva 画布
 * 在修改图层样式、文本、位置等属性后调用，确保界面同步
 */
const forceRefresh = () => {
  // 等待 Vue 完成 DOM 更新（确保 ref 已挂载）
  nextTick(() => {
    const stage = stageRef.value?.getNode()
    if (stage) {
      // 获取主图层（默认所有节点都在一个图层上）
      const layer = stage.getLayer()
      if (layer) {
        // 重绘图层
        layer.draw()
      }

      // 如果有 Transformer（选中框），也一并重绘
      const transformer = transformerRef.value?.getNode()
      if (transformer) {
        transformer.getLayer()?.draw()
      }
    }
  })
}

/**
 * 编辑文本图层
 * @param layerId - 文本图层 ID
 */
const editTextLayer = (layerId) => {
  // 1. 查找图层
  const layer = textLayers.value.find((l) => l.id === layerId)
  if (!layer) {
    console.warn('未找到图层:', layerId)
    return
  }

  // 2. 获取 Konva 节点
  const stage = stageRef.value?.getNode()
  if (!stage) {
    console.warn('Stage 未就绪')
    return
  }

  const comp = textRefs?.[layerId]
  let textNode = comp?.getNode?.()

  // 备用：通过名称在 Stage 中查找
  if (!textNode) {
    textNode = stage.findOne('.text-' + layerId)
  }
  if (!textNode) {
    console.warn('未找到文本节点:', layerId)
    return
  }

  // 3. 计算节点在屏幕上的绝对位置
  const box = textNode.getClientRect({ relativeTo: stage.getLayer() })
  const stageBox = stage.container().getBoundingClientRect()

  // ---------- 关键修正：获取实际屏幕字号 ----------
  const stageScale = stage.scaleX() || 1 // 当前画布缩放
  const logicFontSize = textNode.fontSize() // 逻辑字号（与 layer.style.fontSize 一致）
  const screenFontSize = Math.ceil(logicFontSize * stageScale) // 屏幕字号

  // 4. 读取样式
  const style = layer.style || {}
  const fontFamily = style.fontFamily || '微软雅黑'
  const isBold = style.fontStyles?.includes('bold') || style.bold
  const isItalic = style.fontStyles?.includes('italic') || style.italic
  const fontWeight = isBold ? 'bold' : 'normal'
  const fontStyle = isItalic ? 'italic' : 'normal'
  const color = '#000000'
  const align = style.align || 'center'
  const letterSpacing = style.letterSpacing || 0
  const lineHeight = style.lineHeight || 1.3
  const rotation = style.rotation || 0

  // 5. 创建输入框（使用 textarea 支持多行）
  const input = document.createElement('textarea')
  input.value = layer.text || ''
  input.spellcheck = false

  // 6. 定位与尺寸
  const left = stageBox.left + box.x
  const top = stageBox.top + box.y
  const width = Math.max(box.width, 80)
  const height = Math.max(box.height, 30)

  // 7. 应用样式（与文本节点保持一致）
  const font = `${fontStyle} ${fontWeight} ${screenFontSize}px "${fontFamily}"`
  Object.assign(input.style, {
    position: 'fixed',
    left: left + 'px',
    top: top + 'px',
    width: width + 'px',
    minHeight: height + 'px',
    font: font,
    fontSize: screenFontSize + 'px', // 明确单独设置，防止被覆盖
    color: color,
    background: 'rgba(255,255,255,0.95)',
    border: '2px solid #1890ff',
    borderRadius: '4px',
    padding: '4px 8px',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    boxSizing: 'border-box',
    lineHeight: lineHeight,
    letterSpacing: letterSpacing + 'px',
    textAlign: align,
    transform: rotation ? `rotate(${rotation}deg)` : 'none',
    transformOrigin: 'center center',
    transition: 'none'
  })

  // 8. 添加到 DOM
  document.body.appendChild(input)
  input.focus()
  input.select()

  // 9. 自动调整高度
  const autoResize = () => {
    input.style.height = 'auto'
    input.style.height = input.scrollHeight + 'px'
  }
  input.addEventListener('input', autoResize)
  autoResize()

  // 10. 确认/取消状态
  let isConfirmed = false

  // 11. 完成编辑（保存或放弃）
  const finishEdit = (save) => {
    if (isConfirmed) return
    isConfirmed = true

    // 移除事件监听
    input.removeEventListener('input', autoResize)
    window.removeEventListener('scroll', handleScrollOrResize)
    window.removeEventListener('resize', handleScrollOrResize)

    // 从 DOM 移除输入框
    if (input.parentNode) {
      document.body.removeChild(input)
    }

    // 如果保存且内容有变化
    if (save) {
      const newText = input.value.trim() || layer.text || '输入标题'
      if (newText !== layer.text) {
        layer.text = newText
        // 更新 Konva 节点文本
        if (textNode) {
          textNode.text(newText)
          textNode.getLayer()?.draw()
        }
        // 标记脏状态
        markDirty()
        // 强制刷新
        forceRefresh()
      }
    }
  }

  // 12. 键盘事件：Enter 确认，Escape 取消
  const handleKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      finishEdit(true)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      finishEdit(false)
    }
  }
  input.addEventListener('keydown', handleKeydown)

  // 13. 失焦处理（点击外部自动确认）
  const handleBlur = () => {
    // 延迟检查，避免点击确认按钮时触发
    setTimeout(() => {
      if (!isConfirmed) {
        finishEdit(true)
      }
    }, 150)
  }
  input.addEventListener('blur', handleBlur)

  // 14. 窗口滚动/尺寸变化时取消（防止错位）
  const handleScrollOrResize = () => {
    if (!isConfirmed) {
      finishEdit(false)
    }
  }
  window.addEventListener('scroll', handleScrollOrResize, { once: true })
  window.addEventListener('resize', handleScrollOrResize, { once: true })

  // 15. 提供清理函数（以备组件卸载时调用）
  const cleanup = () => {
    if (!isConfirmed) finishEdit(false)
  }
  // 存储到全局或组件内部，在 onUnmounted 时调用
  if (!window._editCleanups) window._editCleanups = []
  window._editCleanups.push(cleanup)
}

/**
 * 删除选中的图层
 */
const removeSelectedLayer = () => {
  if (selectedId.value && selectedId.value !== 'mask') {
    removeLayer(selectedId.value)
  }
}

/**
 * 图层拖拽结束（更新位置）
 * @param e
 * @param layer
 */
const onLayerDragEnd = (e, layer) => {
  const node = e.target
  layer.style.x = Math.round(node.x())
  layer.style.y = Math.round(node.y())
  markDirty()
}

/**
 * 图层变换结束
 * @param e
 * @param layer
 */
const onLayerTransformEnd = (e, layer) => {
  const node = e.target
  const scaleX = node.scaleX()
  const newFontSize = Math.max(14, Math.round((layer.style.fontSize || 60) * scaleX))
  layer.style.fontSize = newFontSize
  layer.style.x = Math.round(node.x())
  layer.style.y = Math.round(node.y())
  layer.style.rotation = node.rotation() || 0
  node.scaleX(1)
  node.scaleY(1)
  markDirty()
}

/**
 * 遮罩拖拽
 * @param e
 */
const onMaskDragEnd = (e) => {
  const node = e.target
  currentMask.x = Math.round(node.x())
  currentMask.y = Math.round(node.y())
  markDirty()
}

/**
 * 遮罩变换结束
 * @param e
 */
const onMaskTransformEnd = (e) => {
  const node = e.target
  currentMask.width = Math.round(node.width() * node.scaleX())
  currentMask.height = Math.round(node.height() * node.scaleY())
  currentMask.x = Math.round(node.x())
  currentMask.y = Math.round(node.y())
  currentMask.rotation = node.rotation() || 0
  node.scaleX(1)
  node.scaleY(1)
  markDirty()
}

/**
 * 获取文本图层的 Konva 配置
 * @param layer - 文本图层实例
 * @returns Konva 配置对象
 */
function getLayerTextConfig(layer) {
  const style = layer.style || {}
  const text = layer.text || ''

  // 构建字体字符串
  const isBold = style.fontStyles?.includes('bold') || style.bold
  const isItalic = style.fontStyles?.includes('italic') || style.italic
  const fontWeight = isBold ? 'bold' : 'normal'
  const fontStyle = isItalic ? 'italic' : 'normal'
  const fontFamily = style.fontFamily || '微软雅黑'
  const fontSize = style.fontSize || 60

  // 测量并换行（离屏 Canvas）
  const maxWidth =
    style.background?.enabled && style.background.width
      ? style.background.width
      : canvasW.value * 0.9

  const { lines, maxLineWidth, totalHeight } = wrapText(
    text,
    fontSize,
    fontFamily,
    fontStyle,
    fontWeight,
    maxWidth,
    style.letterSpacing || 0
  )

  // Konva 配置
  const config = {
    text: lines.join('\n'),
    x: style.x || canvasW.value / 2,
    y: style.y || canvasH.value / 2,
    fontFamily,
    fontSize,
    fontStyle: (isItalic ? 'italic' : '') + (isBold ? ' bold' : ''),
    fill: style.color || '#FFFFFF',
    opacity: style.opacity ?? 1,
    letterSpacing: style.letterSpacing || 0,
    lineHeight: style.lineHeight || 1.3,
    align: style.align || 'center',
    width: 'auto', // 使用auto
    draggable: true,
    name: 'text-' + layer.id,
    // 描边
    stroke: style.stroke?.enabled ? style.stroke.color || '#000000' : '',
    strokeWidth: style.stroke?.enabled ? style.stroke.width : 0,
    strokeEnabled: !!style.stroke?.enabled,
    fillAfterStrokeEnabled: true,
    lineJoin: 'round',
    miterLimit: 2,
    // 阴影
    shadowColor: style.shadow?.enabled ? style.shadow.color || '#000000' : '',
    shadowBlur: style.shadow?.enabled ? style.shadow.blur || 0 : 0,
    shadowOffsetX: style.shadow?.enabled ? style.shadow.distance || 0 : 0,
    shadowOffsetY: style.shadow?.enabled ? style.shadow.distance || 0 : 0,
    shadowOpacity: style.shadow?.enabled ? (style.shadow.opacity ?? 0.5) : 0,
    shadowEnabled: !!style.shadow?.enabled,
    // 渐变填充（文本渐变）
    fillLinearGradientStartPoint: style.fillLinearGradientStartPoint || null,
    fillLinearGradientEndPoint: style.fillLinearGradientEndPoint || null,
    fillLinearGradientColorStops: style.fillLinearGradientColorStops || null
  }

  // 对齐偏移
  if (style.align === 'center') {
    config.offsetX = maxLineWidth / 2
  } else if (style.align === 'right') {
    config.offsetX = maxLineWidth
  } else {
    config.offsetX = 0
  }

  config.offsetY = totalHeight / 2

  // 旋转
  if (style.rotation) {
    config.rotation = (style.rotation * Math.PI) / 180
  }

  return config
}

/**
 * 删除图层
 * @param layerId - 图层 ID
 */
const removeLayer = (layerId) => {
  textLayers.value = textLayers.value.filter((l) => l.id !== layerId)
  if (selectedId.value === layerId) {
    selectedId.value = null
    nextTick(() => {
      transformerRef.value?.getNode()?.nodes([])
    })
  }

  markDirty()
}

/**
 * 处理舞台点击事件
 * @param {Event} e - 点击事件对象
 */
const handleStageMouseDown = (e) => {
  const target = e.target
  const layer = target.getLayer && target.getLayer()
  // 如果点击的是舞台背景，取消选中
  if (target === layer || target === stageRef.value?.getNode()) {
    selectedId.value = null
    transformerRef.value?.getNode()?.nodes([])
    transformerRef.value?.getNode()?.getLayer()?.draw()
  }
}

/**
 * 深度对比两个对象，返回变更明细数组
 * @param {Object} oldObj - 旧配置
 * @param {Object} newObj - 新配置
 * @param {string} path - 当前路径（递归用）
 * @returns {Array<{ path: string, oldValue: any, newValue: any }>}
 */
const getDiff = (oldObj, newObj, path = '') => {
  const changes = []
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])

  allKeys.forEach((key) => {
    const currentPath = path ? `${path}.${key}` : key
    const oldVal = oldObj?.[key]
    const newVal = newObj?.[key]

    // 如果两者都是对象（非数组、非null），递归深度对比
    if (
      oldVal !== null &&
      newVal !== null &&
      typeof oldVal === 'object' &&
      typeof newVal === 'object' &&
      !Array.isArray(oldVal) &&
      !Array.isArray(newVal)
    ) {
      // 递归获取子差异
      const subChanges = getDiff(oldVal, newVal, currentPath)
      changes.push(...subChanges)
      return
    }

    // 处理数组对比（简化：先比较长度，再逐个元素对比）
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (oldVal.length !== newVal.length) {
        changes.push({
          path: currentPath,
          oldValue: `数组长度 ${oldVal.length}`,
          newValue: `数组长度 ${newVal.length}`
        })
      } else {
        // 逐个对比数组元素（仅对比基本类型或浅层对象）
        for (let i = 0; i < oldVal.length; i++) {
          const oldItem = oldVal[i]
          const newItem = newVal[i]
          if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
            changes.push({
              path: `${currentPath}[${i}]`,
              oldValue: JSON.stringify(oldItem).slice(0, 60),
              newValue: JSON.stringify(newItem).slice(0, 60)
            })
          }
        }
      }
      return
    }

    // 基本类型对比
    if (oldVal !== newVal) {
      changes.push({
        path: currentPath,
        oldValue: formatValue(oldVal),
        newValue: formatValue(newVal)
      })
    }
  })

  return changes
}

/**
 * 格式化值（用于显示）
 */
const formatValue = (val) => {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'string') return `"${val}"`
  if (typeof val === 'function') return '[Function]'
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val).slice(0, 80) + (JSON.stringify(val).length > 80 ? '...' : '')
    } catch {
      return '[Object]'
    }
  }
  return String(val)
}

/**
 * 打印当前封面设计器的全部参数（调试用）
 * 包含：模板ID、画布尺寸、遮罩、形状、文本图层、背景等
 * @param {string} label - 可选的日志标签，默认为 '封面模板参数'
 */
const printTemplateParams = (label = '封面模板参数') => {
  // 1. 获取当前完整的配置快照
  const currentSnapshot = getSnapshot()

  // 2. 开始分组打印（折叠式，方便查看）
  console.groupCollapsed(`📐 ${label} (${new Date().toLocaleTimeString()})`)

  // 3. 打印基本信息
  console.log('📋 模板信息:', {
    templateId: currentTemplateId.value,
    defaultTemplateId: defaultTemplateId.value,
    canvasSize: `${canvasW.value} x ${canvasH.value}`,
    backgroundSrc: backgroundSrc.value || '(无背景)',
    layerCount: textLayers.value.length
  })

  // 4. 打印遮罩配置
  console.log('🎭 遮罩配置 (currentMask):', {
    enabled: currentMask.enabled,
    x: currentMask.x,
    y: currentMask.y,
    width: currentMask.width,
    height: currentMask.height,
    color: currentMask.color,
    opacity: currentMask.opacity,
    radius: currentMask.radius,
    stroke: currentMask.stroke,
    gradient: currentMask.fillLinearGradientColorStops ? '已启用渐变' : '纯色'
  })

  // 5. 打印形状图层
  if (shapes.value.length > 0) {
    console.log('🔷 形状图层 (shapes):', shapes.value)
  }

  // 6. 打印文本图层（详细）
  console.log(`📝 文本图层 (${textLayers.value.length} 个):`)
  textLayers.value.forEach((layer, index) => {
    console.groupCollapsed(`  #${index + 1} [${layer.id}]: "${layer.text}"`)
    console.log('位置:', `x: ${layer.style.x}, y: ${layer.style.y}`)
    console.log('字体:', `${layer.style.fontFamily}, ${layer.style.fontSize}px`)
    console.log('颜色:', layer.style.color)
    console.log('完整样式:', layer.style)
    console.groupEnd()
  })

  // 7. 打印完整的 JSON 数据（方便复制粘贴）
  console.log('📦 完整 JSON 配置 (可复制):')
  console.log(JSON.stringify(currentSnapshot, null, 2))

  // 8. 如果有上一次的快照，对比差异
  if (lastSnapshot) {
    const diff = getDiff(lastSnapshot, currentSnapshot)
    if (diff.length > 0) {
      console.log('🔄 变更明细 (较上次):')
      console.table(diff)
    } else {
      console.log('✅ 无参数变化 (与上次一致)')
    }
  }

  // 9. 结束分组
  console.groupEnd()

  // 10. 更新快照缓存
  lastSnapshot = currentSnapshot
}

/**
 * 生成形状图层的 Konva 配置对象
 * @param {Object} shape - 形状数据
 * @param {string} shape.id - 唯一标识
 * @param {string} shape.type - 形状类型，目前仅 'rect'
 * @param {number} shape.x - 左上角 x 坐标（逻辑像素）
 * @param {number} shape.y - 左上角 y 坐标
 * @param {number} shape.width - 宽度
 * @param {number} shape.height - 高度
 * @param {number} [shape.rotation] - 旋转角度（度）
 * @param {number} [shape.opacity] - 透明度 (0~1)
 * @param {number} [shape.radius] - 圆角半径
 * @param {string} [shape.fill] - 填充颜色
 * @param {object} [shape.fillLinearGradientStartPoint] - 渐变起点
 * @param {object} [shape.fillLinearGradientEndPoint] - 渐变终点
 * @param {array} [shape.fillLinearGradientColorStops] - 渐变颜色停止点
 * @param {object} [shape.stroke] - 描边配置 { enabled, color, width }
 * @param {boolean} [shape.listening] - 是否响应事件（默认 true）
 * @returns {Object} Konva 形状配置
 */
const getShapeConfig = (shape) => {
  if (!shape || typeof shape !== 'object') return {}

  // 基础属性
  const config = {
    x: shape.x || 0,
    y: shape.y || 0,
    width: shape.width || 0,
    height: shape.height || 0,
    rotation: shape.rotation || 0,
    opacity: shape.opacity ?? 1,
    listening: shape.listening !== undefined ? shape.listening : true,
    name: 'shape-' + (shape.id || 'default')
  }

  // 根据类型处理
  switch (shape.type) {
    case 'rect':
    default:
      // 圆角
      if (shape.radius) {
        config.cornerRadius = shape.radius
      }

      // 填充：渐变优先于纯色
      if (shape.fillLinearGradientColorStops && shape.fillLinearGradientColorStops.length >= 4) {
        config.fillLinearGradientStartPoint = shape.fillLinearGradientStartPoint || { x: 0, y: 0 }
        config.fillLinearGradientEndPoint = shape.fillLinearGradientEndPoint || {
          x: 0,
          y: shape.height || 0
        }
        config.fillLinearGradientColorStops = shape.fillLinearGradientColorStops
      } else {
        config.fill = shape.fill || '#FFFFFF'
      }

      // 描边
      if (shape.stroke && shape.stroke.enabled && shape.stroke.width > 0) {
        config.stroke = shape.stroke.color || '#000000'
        config.strokeWidth = shape.stroke.width
        config.strokeEnabled = true
      }
      break
  }

  return config
}

/**
 * 加载背景图片
 * @param {string} src - 图片 URL
 */
async function loadBackgroundImage(src) {
  if (!src) {
    bgImage.value = null
    backgroundSrc.value = ''
    return
  }
  try {
    const url = normalizeUrl(src)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    return new Promise((resolve, reject) => {
      img.onload = () => {
        bgImage.value = img
        backgroundSrc.value = src
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        mediaSize.value = {
          width: w,
          height: h
        }
        if (w > 0 && h > 0) {
          const ratio = Math.min(CANVAS_WIDTH / w, CANVAS_HEIGHT / h, 1)
          canvasW.value = Math.round(w * ratio)
          canvasH.value = Math.round(h * ratio)
          if (currentMask.enabled && currentMask.width === 0) {
            currentMask.width = canvasW.value
            currentMask.height = canvasH.value
          }
        }
        markDirty()
        resolve(img)
      }
      img.onerror = () => {
        console.error('加载背景图片失败:', src)
        bgImage.value = null
        reject(new Error('加载背景图片失败'))
      }
      img.src = url
    })
  } catch (err) {
    console.error('加载背景图片异常:', err)
    bgImage.value = null
  }
}

/**
 * 文字背景
 * @param {*} layer
 * @returns
 */
function getLayerBgConfig(layer) {
  const style = layer.style || {}
  const bg = style.background
  if (!bg || !bg.enabled) return null
  const text = layer.text || ''
  const fontSize = style.fontSize || 72
  const lines = text.split('\n')
  const maxWidth = Math.max(...lines.map((l) => l.length * fontSize * 0.6))
  const totalHeight = lines.length * fontSize * (style.lineHeight || 1.3)
  const paddingX = bg.paddingX || 16
  const paddingY = bg.paddingY || 8

  const x = (style.x || canvasW.value / 2) - maxWidth / 2 - paddingX
  const y = (style.y || canvasH.value / 2) - totalHeight / 2 - paddingY
  const width = maxWidth + paddingX * 2
  const height = totalHeight + paddingY * 2

  return {
    x: x,
    y: y,
    width: width,
    height: height,
    fill: bg.color || '#000000',
    opacity: bg.opacity !== undefined ? bg.opacity : 0.7,
    cornerRadius: bg.radius || 0,
    listening: false
  }
}

/**
 * 取消设计
 */
function handleCancel() {
  visible.value = false
  onCancel()
}

watch(
  () => [props.titleMain, props.titleSub, props.title],
  (newVals, oldVals) => {
    if (!textLayers.value || textLayers.value.length === 0) return
    if (newVals[0] === oldVals[0] && newVals[1] === oldVals[1] && newVals[2] === oldVals[2]) {
      return // 没变化
    }

    const tmplMain = props.titleMain.value || '主标题'
    const tmplSub = props.titleSub.value || '副标题'
    const tmplTitle = props.title.value || '标题'

    // 直接 mutate layer.text（保持引用稳定），同时调 Konva 节点同步
    textLayers.value.forEach((layer) => {
      if (layer.id == 'main') {
        layer.text = tmplMain
      } else if (layer.id == 'sub') {
        layer.text = tmplSub
      } else if (layer.id == 'title') {
        layer.text = tmplTitle
      }

      const comp = textRefs?.[layer.id]
      let textNode = comp?.getNode?.()
      if (textNode) {
        textNode.text(layer.text)
      }
    })

    // 标记脏状态
    markDirty()
    // 强制刷新
    forceRefresh()
  }
)

// ---------- 初始化 ----------
async function initialize() {
  // 加载默认模板
  await loadDefaultTemplate()

  if (props.initialConfig) {
    const config = props.initialConfig
    if (config.templateId) applyTemplate(config.templateId)
    if (config.mask) {
      Object.assign(currentMask, config.mask)
      if (config.mask.fillLinearGradientColorStops) {
        const g = extractGradientFromMask(config.mask)
        maskGradient.color1 = g.color1
        maskGradient.alpha1 = g.alpha1
        maskGradient.color2 = g.color2
        maskGradient.alpha2 = g.alpha2
      }
    }
    if (config.shapes) shapes.value = JSON.parse(JSON.stringify(config.shapes))
    if (config.textLayers) {
      textLayers.value = JSON.parse(JSON.stringify(config.textLayers))
      textLayers.value.forEach((layer) => {
        layer.text = layer.text
          .replace(/\{titleMain\}/g, props.titleMain || '主标题')
          .replace(/\{titleSub\}/g, props.titleSub || '副标题')
          .replace(/\{title\}/g, props.title || '标题')
      })
    }
    if (config.backgroundSrc) await loadBackgroundImage(config.backgroundSrc)
    if (config.canvasWidth && config.canvasHeight) {
      canvasW.value = config.canvasWidth
      canvasH.value = config.canvasHeight
    }
    isDirty.value = false
    onDirtyChange(false)
  } else {
    // if (coverTemplates.value.length > 0) {
    //   applyTemplate(coverTemplates.value[0].id)
    // }

    if (props.videoPath) await refreshAutoFrame()
  }

  watch(visible, (newVal) => {
    if (newVal) initialize()
  })
}

// 监听 stageWrapperRef 尺寸变化的 ResizeObserver 实例
let stageResizeObserver = null

onMounted(async () => {
  await initialize()

  // 根据 stageWrapperRef 的实际大小自适应画布
  updateStageFit()
  if (stageWrapperRef.value) {
    stageResizeObserver = new ResizeObserver(() => updateStageFit())
    stageResizeObserver.observe(stageWrapperRef.value)
  }
})

// 组件卸载时断开 observer，避免内存泄漏
onBeforeUnmount(() => {
  if (stageResizeObserver) {
    stageResizeObserver.disconnect()
    stageResizeObserver = null
  }
})

// 画布逻辑尺寸变化时（如切换比例），重新计算适配缩放
watch([canvasW, canvasH], () => {
  nextTick(updateStageFit)
})

watch(
  () => props.videoPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath && newPath !== '') {
      refreshAutoFrame()
    }
  },
  { immediate: true }
)

watch(
  () => [props.titleMain, props.titleSub, props.title],
  (newVals, oldVals) => {
    if (!textLayers.value || textLayers.value.length === 0) return
    if (newVals[0] === oldVals[0] && newVals[1] === oldVals[1] && newVals[2] === oldVals[2]) {
      return // 没变化
    }

    const tmplMain = props.titleMain || '主标题'
    const tmplSub = props.titleSub || '副标题'
    const tmplTitle = props.title || '标题'

    // 直接 mutate layer.text（保持引用稳定），同时调 Konva 节点同步
    textLayers.value.forEach((layer) => {
      if (layer.id == 'main') {
        layer.text = tmplMain
      } else if (layer.id == 'sub') {
        layer.text = tmplSub
      } else if (layer.id == 'title') {
        layer.text = tmplTitle
      }

      const comp = textRefs?.[layer.id]
      let textNode = comp?.getNode?.()
      if (textNode) {
        textNode.text(layer.text)
      }
    })

    // 标记脏状态
    markDirty()
    // 强制刷新
    forceRefresh()
  }
)

/**
 * 把秒数格式化为 mm:ss(.xx)
 */
const formatTime = (sec) => {
  const s = Math.max(0, Number(sec) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  const wholeSec = Math.floor(r)
  const ms = Math.round((r - wholeSec) * 100)
  return `${String(m).padStart(2, '0')}:${String(wholeSec).padStart(2, '0')}${
    ms > 0 ? '.' + String(ms).padStart(2, '0') : ''
  }`
}

// 右侧 Tab 列表
const tabs = [
  { key: 'template', label: '模板' },
  { key: 'source', label: '封面来源' },
  { key: 'text', label: '文本图层' },
  { key: 'mask', label: '遮罩' }
]

//暴露方法给父组件（通过 ref）
defineExpose({
  generateCover: handleConfirm,
  isDirty: () => visible.value,
  refreshAutoFrame
})
</script>

<template>
  <!-- 主体内容：左侧大预览 + 右侧模板/来源/文本/遮罩 面板 -->
  <div class="cover-designer-panel title-cover-designer">
    <div class="cd-container">
      <div class="cd-preview">
        <div class="cd-preview-header">
          <div class="cd-preview-title-wrap">
            <span class="cd-preview-title">封面预览</span>
          </div>
          <span class="cd-preview-size">{{ mediaSize.width }} × {{ mediaSize.height }}</span>
        </div>

        <div class="cd-stage-wrapper" ref="stageWrapperRef">
          <v-stage
            ref="stageRef"
            :config="stageConfig"
            @mousedown="handleStageMouseDown"
            @touchstart="handleStageMouseDown"
          >
            <v-layer ref="maskRef">
              <v-image v-if="backgroundSrc" :config="bgImageConfig" />
              <v-rect v-else :config="bgPlaceholderConfig" />

              <!-- 遮罩图层 -->
              <v-rect
                v-if="currentMask.enabled"
                ref="maskRectRef"
                :config="maskRectConfig"
                @click="selectItem('mask')"
                @tap="selectItem('mask')"
                @dragend="onMaskDragEnd"
                @transformend="onMaskTransformEnd"
              />

              <!-- 形状图层 -->
              <template v-for="shape in shapes" :key="shape.id">
                <v-rect :config="getShapeConfig(shape)" />
              </template>

              <!-- 文本图层 -->
              <template v-for="layer in textLayers" :key="layer.id">
                <v-text
                  :ref="
                    (el) => {
                      if (el) textRefs[layer.id] = el
                    }
                  "
                  :config="getLayerTextConfig(layer)"
                  @click="selectItem(layer.id)"
                  @tap="selectItem(layer.id)"
                  @dblclick="editTextLayer(layer.id)"
                  @dbltap="editTextLayer(layer.id)"
                  @dragend="(e) => onLayerDragEnd(e, layer)"
                  @transformend="(e) => onLayerTransformEnd(e, layer)"
                />

                <!-- 文字背景 -->
                <v-rect
                  v-if="layer.style.background && layer.style.background.enabled"
                  :config="getLayerBgConfig(layer)"
                />
              </template>

              <!-- 变换器（选中框） -->
              <v-transformer ref="transformerRef" :config="transformerConfig" />
            </v-layer>
          </v-stage>
        </div>

        <div class="cd-preview-footer">
          <span class="cd-preview-tip">点击文字可选中删除，双击文字可直接修改</span>
          <a-space>
            <a-button
              size="sm"
              danger
              :disabled="!selectedId || selectedId === 'mask'"
              @click="removeSelectedLayer"
            >
              <DeleteOutlined />
              删除选中图层
            </a-button>
            <a-button @click="addTextLayer" size="sm">
              <PlusOutlined />
              添加文本
            </a-button>
          </a-space>
        </div>
      </div>

      <div class="cd-panel">
        <a-tabs v-model:activeKey="activeTab" class="cd-tabs">
          <a-tab-pane key="template" tab="模板">
            <div class="flex-1 overflow-y-auto pr-1 side-scroll cd-scroll">
              <div class="grid gap-3 grid-cols-[repeat(auto-fill,minmax(130px,1fr))]">
                <div
                  v-for="tpl in coverTemplates"
                  :key="tpl.id"
                  class="group flex flex-col items-center gap-1.5 rounded-[10px] border p-2 cursor-pointer transition bg-white/5 border-white/10 hover:bg-white/10 hover:-translate-y-0.5"
                  :class="[
                    currentTemplateId === tpl.id
                      ? 'border-fuchsia-500/70 bg-fuchsia-500/10 shadow-[0_0_0_2px_rgba(168,85,247,0.25)]'
                      : ''
                  ]"
                  @click="applyTemplate(tpl.id)"
                >
                  <div
                    class="relative w-full aspect-[1080/1920] rounded-md overflow-hidden bg-black"
                  >
                    <CoverTemplateThumbnail
                      :template="tpl"
                      :title-main="props.titleMain"
                      :title-sub="props.titleSub"
                      :title="props.title"
                      :background-src="backgroundSrc"
                      class="absolute inset-0 w-full h-full object-cover"
                    />

                    <!-- 设为默认：星星图标，已默认则常显高亮，否则 hover 才显示 -->
                    <button
                      class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-[14px] leading-none transition"
                      :class="[
                        defaultTemplateId === tpl.id
                          ? 'text-amber-400 bg-black/50 hover:bg-black/70 opacity-100'
                          : 'text-gray-300/70 bg-black/40 hover:text-amber-300 hover:bg-black/60 opacity-0 group-hover:opacity-100'
                      ]"
                      :title="defaultTemplateId === tpl.id ? '取消默认' : '设为默认'"
                      @click.stop="toggleDefaultTemplate(tpl.id)"
                    >
                      <span>{{ defaultTemplateId === tpl.id ? '★' : '☆' }}</span>
                    </button>

                    <span
                      v-if="currentTemplateId === tpl.id"
                      class="absolute top-1 left-1 bg-fuchsia-500/95 text-white text-[10px] px-1.5 py-0.5 rounded font-medium"
                      >已选</span
                    >

                    <!-- 默认角标：已默认且非当前选中时，hover 才显示 -->
                    <span
                      v-else-if="defaultTemplateId === tpl.id"
                      class="absolute bottom-1 left-1 bg-amber-400/95 text-black text-[10px] px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >默认</span
                    >
                  </div>
                  <div class="text-xs text-gray-300 text-center truncate w-full">
                    {{ tpl.name }}
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="source" tab="封面来源">
            <!-- Tab：封面来源 -->
            <div class="flex-1 overflow-y-auto pr-1 side-scroll cd-scroll">
              <div class="grid grid-cols-3 gap-2 mb-3">
                <button
                  class="flex flex-col items-center gap-1 rounded-xl p-2.5 border transition bg-white/5 border-white/10 hover:bg-white/10"
                  :class="
                    sourceMode === 'auto'
                      ? 'bg-fuchsia-500/25 border-fuchsia-400/80 text-white'
                      : 'text-gray-300'
                  "
                  @click="sourceMode = 'auto'"
                >
                  <span class="text-lg">🎬</span>
                  <span class="block"
                    ><b class="block text-[13px] font-medium whitespace-nowrap">自动抽帧</b
                    ><small
                      class="block text-[10px] text-gray-400 mt-0.5 whitespace-nowrap truncate"
                      >视频前5秒随机取帧</small
                    ></span
                  >
                </button>
                <button
                  class="flex flex-col items-center gap-1 rounded-xl p-2.5 border transition bg-white/5 border-white/10 hover:bg-white/10"
                  :class="
                    sourceMode === 'timeline'
                      ? 'bg-fuchsia-500/25 border-fuchsia-400/80 text-white'
                      : 'text-gray-300'
                  "
                  @click="sourceMode = 'timeline'"
                >
                  <span class="text-lg">🖼</span>
                  <span class="block"
                    ><b class="block text-[13px] font-medium whitespace-nowrap">时间轴选帧</b
                    ><small
                      class="block text-[10px] text-gray-400 mt-0.5 whitespace-nowrap truncate"
                      >拖动进度条后使用当前帧</small
                    ></span
                  >
                </button>
                <button
                  class="flex flex-col items-center gap-1 rounded-xl p-2.5 border transition bg-white/5 border-white/10 hover:bg-white/10"
                  :class="
                    sourceMode === 'upload'
                      ? 'bg-fuchsia-500/25 border-fuchsia-400/80 text-white'
                      : 'text-gray-300'
                  "
                  @click="sourceMode = 'upload'"
                >
                  <span class="text-lg">📤</span>
                  <span class="block"
                    ><b class="block text-[13px] font-medium whitespace-nowrap">上传图片</b
                    ><small
                      class="block text-[10px] text-gray-400 mt-0.5 whitespace-nowrap truncate"
                      >支持 jpg / png 格式</small
                    ></span
                  >
                </button>
              </div>

              <!-- 自动抽帧 -->
              <div v-if="sourceMode === 'auto'" class="mb-3">
                <button
                  class="btn-primary w-full"
                  :loading="frameLoading"
                  :disabled="!videoPath"
                  @click="refreshAutoFrame"
                >
                  重新随机抽帧
                </button>
                <p v-if="!videoPath" class="text-xs text-gray-400 mt-2">
                  未检测到视频源，请先完成视频制作步骤。
                </p>
              </div>

              <!-- 时间轴选帧 -->
              <div v-if="sourceMode === 'timeline'" class="mb-3">
                <video
                  v-if="props.videoPath"
                  ref="videoRef"
                  :src="props.videoPath"
                  preload="metadata"
                  class="w-full rounded-lg bg-black max-h-[320px]"
                  muted
                  playsinline
                  @loadedmetadata="onVideoLoadedMeta"
                  @seeked="onVideoSeeked"
                  @timeupdate="onVideoTimeUpdate"
                ></video>
                <!-- 时间轴选帧 -->
                <div v-if="videoDuration > 0" class="mt-3 px-1">
                  <div class="flex items-center justify-between text-xs text-gray-300 mb-1.5">
                    <span>时间轴选帧</span>
                    <span class="text-gray-400">
                      <b class="text-white font-medium tabular-nums">{{
                        formatTime(props.videoTime)
                      }}</b>
                      <span class="mx-1">/</span>
                      <span class="tabular-nums">{{ formatTime(props.videoDuration) }}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    :max="videoDuration"
                    step="0.05"
                    :value="videoTime"
                    class="timeline-slider w-full"
                    @input="onTimelineChange($event.target.valueAsNumber)"
                  />
                  <div class="flex justify-between text-[10px] text-gray-500 mt-1 tabular-nums">
                    <span>00:00</span>
                    <span>{{ formatTime(videoDuration / 4) }}</span>
                    <span>{{ formatTime(videoDuration / 2) }}</span>
                    <span>{{ formatTime((videoDuration * 3) / 4) }}</span>
                    <span>{{ formatTime(videoDuration) }}</span>
                  </div>
                  <button
                    class="btn-ghost w-full mt-2 text-xs"
                    :disabled="frameLoading"
                    @click="captureFromTime(videoTime)"
                  >
                    <span v-if="frameLoading">抽帧中…</span>
                    <span v-else>使用此帧作封面</span>
                  </button>
                </div>
                <p v-if="!props.videoPath" class="text-xs text-gray-400 mt-2">
                  未检测到视频源，请先完成视频制作步骤。
                </p>
              </div>

              <!-- 上传图片 -->
              <div v-if="sourceMode === 'upload'" class="mb-3">
                <a-upload-dragger
                  :show-upload-list="false"
                  :before-upload="onUploadImage"
                  accept="image/jpeg,image/png"
                  :multiple="false"
                >
                  <div class="flex flex-col items-center justify-center gap-3 py-2">
                    <!-- 图标 -->
                    <div class="text-fuchsia-300">
                      <svg
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-7 h-7"
                        aria-hidden="true"
                      >
                        <path
                          d="M14 30a6 6 0 010-12 7 7 0 0113.7 1.5A5 5 0 0137 22a5 5 0 01-1 9.9"
                          stroke="currentColor"
                          stroke-width="2.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M24 22v12m0-12l-5 5m5-5l5 5"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>

                    <!-- 文字 -->
                    <div class="flex flex-col items-center gap-1 text-center">
                      <div class="text-[13px] font-medium text-white">点击选择图片</div>
                      <div class="text-[11px] text-gray-400">
                        支持 jpg / png 格式，建议 1080×1920 竖版
                      </div>
                    </div>
                  </div>
                </a-upload-dragger>
              </div>

              <!-- 背景预览 -->
              <div class="rounded-[10px] bg-black/25 p-3 mt-3">
                <div class="flex justify-between text-xs text-gray-300 mb-2">
                  <span>当前背景</span>
                  <b class="text-white font-medium">{{ canvasW }} × {{ canvasH }}</b>
                </div>
                <div
                  class="w-full aspect-video bg-[#1a1a2a] rounded-md overflow-hidden flex items-center justify-center"
                >
                  <img
                    v-if="backgroundSrc"
                    :src="backgroundSrc"
                    alt="背景"
                    class="h-full object-cover"
                  />
                  <div v-else class="text-xs text-gray-500">暂无背景</div>
                </div>
                <p class="text-[11px] text-gray-500 text-center mt-2">画布尺寸跟随原图分辨率</p>
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="text" tab="文本图层">
            <div class="flex-1 overflow-y-auto pr-1 side-scroll cd-scroll">
              <div
                class="flex items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-white/10"
              >
                <div class="text-xs text-gray-300 flex-1 truncate">
                  {{
                    activeLayer
                      ? `已选中：${activeLayer.text || '文本图层'}`
                      : '请在左侧画布点击文字图层'
                  }}
                </div>
                <div class="flex gap-1.5">
                  <button
                    class="btn-ghost !text-[12px] !px-2.5 !py-1 bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200"
                    @click="addTextLayer"
                  >
                    ＋ 新增文本
                  </button>
                  <button
                    class="btn-ghost !text-[12px] !px-2.5 !py-1 text-rose-300 border-rose-500/30"
                    :disabled="!activeLayer"
                    @click="removeSelectedLayer"
                  >
                    🗑 删除
                  </button>
                </div>
              </div>

              <!-- 选中图层的样式编辑器 -->
              <div v-if="activeLayer" class="bg-black/20 rounded-[10px] p-3">
                <TextStyleEditor
                  v-if="activeLayer"
                  v-model="activeLayer.style"
                  :text-bounds-hint="activeLayerTextBounds"
                  :bg-max-size="bgMaxSize"
                  @update:model-value="onStyleChange"
                />
              </div>
              <div v-else class="text-xs text-gray-500 text-center p-6 bg-black/20 rounded-[10px]">
                点击画布中的文字图层后，可在这里调整样式。
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="mask" tab="遮罩">
            <!-- Tab：遮罩 -->
            <div class="flex-1 overflow-y-auto pr-1 side-scroll cd-scroll">
              <div class="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  class="cdm-toggle"
                  :class="currentMask.enabled && 'cdm-toggle-on'"
                  role="switch"
                  :aria-checked="!!currentMask.enabled"
                  @click="toggleMask(!currentMask.enabled)"
                >
                  <span class="cdm-toggle-knob"></span>
                </button>
                <span class="text-[13px] text-gray-300">启用遮罩</span>
              </div>

              <div v-if="currentMask.enabled" class="bg-black/20 rounded-[10px] p-3">
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-12">
                    <div class="cdm-field">
                      <span class="cdm-field-label">颜色</span>
                      <div class="flex items-center gap-1.5 flex-1">
                        <input
                          v-model="currentMask.color"
                          type="color"
                          class="w-[30px] h-6 rounded cursor-pointer bg-transparent border border-white/15"
                        />
                        <input v-model="currentMask.color" type="text" class="cdm-input flex-1" />
                      </div>
                    </div>
                  </div>
                  <div class="col-span-12">
                    <div class="cdm-field">
                      <span class="cdm-field-label">圆角</span>
                      <div class="flex items-center gap-1.5 flex-1">
                        <input
                          v-model.number="currentMask.radius"
                          type="range"
                          min="0"
                          max="200"
                          step="1"
                          class="ts-slider flex-1"
                        />
                        <span class="cdm-val">{{ currentMask.radius }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="cdm-field mt-1">
                  <span class="cdm-field-label">透明度</span>
                  <div class="flex items-center gap-1.5 flex-1">
                    <input
                      v-model.number="currentMask.opacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      class="ts-slider flex-1"
                    />
                    <span class="cdm-val">{{ Math.round(currentMask.opacity * 100) }}%</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 mb-3 mt-2">
                  <button
                    type="button"
                    class="cdm-toggle"
                    :class="currentMask.stroke.enabled && 'cdm-toggle-on'"
                    role="switch"
                    :aria-checked="!!currentMask.stroke.enabled"
                    @click="currentMask.stroke.enabled = !currentMask.stroke.enabled"
                  >
                    <span class="cdm-toggle-knob"></span>
                  </button>
                  <span class="text-[13px] text-gray-300">描边</span>
                </div>
                <div v-if="currentMask.stroke.enabled">
                  <div class="grid grid-cols-12 gap-2 items-center">
                    <div class="col-span-12">
                      <div class="cdm-field">
                        <span class="cdm-field-label">颜色</span>
                        <div class="flex items-center gap-1.5 flex-1">
                          <input
                            v-model="currentMask.stroke.color"
                            type="color"
                            class="w-[30px] h-6 rounded cursor-pointer bg-transparent border border-white/15"
                          />
                          <input
                            v-model="currentMask.stroke.color"
                            type="text"
                            class="cdm-input flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="col-span-12">
                      <div class="cdm-field">
                        <span class="cdm-field-label">粗细</span>
                        <div class="flex items-center gap-1.5 flex-1">
                          <input
                            v-model.number="currentMask.stroke.width"
                            type="range"
                            min="0"
                            max="30"
                            step="0.5"
                            class="ts-slider flex-1"
                          />
                          <span class="cdm-val">{{ currentMask.stroke.width }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 渐变控制 -->
                <div class="flex items-center gap-2 mb-3 mt-2">
                  <button
                    type="button"
                    class="cdm-toggle"
                    :class="currentMask.fillLinearGradientColorStops && 'cdm-toggle-on'"
                    role="switch"
                    :aria-checked="!!currentMask.fillLinearGradientColorStops"
                    @click="
                      currentMask.fillLinearGradientColorStops =
                        currentMask.fillLinearGradientColorStops
                          ? null
                          : [0, '#d946ef', 1, '#000000']
                    "
                  >
                    <span class="cdm-toggle-knob"></span>
                  </button>
                  <span class="text-[13px] text-gray-300">渐变填充</span>
                </div>
                <div v-if="currentMask.fillLinearGradientColorStops">
                  <div class="flex gap-1.5 mb-3">
                    <button
                      title="从上到下"
                      class="bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1.5 rounded-md text-xs transition"
                      @click="setGradientDirection('tb')"
                    >
                      ⬇️
                    </button>
                    <button
                      title="从下到上"
                      class="bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1.5 rounded-md text-xs transition"
                      @click="setGradientDirection('bt')"
                    >
                      ⬆️
                    </button>
                    <button
                      title="从左到右"
                      class="bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1.5 rounded-md text-xs transition"
                      @click="setGradientDirection('lr')"
                    >
                      ➡️
                    </button>
                    <button
                      title="从右到左"
                      class="bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1.5 rounded-md text-xs transition"
                      @click="setGradientDirection('rl')"
                    >
                      ⬅️
                    </button>
                    <button
                      title="反转颜色"
                      class="bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1.5 rounded-md text-xs transition"
                      @click="reverseGradientColors"
                    >
                      🔄 反转
                    </button>
                  </div>
                  <div class="grid grid-cols-12 gap-2 items-center">
                    <div class="col-span-3 text-xs text-gray-400">起点</div>
                    <div class="col-span-5">
                      <div class="flex items-center gap-1.5">
                        <input
                          v-model="maskGradient.color1"
                          type="color"
                          class="w-[30px] h-6 rounded cursor-pointer bg-transparent border border-white/15"
                        />
                        <input v-model="maskGradient.color1" type="text" class="cdm-input flex-1" />
                      </div>
                    </div>
                    <div class="col-span-4">
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs text-gray-400">透明度</span>
                        <input
                          v-model.number="maskGradient.alpha1"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          class="ts-slider flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-12 gap-2 items-center mt-2">
                    <div class="col-span-3 text-xs text-gray-400">终点</div>
                    <div class="col-span-5">
                      <div class="flex items-center gap-1.5">
                        <input
                          v-model="maskGradient.color2"
                          type="color"
                          class="w-[30px] h-6 rounded cursor-pointer bg-transparent border border-white/15"
                        />
                        <input v-model="maskGradient.color2" type="text" class="cdm-input flex-1" />
                      </div>
                    </div>
                    <div class="col-span-4">
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs text-gray-400">透明度</span>
                        <input
                          v-model.number="maskGradient.alpha2"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          class="ts-slider flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>

        <div class="cd-footer">
          <a-space>
            <a-button :loading="saving" @click="handleConfirm">
              <CheckOutlined />
              生成封面
            </a-button>
          </a-space>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-cover-step .ant-input,
.title-cover-step .ant-input-affix-wrapper,
.title-cover-step .ant-select-selector,
.title-cover-step textarea.ant-input {
  color: var(--theme-text-secondary) !important;
  background: color-mix(in srgb, var(--theme-background-light) 66%, transparent) !important;
  border-color: color-mix(in srgb, var(--theme-info) 16%, transparent) !important;
}

.title-cover-step .ant-input::-moz-placeholder,
.title-cover-step textarea.ant-input::-moz-placeholder {
  color: var(--theme-text-muted) !important;
}

.title-cover-step .ant-input::placeholder,
.title-cover-step .ant-select-selection-placeholder,
.title-cover-step textarea.ant-input::placeholder {
  color: var(--theme-text-muted) !important;
}

.title-cover-step .ant-input-affix-wrapper .ant-input {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.title-cover-step .ant-input-data-count,
.title-cover-step .ant-input-show-count-suffix,
.title-cover-step .ant-input-textarea-show-count:after,
.title-cover-step .ant-select-arrow,
.title-cover-step .ant-select-selection-item {
  color: color-mix(in srgb, var(--theme-text-secondary) 72%, transparent) !important;
}

.cd-container {
  display: flex;
  width: 100%;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--theme-background-light) 92%, transparent),
      color-mix(in srgb, var(--theme-background-card) 78%, transparent)
    ),
    radial-gradient(
      circle at 30% 0,
      color-mix(in srgb, var(--theme-primary-light) 22%, transparent),
      transparent 32%
    );
}

.cd-container,
.cover-designer-panel {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.title-cover-designer {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--theme-border-gray) 18%, transparent);
  background:
    radial-gradient(
      circle at 18% 0,
      color-mix(in srgb, var(--theme-primary-light) 18%, transparent),
      transparent 28%
    ),
    color-mix(in srgb, var(--theme-background-light) 58%, transparent);
  box-shadow:
    inset 0 1px 0 var(--theme-overlay-light),
    0 18px 44px color-mix(in srgb, var(--theme-background) 24%, transparent);
}

.cd-preview {
  flex: 0 0 clamp(360px, 40%, 520px);
  width: clamp(360px, 40%, 520px);
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: color-mix(in srgb, var(--theme-background) 24%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--theme-border-gray) 14%, transparent);
  min-width: 360px;
  max-width: 520px;
}

.cd-panel {
  flex: 1 1 auto;
  width: 0;
  height: 100%;
  max-height: 100%;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--theme-background-light) 82%, transparent);
}

.cd-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--theme-border-gray) 14%, transparent);
  background: color-mix(in srgb, var(--theme-background-light) 64%, transparent);
}

.cd-preview-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.cd-preview-title {
  font-size: var(--app-font-size-secondary);
  font-weight: 900;
  color: var(--theme-text-primary);
}

.cd-preview-size {
  font-size: var(--app-font-size-caption);
  color: color-mix(in srgb, var(--theme-text-secondary) 72%, transparent);
}

.cd-stage-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 18px;
  background:
    radial-gradient(
      circle at 50% 12%,
      color-mix(in srgb, var(--theme-primary-light) 16%, transparent),
      transparent 34%
    ),
    color-mix(in srgb, var(--theme-background) 46%, transparent);
  overflow: hidden;
}

.cd-preview-footer {
  min-height: 72px;
  padding: 9px 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  border-top: 1px solid color-mix(in srgb, var(--theme-border-gray) 14%, transparent);
  background: color-mix(in srgb, var(--theme-background-light) 70%, transparent);
}

.cd-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cd-footer {
  height: 54px;
  padding: 0 16px;
  border-top: 1px solid color-mix(in srgb, var(--theme-border-gray) 14%, transparent);
  background: color-mix(in srgb, var(--theme-background-light) 72%, transparent);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>

<style scoped>
.timeline-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d946ef;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.timeline-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.timeline-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d946ef;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.timeline-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 与 timeline-slider 同款（仅命名不同） */
.ts-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.ts-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d946ef;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.ts-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.ts-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d946ef;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.ts-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表单字段（label + control 一行布局） */
.cdm-field {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
}

.cdm-field-label {
  font-size: 12px;
  color: #b9b9c7;
  min-width: 40px;
  flex-shrink: 0;
}

.cdm-input {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 26px;
  color: #e2e2ea;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  outline: none;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  width: 100%;
}

.cdm-input:focus {
  border-color: #d946ef;
  background: rgba(255, 255, 255, 0.1);
}

.cdm-val {
  font-size: 12px;
  color: #e2e2ea;
  min-width: 36px;
  text-align: right;
  flex-shrink: 0;
}

/* toggle 开关 */
.cdm-toggle {
  position: relative;
  width: 30px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  cursor: pointer;
  transition: background 0.18s ease;
  flex-shrink: 0;
}

.cdm-toggle-on {
  background: #d946ef;
}

.cdm-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.18s ease;
}

.cdm-toggle-on .cdm-toggle-knob {
  transform: translateX(14px);
}
</style>

<style>
.cd-tabs .ant-tabs-content-holder {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: color-mix(in srgb, var(--theme-background) 28%, transparent);
}

.cd-tabs .ant-tabs-content {
  height: 100%;
  min-height: 0;
}

.cd-tabs .ant-tabs-tabpane {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.cd-tabs .ant-tabs-tabpane-active {
  display: flex;
  flex-direction: column;
}

.cd-scroll {
  flex: 1;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 14px;
  box-sizing: border-box;
}

.cd-tabs .ant-tabs-nav {
  margin: 0;
  height: 52px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--theme-background-light) 90%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--theme-border-gray) 14%, transparent);
}

.cd-tabs .ant-tabs-tab {
  color: color-mix(in srgb, var(--theme-text-secondary) 76%, transparent) !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 999px !important;
  margin: 0 !important;
  padding: 6px 14px !important;
  transition: all 0.2s ease;
}

.cd-tabs .ant-tabs-tab-active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--theme-primary-light) 96%, transparent),
    color-mix(in srgb, var(--theme-info) 86%, transparent)
  ) !important;
  border-color: transparent !important;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--theme-primary) 22%, transparent);
}

.cd-tabs .ant-tabs-tab .ant-tabs-tab-btn {
  color: color-mix(in srgb, var(--theme-text-secondary) 76%, transparent) !important;
  text-shadow: none !important;
}

.cd-tabs .ant-tabs-nav-list {
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-background) 42%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-border-gray) 12%, transparent);
}

.cd-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
  color: var(--theme-text-primary) !important;
}

.cd-tabs .ant-tabs-ink-bar {
  visibility: hidden;
}
</style>
