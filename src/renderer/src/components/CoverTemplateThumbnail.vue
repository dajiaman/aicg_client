<template>
  <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight" class="cover-template-thumbnail" />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { wrapText } from '../utils/wrapText'

// 标准画布尺寸（与模板定义一致）
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

const props = defineProps({
  // 模板对象（包含 mask、shapes、textLayers）
  template: {
    type: Object,
    required: true
  },
  // 标题文本（用于替换占位符）
  title: {
    type: String,
    default: '输入标题'
  },
  // 封面主标题
  titleMain: {
    type: String,
    default: ''
  },
  // 封面副标题
  titleSub: {
    type: String,
    default: ''
  },
  // 背景图片 URL（可选）
  backgroundSrc: {
    type: String,
    default: ''
  },
  // 缩略图宽度（像素）
  width: {
    type: Number,
    default: 135
  },
  // 缩略图高度（像素）
  height: {
    type: Number,
    default: 240
  }
})

const canvasRef = ref(null)
let bgImage = null

// 计算实际缩略图画布尺寸（保持比例）
const canvasWidth = ref(props.width)
const canvasHeight = ref(props.height)

// ----- 工具函数：加载图片 -----
const loadImage = (src) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ----- 核心：渲染缩略图 -----
const renderThumbnail = async () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const scale = canvas.width / CANVAS_WIDTH

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. 绘制背景
  if (props.backgroundSrc && bgImage) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)
  } else {
    // 默认渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, '#f0f0f0')
    grad.addColorStop(1, '#d0d0d0')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // 2. 获取模板数据（深拷贝，避免修改原模板）
  const template = JSON.parse(JSON.stringify(props.template))

  // 3. 替换占位符
  const titleMain = props.titleMain || props.title || '主标题'
  const titleSub = props.titleSub || '副标题'

  template.textLayers?.forEach((layer) => {
    if (layer.text) {
      layer.text = layer.text
        .replace(/\{titleMain\}/g, titleMain)
        .replace(/\{titleSub\}/g, titleSub)
        .replace(/\{title\}/g, props.title || '输入标题')
    }
  })

  // 4. 渲染遮罩
  if (template.mask && template.mask.enabled) {
    const mask = template.mask
    const x = (mask.x || 0) * scale
    const y = (mask.y || 0) * scale
    const w = (mask.width || CANVAS_WIDTH) * scale
    const h = (mask.height || CANVAS_HEIGHT) * scale
    const radius = (mask.radius || 0) * scale

    ctx.save()
    if (mask.rotation) {
      ctx.translate(x + w / 2, y + h / 2)
      ctx.rotate((mask.rotation * Math.PI) / 180)
      ctx.translate(-(x + w / 2), -(y + h / 2))
    }

    // 渐变或纯色
    if (mask.fillLinearGradientColorStops && mask.fillLinearGradientColorStops.length >= 4) {
      const stops = mask.fillLinearGradientColorStops
      const grad = ctx.createLinearGradient(
        (mask.fillLinearGradientStartPoint?.x || 0) * scale,
        (mask.fillLinearGradientStartPoint?.y || 0) * scale,
        (mask.fillLinearGradientEndPoint?.x || w) * scale,
        (mask.fillLinearGradientEndPoint?.y || h) * scale
      )
      for (let i = 0; i < stops.length; i += 2) {
        grad.addColorStop(stops[i], stops[i + 1])
      }
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = mask.color || '#000000'
      ctx.globalAlpha = mask.opacity ?? 0.5
    }

    // 绘制遮罩（支持圆角）
    if (radius > 0) {
      roundRect(ctx, x, y, w, h, radius)
      ctx.fill()
    } else {
      ctx.fillRect(x, y, w, h)
    }

    // 描边
    if (mask.stroke?.enabled && mask.stroke.width > 0) {
      ctx.globalAlpha = 1
      ctx.strokeStyle = mask.stroke.color || '#FFFFFF'
      ctx.lineWidth = (mask.stroke.width || 0) * scale
      if (radius > 0) {
        roundRect(ctx, x, y, w, h, radius)
        ctx.stroke()
      } else {
        ctx.strokeRect(x, y, w, h)
      }
    }
    ctx.restore()
  }

  // 5. 渲染形状图层
  if (template.shapes) {
    template.shapes.forEach((shape) => {
      if (shape.type !== 'rect') return
      const x = (shape.x || 0) * scale
      const y = (shape.y || 0) * scale
      const w = (shape.width || 0) * scale
      const h = (shape.height || 0) * scale
      const radius = (shape.radius || 0) * scale

      ctx.save()
      if (shape.rotation) {
        ctx.translate(x + w / 2, y + h / 2)
        ctx.rotate((shape.rotation * Math.PI) / 180)
        ctx.translate(-(x + w / 2), -(y + h / 2))
      }

      ctx.globalAlpha = shape.opacity ?? 1

      // 渐变或纯色
      if (shape.fillLinearGradientColorStops && shape.fillLinearGradientColorStops.length >= 4) {
        const stops = shape.fillLinearGradientColorStops
        const grad = ctx.createLinearGradient(
          (shape.fillLinearGradientStartPoint?.x || 0) * scale,
          (shape.fillLinearGradientStartPoint?.y || 0) * scale,
          (shape.fillLinearGradientEndPoint?.x || w) * scale,
          (shape.fillLinearGradientEndPoint?.y || h) * scale
        )
        for (let i = 0; i < stops.length; i += 2) {
          grad.addColorStop(stops[i], stops[i + 1])
        }
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = shape.fill || '#FFFFFF'
      }

      if (radius > 0) {
        roundRect(ctx, x, y, w, h, radius)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, w, h)
      }

      ctx.restore()
    })
  }

  // 6. 渲染文本图层
  if (template.textLayers) {
    template.textLayers.forEach((layer) => {
      if (!layer.text) return
      const style = layer.style || {}
      const fontSize = (style.fontSize || 60) * scale
      const fontFamily = style.fontFamily || '微软雅黑'
      const isBold = style.fontStyles?.includes('bold') || style.bold
      const isItalic = style.fontStyles?.includes('italic') || style.italic
      const fontWeight = isBold ? 'bold' : 'normal'
      const fontStyle = isItalic ? 'italic' : 'normal'
      const color = style.color || '#FFFFFF'
      const align = style.align || 'center'
      const letterSpacing = (style.letterSpacing || 0) * scale
      const lineHeight = style.lineHeight || 1.3

      // 计算文本位置（缩放后）
      let x = (style.x || CANVAS_WIDTH / 2) * scale
      let y = (style.y || CANVAS_HEIGHT / 2) * scale

      // 文本换行
      const maxWidth =
        style.background?.enabled && style.background.width
          ? style.background.width * scale
          : canvas.width * 0.9

      const { lines } = wrapText(
        layer.text,
        fontSize,
        fontFamily,
        fontStyle,
        fontWeight,
        maxWidth,
        letterSpacing
      )

      const totalHeight = lines.length * fontSize * lineHeight

      // 垂直居中偏移
      const offsetY = totalHeight / 2

      ctx.save()

      // 旋转
      if (style.rotation) {
        ctx.translate(x, y)
        ctx.rotate((style.rotation * Math.PI) / 180)
        ctx.translate(-x, -y)
      }

      // 背景（如果启用）
      if (style.background?.enabled) {
        const bg = style.background
        const padX = (bg.paddingX || 12) * scale
        const padY = (bg.paddingY || 8) * scale
        const bgWidth = (bg.width || maxWidth) + padX * 2
        const bgHeight = totalHeight + padY * 2
        const bgX = x - bgWidth / 2
        const bgY = y - bgHeight / 2
        ctx.globalAlpha = bg.opacity ?? 0.7
        ctx.fillStyle = bg.color || '#000000'
        const radius = (bg.radius || 0) * scale
        if (radius > 0) {
          roundRect(ctx, bgX, bgY, bgWidth, bgHeight, radius)
          ctx.fill()
        } else {
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
        }
        ctx.globalAlpha = 1
      }

      // 设置字体
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`
      ctx.textBaseline = 'middle'
      ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'

      // 描边
      if (style.stroke?.enabled && style.stroke.width > 0) {
        ctx.strokeStyle = style.stroke.color || '#000000'
        ctx.lineWidth = (style.stroke.width || 0) * scale
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
      }

      // 阴影
      if (style.shadow?.enabled) {
        ctx.shadowColor = style.shadow.color || '#000000'
        ctx.shadowBlur = (style.shadow.blur || 0) * scale
        ctx.shadowOffsetX = (style.shadow.distance || 0) * scale
        ctx.shadowOffsetY = (style.shadow.distance || 0) * scale
        ctx.shadowOpacity = style.shadow.opacity ?? 0.5
      }

      // 填充颜色（支持渐变）
      if (style.fillLinearGradientColorStops && style.fillLinearGradientColorStops.length >= 4) {
        const stops = style.fillLinearGradientColorStops
        const grad = ctx.createLinearGradient(
          (style.fillLinearGradientStartPoint?.x || 0) * scale,
          (style.fillLinearGradientStartPoint?.y || 0) * scale,
          (style.fillLinearGradientEndPoint?.x || fontSize) * scale,
          (style.fillLinearGradientEndPoint?.y || fontSize) * scale
        )
        for (let i = 0; i < stops.length; i += 2) {
          grad.addColorStop(stops[i], stops[i + 1])
        }
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = color
      }

      // 渲染文本（逐行）
      const startY = y - offsetY + (fontSize * lineHeight) / 2
      lines.forEach((line, index) => {
        const lineY = startY + index * fontSize * lineHeight
        // 字间距手动处理（Canvas 原生不支持 letterSpacing，逐字符绘制）
        if (letterSpacing > 0) {
          let currentX = align === 'center' ? x - ctx.measureText(line).width / 2 : x
          for (const ch of line) {
            ctx.fillText(ch, currentX, lineY)
            if (style.stroke?.enabled) ctx.strokeText(ch, currentX, lineY)
            currentX += ctx.measureText(ch).width + letterSpacing
          }
        } else {
          ctx.fillText(line, x, lineY)
          if (style.stroke?.enabled) ctx.strokeText(line, x, lineY)
        }
      })

      ctx.restore()
    })
  }
}

// ----- 辅助：圆角矩形路径 -----
const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ----- 加载背景图片 -----
const loadBackground = async () => {
  if (props.backgroundSrc) {
    bgImage = await loadImage(props.backgroundSrc)
  } else {
    bgImage = null
  }
  await renderThumbnail()
}

// ----- 监听变化重新渲染 -----
watch(
  () => [props.template, props.title, props.titleMain, props.titleSub, props.backgroundSrc],
  () => {
    loadBackground()
  },
  { deep: true }
)

// ----- 生命周期 -----
onMounted(() => {
  // 确保 canvas 尺寸已设置
  if (canvasRef.value) {
    canvasRef.value.width = props.width
    canvasRef.value.height = props.height
  }
  loadBackground()
})
</script>

<style scoped>
.cover-template-thumbnail {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1080 / 1920;
  border-radius: 4px;
  background: #f0f0f0;
  object-fit: contain;
}
</style>
