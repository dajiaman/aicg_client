/**
 * 字幕模板容量注册表
 *
 * 描述每个灵动字幕模板"一行能容纳多宽的文字"，供上游字幕分割引擎使用。
 * 数值抄录自各模板的布局逻辑（electron/main/viral-ass-engine/templates/subtitle/）：
 * - fontSize：模板内基于 1080p 高度的基准字号（scaleValue(value, ctx, 'y') 按 height/1080 缩放）
 * - safeWidthRatio：可用文字区域占视频宽度的比例（扣除左右安全边距）
 * - effectScale：入场/弹跳动画的放大倍数，需要为其预留宽度
 * - charWidthFactor：模板计算单字符宽度时的额外系数（如双语模板的 1.05）
 * - layout / marginLeft / marginRight：左对齐模板（如 scrolling_*）的可用宽度
 * - minFontScale：模板 fitTextToWidth 允许的最小字号比例（如 0.75 表示最多可缩至 75%）
 *
 * 居中模板：maxWidthUnits = floor(width * safeWidthRatio / effectScale / (scaledFontSize * charWidthFactor))
 * 左对齐模板：maxWidthUnits = floor((width - marginLeft - marginRight) / (scaledFontSize * minFontScale))
 * 单位为"全角字符单位"（一个 CJK 汉字 = 1，拉丁字母约 0.55）。
 */

// 默认值：居中布局、无大幅缩放动画的常规模板
const DEFAULT_SPEC = {
  fontSize: 50,
  safeWidthRatio: 0.9,
  effectScale: 1.0,
  charWidthFactor: 1.0
}

// simple_* 系列：锚点偏移布局 + 1.5 倍弹入动画，可用宽度明显更窄。
// 完全按 1.5 预留会把行切得过碎，按 1.3 折中（模板内 fitTextToWidth 仍可兜底缩字号）。
const SIMPLE_FAMILY_SPEC = {
  fontSize: 50,
  safeWidthRatio: 0.9,
  effectScale: 1.3,
  charWidthFactor: 1.0
}

// scrolling_* 系列：左对齐（posX=250、右边距 100），超长句由 fitTextToWidth 缩至 75% 字号兜底
const SCROLLING_FAMILY_SPEC = {
  fontSize: 45,
  layout: 'left',
  marginLeft: 250,
  marginRight: 100,
  minFontScale: 0.75,
  charWidthFactor: 1.0,
  maxWidthUnitsCap: 40
}

const TEMPLATE_SPECS = {
  '3d_flip': { ...DEFAULT_SPEC, fontSize: 45 },
  cartoon_yellow: { ...DEFAULT_SPEC },
  cute_pink: { ...DEFAULT_SPEC, fontSize: 80 },
  scrolling_3lines: { ...SCROLLING_FAMILY_SPEC },
  scrolling_4lines: { ...SCROLLING_FAMILY_SPEC },
  simple_brown_white: { ...SIMPLE_FAMILY_SPEC },
  simple_blue_white: { ...SIMPLE_FAMILY_SPEC },
  simple_yellow_white: { ...SIMPLE_FAMILY_SPEC },
  energy_pink_yellow: { ...DEFAULT_SPEC, fontSize: { portrait: 62, landscape: 70 } },
  white_pinyin: { ...DEFAULT_SPEC, fontSize: { portrait: 46, landscape: 50 }, safeWidthRatio: 0.8 },
  purple_slide: { ...DEFAULT_SPEC },
  red_blue_science: { ...DEFAULT_SPEC },
  red_yellow: { ...DEFAULT_SPEC },
  variety_wave: { ...DEFAULT_SPEC },
  yellow_box_white: { ...DEFAULT_SPEC },
  yellow_white_calligraphy: { ...DEFAULT_SPEC },
  yellow_white_italic: { ...DEFAULT_SPEC },
  yellow_white_split: { ...DEFAULT_SPEC },
  yellow_white_bounce: { ...DEFAULT_SPEC },
  // 双语模板按中文行容量计算（英文行由 LLM 翻译生成、模板内自适应）
  red_white_bilingual: {
    ...DEFAULT_SPEC,
    fontSize: { portrait: 40, landscape: 45 },
    charWidthFactor: 1.05
  },
  yellow_white_bilingual: { ...DEFAULT_SPEC, charWidthFactor: 1.05 },
  black_white_bilingual: {
    ...DEFAULT_SPEC,
    fontSize: { portrait: 40, landscape: 45 },
    charWidthFactor: 1.05
  }
}

