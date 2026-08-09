import logger from '../log'
import { getAppRootPath, getTempPath } from './file.ipc'
import fs from 'fs'
import path from 'path'
import { models } from '../database/services'
import { normalizePath, pathFileName, ensureDir, getFFmpegBin, runCmd } from '../utils/index'
import { DEFAULT_TEMPLATE } from '../constants'
import { v4 as uuidv4 } from 'uuid'
const { instance: ViralAssEngine } = require('./viral-ass-engine/index.js')

/**
 * 注册 videoRender:* 通道
 */
export function registerVideoCompositionIpc(ipcMain) {
  logger.info('[video-composition] registering video composition ipc')

  /**
   * 合成视频
   */
  ipcMain.handle('video-composition:compose', async (_, params) => {
    logger.info(`[video-composition:compose] param:`, JSON.stringify(params))

    ensureDir(path.join(getAppRootPath(), 'outputs', 'videos'))
    ensureDir(path.join(getTempPath(), 'ass'))

    // 返回的data对象
    const returnData = {
      compositionData: null,
      duration: 0,
      fileSize: 0,
      hasBackgroundMusic: false,
      outputPath: '',
      pipVideoCount: 0,
      subtitleCount: 0
    }

    // 视频输出路径（最终返回给 renderer 的路径）
    let outputPath = path.join(getAppRootPath(), 'outputs', 'videos', `${uuidv4()}.mp4`)

    // 参数格式参考 D:\code_project\aigc-client\1.json 中的
    const { sourceVideoPath, enableSubtitle, videoInfo, viralStudioConfig, precomputedData } =
      params

    // 生成字幕文件路径
    let generatedAssPath = ''
    const fontsDir = path.join(getAppRootPath(), 'resources', 'fonts')

    // 开启了字幕
    if (enableSubtitle) {
      generatedAssPath = path.join(getTempPath(), 'ass', `viral-ass-${Date.now()}.ass`)

      const isTemplateMode = viralStudioConfig.subtitle.mode === 'template'
      if (isTemplateMode) {
        const params = {
          subtitle: {
            show: true,
            data: precomputedData.convertedSubtitles,
            template_id: viralStudioConfig.subtitle.presetId
          },
          options: {
            fontsDir: fontsDir,
            outputPath: generatedAssPath,
            resolutionX: videoInfo.width,
            resolutionY: videoInfo.height
          }
        }
        const res = await ViralAssEngine.generate(params)
        fs.writeFileSync(generatedAssPath, res)
      } else {
        const params = {
          subtitle: {
            show: true,
            data: precomputedData.convertedSubtitles,
            customStyle: viralStudioConfig.subtitle.customConfig
          },
          options: {
            fontsDir: fontsDir,
            outputPath: generatedAssPath,
            resolutionX: videoInfo.width,
            resolutionY: videoInfo.height
          }
        }
        const res = await ViralAssEngine.generate(params)
        fs.writeFileSync(generatedAssPath, res)
      }
    }

    const ffmpegPath = getFFmpegBin('ffmpeg')
    if (!ffmpegPath) {
      return {
        success: false,
        message: '未找到 ffmpeg.exe',
        error: 'ffmpeg not found'
      }
    }

    try {
      if (generatedAssPath) {
        // === 烧字幕：重新编码视频流 + 保留音轨 ===
        // ffmpeg subtitles 滤镜对路径里的 : 和 \ 需要转义
        const escAss = generatedAssPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:')
        logger.info(
          `[video-composition:compose] burn subtitle: ${sourceVideoPath} + ${generatedAssPath} → ${outputPath}`
        )
        await runCmd(ffmpegPath, [
          '-y',
          '-i',
          sourceVideoPath,
          '-vf',
          `subtitles='${escAss}'`,
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-crf',
          '23',
          '-c:a',
          'copy',
          outputPath
        ])
      } else {
        // === 不烧字幕：直接流复制（无需重新编码） ===
        logger.info(`[video-composition:compose] just copy: ${sourceVideoPath} → ${outputPath}`)
        await runCmd(ffmpegPath, ['-y', '-i', sourceVideoPath, '-c', 'copy', outputPath])
      }

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        return {
          success: false,
          message: '视频合成失败，未生成输出文件',
          error: 'ffmpeg produced no output'
        }
      }
      logger.info(`[video-composition:compose] 视频合成完成: ${outputPath}`)

      returnData.fileSize = fs.statSync(outputPath).size
      returnData.outputPath = outputPath
    } catch (e) {
      logger.error('[video-composition:compose] 视频合成失败:', e)
      return {
        success: false,
        message: '视频合成失败',
        error: e.message,
        assPath: generatedAssPath || undefined
      }
    }

    return {
      success: true,
      data: returnData
    }
  })

  /**
   * 生成视频数据
   *
   * 核心流程：
   * 1. 解析 ASR 结果，生成可编辑字幕
   * 2. 调用 LLM 生成标题（如果有参考文本）
   * 3. AI 法务审核（如果启用）
   * 4. 处理 BGM（自动匹配或使用指定路径）
   * 5. 查询素材库获取画中画视频列表
   * 6. 合并所有配置，生成完整的合成数据
   */
  ipcMain.handle('video-composition:generate-data', async (_, params) => {
    logger.info(`[video-composition:generate-data] param:`, JSON.stringify(params))

    const {
      asrResult,
      autoBgm,
      backgroundMusicPath,
      enableAiProofread,
      enableSubtitle,
      materialCategory,
      subtitleConfig,
      templateId,
      videoInfo,
      viralStudioConfig,
      referenceText
    } = params

    // 返回结构
    const result = {
      backgroundMusic: {
        category: '',
        path: '',
        source: 'auto_selected',
        volume: 0.3
      },
      convertedSubtitles: [],
      llmContent: null,
      materialCategory: '',
      pipVideos: [],
      processedSubtitles: [],
      resourceSelection: {
        bgm_category: '通用',
        keyframe_animations: [],
        sound_effects: []
      },
      subtitleResult: {
        config: {},
        subtitles: []
      },
      template: {
        bgm_category: '',
        description: '',
        viralStudioConfig: {}
      }
    }

    try {
      if (viralStudioConfig.subtitle.enabled) {
        // 1. 处理字幕（从 ASR 结果转换）
        if (enableSubtitle !== false && asrResult) {
          const subtitles = await processAsrSubtitles(asrResult, viralStudioConfig)
          result.convertedSubtitles = subtitles.converted
          result.processedSubtitles = subtitles.processed
          result.subtitleResult = {
            config: subtitleConfig || {},
            subtitles: subtitles.processed
          }
        }
      }

      // // 2. 调用 LLM 生成标题（如果有参考文本）
      // if (referenceText && typeof referenceText === 'string' && referenceText.trim()) {
      //   const llmResult = await generateTitleByLlm(referenceText)
      //   if (llmResult.success) {
      //     result.llmContent = llmResult.data
      //   }
      // }

      // 3. AI 法务审核（如果启用）
      // if (enableAiProofread && referenceText && typeof referenceText === 'string') {
      //   const reviewResult = await legalReview(referenceText)
      //   if (reviewResult.success && reviewResult.data) {
      //     logger.info(
      //       `[video-composition:generate-data] legal review: hasRisk=${reviewResult.data.hasRisk}`
      //     )
      //     // 如果有风险且有清理后的内容，更新字幕文本
      //     if (reviewResult.data.hasRisk && reviewResult.data.cleanedContent) {
      //       result.legalReview = reviewResult.data
      //       // 更新所有字幕文本为清理后的版本
      //       if (result.processedSubtitles.length > 0) {
      //         result.processedSubtitles = result.processedSubtitles.map((sub) => ({
      //           ...sub,
      //           text: reviewResult.data.cleanedContent
      //         }))
      //         result.convertedSubtitles = result.convertedSubtitles.map((sub) => ({
      //           ...sub,
      //           text: reviewResult.data.cleanedContent
      //         }))
      //         result.subtitleResult.subtitles = result.processedSubtitles
      //       }
      //     }
      //   }
      // }

      // 开启了 BGM 功能，处理 BGM 配置和路径
      if (viralStudioConfig.bgm.enabled) {
        // 4. 处理 BGM
        if (backgroundMusicPath) {
          const normalizedPath = normalizePath(backgroundMusicPath)
          if (fs.existsSync(normalizedPath)) {
            result.backgroundMusic = {
              category: '自定义',
              path: normalizedPath,
              source: 'manual',
              volume: viralStudioConfig?.bgm?.volume ?? 0.3,
              volumn: viralStudioConfig?.bgm?.volume ?? 0.3 // 兼容旧字段名
            }
            result.resourceSelection.bgm_category = '自定义'
          } else {
            logger.warn('[video-composition:generate-data] BGM file not found:', normalizedPath)
          }
        } else if (autoBgm) {
          const bgmResult = await selectAutoBgm()
          if (bgmResult.success) {
            result.backgroundMusic = {
              category: bgmResult.data.category || '通用',
              path: bgmResult.data.path || '',
              source: 'auto_selected',
              volume: viralStudioConfig?.bgm?.volume ?? 0.3,
              volumn: viralStudioConfig?.bgm?.volume ?? 0.3 // 兼容旧字段名
            }
            result.resourceSelection.bgm_category = bgmResult.data.category || '通用'
          }
        }
      }

      // PIP 功能处理
      if (viralStudioConfig.mixcut.enabled) {
        // 5. 处理画中画素材（如果指定了分类）
        if (materialCategory) {
          const pipResult = await getPipVideosByCategory(materialCategory)
          if (pipResult.success) {
            result.pipVideos = pipResult.data
            result.materialCategory = materialCategory
          }
        }
      }

      if (!templateId) {
        // defualt template
        result.template = DEFAULT_TEMPLATE
        result.template.project_settings = Object.assign({}, result.template.project_settings, {
          duration: videoInfo.duration,
          width: videoInfo.width,
          height: videoInfo.height
        })
      }

      logger.info('[video-composition:generate-data] completed successfully')
      return { success: true, data: result }
    } catch (e) {
      logger.error('[video-composition:generate-data] failed:', e)
      return { success: false, error: e.message, data: result }
    }
  })

  /**
   * 获取 BGM 系统库资源
   * 目录约定：<appRoot>/resources/bgm/<分类>/<音频文件>
   * 返回两级嵌套 [{ name: 分类名, files: [{ name, path }] }, ...]
   *   - name:  分类目录名（情感 / 新闻 / 知识科普 / 营销 / 通用）
   *   - files: 该分类下的音频文件数组
   *     - name:  文件名（含扩展名）
   *     - path:  绝对路径
   */
  ipcMain.handle('video-composition:get-bgm-resources', async () => {
    logger.info('[video-composition:get-bgm-resources]')
    const bgmDir = path.join(getAppRootPath(), 'resources/bgm')

    // 目录不存在视为空库（不要报错）
    if (!fs.existsSync(bgmDir)) {
      logger.warn('[video-composition:get-bgm-resources] BGM 目录不存在:', bgmDir)
      return { success: true, data: [] }
    }

    // 支持的音频扩展名
    const AUDIO_EXTS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'])

    try {
      const categoryEntries = await fs.promises.readdir(bgmDir, { withFileTypes: true })
      const groups = []

      for (const catEntry of categoryEntries) {
        if (!catEntry.isDirectory()) continue
        const category = catEntry.name
        const catDir = path.join(bgmDir, category)

        let fileEntries
        try {
          fileEntries = await fs.promises.readdir(catDir, { withFileTypes: true })
        } catch (e) {
          logger.warn(`[video-composition:get-bgm-resources] 跳过分类 ${category}:`, e.message)
          continue
        }

        const files = []
        for (const fileEntry of fileEntries) {
          if (!fileEntry.isFile()) continue
          const ext = path.extname(fileEntry.name).toLowerCase()
          if (!AUDIO_EXTS.has(ext)) continue
          files.push({
            name: fileEntry.name,
            path: path.join(catDir, fileEntry.name)
          })
        }

        // 跳过空分类，保持列表紧凑
        if (files.length === 0) continue

        // 分类内文件名按中文排序
        files.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

        groups.push({
          name: category,
          files
        })
      }

      // 分类按中文排序
      groups.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

      return { success: true, data: groups }
    } catch (e) {
      logger.error('[video-composition:get-bgm-resources] error', e)
      return { success: false, error: '读取 BGM 资源失败：' + e.message, data: [] }
    }
  })
}

