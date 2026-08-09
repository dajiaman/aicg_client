import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { TEMPLATES } from '../constants/cover_templates'
import { watch } from 'vue'
import { wrapText } from '../utils/wrapText'
import { pathJoin } from '../utils/index'
import { message } from 'ant-design-vue'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920
const DEFAULT_TEMPLATE_ID = 'default'

function generateId() {
  return 'layer_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
    return url
  }
  return 'file://' + url.replace(/\\/g, '/')
}

/**
 * 将十六进制颜色转换为 RGB 格式
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0'
}

/**
 * 获取遮罩渐变停止点
 */
function getGradientStops(direction, color1, alpha1, color2, alpha2) {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  return [0, `rgba(${rgb1}, ${alpha1})`, 1, `rgba(${rgb2}, ${alpha2})`]
}

export function useCoverDesigner(options) {
  const {
    open = false,
    videoPath = '',
    title = '',
    titleMain = '',
    titleSub = '',
    initialConfig = null,
    onConfirm = () => {},
    onDirtyChange = () => {},
    onCancel = () => {}
  } = options || {}

  const visible = ref(open)

  // 当前激活的右侧 Tab（模板 / 封面来源 / 文本图层 / 遮罩）
  const activeTab = ref('template')
  // 封面来源模式
  const sourceMode = ref('auto')
  const titleText = ref(title || titleMain || '输入标题')

  const currentTemplateId = ref(DEFAULT_TEMPLATE_ID)
  const defaultTemplateId = ref(DEFAULT_TEMPLATE_ID)
  const defaultTemplateSaving = ref(false)
  const frameLoading = ref(false)
  const saving = ref(false)
  const isDirty = ref(false)

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
      `${fontStyle} ${fontWeight}`.trim(),
      maxWidth,
      letterSpacing,
      lineHeight
    )

    console.log('计算文字宽度:', maxLineWidth, lines, totalHeight)

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

  // 舞台配置
  const stageConfig = computed(() => ({
    width: canvasW.value * 0.35,
    height: canvasH.value * 0.35,
    scaleX: 0.35,
    scaleY: 0.35
  }))

  // 背景占位配置
  const bgPlaceholderConfig = computed(() => ({
    x: 0,
    y: 0,
    width: canvasW.value,
    height: canvasH.value,
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 0, y: canvasH.value },
    fillLinearGradientColorStops: [0, '#f0f0f0', 1, '#d0d0d0'],
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
      text = text.replace(/\{titleMain\}/g, titleMain || title || '主标题')
      text = text.replace(/\{titleSub\}/g, titleSub || '副标题')
      text = text.replace(/\{title\}/g, title || '标题')
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

  // 设置默认模板（占位，可接入 IPC）
  const setDefaultTemplate = async (id) => {
    defaultTemplateId.value = id
    defaultTemplateSaving.value = true
    try {
      // TODO: 接入 IPC 保存默认模板 ID
      await new Promise((r) => setTimeout(r, 200))
    } finally {
      defaultTemplateSaving.value = false
    }
  }

  // 加载默认模板ID
  const loadDefaultTemplate = async () => {
    try {
      const result = { success: true, data: DEFAULT_TEMPLATE_ID }
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

      const result = await window.api.cover.saveTempImage(dataUrl)
      if (!result?.success) {
        throw new Error(result?.error || '保存封面失败')
      }

      onConfirm({
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
    // 如果存在videoPath
    if (!videoPath) {
      console.error('视频路径不能为空')
      return
    }

    frameLoading.value = true
    try {
      // 视频抽帧接口
      const outputPath = await getFrameOutputPath()
      const result = await window.api.cover.extractFrame(videoPath, outputPath)
      console.log('extractFrame result:', result)
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
      `${fontStyle} ${fontWeight}`,
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
      width: maxLineWidth,
      // 关键：关闭 Konva 自带换行，完全信任 wrapText 预计算的换行结果
      // 否则 Konva 会按 width 二次换行，导致与预计算行不一致（尤其有 letterSpacing 时度量偏差）
      wrap: 'none',
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
   * 文本样式变更时触发
   * @param {Object} newStyle - 新的文本样式
   */
  const onStyleChange = (newStyle) => {
    console.log('newStyle', newStyle)
    markDirty()
    forceRefresh()
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
    () => [titleMain.value, titleSub.value, title],
    (newVals, oldVals) => {
      if (!textLayers.value || textLayers.value.length === 0) return
      if (newVals[0] === oldVals[0] && newVals[1] === oldVals[1] && newVals[2] === oldVals[2]) {
        return // 没变化
      }

      const tmplMain = titleMain.value || '主标题'
      const tmplSub = titleSub.value || '副标题'
      const tmplTitle = title.value || '标题'

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

    if (initialConfig) {
      const config = initialConfig
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
            .replace(/\{titleMain\}/g, titleMain || '主标题')
            .replace(/\{titleSub\}/g, titleSub || '副标题')
            .replace(/\{title\}/g, title || '标题')
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
      if (coverTemplates.value.length > 0) {
        applyTemplate(coverTemplates.value[0].id)
      }
      if (videoPath) await refreshAutoFrame()
    }

    watch(visible, (newVal) => {
      if (newVal) initialize()
    })
  }

  onMounted(async () => {
    await initialize()
  })

  return {
    visible,
    activeTab,
    sourceMode,
    titleText,
    currentTemplateId,
    defaultTemplateId,
    defaultTemplateSaving,
    currentMask,
    maskGradient,
    textLayers,
    selectedId,
    activeLayer,
    activeLayerTextBounds,
    bgMaxSize,
    bgImage,
    backgroundSrc,
    frameLoading,
    saving,
    coverTemplates,
    canvasW,
    canvasH,
    shapes,
    videoDuration,
    videoTime,
    isDevelopment,
    textRefs,

    // Konva 引用
    stageRef,
    stageWrapperRef,
    maskRef,
    transformerRef,
    bgLayerRef,
    videoRef,

    // 计算属性
    stageConfig,
    bgPlaceholderConfig,
    bgImageConfig,
    maskRectConfig,
    transformerConfig,

    applyTemplate,
    setDefaultTemplate,
    toggleMask,
    toggleMaskGradient,
    setGradientDirection,
    reverseGradientColors,
    addTextLayer,
    removeSelectedLayer,
    selectItem,
    editTextLayer,
    getShapeConfig,
    getLayerTextConfig,
    getLayerBgConfig,
    handleStageMouseDown,
    onMaskDragEnd,
    onMaskTransformEnd,
    onLayerDragEnd,
    onLayerTransformEnd,
    printTemplateParams,
    refreshAutoFrame,
    onVideoLoadedMeta,
    onVideoSeeked,
    onTimelineChange,
    captureCurrentFrame,
    captureFromTime,
    onUploadImage,
    loadBackgroundImage,
    handleConfirm,
    handleCancel,
    markDirty
  }
}
