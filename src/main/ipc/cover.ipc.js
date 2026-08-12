// cover:*  —  封面相关：临时图保存
import fs from 'fs'
import fontkit from 'fontkit'
import sharp from 'sharp'
import logger from '../log'
import { ensureDir, getFFmpegBin, runCmd } from '../utils/index'
import path, { join } from 'path'
import { getAppRootPath, getOutputsPath, getTempPath } from './file.ipc'
import { models } from '../database/services'

/**
 * 自定义字体目录（与 src/main/ipc/font.ipc.js 保持一致）
 */
function getFontsDir() {
  return join(getAppRootPath(), 'resources', 'fonts')
}

/**
 * 扫描字体目录，构建 { displayName -> path } 索引（懒加载 + 缓存）
 */
let fontsIndexPromise = null
function getFontsIndex() {
  if (fontsIndexPromise) return fontsIndexPromise
  fontsIndexPromise = (async () => {
    const dir = getFontsDir()
    const index = new Map() // key: lower(displayName) -> path
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile()) continue
        const ext = path.extname(entry.name).toLowerCase()
        if (!['.ttf', '.otf', '.ttc'].includes(ext)) continue
        const fontPath = join(dir, entry.name)
        const displayName = entry.name.split('.')[0].split('-')[0].trim()
        if (displayName) {
          index.set(displayName.toLowerCase(), fontPath)
        }
      }
    } catch (e) {
      logger.warn(`[cover:generate] 扫描字体目录失败: ${e.message}`)
    }
    return index
  })()
  return fontsIndexPromise
}

/**
 * 根据字体名解析字体绝对路径
 * @param {string} name 字体展示名（如"方正粗黑宋简体"）或绝对路径
 * @returns {Promise<string|null>}
 */
async function resolveFontPath(name) {
  if (!name || typeof name !== 'string') return null
  // 已经是绝对路径 → 直接返回
  if (/^([a-zA-Z]:[\\/]|\/)/.test(name) && fs.existsSync(name)) {
    return name
  }
  const index = await getFontsIndex()
  const lower = name.trim().toLowerCase()
  // 精确匹配 displayName
  if (index.has(lower)) return index.get(lower)
  // 模糊匹配（包含关系）
  for (const [k, v] of index.entries()) {
    if (k.includes(lower) || lower.includes(k)) return v
  }
  return null
}

/**
 * 获取默认封面字体（方正粗黑宋简体.ttf）
 */
async function getDefaultCoverFontPath() {
  const resolved = await resolveFontPath('方正粗黑宋简体')
  if (resolved) return resolved
  // 兜底：扫描目录下第一个字体
  const dir = getFontsDir()
  try {
    const entries = await fs.promises.readdir(dir)
    const first = entries.find((f) => /\.(ttf|otf|ttc)$/i.test(f))
    if (first) return join(dir, first)
  } catch {}
  return null
}

/**
 * 简单换行工具：按 maxCharsPerLine 字符数切割，优先在标点处断行
 */
function wrapText(text, maxCharsPerLine) {
  if (!text) return []
  if (text.length <= maxCharsPerLine) return [text]

  const lines = []
  let cursor = 0
  while (cursor < text.length) {
    let end = Math.min(cursor + maxCharsPerLine, text.length)
    if (end < text.length) {
      // 在 [cursor+maxChars-3, cursor+maxChars] 范围内找最近的标点
      const minEnd = Math.max(cursor + 1, cursor + maxCharsPerLine - 3)
      let bestBreak = -1
      for (let i = end; i >= minEnd; i--) {
        const ch = text[i]
        if (/[，。！？、；：,.!?;:、]/.test(ch)) {
          bestBreak = i
          break
        }
      }
      // 如果整段没有任何标点 → 强制在 maxCharsPerLine 处断
      if (bestBreak >= 0) {
        end = bestBreak + 1 // 包含标点
      }
    }
    lines.push(text.slice(cursor, end))
    cursor = end
  }
  return lines
}

/**
 * 注册 cover:* 通道
 */