/**
 * 处理 ASR 结果，转换为字幕格式
 * @param {object} asrResult - ASR 语音识别结果
 * @param {object} viralStudioConfig - Viral Studio 配置，包含字幕配置
 * @returns {object} { converted, processed }
 */
async function processAsrSubtitles(asrResult, viralStudioConfig) {
  const converted = []
  const processed = []

  // 兼容不同的 ASR 结果格式
  const segments = asrResult.sentences

  for (let index = 0; index < segments.length; index++) {
    const seg = segments[index]
    const text = seg.text
    if (!text.trim()) continue

    const start = seg.start !== undefined ? seg.start : seg.begin || 0
    const end = seg.end !== undefined ? seg.end : seg.end_time || start + 2
    const duration = end - start

    // 转换后的字幕（用于编辑）
    converted.push({
      index,
      text: text.trim(),
      start: Math.max(0, start) / 1000,
      end: Math.max(start, end) / 1000,
      duration: Math.max(0, duration) / 1000
    })

    // 处理后的字幕（用于合成）
    processed.push({
      id: `subtitle_${index + 1}`,
      text: text.trim(),
      start: Math.max(0, start),
      end: Math.max(start, end),
      duration: Math.max(0, duration),
      style: viralStudioConfig.subtitle.presetId || 'default'
    })
  }

  return { converted, processed }
}

