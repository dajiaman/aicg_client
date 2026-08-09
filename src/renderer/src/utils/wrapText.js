/**
 * 将文本按指定宽度换行，并返回换行结果及尺寸信息
 *
 * @param {string} text - 原始文本（可包含换行符 \n）
 * @param {number} fontSize - 字号（逻辑像素）
 * @param {string} fontFamily - 字体名称（如 "微软雅黑"）
 * @param {string} fontStyle - 字体样式（如 "bold italic"，用于测量）
 * @param {number} maxWidth - 最大行宽（逻辑像素）
 * @param {number} letterSpacing - 字间距（逻辑像素），默认 0
 * @param {number} lineHeight - 行高倍数，默认 1.3
 * @returns {{
 *   lines: string[],      // 换行后的行数组
 *   maxLineWidth: number,  // 最宽行的宽度（逻辑像素）
 *   totalHeight: number    // 文本总高度（逻辑像素）
 * }}
 */
export function wrapText(
  text = '',
  fontSize = 60,
  fontFamily = '微软雅黑',
  fontStyle = 'normal',
  fontWeight = 'normal',
  maxWidth = 1080,
  letterSpacing = 0,
  lineHeight = 1.3
) {
  // 归一化换行符
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (!text) {
    return { lines: [''], maxLineWidth: 0, totalHeight: fontSize * lineHeight }
  }

  const safeMaxWidth = Math.max(maxWidth, fontSize * 0.5)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 设置字体（测量和绘制共用）
  const styleParts = [fontStyle, fontWeight, `${fontSize}px`, `"${fontFamily}"`].filter(Boolean)
  ctx.font = styleParts.join(' ')
  ctx.letterSpacing = letterSpacing

  // ---------- 换行计算（与原代码相同） ----------
  const lines = []
  let maxLineWidth = 0
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }

    let currentLine = ''
    let currentWidth = 0

    for (const char of paragraph) {
      // 测量宽度
      const charWidth = ctx.measureText(char).width
      const spacing = currentLine ? letterSpacing : 0
      const newWidth = currentWidth + spacing + charWidth

      if (charWidth > safeMaxWidth) {
        if (currentLine) {
          lines.push(currentLine)
          maxLineWidth = Math.max(maxLineWidth, currentWidth)
          currentLine = ''
          currentWidth = 0
        }
        lines.push(char)
        maxLineWidth = Math.max(maxLineWidth, charWidth)
        continue
      }

      if (currentLine && newWidth > safeMaxWidth) {
        lines.push(currentLine)
        maxLineWidth = Math.max(maxLineWidth, currentWidth)
        currentLine = char
        currentWidth = charWidth
      } else {
        currentLine += char
        currentWidth += spacing + charWidth
      }
    }

    if (currentLine) {
      lines.push(currentLine)
      maxLineWidth = Math.max(maxLineWidth, currentWidth)
    }
  }

  if (lines.length === 0) lines.push('')

  // ---------- 返回结果 ----------
  return {
    lines,
    maxLineWidth: Math.ceil(Math.max(maxLineWidth, fontSize * 0.5)),
    totalHeight: lines.length * fontSize * lineHeight
  }
}