export function registerCoverIpc(ipcMain) {
  logger.info('[cover] registering cover ipc')
  // ------------------------------------------------------------
  // 封面生成（cover:generate）
  // ------------------------------------------------------------
  ipcMain.handle('cover:generate', async (_, opts = {}) => {
    logger.info(`[cover:generate] ${JSON.stringify(opts)}`)
    const { videoPath, title, options } = opts

    if (!videoPath || typeof videoPath !== 'string') {
      return { success: false, error: 'videoPath 不能为空' }
    }
    if (!title || typeof title !== 'string') {
      return { success: false, error: 'title 不能为空' }
    }
    if (!options || typeof options !== 'object') {
      return { success: false, error: 'options 不能为空' }
    }
    if (!fs.existsSync(videoPath)) {
      return { success: false, error: `视频文件不存在: ${videoPath}` }
    }

    const ffmpegPath = getFFmpegBin('ffmpeg')
    if (!ffmpegPath) {
      return { success: false, error: '未找到 ffmpeg，请确认 ./ffmpeg/bin 已放置' }
    }

    try {
      // 取视频尺寸 + 时长（用于自动避让顶部 / 底部黑边）
      const ffprobePath = getFFmpegBin('ffprobe')
      let width = 1080
      let height = 1920
      let duration = 0
      try {
        if (ffprobePath) {
          const { stdout } = await runCmd(ffprobePath, [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            videoPath
          ])
          const lines = stdout.trim().split(/\r?\n/)
          for (const line of lines) {
            const [k, v] = line.split('=')
            if (k === 'width') width = parseInt(v, 10) || width
            else if (k === 'height') height = parseInt(v, 10) || height
            else if (k === 'duration') duration = parseFloat(v) || duration
          }
        }
      } catch (e) {
        logger.warn(`[cover:generate] ffprobe 失败，使用默认值: ${e.message}`)
      }

      const baseOutput = models.config.get('paths.baseOutput')

      if (!baseOutput) {
        return { success: false, error: '未配置 paths.baseOutput，无法确定输出目录' }
      }

      // 输出文件路径
      const outDir = path.join(baseOutput, 'covers')
      ensureDir(outDir)

      // 抽帧时间策略：与 cover:extract-frame 对齐
      //   - 显式指定 options.time / options.frameTime → 校验不超过视频长度
      //   - 否则在前 5 秒内随机（视频不足 5 秒则在 [0.1, duration-0.1] 范围内随机）
      const explicitTimeRaw = options.time != null ? options.time : options.frameTime
      const explicitTime = explicitTimeRaw != null && Number.isFinite(Number(explicitTimeRaw))
      let frameTime
      if (explicitTime) {
        frameTime = Math.max(0.1, Number(explicitTimeRaw))
        if (duration > 0 && frameTime > duration - 0.2) {
          frameTime = Math.max(0.1, duration - 0.2)
        }
      } else {
        const capSec = duration > 0 ? Math.min(5, duration) : 5
        const upper = Math.max(0.5, capSec - 0.1)
        const lower = 0.1
        frameTime = Math.round((lower + Math.random() * (upper - lower)) * 100) / 100
      }
      logger.info(
        `[cover:generate] 抽帧时间: ${frameTime}s (duration=${duration.toFixed(
          2
        )}s, 显式=${explicitTime})`
      )

      const outputPath = path.join(
        outDir,
        `cover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      )

      // 文字参数
      const fontSize = options.fontSize || 110
      const color = options.color || 'white'

      // 字体路径：优先级 options.fontPath(绝对路径) > options.fontName(扫描 resources/fonts) > 默认"方正粗黑宋简体"
      let fontPath = null
      if (options.fontPath && fs.existsSync(options.fontPath)) {
        fontPath = options.fontPath
      } else if (options.fontName) {
        fontPath = await resolveFontPath(options.fontName)
      }
      if (!fontPath) {
        fontPath = await getDefaultCoverFontPath()
      }
      if (!fontPath) {
        return {
          success: false,
          error: '未找到可用字体，请确认 resources/fonts 目录存在且至少有一个 ttf/otf 文件'
        }
      }
      logger.info(`[cover:generate] 使用字体: ${fontPath}`)

      // ============================================================
      // Step 1: 用 ffmpeg 抽帧（不加 drawtext），写到临时文件
      // ============================================================
      const tempDir = join(getTempPath(), 'cover-frames')
      ensureDir(tempDir)
      const framePath = join(
        tempDir,
        `frame_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      )
      const extractArgs = [
        '-hide_banner',
        '-ss',
        frameTime.toFixed(3),
        '-i',
        videoPath,
        '-frames:v',
        '1',
        '-q:v',
        '4',
        '-y',
        framePath
      ]
      logger.info(`[cover:generate] ffmpeg 抽帧 ${frameTime.toFixed(2)}s -> ${framePath}`)
      await runCmd(ffmpegPath, extractArgs)

      if (!fs.existsSync(framePath) || fs.statSync(framePath).size === 0) {
        return { success: false, error: '抽帧失败，未生成图片' }
      }

      // ============================================================
      // Step 2: 用 fontkit 解析字体，构造 SVG 文字层（base64 内嵌字体）
      // ============================================================
      let ascentRatio = 0.8 // 默认粗略居中（不同字体差异）
      let fontFamilyForSvg = 'CustomFont'
      try {
        const fontBuffer = fs.readFileSync(fontPath)
        const font = fontkit.openSync(fontPath)
        fontFamilyForSvg = font.familyName || font.postscriptName || 'CustomFont'
        // fontkit ascent 单位是 em 的千分之一
        if (font.ascent && font.descent) {
          ascentRatio = font.ascent / (font.ascent + Math.abs(font.descent))
        }
        logger.info(
          `[cover:generate] fontkit: family=${fontFamilyForSvg} ascent=${font.ascent} descent=${font.descent} ratio=${ascentRatio.toFixed(3)}`
        )
      } catch (e) {
        logger.warn(`[cover:generate] fontkit 解析失败，使用默认 ratio: ${e.message}`)
      }

      // 字体 → base64 data URI（SVG 内嵌，完全避开中文路径问题）
      const fontBase64 = fs.readFileSync(fontPath).toString('base64')
      const ext = path.extname(fontPath).toLowerCase()
      const mime = ext === '.otf' ? 'font/otf' : ext === '.ttc' ? 'font/collection' : 'font/ttf'
      const fontDataUri = `data:${mime};base64,${fontBase64}`

      // 读取底图实际像素尺寸
      const baseMeta = await sharp(framePath).metadata()
      const imgW = baseMeta.width || width
      const imgH = baseMeta.height || height

      // 单行最多字符数（粗略估算，避免一行太长）
      // 中文按 1.0em 宽，英文按 0.6em，留 10% 边距
      const safeTitle = String(title || '').trim()
      if (!safeTitle) {
        try {
          fs.unlinkSync(framePath)
        } catch {}
        return { success: false, error: 'title 不能为空' }
      }

      const maxCharsPerLine = Math.max(2, Math.floor((imgW * 0.8) / (fontSize * 0.9)))
      const lines = wrapText(safeTitle, maxCharsPerLine)

      // SVG: 多行 <text>，垂直整体居中（基于 fontkit ascent 比例）
      const lineHeight = fontSize * 1.3
      const totalHeight = lineHeight * lines.length
      const centerY = imgH / 2
      const startY = centerY - totalHeight / 2 + lineHeight * ascentRatio

      const textElements = lines
        .map((line, i) => {
          const y = startY + i * lineHeight
          // escape XML 特殊字符
          const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          return `<text x="${imgW / 2}" y="${y.toFixed(1)}" font-family="${fontFamilyForSvg}" font-size="${fontSize}" fill="${color}" text-anchor="middle" font-weight="bold">${escaped}</text>`
        })
        .join('')

      const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}" viewBox="0 0 ${imgW} ${imgH}">
  <defs>
    <style type="text/css">
      @font-face {
        font-family: "${fontFamilyForSvg}";
        src: url("${fontDataUri}") format("${ext === '.otf' ? 'opentype' : ext === '.ttc' ? 'collection' : 'truetype'}");
        font-weight: bold;
      }
    </style>
  </defs>
  ${textElements}
</svg>`.trim()

      // ============================================================
      // Step 3: sharp composite（底图 + 文字 SVG）→ 输出最终 cover
      // ============================================================
      await sharp(framePath)
        .composite([{ input: Buffer.from(textSvg, 'utf8'), top: 0, left: 0 }])
        .jpeg({ quality: 92 })
        .toFile(outputPath)

      // 清理临时抽帧文件
      try {
        fs.unlinkSync(framePath)
      } catch {}

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        return { success: false, error: '封面生成失败，未生成图片' }
      }

      let coverSize = 0
      try {
        coverSize = fs.statSync(outputPath).size
      } catch {}

      return {
        success: true,
        data: {
          coverPath: outputPath,
          coverUrl: `file://${outputPath}`,
          videoPath,
          width: imgW,
          height: imgH,
          duration,
          frameTime,
          size: coverSize
        }
      }
    } catch (e) {
      logger.error(`[cover:generate] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  // ------------------------------------------------------------
  // 封面提取（cover:extract-frame）
  // @param videoPath 视频文件路径 必填
  // @param outputPath 输出文件路径 必填
  // @param time 抽帧时间（可选）
  //
  ipcMain.handle('cover:extract-frame', async (_, params) => {
    logger.info(`[cover:extract-frame] ${JSON.stringify(params)}`)
    try {
      const { videoPath, time = undefined } = params
      const width = 1080

      if (!videoPath || typeof videoPath !== 'string') {
        return { success: false, error: 'videoPath 不能为空' }
      }

      if (!fs.existsSync(videoPath)) {
        return { success: false, error: `视频文件不存在: ${videoPath}` }
      }

      // 临时文件路径
      const outputPath = path.join(getTempPath(), 'video_frames', `cover_${Date.now()}.jpg`)
      ensureDir(path.dirname(path.resolve(outputPath)))

      const ffmpegPath = getFFmpegBin('ffmpeg')
      const ffprobePath = getFFmpegBin('ffprobe')
      if (!ffmpegPath) {
        return { success: false, error: '未找到 ffmpeg，请确认 ./ffmpeg/bin 已放置' }
      }

      // 抽帧时间策略
      const explicitTime = time != null && Number.isFinite(Number(time))

      let actualTime
      let probeDuration = 0

      // 用 ffprobe 拿真实时长（如果可用）
      try {
        if (ffprobePath) {
          const { stdout } = await runCmd(ffprobePath, [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            videoPath
          ])
          const durationSec = parseFloat(stdout.trim())
          if (!Number.isNaN(durationSec) && durationSec > 0) {
            probeDuration = durationSec
          }
        }
      } catch (e) {
        console.error('ffprobe 异常:', e)
        // ffprobe 不可用时跳过
        return { success: false, error: 'ffprobe 异常，跳过抽帧' }
      }

      if (explicitTime) {
        // 显式指定了 time → 校验 + 防止超过视频长度
        actualTime = Math.max(0.05, Number(time))
        if (probeDuration > 0 && actualTime > probeDuration - 0.2) {
          actualTime = Math.max(0.1, probeDuration - 0.2)
        }
      } else {
        // 默认：在前 5 秒随机；若视频本身不足 5 秒，按视频长度范围内随机
        const capSec = probeDuration > 0 ? Math.min(5, probeDuration) : 5
        const upper = Math.max(0.5, capSec - 0.1) // 留 0.1s 防边缘空帧
        const lower = 0.1
        actualTime = Math.round((lower + Math.random() * (upper - lower)) * 100) / 100
      }

      // 抽帧：-ss <time> -i <file> -frames:v 1 -q:v 2 -y <out>
      const args = [
        '-hide_banner',
        '-ss',
        actualTime.toFixed(3),
        '-i',
        videoPath,
        '-frames:v',
        '1',
        '-q:v',
        '4'
      ]
      if (width && Number(width) > 0) {
        args.push('-vf', `scale=${Math.round(width)}:-2`)
      }
      args.push('-y', outputPath)

      logger.info(`[cover:extract-frame] ffmpeg ${actualTime.toFixed(2)}s -> ${outputPath}`)
      await runCmd(ffmpegPath, args)

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        return { success: false, error: '抽帧失败，未生成图片' }
      }

      return {
        success: true,
        data: {
          framePath: outputPath,
          frameUrl: `file://${outputPath}`,
          videoPath,
          timestamp: actualTime
        }
      }
    } catch (e) {
      logger.error(`[cover:extract-frame] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 保存图片（cover:save）
   * @param dataUrl 图片数据 URL 必填 base64 编码的图片数据
   * @param ext 图片扩展名 必填
   */
  ipcMain.handle('cover:save', async (_, params) => {
    logger.info(`[cover:save]`)
    try {
      // dataUrl base64
      const { dataUrl, ext } = params

      const baseOutput = getOutputsPath()
      const outputPath = path.join(baseOutput, 'covers', `cover_${Date.now()}.${ext}`)

      // 1. 参数校验
      if (!params) return { success: false, error: '参数不能为空' }
      if (!dataUrl || typeof dataUrl !== 'string') {
        return { success: false, error: 'dataUrl 不能为空' }
      }
      if (!ext || typeof ext !== 'string') {
        return { success: false, error: 'ext 不能为空' }
      }

      // 2. 规范化 ext（加 .，统一小写）
      const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
      // 白名单校验，防止任意扩展名
      const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
      if (!ALLOWED_EXTS.includes(normalizedExt)) {
        return { success: false, error: `不支持的图片格式: ${normalizedExt}` }
      }

      // 3. 解析 dataUrl：data:image/<mime>;base64,<payload>
      const m = dataUrl.match(/^data:(image\/[A-Za-z0-9+.-]+);base64,(.+)$/s)
      if (!m) return { success: false, error: 'dataUrl 格式错误，期望 data:image/...;base64,...' }
      const mime = m[1]
      const base64 = m[2]

      // 4. base64 → Buffer
      let buffer
      try {
        buffer = Buffer.from(base64, 'base64')
      } catch (e) {
        return { success: false, error: `base64 解码失败: ${e.message}` }
      }
      if (!buffer || buffer.length === 0) {
        return { success: false, error: '解码后为空（base64 可能不完整）' }
      }

      // 5. 确保 covers 目录存在
      const coversDir = path.dirname(outputPath)
      ensureDir(coversDir)

      // 6. 写入文件
      try {
        fs.writeFileSync(outputPath, buffer)
        logger.info(`[cover:save] saved ${outputPath} (${buffer.length} bytes, ${mime})`)
      } catch (e) {
        logger.error(`[cover:save] write failed: ${e.message}`)
        return { success: false, error: e.message }
      }

      // 7. 校验写入结果
      if (!fs.existsSync(outputPath)) {
        return { success: false, error: '文件写入后不存在' }
      }
      const stat = fs.statSync(outputPath)
      if (stat.size === 0) {
        return { success: false, error: '文件写入后大小为 0' }
      }

      const fileName = path.basename(outputPath)
      // 8. 返回的 fileUrl 用 file:// 协议，浏览器 / Electron <img> 才能正确显示
      return {
        success: true,
        data: {
          filePath: outputPath,
          fileUrl: `file://${outputPath}`,
          fileName,
          ext: normalizedExt,
          mime,
          size: stat.size
        }
      }
    } catch (e) {
      logger.error(`[cover:save] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  // ------------------------------------------------------------
  // 保存临时图片（cover:save-temp-image）
  // @param dataUrl 图片数据 URL 必填 base64 编码的图片数据
  //
  ipcMain.handle('cover:save-temp-image', async (_, params) => {
    logger.info(`[cover:save-temp-image]`)
    try {
      const tempDir = getTempPath()
      // dataUrl base64
      const { dataUrl, ext } = params
      const outputPath = path.join(tempDir, 'cover-frame', `cover_${Date.now()}.${ext}`)

      // 1. 参数校验
      if (!params) return { success: false, error: '参数不能为空' }
      if (!dataUrl || typeof dataUrl !== 'string') {
        return { success: false, error: 'dataUrl 不能为空' }
      }
      if (!ext || typeof ext !== 'string') {
        return { success: false, error: 'ext 不能为空' }
      }

      // 2. 规范化 ext（加 .，统一小写）
      const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
      // 白名单校验，防止任意扩展名
      const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
      if (!ALLOWED_EXTS.includes(normalizedExt)) {
        return { success: false, error: `不支持的图片格式: ${normalizedExt}` }
      }

      // 3. 解析 dataUrl：data:image/<mime>;base64,<payload>
      const m = dataUrl.match(/^data:(image\/[A-Za-z0-9+.-]+);base64,(.+)$/s)
      if (!m) return { success: false, error: 'dataUrl 格式错误，期望 data:image/...;base64,...' }
      const mime = m[1]
      const base64 = m[2]

      // 4. base64 → Buffer
      let buffer
      try {
        buffer = Buffer.from(base64, 'base64')
      } catch (e) {
        return { success: false, error: `base64 解码失败: ${e.message}` }
      }
      if (!buffer || buffer.length === 0) {
        return { success: false, error: '解码后为空（base64 可能不完整）' }
      }

      // 5. 确保 covers 目录存在
      const coversDir = path.dirname(outputPath)
      ensureDir(coversDir)

      // 6. 写入文件
      try {
        fs.writeFileSync(outputPath, buffer)
        logger.info(`[cover:save-temp-image] saved ${outputPath} (${buffer.length} bytes, ${mime})`)
      } catch (e) {
        logger.error(`[cover:save-temp-image] write failed: ${e.message}`)
        return { success: false, error: e.message }
      }

      // 7. 校验写入结果
      if (!fs.existsSync(outputPath)) {
        return { success: false, error: '文件写入后不存在' }
      }

      // 8. 返回的 fileUrl 用 file:// 协议，浏览器 / Electron <img> 才能正确显示
      return {
        success: true,
        data: {
          filePath: outputPath,
          fileUrl: `file://${outputPath}`
        }
      }
    } catch (e) {
      logger.error(`[cover:save] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })
}