/**
 * 调用 LLM 生成视频标题
 * @param {string} referenceText - 参考文本（文案内容）
 * @returns {object} { success, data: { h1, h2 } }
 */
async function generateTitleByLlm(referenceText) {
  const apiKey = String(models.config.get('ai.apiKey') || '').trim()
  const baseURL = String(
    models.config.get('ai.baseURL') || 'https://ark.cn-beijing.volces.com/api/v3'
  ).trim()
  const model = String(models.config.get('ai.model') || 'doubao-seed-2-0-lite-260215').trim()

  if (!apiKey) {
    logger.warn('[video-composition:generate-data] LLM not configured, skip title generation')
    return { success: false, error: 'AI 服务未配置' }
  }

  const url = baseURL.replace(/\/$/, '') + '/chat/completions'

  const systemPrompt = `你是一位短视频标题创作专家，擅长根据文案内容生成吸引人的标题。
你的任务是：
1) 阅读用户提供的文案内容
2) 生成一个主标题（h1）和一个副标题（h2）
3) 标题要简洁有力，符合短视频平台风格（抖音、快手等）
4) 主标题不超过20字，副标题不超过15字
5) 严格只输出 JSON，不要包含任何解释性文字`

  const userPrompt = `请根据以下文案内容生成短视频标题。

文案：
"""
${referenceText}
"""

返回 JSON 结构（严格匹配字段名）：
{
  "h1": "主标题",
  "h2": "副标题"
}`

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        temperature: 0.8,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      })
    })

    const text = await resp.text()
    if (!resp.ok) {
      logger.error(`[video-composition:generate-data] LLM HTTP ${resp.status}: ${text.slice(0, 500)}`)
      return { success: false, error: `LLM HTTP ${resp.status}` }
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return { success: false, error: 'LLM 返回非 JSON' }
    }

    const messageContent =
      parsed?.choices?.[0]?.message?.content || parsed?.choices?.[0]?.text || ''

    let result
    try {
      const cleaned = String(messageContent)
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      result = JSON.parse(cleaned)
    } catch {
      logger.error(
        `[video-composition:generate-data] title parse failed: ${String(messageContent).slice(0, 300)}`
      )
      return { success: false, error: '标题解析失败' }
    }

    return {
      success: true,
      data: {
        h1: String(result.h1 || '').trim(),
        h2: String(result.h2 || '').trim()
      }
    }
  } catch (e) {
    logger.error(`[video-composition:generate-data] title generation failed: ${e.message}`)
    return { success: false, error: e.message }
  }
}

