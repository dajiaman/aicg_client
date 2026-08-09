import { message } from 'ant-design-vue'
import { usePipeline } from './usePipeline'
import { onMounted, ref, reactive, computed, watch } from 'vue'
import { getAIConfig, getRunMode } from '../utils'
import { subtitleStylePresets, titleStylePresets } from '../constants'
import { getDefaultViralStudioConfig } from '../store/workflow'

// 视频剪辑

// viralStudioConfig 本地持久化 key
const VS_CONFIG_STORAGE_KEY = 'viralStudioConfig'

/**
 * 从 localStorage 读取已保存的剪辑配置
 * @returns {object|null} 解析后的配置，或 null（无 / 解析失败）
 */
function loadViralStudioConfigFromStorage() {
  try {
    const raw = localStorage.getItem(VS_CONFIG_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[viralStudioConfig] 读取 localStorage 失败:', e)
    return null
  }
}

/**
 * 将剪辑配置写入 localStorage
 * @param {object} cfg - 配置对象
 */
function saveViralStudioConfigToStorage(cfg) {
  try {
    localStorage.setItem(VS_CONFIG_STORAGE_KEY, JSON.stringify(cfg))
  } catch (e) {
    console.warn('[viralStudioConfig] 写入 localStorage 失败:', e)
  }
}

export function useVideoEdit() {
  const { pipeline, updatePipelineData } = usePipeline()

  const loading = ref(false)

  const sourceVideoPath = ref('')
  const previewVideoPath = ref('')
  // 初始化：localStorage 优先，再与默认值深度合并（保证新增字段有兜底）
  const storedConfig = loadViralStudioConfigFromStorage()
  const config = reactive(
    storedConfig
      ? deepMerge(getDefaultViralStudioConfig(), storedConfig)
      : getDefaultViralStudioConfig()
  )
  const subtitleConfig = ref({
    // 字幕样式配置
    fontFamily: '微软雅黑',
    fontSize: 54,
    fontStyles: ['bold'],
    color: '#FFFFFF',
    opacity: 1,
    letterSpacing: 0,
    enableStroke: true,
    strokeWidth: 0,
    strokeColor: '#000000',
    backgroundType: 'none',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    lineHeight: 1.2,
    positionX: 540,
    positionY: 1500
  })
  const selectedMaterialCategory = ref('')
  const materialCategories = ref([])
  const materialCategoriesLoading = ref(false)
  const materialCategoryMissingTooltip = ref('')
  const materialCategoryVectorTooltip = ref('')
  const backgroundMusicPath = ref('')
  const autoBgm = ref(true)
  const bgmVolume = ref(0.3)
  const voiceVolume = ref(1)
  const selectedTemplateId = ref(null)
  const enableSubtitle = ref(true)
  const enableAiProofread = ref(true)
  const enableSilenceRemoval = ref(false)
  const silenceThreshold = ref(-30)
  const silenceDuration = ref(0.4)
  const bgmList = ref([])
  const bgmListLoading = ref(false)
  const compositionData = ref(null) // 预计算的合成数据
  const editableSubtitles = ref([]) // 字幕可编辑列表
  const editableH1 = ref('')
  const editableH2 = ref('')
  const subtitleEditorVisible = ref(false)
  const progressText = ref('')
  const dataGenerating = ref(false)
  const videoGenerating = ref(false)
  const titleGenerating = ref(false)
  const templates = ref([])
  const templatesLoading = ref(false)
  const previewingBgm = ref(null)
  const audioPlayer = ref(null)

  /**
   * 显示的视频路径
   */
  const displayVideoPath = computed(() => {
    return sourceVideoPath.value || pipeline.sourceVideoPath || ''
  })

  /**
   * 显示的视频源
   */
  const displayVideoSrc = computed(() => {
    const path = displayVideoPath.value
    if (!path) return ''
    return path.startsWith('http') || path.startsWith('file://') ? path : 'file://' + path
  })

  const displayVideoName = computed(() => {
    const path = displayVideoPath.value
    return path ? path.split(/[\\/]/).pop() : ''
  })

  const previewVideoName = computed(() => {
    const path = previewVideoPath.value || pipeline.previewVideoPath || ''
    return path ? path.split(/[\\/]/).pop() : ''
  })

  /**
   * 是否可以生成合成数据
   */
  const canGenerate = computed(() => {
    return !!displayVideoPath.value
  })

  /**
   * 是否可以生成标题
   */
  const canGenerateTitle = computed(() => {
    return canGenerate.value && !!getReferenceText()
  })

  /**
   * 选中的字幕样式预设名称
   */
  const selectedTemplateName = computed(() => {
    if (!subtitleConfig.value.templateId) return '未选择'
    const found = templates.value.find((t) => t.id === subtitleConfig.value.templateId)
    return found?.name || '未知模板'
  })

  /**
   * 背景音乐摘要
   */
  const bgmSummary = computed(() => {
    if (!config.bgm.enabled) return '已关闭'
    if (autoBgm.value && !backgroundMusicPath.value) return 'AI 根据文案自动匹配'
    if (backgroundMusicPath.value) {
      const name = backgroundMusicPath.value.split(/[\\/]/).pop()
      return name || '本地文件'
    }
    return '未选择'
  })

  /**
   * 混剪分类摘要
   */
  const mixcutSummary = computed(() => {
    if (!config.mixcut.enabled) return '未启用'
    const cat = materialCategories.value.find((c) => c.value === selectedMaterialCategory.value)
    return cat?.label || '未选择分类'
  })

  /**
   * 音效摘要
   */

  const soundEffectSummary = computed(() =>
    config.soundEffect.enabled ? '已开启 AI 音效' : '已关闭'
  )

  /**
   * 字幕摘要
   */
  const subtitleSummary = computed(() => {
    if (!enableSubtitle.value) return '已关闭'
    if (config.subtitle.presetId) {
      const found = subtitleStylePresets.find((t) => t.id === config.subtitle.presetId)
      return found?.name || '模板'
    }

    return '自定义样式'
  })

  /**
   * 标题摘要
   */
  const titleSummary = computed(() => {
    if (!config.title.enabled) return '已关闭'

    if (config.title.enabled) {
      const found = titleStylePresets.find((t) => t.id === config.title.presetId)
      return found?.name || '模板'
    }

    return '已启用'
  })

  const namecardSummary = computed(() => {
    if (!config.namecard.enabled) return '已关闭'
    return config.namecard.name || '未填写'
  })

  /**
   * 辅助：获取用于 AI 生成标题的参考文本
   * @returns {string} 参考文本
   */
  function getReferenceText() {
    const rewritten = pipeline.rewrittenContent?.trim()
    if (rewritten) return rewritten
    const original = pipeline.originalContent?.trim()
    if (original) return original

    const subs = compositionData.value?.convertedSubtitles || []
    console.log('subs', subs)
    return subs
      .map((s) => s.text || '')
      .filter(Boolean)
      .join('\n')
  }

  // 判断是否具备生成标题条件
  function hasReferenceText() {
    return !!getReferenceText()
  }

  /**
   * 验证视频文件大小和时长
   * @param {string} videoPath - 视频文件路径
   * @returns {Promise<void>} 验证通过后返回 void，否则抛出错误
   */
  async function validateVideoFile(videoPath) {
    const info = await window.api.video.getInfo(videoPath)
    if (!info.success) {
      return { ok: false, message: '无法读取视频信息，请确认文件有效' }
    }

    const duration = info.data.duration || 0
    const fileSize = info.data.size || 0

    // 时长限制：不超过 5 分钟（300秒）
    if (duration > 300) {
      const minutes = Math.floor(duration / 60)
      const seconds = Math.floor(duration % 60)
      return {
        ok: false,
        message: `云端模式下本地视频时长不能超过 5 分钟（当前约 ${minutes}分${seconds}秒）`
      }
    }

    // 大小限制：不超过 500MB
    if (fileSize > 500 * 1024 * 1024) {
      const mb = (fileSize / (1024 * 1024)).toFixed(1)
      return { ok: false, message: `云端模式下本地视频文件不能超过 500MB（当前约 ${mb}MB）` }
    }

    return { ok: true }
  }

  /**
   * 选择视频源文件
   */
  async function selectSourceVideo() {
    try {
      const opts = {
        title: '选择视频文件',
        filters: [{ name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'webm'] }]
      }
      if (sourceVideoPath.value) opts.defaultPath = sourceVideoPath.value
      const result = await window.api.file.selectFile(opts)
      if (result.success && !result.data.canceled && result.data.filePaths.length) {
        const path = result.data.filePaths[0]
        const runMode = await getRunMode()
        if (runMode === 'cloud') {
          // 检查大小和时长
          const validation = await validateVideoFile(path)
          if (!validation.ok) {
            message.warn(validation.message)
            return {
              success: false,
              message: validation.message
            }
          }
        }

        sourceVideoPath.value = path
        config.source.videoPath = path
        updatePipelineData({ sourceVideoPath: path })
        message.success('视频选择成功')
      }
    } catch (error) {
      console.error('选择视频失败:', error)
      message.error('选择视频失败：' + e.message)
    }
  }

  /**
   * 加载素材分类列表
   */
  async function loadMaterialCategories() {
    materialCategoriesLoading.value = true

    try {
      const res = await window.api.category.list()
      if (res.success) {
        materialCategories.value = res.data.map((item) => {
          return {
            id: item.id,
            name: item.name,
            label: item.name,
            value: item.id
          }
        })
        materialCategories.value.unshift({ id: '', name: '不混剪', label: '不混剪', value: '' })
      }
    } catch (err) {
      console.error('加载素材分类异常:', err)
    } finally {
      materialCategoriesLoading.value = false
    }

    // try {
    //   const res = await window.api.material.list()
    //   if (res.success) {
    //     const data = Array.isArray(res.data) ? res.data : []
    //     materialCategories.value = data
    //       .map((c) => ({
    //         id: String(c.id || c._id || ''),
    //         name: c.name || c.label || '',
    //         label: c.name || c.label || '',
    //         value: String(c.id || c._id || '')
    //       }))
    //       .filter((c) => c.id && c.name)
    //     // 添加一个"未选择"选项
    //     materialCategories.value.unshift({ id: '', name: '未选择', label: '未选择', value: '' })
    //     console.log('materialCategories', materialCategories.value)
    //   } else {
    //     console.error('加载素材分类失败:', res.error)
    //   }
    // } catch (err) {
    //   console.error('加载素材分类异常:', err)
    // } finally {
    //   materialCategoriesLoading.value = false
    // }
  }

  /**
   * 加载背景音乐列表
   */
  async function loadBgmList() {
    try {
      bgmListLoading.value = true
      const res = await window.api.videoComposition.getBgmResources()
      if (res.success) {
        bgmList.value = res.data || []
      } else {
        console.error('加载BGM失败:', res.error)
      }
    } catch (e) {
      console.error('加载BGM资源失败:', e)
    } finally {
      bgmListLoading.value = false
    }
  }

  /**
   * 选择背景音乐
   */
  async function selectBackgroundMusic() {
    try {
      const opts = {
        title: '选择背景音乐',
        filters: [{ name: '音频文件', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac'] }]
      }
      if (backgroundMusicPath.value) opts.defaultPath = backgroundMusicPath.value
      const result = await window.api.file.selectFile(opts)
      if (result.success && !result.data.canceled) {
        const path = result.data.filePath
        backgroundMusicPath.value = path
        config.bgm.path = path
        message.success('背景音乐选择成功')
        return { success: true, data: path }
      }
    } catch (e) {
      message.error('选择背景音乐失败：' + e.message)
      return { success: false, error: err.message }
    }
  }

  /**
   * 选择背景音乐资源
   */
  function selectBgmResource(path) {
    backgroundMusicPath.value = path || ''
    config.bgm.path = path || ''
  }

  // 预览 BGM（播放/暂停）
  function togglePreviewBgm(url) {
    if (previewingBgm.value === url && audioPlayer.value) {
      audioPlayer.value.pause()
      audioPlayer.value = null
      previewingBgm.value = null
      return
    }
    if (audioPlayer.value) {
      audioPlayer.value.pause()
      audioPlayer.value = null
    }
    try {
      const audio = new Audio(url)
      audio.volume = 0.5
      audio.onended = () => {
        previewingBgm.value = null
        audioPlayer.value = null
      }
      audio.onerror = () => {
        message.error('BGM播放失败')
        previewingBgm.value = null
        audioPlayer.value = null
      }
      audio.play()
      audioPlayer.value = audio
      previewingBgm.value = url
    } catch (err) {
      console.error('BGM预览失败:', err)
      message.error('BGM播放失败')
    }
  }

  /**
   * 生成合成数据
   */
  async function generateCompositionData(videoPath, onProgress) {
    if (!videoPath) {
      message.warning('请先选择视频文件')
      return { success: false, error: '无视频文件' }
    }

    dataGenerating.value = true
    progressText.value = ''

    let audioPath = ''

    try {
      onProgress?.('正在提取音频...')
      // 提取音频
      const extractRes = await window.api.video.extractAudio({
        videoPath
      })
      if (!extractRes.success || !extractRes.data?.audioPath) {
        throw new Error(extractRes.error || '提取音频失败')
      }

      audioPath = extractRes.data.audioPath
      onProgress?.('正在识别语音...')

      const runMode = await getRunMode()
      let asrResultData

      if (runMode === 'cloud') {
        onProgress?.('☁️ 使用云端语音识别...')
        asrResultData = await window.api.cloud.asr.recognize(audioPath, 'auto', true)
      } else {
        onProgress?.('💻 使用本地语音识别...')
        const localAsr = await window.api.python.asr.recognize(audioPath, 'auto', true)
        if (!localAsr.success) throw new Error(localAsr.error || '本地ASR失败')
        asrResultData = localAsr.data.data
      }

      console.log('asrResultData:', asrResultData)

      // // 缓存ASR结果（可选）
      // try {
      //   const {
      //     data: { tempDir }
      //   } = await window.api.file.getTempPath()
      //   const cacheDir = await window.api.path.join(tempDir, 'asr_cache')
      //   const hash = await window.api.crypto.md5(videoPath)
      //   const cacheFile = await window.api.path.join(cacheDir, hash + '.json')
      //   await window.api.file.mkdir(cacheDir)
      //   await window.api.file.writeText(cacheFile, JSON.stringify(asrResultData, null, 2))
      // } catch (e) {
      //   console.warn('缓存ASR失败:', e)
      // }

      onProgress?.('正在生成字幕和资源数据...')

      // 3. 获取视频信息
      const videoInfoRes = await window.api.video.getInfo(videoPath)
      if (!videoInfoRes.success) throw new Error('获取视频信息失败')
      const videoInfo = videoInfoRes.data

      // 4. 组合配置并调用后端合成数据
      const enableProof = enableAiProofread.value && getReferenceText().length > 0
      const refText = enableProof ? getReferenceText() : ''

      // 生成合成数据
      const composeData = {
        asrResult: asrResultData,
        subtitleConfig: subtitleConfig.value,
        viralStudioConfig: config || null,
        materialCategory: selectedMaterialCategory.value || null,
        backgroundMusicPath: backgroundMusicPath.value || null,
        videoInfo: videoInfo,
        templateId: selectedTemplateId.value,
        autoBgm: autoBgm.value,
        enableAiProofread: enableProof,
        enableSubtitle: enableSubtitle.value,
        referenceText: refText
      }

      console.log('composeData:', composeData)
      const composeRes = await window.api.videoComposition.generateData(
        JSON.parse(JSON.stringify(composeData))
      )
      if (!composeRes.success) throw new Error(composeRes.error || '生成合成数据失败')

      console.log('composeRes:', composeRes)

      // 保存合成数据，并同步可编辑内容
      compositionData.value = composeRes.data
      if (asrResultData?.sentences?.length) {
        compositionData.value.asrSnapshot = asrResultData
      }

      getReferenceText()
      syncEditableFromCompositionData(compositionData.value)
      syncPipelineFromConfig()

      onProgress?.('✓ 字幕和资源数据生成完成')
      message.success('字幕和资源数据生成成功！可以编辑字幕了。')
      return { success: true, data: compositionData.value }
    } catch (error) {
      console.error('生成合成数据失败:', error)
      message.error('生成失败：' + error.message)
      onProgress?.('生成失败')
      return { success: false, error: error.message }
    } finally {
      dataGenerating.value = false
      // 清理临时音频文件
      try {
        if (audioPath) await window.api.file.delete(audioPath)
      } catch (error) {
        console.warn('清理临时音频失败:', error)
      }
    }
  }

  /**
   * 从合成数据同步可编辑字幕/标题
   * @param {*} data
   * @returns
   */
  function syncEditableFromCompositionData(data) {
    if (!data) return
    if (Array.isArray(data.convertedSubtitles)) {
      editableSubtitles.value = data.convertedSubtitles.map((item, idx) => ({
        index: item.index ?? idx,
        text: item.text || '',
        start: item.start || 0,
        end: item.end || 0,
        duration: item.duration || 0,
        pipVideoPath: item.pipVideoPath || null,
        pipGroupId: item.pipGroupId || null,
        willClip: item.willClip || false
      }))
    }

    // 同步标题
    if (data.llmContent) {
      editableH1.value = data.llmContent.h1 || ''
      editableH2.value = data.llmContent.h2 || ''
    }

    // 更新缓存配置快照
    const subsHash = editableSubtitles.value.map((s) => s.text).join('|')
    const configSnapshot = {
      backgroundMusicPath: backgroundMusicPath.value,
      bgmVolume: bgmVolume.value,
      voiceVolume: voiceVolume.value,
      selectedMaterialCategory: selectedMaterialCategory.value,
      autoBgm: autoBgm.value,
      templateId: selectedTemplateId.value,
      enableAiProofread: enableAiProofread.value,
      subtitlesHash: subsHash,
      h1: editableH1.value,
      h2: editableH2.value
    }
  }

  /**
   * 检查配置是否改变
   * @returns
   */
  function hasConfigChanged() {
    return true
  }

  /**
   * 生成视频
   * @param {*} videoPath
   * @param {*} onProgress
   */
  async function generateVideo(videoPath, onProgress) {
    if (!videoPath) {
      message.warning('请先选择视频文件')
      return { success: false, error: '无视频文件' }
    }

    videoGenerating.value = true
    progressText.value = ''

    try {
      onProgress?.('开始视频合成...')

      // 检查是否可复用已有合成数据
      const existingData = compositionData.value
      const canReuse = existingData && !hasConfigChanged() // 需要实现hasConfigChanged判断
      let finalCompositionData = existingData

      if (!canReuse) {
        // 先重新生成合成数据
        const genResult = await generateCompositionData(videoPath, onProgress)
        if (!genResult.success) throw new Error(genResult.error)
        finalCompositionData = genResult.data
      } else {
        onProgress?.('✨ 智能检测：参数未变，直接使用缓存...')
        // 更新部分动态字段（如BGM路径、音量等）
        if (backgroundMusicPath.value) {
          finalCompositionData.backgroundMusic = {
            path: backgroundMusicPath.value,
            volume: bgmVolume.value,
            source: 'user_provided'
          }
        } else {
          // 自动匹配BGM逻辑
          if (autoBgm.value) {
            finalCompositionData.backgroundMusic = null // 让后端自动匹配
          } else {
            finalCompositionData.backgroundMusic = null
          }
        }
        // 更新字幕和标题
        if (editableSubtitles.value.length > 0) {
          finalCompositionData.convertedSubtitles = JSON.parse(
            JSON.stringify(editableSubtitles.value)
          )
        }
        if (editableH1.value !== finalCompositionData.llmContent?.h1) {
          finalCompositionData.llmContent.h1 = editableH1.value
        }
        if (editableH2.value !== finalCompositionData.llmContent?.h2) {
          finalCompositionData.llmContent.h2 = editableH2.value
        }
        // 更新配置快照
        syncEditableFromCompositionData(finalCompositionData)
      }

      // 调用合成API
      const composePayload = {
        sourceVideoPath: videoPath,
        bgmVolume: bgmVolume.value,
        voiceVolume: voiceVolume.value,
        backgroundMusicPath: backgroundMusicPath.value || '',
        videoInfo: await window.api.video.getInfo(videoPath).then((r) => r.data),
        templateId: selectedTemplateId.value,
        enableSubtitle: !!enableSubtitle.value,
        autoBgm: autoBgm.value,
        enableSilenceRemoval: enableSilenceRemoval.value,
        silenceThreshold: silenceThreshold.value,
        silenceDuration: silenceDuration.value,
        materialCategory: selectedMaterialCategory.value || '',
        viralStudioConfig: pipeline.viralStudioConfig || null,
        precomputedData: finalCompositionData
      }

      // 监听进度（通过回调）
      const unsubscribe = window.api.video.onProgress((msg) => {
        onProgress?.(msg)
      })

      const result = await window.api.videoComposition.compose(
        JSON.parse(JSON.stringify(composePayload))
      )
      unsubscribe()

      console.log('视频生成结果：', result)
      if (result.success) {
        previewVideoPath.value = result.data.outputPath
        // 如果返回了新的compositionData，更新
        if (result.data.compositionData) {
          compositionData.value = result.data.compositionData
          syncEditableFromCompositionData(result.data.compositionData)
        }
        updatePipelineData({
          publishVideoPath: result.data.outputPath,
          previewVideoPath: result.data.outputPath,
          compositionData: result.data.compositionData ?? finalCompositionData,
          viralStudioConfig: JSON.parse(JSON.stringify(config || {}))
        })
        message.success('带字幕视频生成成功！')
        onProgress?.('生成完成！')
        return { success: true, data: { outputPath: result.data.outputPath } }
      } else {
        throw new Error(result.error || '生成视频失败')
      }
    } catch (err) {
      console.error('生成字幕视频失败:', err)
      message.error('生成失败：' + err.message)
      onProgress?.('生成失败')
      return { success: false, error: err.message }
    } finally {
      videoGenerating.value = false
    }
  }

  /**
   * 自动生成标题（简化）
   */
  async function maybeAutoGenerateTitle() {
    if (!canGenerateTitle.value) return
    // 检查是否已存在标题或AI已尝试过
    if (config.title.text.h1 || config.title.ai?.autoAttempted) return
    // 触发生成
    await generateTitleText({ force: false, auto: true })
  }

  /**
   * 生成标题文本
   */
  async function generateTitleText({ force = true, auto = true }) {
    const ai = config.title.ai || {}
    if (titleGenerating.value) return { success: false, skipped: true, error: '正在生成' }
    if (!force && ai.manualEdited) return { success: false, skipped: true, error: '手动编辑过' }
    const refText = getReferenceText()
    if (!displayVideoPath.value || !refText) {
      return { success: false, error: '缺少视频或文案' }
    }

    titleGenerating.value = true

    try {
      // 10. 生成请求 ID
      const requestId = `viral-title-${Date.now()}`

      const prompt = `请根据视频文案生成新版灵动剪辑画面上方的双行标题。

要求：
目标语言：中文
标题内容都必须使用中文。
返回格式的字段名仍使用中文，字段值使用目标语言。
主标题：4-8 个字，强钩子，适合画面大标题
副标题：4-8 个字，补充信息、悬念、收益点
标题要短促，适合视频顶部单行展示
不要使用书名号、引号、句号，不要解释

视频文案：
${refText}

只输出：
主标题：xxx
副标题：xxx
    `

      const aiConfig = await getAIConfig()

      const result = await window.api.llm.sendStreamMessage(prompt, {
        ...aiConfig,
        requestId,
        thinking: {
          type: 'disabled'
        }
      })

      console.log('result', result)

      if (result.success) {
        const { titleMain, titleSub } = result.data
        config.title.text.h1 = titleMain || ''
        config.title.text.h2 = titleSub || ''
        config.title.ai.manualEdited = true
        config.title.ai.autoAttempted = true
        config.title.ai.generatedAt = new Date().toISOString()
        config.title.ai.source = refText
        config.title.ai.status = 'success'
        syncPipelineFromConfig()
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || '生成标题失败')
      }
    } catch (err) {
      console.error('生成标题失败:', err)
      if (!auto) message.error('AI生成失败：' + err.message)

      config.title.ai.status = 'error'
      return { success: false, error: err.message }
    } finally {
      titleGenerating.value = false
    }
  }

  /**
   * 清除混剪素材分类
   */
  function clearMixcut() {
    selectedMaterialCategory.value = ''
    // 同时清除compositionData中的混剪映射
    if (compositionData.value?.convertedSubtitles) {
      compositionData.value.convertedSubtitles = compositionData.value.convertedSubtitles.map(
        (s) => ({
          ...s,
          pipVideoPath: null,
          pipGroupId: null,
          willClip: false
        })
      )
    }

    config.mixcut.enabled = false
    syncEditableFromCompositionData(compositionData.value)
    // 更新pipeline
    updatePipelineData({ selectedMaterialCategory: '' })
  }

  /**
   * 同步混剪分类（更新到pipeline）
   */
  function syncMixcutCategory() {
    updatePipelineData({ selectedMaterialCategory: selectedMaterialCategory.value })
  }

  /**
   * 从pipeline同步配置
   */
  function syncConfigFromPipeline() {
    const p = pipeline
    if (p.viralStudioConfig) {
      // 深度合并：默认值兜底 + pipeline 中的配置
      const saved = p.viralStudioConfig
      const defaults = getDefaultViralStudioConfig()
      // 这里简单赋值，实际需深度合并
      Object.assign(config, deepMerge(defaults, saved))
    } else {
      // 从独立字段恢复
      config.source.videoPath = p.sourceVideoPath || ''
      config.source.voiceVolume = p.voiceVolume ?? 1
      config.source.bgmVolume = p.bgmVolume ?? 0.3
      config.source.playbackRate = p.playbackRate ?? 1
      config.source.silenceRemoval.enabled = p.enableSilenceRemoval ?? false
      config.source.silenceRemoval.threshold = p.silenceThreshold ?? -30
      config.source.silenceRemoval.minDuration = p.silenceDuration ?? 0.4
      config.subtitle.enabled = p.enableSubtitle ?? false
      if (p.subtitleConfig) {
        Object.assign(config.subtitle.customConfig, p.subtitleConfig)
      }
      config.subtitle.templateId = p.videoEditTemplateId || null
      config.subtitle.mode = 'template'
      config.bgm.path = p.backgroundMusicPath || ''
      config.bgm.autoMatch = p.autoBgm ?? true
      config.mixcut.enabled = !!p.selectedMaterialCategory
      config.mixcut.categoryId = p.selectedMaterialCategory || ''
    }

    // 同步独立refs
    sourceVideoPath.value = p.sourceVideoPath || ''
    previewVideoPath.value = p.previewVideoPath || ''
    compositionData.value = p.compositionData || null
    if (compositionData.value) {
      syncEditableFromCompositionData(compositionData.value)
    }

    selectedMaterialCategory.value = p.selectedMaterialCategory || ''
    backgroundMusicPath.value = p.backgroundMusicPath || ''
    autoBgm.value = p.autoBgm ?? true
    bgmVolume.value = p.bgmVolume ?? 0.3
    voiceVolume.value = p.voiceVolume ?? 1
    selectedTemplateId.value = p.videoEditTemplateId || null
    enableSubtitle.value = p.enableSubtitle ?? false
    enableAiProofread.value = p.enableAiProofread ?? true
    enableSilenceRemoval.value = p.enableSilenceRemoval ?? false
    silenceThreshold.value = p.silenceThreshold ?? -30
    silenceDuration.value = p.silenceDuration ?? 0.4

    // 同步到本地subtitleConfig
    if (p.subtitleConfig) {
      Object.assign(subtitleConfig, p.subtitleConfig)
    }
  }

  /**
   * 从config同步到pipeline数据
   */
  function syncPipelineFromConfig() {
    const data = {
      sourceVideoPath: sourceVideoPath.value,
      voiceVolume: config.source.voiceVolume,
      bgmVolume: config.source.bgmVolume,
      playbackRate: config.source.playbackRate,
      enableSilenceRemoval: config.source.silenceRemoval.enabled,
      silenceThreshold: config.source.silenceRemoval.threshold,
      silenceDuration: config.source.silenceRemoval.minDuration,
      enableSubtitle: config.subtitle.enabled,
      subtitleConfig: config.subtitle.customConfig,
      videoEditTemplateId: config.subtitle.templateId,
      backgroundMusicPath: config.bgm.path,
      autoBgm: config.bgm.autoMatch,
      selectedMaterialCategory: config.mixcut.categoryId,
      previewVideoPath: previewVideoPath.value,
      compositionData: compositionData.value,
      viralStudioConfig: JSON.parse(JSON.stringify(config))
    }

    enableSubtitle.value = config.subtitle.enabled
    updatePipelineData(data)
  }

  /**
   * 从pipeline恢复数据
   */
  async function restore() {
    syncConfigFromPipeline()

    await Promise.all([loadBgmList(), loadMaterialCategories()])

    // 3. 同步到pipeline
    syncPipelineFromConfig()

    await maybeAutoGenerateTitle()
  }

  onMounted(() => {
    restore()
  })

  // 监听可编辑变化，自动更新pipeline + 持久化到 localStorage
  watch(
    config,
    () => {
      syncPipelineFromConfig()
      saveViralStudioConfigToStorage(JSON.parse(JSON.stringify(config)))
    },
    { deep: true }
  )

  // 监听合成数据变化，同步可编辑内容
  watch(
    compositionData,
    (newVal) => {
      if (newVal) {
        syncEditableFromCompositionData(newVal)
      }
    },
    { deep: true }
  )

  return {
    loading,
    sourceVideoPath,
    previewVideoPath,
    compositionData,
    editableSubtitles,
    editableH1,
    editableH2,
    subtitleEditorVisible,
    pipeline,

    subtitleConfig,
    config,
    selectedMaterialCategory,
    materialCategories,
    materialCategoriesLoading,
    materialCategoryMissingTooltip,
    materialCategoryVectorTooltip,
    backgroundMusicPath,
    autoBgm,
    bgmVolume,
    voiceVolume,
    selectedTemplateId,
    enableSubtitle,
    enableAiProofread,
    enableSilenceRemoval,
    silenceThreshold,
    silenceDuration,
    bgmList,
    bgmListLoading,

    progressText,
    dataGenerating,
    videoGenerating,
    titleGenerating,
    previewingBgm,

    // 计算
    displayVideoPath,
    displayVideoSrc,
    displayVideoName,
    previewVideoName,
    canGenerate,
    canGenerateTitle,
    selectedTemplateName,
    bgmSummary,
    mixcutSummary,
    soundEffectSummary,
    subtitleSummary,
    titleSummary,
    namecardSummary,

    // 方法
    selectSourceVideo,
    selectBackgroundMusic,
    selectBgmResource,
    togglePreviewBgm,
    generateCompositionData,
    generateVideo,
    loadMaterialCategories,
    loadBgmList,
    syncMixcutCategory,
    clearMixcut,
    restore,
    syncEditableFromCompositionData,
    generateTitleText,
    maybeAutoGenerateTitle,
    getReferenceText,
    hasReferenceText
  }
}

/**
 * 深度合并多个普通对象
 * @param  {...object} objs 多个待合并对象
 * @returns 全新合并后的对象
 */
function deepMerge(...objs) {
  // 过滤掉 null、非对象参数
  const validObjs = objs.filter((item) => {
    return typeof item === 'object' && item !== null && !Array.isArray(item)
  })
  if (validObjs.length === 0) return {}

  return validObjs.reduce((target, source) => {
    for (const key in source) {
      if (!source.hasOwnProperty(key)) continue

      const tVal = target[key]
      const sVal = source[key]

      // 判断两边都是纯普通对象，递归深度合并
      const isTargetObj = tVal && typeof tVal === 'object' && !Array.isArray(tVal)
      const isSourceObj = sVal && typeof sVal === 'object' && !Array.isArray(sVal)

      if (isTargetObj && isSourceObj) {
        target[key] = deepMerge(tVal, sVal)
      } else {
        // 基础类型、数组直接以后面的值覆盖前面
        target[key] = sVal
      }
    }
    return target
  }, {}) // reduce 初始空对象
}
