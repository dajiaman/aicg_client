/**
 * 跨平台路径拼接（兼容 Windows 和 Unix）
 * @param {...string} segments - 路径片段
 * @returns {string} 拼接后的路径
 */
export function pathJoin(...segments) {
  if (segments.length === 0) return ''
  // 过滤空片段，并统一使用 '/' 分隔
  const parts = segments
    .filter((s) => s != null && s !== '')
    .join('/')
    .replace(/\\/g, '/') // 将 Windows 反斜杠转为正斜杠
    .replace(/\/+/g, '/') // 合并连续斜杠
  return parts
}

/**
 * 获取 AI 配置
 * @returns {Promise<{model: string, temperature: number, maxTokens: number}>}
 */
export async function getAIConfig() {
  const configRes = await window.api.config.getCategory('ai')
  const aiConfig = normalizeAiConfig(configRes?.success ? configRes.data : {})
  return aiConfig
}

// 默认模型
const DEFAULT_MODEL = 'doubao-seed-2-0-lite-260428'

/**
 * 安全归一化 LLM 配置（避免 "0.85" 字符串导致上游 f32 类型报错）
 */
export function normalizeAiConfig(aiConfig = {}) {
  const num = (v, fallback) =>
    v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : fallback
  return {
    model: aiConfig.model || DEFAULT_MODEL,
    temperature: num(aiConfig.temperature, 0.85),
    baseURL: aiConfig.baseURL || '',
    apiKey: aiConfig.apiKey || '',
    fps: num(aiConfig.fps, 2),
    visionModel: aiConfig.visionModel || '',
    maxTokens: Math.floor(num(aiConfig.maxTokens, 1500)),
    enableStream: aiConfig.enableStream || true
  }
}

/**
 * 归一化 URL，确保路径以 '/' 开头
 * @param {string} url - 输入 URL
 * @returns {string} 归一化后的 URL
 */
export function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
    return url
  }
  return 'file://' + url.replace(/\\/g, '/')
}

/**
 * 将十六进制颜色转换为 RGB 格式
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0'
}

/**
 * 获取运行模式
 * @returns {Promise<string>} 运行模式（'local' 或 'cloud'）
 */
export async function getRunMode() {
  const configRes = await getAIConfig()
  return configRes.runMode || 'local'
}

/**
 * 字节数 → 可读字符串
 *   1024 B → 1 KB → 1 MB → 1 GB
 *   - bytes 为 null/undefined 时返回 '-'（前端列表友好）
 *   - 小于 1 KB 显示 "X B"，保留整数
 *   - 大于等于 1 KB 显示 2 位小数（如 "1.23 MB"）
 */
export function formatSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return '-'
  const size = Number(bytes)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