/**
 * 自动选择 BGM（从系统库中随机选择一个）
 * @returns {object} { success, data: { category, path, name } }
 */
async function selectAutoBgm() {
  try {
    const bgmDir = path.join(getAppRootPath(), 'resources/bgm')
    if (!fs.existsSync(bgmDir)) {
      return { success: false, error: 'BGM 目录不存在' }
    }

    const AUDIO_EXTS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'])
    const categoryEntries = await fs.promises.readdir(bgmDir, { withFileTypes: true })

    const allFiles = []
    for (const catEntry of categoryEntries) {
      if (!catEntry.isDirectory()) continue
      const category = catEntry.name
      const catDir = path.join(bgmDir, category)

      let fileEntries
      try {
        fileEntries = await fs.promises.readdir(catDir, { withFileTypes: true })
      } catch {
        continue
      }

      for (const fileEntry of fileEntries) {
        if (!fileEntry.isFile()) continue
        const ext = path.extname(fileEntry.name).toLowerCase()
        if (!AUDIO_EXTS.has(ext)) continue
        allFiles.push({
          category,
          path: path.join(catDir, fileEntry.name),
          name: fileEntry.name
        })
      }
    }

    if (allFiles.length === 0) {
      return { success: false, error: 'BGM 库为空' }
    }

    // 随机选择一个
    const randomIndex = Math.floor(Math.random() * allFiles.length)
    const selected = allFiles[randomIndex]

    return {
      success: true,
      data: {
        category: selected.category,
        path: selected.path,
        name: selected.name
      }
    }
  } catch (e) {
    logger.error('[video-composition:generate-data] auto BGM selection failed:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 根据分类获取画中画视频列表
 * @param {string} categoryId - 素材分类 ID
 * @returns {object} { success, data: Array }
 */
async function getPipVideosByCategory(categoryId) {
  try {
    const result = await models.material.list({
      categoryId,
      status: 'uploaded',
      pageSize: 50
    })

    const pipVideos = result.data.map((item) => ({
      id: item.id,
      name: item.file_name || pathFileName(item.file_path),
      path: item.file_path,
      coverPath: item.cover_path || '',
      duration: item.duration || 0,
      fileSize: item.file_size || 0,
      tags: item.tags || [],
      metadata: item.metadata || {}
    }))

    return { success: true, data: pipVideos }
  } catch (e) {
    logger.error('[video-composition:generate-data] pip videos query failed:', e)
    return { success: false, error: e.message, data: [] }
  }
}