// 容量上下限：上限避免横屏视频出现 30 字超长行，下限保证可读性
const MIN_WIDTH_UNITS = 4
const MAX_WIDTH_UNITS = 18

function resolveResolution(videoInfo) {
  const width = Number(videoInfo?.width) || 1080
  const height = Number(videoInfo?.height) || 1920
  return { width, height, isPortrait: height >= width }
}

function resolveFontSize(fontSize, isPortrait) {
  if (typeof fontSize === 'object' && fontSize !== null) {
    return Number(isPortrait ? fontSize.portrait : fontSize.landscape) || 50
  }
  return Number(fontSize) || 50
}

function resolveSafeWidthPx(spec, width) {
  if (spec.layout === 'left') {
    const posX = Math.round(((spec.marginLeft ?? 250) * width) / 1920)
    return width - posX - (spec.marginRight ?? 100)
  }
  return (width * (spec.safeWidthRatio ?? 0.85)) / (spec.effectScale || 1)
}

/**
 * 根据模板规格和视频分辨率计算每行最大显示宽度（全角字符单位）
 */
function computeMaxWidthUnits(spec, videoInfo) {
  const { width, height, isPortrait } = resolveResolution(videoInfo)
  const baseFontSize = resolveFontSize(spec.fontSize, isPortrait)
  // 与模板内 scaleValue(value, context, 'y') 保持一致：按高度缩放字号
  const scaledFontSize = Math.max(1, Math.round((baseFontSize * height) / 1080))
  const safeWidthPx = resolveSafeWidthPx(spec, width)
  const fontScale = spec.minFontScale > 0 ? spec.minFontScale : 1
  const units = Math.floor(safeWidthPx / (scaledFontSize * fontScale * (spec.charWidthFactor || 1)))
  const cap = spec.maxWidthUnitsCap ?? MAX_WIDTH_UNITS
  return Math.max(MIN_WIDTH_UNITS, Math.min(cap, units))
}

/**
 * 获取字幕分割容量
 * @param {Object} params
 * @param {Object} params.viralStudioConfig - 灵动剪辑配置（可空）
 * @param {Object} params.videoInfo - { width, height }
 * @returns {{ maxWidthUnits: number, templateKey: string|null }}
 */
function getSubtitleCapacity({ viralStudioConfig, videoInfo } = {}) {
  const subtitleConfig = viralStudioConfig?.subtitle || {}

  // 灵动模板模式：查注册表
  if (subtitleConfig.mode === 'template' && subtitleConfig.presetId) {
    const spec = TEMPLATE_SPECS[subtitleConfig.presetId] || DEFAULT_SPEC
    return {
      maxWidthUnits: computeMaxWidthUnits(spec, videoInfo),
      templateKey: subtitleConfig.presetId
    }
  }

  // 自定义样式模式：使用用户配置的字号
  const customFontSize = Number(subtitleConfig?.customConfig?.fontSize)
  const spec = {
    ...DEFAULT_SPEC,
    safeWidthRatio: 0.9,
    fontSize: Number.isFinite(customFontSize) && customFontSize > 0 ? customFontSize : 50
  }
  return {
    maxWidthUnits: computeMaxWidthUnits(spec, videoInfo),
    templateKey: 'custom',
    fontSize: spec.fontSize
  }
}

module.exports = {
  getSubtitleCapacity,
  computeMaxWidthUnits,
  TEMPLATE_SPECS,
  DEFAULT_SPEC,
  MIN_WIDTH_UNITS,
  MAX_WIDTH_UNITS
}
