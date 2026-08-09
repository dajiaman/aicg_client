import path from 'path'
import fs from 'fs/promises'
import { models } from '../database/services'
import logger from '../log'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'
import { getOutputsPath } from './file.ipc'
import { ensureDir, runCmd, getFFmpegBin } from '../utils/index'
import { getChromaDbInfo } from '../database/chroma'
import {
  getChromaClient,
  getEmbedder,
  searchMaterial,
  vectorizeMaterial
} from '../utils/chromaUtil'

export function registerMaterialIpc(ipcMain) {
  logger.info('[material] registering material ipc')

  // ============================================================
  // OpenAI 兼容客户端缓存（不同 baseURL/apiKey 各缓存一份）
  // ============================================================
  const openaiClientCache = new Map()
  function getOpenAIClient(baseURL, apiKey) {
    const key = `${baseURL}::${apiKey.slice(0, 8)}`
    let cli = openaiClientCache.get(key)
    if (!cli) {
      cli = new OpenAI({
        apiKey,
        baseURL,
        // 设置较长超时（视频/多图分析可能耗时）
        timeout: 60_000,
        maxRetries: 1
      })
      openaiClientCache.set(key, cli)
    }
    return cli
  }

  // ------------------------------------------------------------
  // ---------- 素材管理 ----------
  /**
   * 初始化素材管理
   */
  ipcMain.handle('material:init', async () => {
    logger.info('[material:init]')
    models.material.init()
    return { success: true, data: true }
  })

  /**
   * 删除素材
   */
  ipcMain.handle('material:delete', async (_, id) => {
    logger.info(`[material:delete] id: ${id}`)
    try {
      models.material.delete(id)
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * 批量删除素材
   */
  ipcMain.handle('material:batch-delete', async (_, ids) => {
    logger.info(`[material:batch-delete] ids: ${ids.join(', ')}`)
    let successCount = 0
    let failCount = 0

    for (const id of ids) {
      try {
        models.material.delete(id)
        successCount++
      } catch (error) {
        failCount++
      }
    }

    return {
      success: true,
      data: {
        successCount,
        failCount
      }
    }
  })

  /**
   * 批量移动素材
   */
  ipcMain.handle('material:batch-move', async (_, ids, categoryId) => {
    logger.info(`[material:batch-move] ids: ${ids.join(', ')} categoryId: ${categoryId}`)

    let successCount = 0
    let failCount = 0

    for (const id of ids) {
      try {
        models.material.update(id, {
          category_id: categoryId
        })
        successCount++
      } catch (error) {
        failCount++
      }
    }

    return {
      success: true,
      data: {
        successCount,
        failCount
      }
    }
  })

  /**
   * 更新素材描述
   */
  ipcMain.handle('material:update-description', async (_, id, description) => {
    logger.info(`[material:update-description] id: ${id}, description: ${description}`)
    try {
      await models.material.update(id, {
        description
      })
      return {
        success: true,
        data: true
      }
    } catch (error) {
      logger.error(`[material:update-description] failed: ${error.message}`)
      return {
        success: false,
        message: error.message
      }
    }
  })

  /**
   * 读取视频时长（秒），ffprobe 不可用时返回 0
   */
  async function probeVideoDuration(filePath) {
    try {
      const ffprobePath = getFFmpegBin('ffprobe')
      if (!ffprobePath) return 0
      const { stdout } = await runCmd(ffprobePath, [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        filePath
      ])
      const sec = parseFloat(String(stdout).trim())
      return Number.isFinite(sec) && sec > 0 ? sec : 0
    } catch {
      return 0
    }
  }

  /**
   * 抽取视频首帧作为封面
   */
  async function extractVideoCover(videoPath, outDir) {
    try {
      const ffmpegPath = getFFmpegBin('ffmpeg')
      if (!ffmpegPath) return null
      ensureDir(outDir)
      const coverPath = path.join(outDir, `${uuidv4()}.jpg`)
      // -ss 0.2 -i <video> -frames:v 1 -q:v 2 -y <out>
      await runCmd(ffmpegPath, [
        '-ss',
        '0.2',
        '-i',
        videoPath,
        '-frames:v',
        '1',
        '-q:v',
        '2',
        '-y',
        coverPath
      ])
      // 验证是否生成
      try {
        const st = await fs.stat(coverPath)
        if (st.size > 0) return coverPath
      } catch {}
      return null
    } catch (e) {
      log.warn('[material:upload-video] extract cover failed:', e?.message || e)
      return null
    }
  }

  /**
   * 上传视频素材
   * @param {string} filePath   源视频绝对路径
   * @param {string} categoryId 目标分类 id
   * @param {Object} options    {  remark, duration }
   *   - duration:  外部传入的视频时长（秒），>0 时优先于 ffprobe，避免重复探测
   */
  ipcMain.handle('material:upload-video', async (_, filePath, categoryId, options = {}) => {
    logger.info(
      `[material:upload-video] filePath: ${filePath}, categoryId: ${categoryId}, options: ${JSON.stringify(options)}`
    )
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, message: '视频路径不能为空' }
      }
      if (!categoryId) {
        return { success: false, message: '分类 id 不能为空' }
      }

      // 1) 校验源文件存在
      try {
        await fs.access(filePath)
      } catch {
        return { success: false, message: `源文件不存在: ${filePath}` }
      }

      const fileName = path.basename(filePath)
      // 保留 . 后缀名
      const ext = path.extname(filePath)

      // 3) 读 stat
      let stat = null
      try {
        stat = await fs.stat(filePath)
      } catch (e) {
        logger.warn('[material:upload-video] stat filePath failed:', e?.message || e)
      }

      // 4) ffprobe 时长（options.duration 优先，>0 才使用；否则再尝试 ffprobe）
      let duration = 0
      const optDuration = Number(options.duration)
      if (Number.isFinite(optDuration) && optDuration > 0) {
        duration = optDuration
      } else if (!options.skipProbe) {
        duration = await probeVideoDuration(filePath)
      }

      // 5) 抽取首帧作为封面
      let coverPath = null
      if (!options.skipCover) {
        coverPath = await extractVideoCover(filePath, path.join(getOutputsPath(), 'thumbs'))
      }

      // 6) 组装 metadata
      const meta = {
        mediaType: 'video',
        fileName: fileName,
        fileExt: ext,
        remark: options.remark || '',
        uploadTime: new Date().toISOString(),
        duration
      }

      // 7) 写入数据库
      const created = await models.material.create({
        category_id: categoryId,
        file_name: fileName,
        file_path: filePath,
        cover_path: coverPath,
        file_size: stat?.size ?? null,
        duration,
        description: options.description || options.remark || null,
        tags: options.tags || [],
        vector_id: null,
        status: 'uploaded',
        metadata: meta
      })

      logger.info(
        '[material:upload-video] saved id=%s category=%s file=%s size=%s duration=%s',
        created?.id,
        categoryId,
        fileName,
        stat?.size ?? 'unknown',
        duration
      )

      return {
        success: true,
        data: {
          id: created?.id,
          file_path: filePath,
          file_name: fileName,
          file_size: stat?.size ?? null,
          cover_path: coverPath,
          duration,
          category_id: categoryId
        }
      }
    } catch (error) {
      logger.error('[material:upload-video] failed:', error)
      return {
        success: false,
        message: error?.message || String(error)
      }
    }
  })

  /**
   * 上传图片素材
   * @param {string} filePath   源图片绝对路径
   * @param {string} categoryId 目标分类 id
   * @param {Object} options    { description, remark, tags, metadata }
   */
  ipcMain.handle('material:upload-image', async (_, filePath, categoryId, options = {}) => {
    logger.info(
      `[material:upload-image] filePath: ${filePath}, categoryId: ${categoryId}, options: ${JSON.stringify(options)}`
    )
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, message: '图片路径不能为空' }
      }
      if (!categoryId) {
        return { success: false, message: '分类 id 不能为空' }
      }

      // 1) 校验源文件存在
      try {
        await fs.access(filePath)
      } catch {
        return { success: false, message: `源文件不存在: ${filePath}` }
      }

      const fileName = path.basename(filePath)
      // 保留 . 后缀名
      const ext = path.extname(filePath)

      // 3) 读取尺寸 / 大小 / mtime 作为 metadata
      let stat = null
      try {
        stat = await fs.stat(filePath)
      } catch (e) {
        logger.warn('[material:upload-image] stat filePath failed:', e?.message || e)
      }

      const srcStat = stat

      const meta = {
        mediaType: 'image',
        fileName: fileName,
        remark: options.remark || '',
        fileExt: ext,
        uploadTime: new Date().toISOString(),
        duration: 0
      }

      // 4) 写入数据库
      const created = await models.material.create({
        category_id: categoryId,
        file_name: fileName,
        file_path: filePath,
        cover_path: filePath, // 图片无单独封面，用自身
        file_size: srcStat?.size ?? null,
        duration: 0,
        description: options.description || options.remark || null,
        tags: options.tags || [],
        vector_id: null,
        status: 'uploaded',
        metadata: meta
      })

      logger.info(
        '[material:upload-image] saved id=%s category=%s file=%s size=%s',
        created?.id,
        categoryId,
        fileName,
        srcStat?.size ?? 'unknown'
      )

      return {
        success: true,
        data: {
          id: created?.id,
          file_path: filePath,
          file_name: fileName,
          file_size: srcStat?.size ?? null,
          category_id: categoryId
        }
      }
    } catch (error) {
      logger.error('[material:upload-image] failed:', error)
      return {
        success: false,
        message: error?.message || String(error)
      }
    }
  })

  /**
   * 批量处理素材
   * @param {Array}  ids     素材 id 列表
   * @param {Object} options { visionModel, fps, baseURL, apiKey }
   *   - visionModel 视觉模型名（必填）
   *   - fps          视频每秒抽几帧（默认 1，最大 4）；仅对 avi/mkv 等非直传 mime 生效
   *   - baseURL / apiKey 调用方传入；缺省时回落到全局 ai 配置
   *   - 视频 / 图片协议由文件 mime 自动决定，调用方无需关心
   * 流程：
   *   1) 读取素材（仅支持视频 / 图片）
   *   2) 按文件 mime 决定协议：
   *        image/* 或 video/avi|mkv 等不支持直传的 → 抽帧/转 base64 后作 image_url
   *        video/mp4|quicktime|webm → 整段作 video_url
   *   3) 调 OpenAI 兼容 chat/completions 的多模态接口，让 visionModel 输出中文描述
   *   4) 把生成的描述写回数据库（description 字段 + status=tagged）
   */
  ipcMain.handle('material:batch-process', async (_, ids, options) => {
    logger.info(`[material:batch-process] ids: ${ids}, options: ${JSON.stringify(options)}`)
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return { success: false, message: '素材 id 列表不能为空' }
      }
      if (!options || typeof options !== 'object') {
        return { success: false, message: '处理选项不能为空' }
      }

      const { visionModel, fps = 1, baseURL, apiKey } = options || {}

      if (!visionModel) {
        return { success: false, message: '缺少 visionModel（视觉模型）' }
      }

      // 调用方传入的 baseURL / apiKey 优先；否则读全局 ai 配置
      let _baseURL = String(baseURL || '').replace(/\/+$/, '')
      let _apiKey = String(apiKey || '').trim()
      if (!_baseURL || !_apiKey) {
        try {
          const aiConfig = await models.config?.getCategory?.('ai')
          if (aiConfig?.success && aiConfig.data) {
            if (!_baseURL) _baseURL = String(aiConfig.data.baseURL || '').replace(/\/+$/, '')
            if (!_apiKey) _apiKey = String(aiConfig.data.apiKey || '').trim()
          }
        } catch (e) {
          logger.warn('[material:batch-process] 读取 ai 配置失败:', e?.message || e)
        }
      }
      if (!_baseURL || !_apiKey) {
        return { success: false, message: '缺少 baseURL 或 apiKey，请在 AI 配置中填写' }
      }

      const safeFps = Math.max(0.1, Math.min(4, Number(fps) || 1))

      const results = []
      for (const id of ids) {
        const r = await processOne(id, {
          baseURL: _baseURL,
          apiKey: _apiKey,
          visionModel,
          fps: safeFps
        })
        results.push(r)
      }

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      logger.info(
        '[material:batch-process] 完成：total=%s success=%s fail=%s',
        results.length,
        successCount,
        failCount
      )

      return {
        success: true,
        data: results,
        // 附加摘要放在顶层（不影响 data 数组）
        total: results.length,
        successCount,
        failCount
      }
    } catch (error) {
      logger.error('[material:batch-process] failed:', error)
      return { success: false, message: error?.message || String(error) }
    }
  })

  /**
   * 把本地文件读为 base64 data URL（含 mime 推断）
   */
  async function fileToDataUrl(filePath) {
    const buf = await fs.readFile(filePath)
    const ext = (path.extname(filePath) || '.jpg').replace(/^\./, '').toLowerCase()
    let mime = 'application/octet-stream'
    if (['jpg', 'jpeg'].includes(ext)) mime = 'image/jpeg'
    else if (ext === 'png') mime = 'image/png'
    else if (ext === 'webp') mime = 'image/webp'
    else if (ext === 'gif') mime = 'image/gif'
    else if (ext === 'bmp') mime = 'image/bmp'
    else if (['mp4', 'm4v'].includes(ext)) mime = 'video/mp4'
    else if (ext === 'mov') mime = 'video/quicktime'
    else if (ext === 'webm') mime = 'video/webm'
    else if (ext === 'avi') mime = 'video/x-msvideo'
    else if (ext === 'mkv') mime = 'video/x-matroska'
    else if (ext === 'mp3') mime = 'audio/mpeg'
    else if (ext === 'wav') mime = 'audio/wav'
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) mime = `image/${ext}`
    else if (['mp4', 'mov', 'webm', 'mkv'].includes(ext)) mime = `video/${ext}`
    return { dataUrl: `data:${mime};base64,${buf.toString('base64')}`, mime, size: buf.length }
  }

  /**
   * 处理单个素材：抽帧 → 多模态描述 → 写库
   *
   * 协议根据文件 mime 自动判断（调用方无需关心）：
   *   - image/*          → image_url
   *   - video/mp4 | mov | webm → video_url（豆包 Seed-1.6 / Gemini 等支持）
   *   - 其他视频（avi/mkv 等）→ 用 ffmpeg 抽帧后按 image_url 发送
   *   - 其他类型 → 跳过
   */
  async function processOne(materialId, ctx) {
    const { baseURL, apiKey, visionModel, fps } = ctx
    try {
      const mat = await models.material.get(materialId)
      if (!mat) return { id: materialId, success: false, message: '素材不存在' }

      const meta = mat.metadata || {}
      const kind =
        meta.kind ||
        (mat.file_path && /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(mat.file_path) ? 'video' : 'image')
      if (!['video', 'image'].includes(kind)) {
        return { id: materialId, success: false, message: `不支持的素材类型 kind=${kind}` }
      }

      let visionPayload = {}
      let usedMode = ''

      if (kind === 'image') {
        // 图片：image_url
        try {
          const { dataUrl, mime, size } = await fileToDataUrl(mat.file_path)
          visionPayload = { images: [{ url: dataUrl, mime, path: mat.file_path, size }] }
          usedMode = 'image'
        } catch (e) {
          return { id: materialId, success: false, message: '读取图片失败：' + (e?.message || e) }
        }
      } else if (kind === 'video') {
        // 视频：按 mime 决定走 video_url 还是 image_url
        let mime = ''
        try {
          const info = await fileToDataUrl(mat.file_path)
          mime = info.mime
        } catch (e) {
          return { id: materialId, success: false, message: '读取视频失败：' + (e?.message || e) }
        }

        const VIDEO_DIRECT_MIME = new Set([
          'video/mp4',
          'video/quicktime', // mov
          'video/webm'
        ])

        if (VIDEO_DIRECT_MIME.has(mime)) {
          // 走 video_url（豆包 Seed-1.6-Vision / Gemini 1.5+ 等支持）
          try {
            const { dataUrl } = await fileToDataUrl(mat.file_path)
            visionPayload = { video: { dataUrl, mime } }
            usedMode = 'video'
          } catch (e) {
            return { id: materialId, success: false, message: '读取视频失败：' + (e?.message || e) }
          }
        } else {
          // 不直传支持的格式（avi/mkv 等）→ ffmpeg 抽帧后按 image_url 发送
          const framePaths = await extractVideoFrames(mat.file_path, fps)
          const images = []
          for (const fp of framePaths) {
            try {
              const { dataUrl, mime: fMime, size } = await fileToDataUrl(fp)
              images.push({ url: dataUrl, mime: fMime, path: fp, size })
            } catch (e) {
              log.warn(`[material:batch-process] readFile ${fp} failed:`, e?.message || e)
            }
          }
          if (images.length === 0) {
            return { id: materialId, success: false, message: '抽帧失败，请检查 ffmpeg / 视频文件' }
          }
          visionPayload = { images }
          usedMode = 'frames'
        }
      }

      // 调多模态（使用内置固定 prompt，调用方无需关心）
      const desc = await callVisionLLM({
        baseURL,
        apiKey,
        visionModel,
        ...visionPayload
      })

      if (!desc) {
        return { id: materialId, success: false, message: '视觉模型未返回有效描述' }
      }

      // 写库
      await models.material.update(materialId, {
        description: desc,
        status: 'tagged'
      })

      return {
        success: true,
        data: {
          id: materialId,
          description: desc
        }
      }
    } catch (e) {
      log.error(`[material:batch-process] processOne ${materialId} failed:`, e)
      return {
        success: false,
        message: e?.message || String(e),
        data: {
          id: materialId
        }
      }
    }
  }

  /**
   * 按 fps 抽取视频帧到临时目录
   * @returns {Promise<string[]>} 帧图片路径列表
   */
  async function extractVideoFrames(videoPath, fps) {
    const ffmpegPath = getFFmpegBin('ffmpeg')
    if (!ffmpegPath) {
      logger.warn('[material:batch-process] ffmpeg 不可用')
      return []
    }
    const safeFps = Math.max(0.1, Math.min(4, Number(fps) || 1))
    const tempDir = path.join(getOutputsPath(), 'frames', uuidv4())
    ensureDir(tempDir)
    // 输出模板：frame-%03d.jpg
    const outPattern = path.join(tempDir, 'frame-%03d.jpg')

    // -vf fps=N：把视频按 N fps 重采样（均匀采样关键帧）
    const args = ['-i', videoPath, '-vf', `fps=${safeFps}`, '-q:v', '3', '-y', outPattern]

    try {
      await runCmd(ffmpegPath, args, { timeoutMs: 60_000 })
    } catch (e) {
      logger.warn('[material:batch-process] ffmpeg 抽帧失败:', e?.message || e)
      return []
    }

    // 列出生成的帧
    try {
      const files = await fs.readdir(tempDir)
      const jpgs = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort()
      return jpgs.map((f) => path.join(tempDir, f))
    } catch {
      return []
    }
  }

  /**
   * 固定的视觉描述 prompt（中文，≤80 字）
   * 用于素材库的自动标记场景：场景、动作、视觉风格 → 便于后续检索匹配
   */
  const VISION_PROMPT =
    '请用中文描述这段视频/图片的内容，重点描述场景、动作、视觉风格，以便后续检索与匹配。要求：1) 不超过 80 字；2) 不要带"这段视频显示"等前缀，直接描述。'

  /**
   * 调用 OpenAI 兼容的多模态 chat/completions，返回中文描述
   *
   * 使用 openai SDK（自动适配 OpenAI / Doubao / Qwen / Gemini / 自建网关）
   *
   * 两种入参形式（互斥，按优先级）：
   *   1. opts.video   = { dataUrl, mime }    → 作为 video_url 发送给豆包/Gemini 等支持视频直传的模型
   *   2. opts.images  = [{ url, path }, ...]  → 作为 image_url[] 多模态数组
   *   都没有 → 直接返回空串
   */
  async function callVisionLLM(opts) {
    const { baseURL, apiKey, visionModel, images, video } = opts

    let content
    if (video && video.dataUrl) {
      content = [
        { type: 'text', text: VISION_PROMPT },
        { type: 'video_url', video_url: { url: video.dataUrl } }
      ]
    } else if (Array.isArray(images) && images.length > 0) {
      content = [
        { type: 'text', text: VISION_PROMPT },
        ...images.slice(0, 6).map((img) => ({
          type: 'image_url',
          image_url: { url: img.url }
        }))
      ]
    } else {
      logger.warn('[callVisionLLM] 缺少 video 与 images，无法调用')
      return ''
    }

    try {
      const client = getOpenAIClient(baseURL, apiKey)
      const resp = await client.chat.completions.create({
        model: visionModel,
        messages: [{ role: 'user', content }],
        temperature: 0.5,
        max_tokens: 256,
        stream: false
      })

      const choice = resp?.choices?.[0]
      const msg = choice?.message?.content || choice?.text || ''
      return String(msg || '').trim()
    } catch (e) {
      const status = e?.status || e?.response?.status
      const detail = e?.error?.message || e?.message || String(e)
      logger.error(
        `[material:batch-process] LLM 调用失败${status ? ' status=' + status : ''}: ${detail}`
      )
      return ''
    }
  }

  /**
   * 向量化素材
   */
  ipcMain.handle('material:vectorize', async (_, materialId) => {
    logger.info(`[material:vectorize] materialId=${materialId}`)
    const material = await models.material.get(materialId)
    if (!material) {
      return { id: materialId, success: false, message: '素材不存在' }
    }

    try {
      const res = await vectorizeMaterial(material)
      return { success: true, data: res }
    } catch (error) {
      logger.error('[material:vectorize] error:', error?.message || error)
      return { success: false, error: error.message }
    }
  })

  /**
   * 搜索素材
   */
  ipcMain.handle('material:search', async (_, query, categoryId) => {
    logger.info(`[material:search] query=${query}, categoryId=${categoryId}`)

    try {
      const result = await searchMaterial(
        query,
        20,
        0.8,
        categoryId
          ? {
              categoryId: String(categoryId)
            }
          : null
      )

      if (result.length > 0) {
        const vectorIds = result.map((item) => item.vectorId)
        // 查询一下
        const materials = models.material.getByVectorIds(vectorIds)
        return {
          success: true,
          data: {
            results: materials
          }
        }
      } else {
        return { success: true, data: [] }
      }
    } catch (error) {
      logger.error('[material:search] error:', error?.message || error)
      return { success: false, error: error.message }
    }
  })

  /**
   * 验证素材分类文件
   */
  ipcMain.handle('material:verify-category-files', async (_, categoryId) => {
    logger.info(`[material:verify-category-files] categoryId=${categoryId}`)
    return { success: true, data: [] }
  })
}
