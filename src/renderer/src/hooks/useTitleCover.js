import { onMounted, ref, watch } from 'vue'
import { usePipeline } from './usePipeline'
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import { usePermission } from './usePermission'
import { getAIConfig } from '../utils'

/**
 * 清理标签：移除 # 前缀，去除空白
 */
function cleanTag(tag) {
  return tag.replace(/^#+/, '').trim()
}

/**
 * 从描述中提取标签
 */
function extractTagsFromDescription(desc) {
  if (!desc) return []
  const tagRegex = /[#＃]([^\s#＃,，。、!！?？:：;；""''（）()【】\[\]]+)/g
  const tags = []
  let match
  while ((match = tagRegex.exec(desc)) !== null) {
    const tag = cleanTag(match[1])
    if (tag && !tags.includes(tag)) {
      tags.push(tag)
    }
  }
  return tags
}

/**
 * 封面/视频标题/描述/标签 管理
 */
export function useTitleCover() {
  const publishTitle = ref('') // 发布标题（主标题）
  const coverTitleMain = ref('') // 封面主标题（单独存储，用于设计器）
  const coverTitleSub = ref('') // 封面副标题（单独存储，用于设计器）

  const publishDescription = ref('') //发布描述
  const publishTags = ref([]) // 话题标签

  const aiGenerating = ref(false) // 是否正在生成AI内容

  const coverPath = ref('') // 封面图片本地路径
  const coverGenerating = ref(false) // 封面生成中状态
  const coverTemplate = ref('default') // 当前使用的封面模板 ID

  const coverPreviewOpen = ref(false) // 封面预览弹窗是否打开

  // 设计器相关
  const designerRef = ref(null)
  const designerConfig = ref(null)
  const designerRevision = ref(0) // 设计器版本号（用于强制刷新）
  const designerVideoPath = ref('')
  const designerVideoSrc = ref('')
  const sourceVideoName = ref('')

  // 导出封面视频
  const exportingCoverVideo = ref(false)
  const exportCoverVideoPath = ref('')

  const coverPreviewSrc = ref('')

  const progressText = ref('')

  // 封面是否被编辑但未保存（由设计器控制）
  const coverDirty = ref(false)

  // 获取工作流 pipeline（由父级注入）
  const { pipeline, updatePipelineData } = usePipeline()

  const { checkFullPermission } = usePermission()

  /**
   * 是否显示引导提示
   * 当视频源存在且标题、封面都为空时，显示引导提示
   */
  const showGenerateGuide = computed(() => {
    return !!(
      designerVideoPath.value &&
      !publishTitle.value &&
      !coverPath.value &&
      !aiGenerating.value
    )
  })

  /**
   * 是否可以生成标题
   * 当视频源存在或有源视频路径时，可以生成标题
   */
  const canGenerateTitle = computed(() => {
    return !!(designerVideoPath.value || pipeline.value?.sourceVideoPath)
  })

  /**
   * 从 pipeline 恢复标题、描述、标签
   */
  function restoreFromPipeline() {
    const pl = pipeline || {}
    if (pl.publishTitle) publishTitle.value = pl.publishTitle
    if (pl.coverTitleMain) coverTitleMain.value = pl.coverTitleMain
    if (pl.coverTitleSub) coverTitleSub.value = pl.coverTitleSub
    if (pl.publishDescription) publishDescription.value = pl.publishDescription

    if (pl.publishTags && Array.isArray(pl.publishTags)) {
      publishTags.value = [...pl.publishTags]
    }

    if (pl.coverPath) {
      coverPath.value = normalizeUrl(pl.coverPath)
    }

    if (pl.coverUrl) {
      coverPath.value = pl.coverUrl
    }

    if (pl.previewVideoPath) {
      designerVideoPath.value = pl.previewVideoPath
      sourceVideoName.value = getFileNameFromPath(pl.previewVideoPath)
      designerVideoSrc.value = normalizeUrl(pl.previewVideoPath)
    } else if (pl.generatedVideoPath) {
      designerVideoPath.value = pl.generatedVideoPath
      sourceVideoName.value = getFileNameFromPath(pl.generatedVideoPath)
      designerVideoSrc.value = normalizeUrl(pl.generatedVideoPath)
    } else if (pl.sourceVideoPath) {
      designerVideoPath.value = pl.sourceVideoPath
      sourceVideoName.value = getFileNameFromPath(pl.sourceVideoPath)
      designerVideoSrc.value = normalizeUrl(pl.sourceVideoPath)
    }

    // 从 pipeline 恢复封面设计器配置
    if (pl.coverDesignerConfig) {
      designerConfig.value = pl.coverDesignerConfig
    }
  }

  function getFileNameFromPath(path) {
    if (!path) return ''
    return path.split(/[\\/]/).pop() || ''
  }

  function normalizeUrl(url) {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
      return url
    }
    return 'file://' + url.replace(/\\/g, '/')
  }

  /**
   * 1. AI 生成标题、描述、标签（不生成封面图片）
   */
  const generateTitleOnly = async () => {
    const configRes = await window.api.config.getAll()
    if (!configRes.success || !configRes.data.ai.apiKey) {
      message.error('AI服务未配置，请检查是否激活会员')
      return { success: false, error: 'AI服务未配置' }
    }

    if (!canGenerateTitle.value) {
      message.warning('缺少可用于生成标题的视频或文案')
      return { success: false, error: '缺少必要数据' }
    }

    aiGenerating.value = true
    progressText.value = 'AI正在生成标题...'

    try {
      // 获取文案内容
      const content = pipeline.rewrittenContent || pipeline.originalContent || ''
      if (!content) {
        throw new Error('请先生成文案')
      }

      // 获取语言设置
      const targetLanguage = pipeline.voiceTargetLanguage || 'zh'

      // 构建 Prompt
      const prompt = buildTitlePrompt(content, targetLanguage)

      // 获取 AI 配置
      const aiConfig = await getAIConfig()

      // 调用 LLM
      const requestId = 'title_gen_' + Date.now()

      const response = await window.api.llm.sendStreamMessage(prompt, {
        model: aiConfig.model || 'doubao-seed-2-0-lite-260215',
        temperature: aiConfig.temperature || 0.8,
        maxTokens: aiConfig.maxTokens || 2048,
        thinking: { type: 'disabled' },
        requestId
      })

      if (!response.success) {
        throw new Error(response.error || 'AI生成失败')
      }

      console.log('response:', response)

      // 最终解析
      const finalText = response.data.response
      const parsed = parseTitleFromStream(finalText)

      console.log('parsed:', parsed)
      if (parsed.publishTitle) publishTitle.value = parsed.publishTitle
      if (parsed.coverTitleMain) coverTitleMain.value = parsed.coverTitleMain
      if (parsed.coverTitleSub) coverTitleSub.value = parsed.coverTitleSub
      if (parsed.description) publishDescription.value = parsed.description
      if (parsed.tags && parsed.tags.length > 0) {
        publishTags.value = parsed.tags
      }

      // 更新 pipeline
      updatePipelineData({
        publishTitle: publishTitle.value,
        coverTitleMain: coverTitleMain.value,
        coverTitleSub: coverTitleSub.value,
        publishDescription: publishDescription.value,
        publishTags: publishTags.value
      })

      progressText.value = '标题生成完成！'
      message.success('标题生成成功')
      return {
        success: true,
        data: {
          publishTitle: publishTitle.value,
          coverTitleMain: coverTitleMain.value,
          coverTitleSub: coverTitleSub.value
        }
      }
    } catch (err) {
      console.error('AI生成标题失败:', err)
      message.error('AI生成标题失败：' + err.message)
      progressText.value = '生成失败'
      return { success: false, error: err.message }
    } finally {
      aiGenerating.value = false
      setTimeout(() => {
        progressText.value = ''
      }, 3000)
    }
  }

  // ---------- 构建标题生成 Prompt ----------
  function buildTitlePrompt(content, targetLanguage = 'zh') {
    let prompt = `请为以下内容生成一个吸引人的标题，要求简洁有力，能够吸引用户点击，标题字数控制在12字以内，描述控制在50字以内：

目标语言：中文
主标题、副标题、发布标题、描述和标签内容都必须使用中文。
返回格式的字段名仍使用中文，字段值使用目标语言。

文案：
${content}


请严格按以下格式返回（字段名保持中文；标签独立成行，多个标签用空格分隔，每个标签用 # 开头）：
主标题：[封面最大文字，目标语言中的短促强钩子]
副标题：[封面辅助文字，目标语言中的补充信息、悬念或收益点]
发布标题：[短视频发布标题，目标语言中的自然标题]
描述：[目标语言中的描述文字，不要在描述里夹杂 # 标签]
标签：#标签1 #标签2 #标签3

不要输出额外说明或无关内容。
不要使用书名号或引号包裹标题。只输出内容，不要解释`
    return prompt
  }

  // ---------- 流式解析标题 ----------
  function parseTitleFromStream(text) {
    const result = {
      publishTitle: '',
      coverTitleMain: '',
      coverTitleSub: '',
      description: '',
      tags: []
    }

    // 解析主标题
    const mainMatch = text.match(/主标题[：:]\s*(.+?)(?=\n|$)/)
    if (mainMatch) result.coverTitleMain = mainMatch[1].trim()

    // 解析副标题
    const subMatch = text.match(/副标题[：:]\s*(.+?)(?=\n|$)/)
    if (subMatch) result.coverTitleSub = subMatch[1].trim()

    // 解析发布标题
    const titleMatch = text.match(/发布标题[：:]\s*(.+?)(?=\n|描述|$)/)
    if (titleMatch) result.publishTitle = titleMatch[1].trim()

    // 如果没找到发布标题，尝试匹配"标题"
    if (!result.publishTitle) {
      const fallbackMatch = text.match(/标题[：:]\s*(.+?)(?=\n|描述|$)/)
      if (fallbackMatch) result.publishTitle = fallbackMatch[1].trim()
    }

    // 解析描述
    const descMatch = text.match(/描述[：:]\s*([\s\S]+?)(?=\n\s*标签[：:]|$)/)
    if (descMatch) result.description = descMatch[1].trim()

    // 解析标签
    const tagMatch = text.match(/标签[：:]\s*([\s\S]+)/)
    if (tagMatch) {
      const tagText = tagMatch[1].trim()
      const tags = tagText
        .split(/[,\s，、]+/)
        .map((t) => cleanTag(t))
        .filter(Boolean)
      result.tags = tags
    }

    // 如果没有解析到发布标题，尝试用主标题+副标题组合
    if (!result.publishTitle && result.coverTitleMain) {
      result.publishTitle =
        result.coverTitleMain + (result.coverTitleSub ? ' ' + result.coverTitleSub : '')
    }

    return result
  }

  /**
   *  仅生成封面（基于已有标题）
   */
  const generateCover = async (title) => {
    const titleToUse = title || publishTitle.value
    if (!titleToUse) {
      message.warning('请先输入标题或生成标题')
      return { success: false, error: '标题为空' }
    }

    const videoPath =
      pipeline.sourceVideoPath ||
      pipeline.previewVideoPath ||
      pipeline.generatedVideoPath ||
      pipeline.videoPath

    if (!videoPath) {
      message.warning('未找到视频源，无法生成封面')
      return { success: false, error: '未找到视频源' }
    }

    if (coverGenerating.value) return { success: false, error: '正在生成中' }

    coverGenerating.value = true
    progressText.value = '正在生成封面...'

    try {
      // 封面生成 API 调用
      const result = await window.api.cover.generate({
        videoPath: videoPath,
        title: titleToUse,
        options: {
          templateId: coverTemplate.value || 'default'
        }
      })
      console.log('cover generate result: ', result)

      if (result.success && result.data?.coverPath) {
        const url = normalizeUrl(result.data.coverPath)
        coverPath.value = url
        coverPreviewSrc.value = url

        updatePipelineData({
          coverPath: url,
          coverUrl: url
        })

        message.success('封面生成成功')
        progressText.value = '封面生成完成！'
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || '封面生成失败')
      }
    } catch (error) {
      console.error('生成封面失败:', error)
      message.error('生成封面失败：' + error.message)
      progressText.value = '封面生成失败！'
      return { success: false, error: error.message }
    } finally {
      coverGenerating.value = false
      setTimeout(() => {
        progressText.value = ''
      }, 3000)
    }
  }

  const generateTitleAndCover = async () => {
    const titleResult = await generateTitleOnly()
    if (!titleResult.success) {
      return titleResult
    }

    // 使用新生成的标题生成封面
    const coverResult = await generateCover(titleResult.data?.publishTitle || publishTitle.value)
    if (!coverResult.success) {
      return coverResult
    }

    return {
      success: true,
      data: {
        publishTitle: publishTitle.value,
        coverTitleMain: coverTitleMain.value,
        coverTitleSub: coverTitleSub.value,
        publishDescription: publishDescription.value,
        publishTags: publishTags.value,
        coverPath: coverPath.value
      }
    }
  }

  /**
   * 封面更新回调（内部使用，同时也会由外部设计器调用）
   * @param {Object} result - { coverPath, coverUrl, config }
   */
  const onCoverUpdated = (result) => {
    if (result.coverUrl || result.coverPath) {
      coverPath.value = result.coverUrl || result.coverPath
      coverDirty.value = false
    }

    if (result.config) {
      designerConfig.value = result.config
    }

    updatePipelineData({
      coverPath: result.coverPath,
      coverUrl: result.coverUrl,
      coverDesignerConfig: result.config || null
    })

    window.dispatchEvent(
      new CustomEvent('workflow:state-change', {
        detail: {
          step: 'titleCover',
          hasCover: true,
          coverDirty: false
        }
      })
    )
  }

  /**
   *  手动生成标题
   */
  async function handleGenerateTitle() {
    if (!checkFullPermission?.('标题封面')) return
    if (aiGenerating.value) return
    await generateTitleOnly()
  }

  /**
   * 选择封面视频源
   */
  const handleSelectVideoSource = async () => {
    try {
      const result = await window.api.file.selectFile({
        title: '选择封面视频源',
        filters: [{ name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'webm'] }]
      })
      if (result.success && !result.data.canceled && result.data.filePaths.length) {
        const path = result.data.filePaths[0]
        designerVideoPath.value = path
        designerVideoSrc.value = normalizeUrl(path)
        sourceVideoName.value = getFileNameFromPath(path)
        updatePipelineData({ sourceVideoPath: path })
        message.success('视频源已更新')
      }
    } catch (err) {
      console.error('选择视频失败:', err)
      message.error('选择视频失败：' + err.message)
    }
  }

  /**
   * 打开封面所在文件夹
   */
  async function handleOpenCover() {
    if (!coverPath.value) {
      message.warning('暂无封面')
      return
    }
    try {
      // 获取真实路径（去除 file:// 前缀）
      const realPath = coverPath.value.replace(/^file:\/\//, '')
      const result = await window.api.file.showInFolder(realPath)
      if (result.success) {
        message.success('已打开封面所在文件夹')
      } else {
        message.error(result.error || '打开文件夹失败')
      }
    } catch (err) {
      console.error('打开封面失败:', err)
      message.error('打开封面失败')
    }
  }

  /**
   * 导出封面（另存为）
   */
  async function handleExportCover() {
    if (!coverPath.value) {
      message.warning('请先生成封面')
      return
    }
    try {
      const realPath = coverPath.value.replace(/^file:\/\//, '')
      const fileName = getFileNameFromPath(realPath) || 'cover.jpg'
      const result = await window.api.file.saveDialog({
        title: '导出封面',
        defaultPath: fileName,
        filters: [
          { name: '图片文件', extensions: ['jpg', 'png', 'jpeg'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      })
      if (result.success && !result.data.canceled && result.data.filePath) {
        const copyResult = await window.api.file.copy(realPath, result.data.filePath)
        if (copyResult.success) {
          message.success('封面导出成功')
        } else {
          message.error(copyResult.error || '导出失败')
        }
      }
    } catch (err) {
      console.error('导出封面出错:', err)
      message.error('导出封面出错：' + err.message)
    }
  }

  /**
   *  导出封面视频
   */
  async function handleExportCoverVideo() {
    if (!coverPath.value) {
      message.warning('请先生成封面')
      return
    }

    const videoPath =
      designerVideoPath.value ||
      pipeline.value?.sourceVideoPath ||
      pipeline.value?.generatedVideoPath

    if (!videoPath) {
      message.warning('未找到视频源，无法生成封面视频')
      return
    }

    exportingCoverVideo.value = true
    progressText.value = '正在生成封面视频...'

    try {
      // 保存导出路径对话框
      const saveResult = await window.api.file.saveDialog({
        title: '导出封面视频',
        filters: [
          { name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'webm'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      })

      if (saveResult.success && !saveResult.data.canceled && saveResult.data.filePath) {
        // 导出视频带封面
        const result = await window.api.video.embedCover({
          videoPath: videoPath,
          coverPath: coverPath.value,
          outputPath: saveResult.data.filePath
        })
        if (result.success) {
          exportCoverVideoPath.value = saveResult.data.filePath
          message.success('封面视频导出成功')
        } else {
          throw new Error(result.error || '导出失败')
        }
      }
    } catch (err) {
      console.error('导出封面视频出错:', err)
      message.error('导出封面视频出错：' + err.message)
    } finally {
      exportingCoverVideo.value = false
      progressText.value = ''
    }
  }

  /**
   *  处理设计器确认
   */
  const onDesignerConfirm = (payload) => {
    const data = payload
    if (data.coverUrl || data.coverPath) {
      coverPath.value = data.coverUrl || normalizeUrl(data.coverPath)
      coverPreviewSrc.value = coverPath.value
      if (data.designerConfig) {
        designerConfig.value = data.designerConfig
        designerRevision.value += 1
      }
      updatePipelineData?.({
        coverPath: data.coverPath || data.coverUrl,
        coverUrl: data.coverUrl || coverPath.value,
        coverDesignerConfig: data.designerConfig || null
      })

      onCoverUpdated(data)
      coverDirty.value = false
      message.success('封面已更新')
    }
  }

  /**
   * 处理设计器脏状态变化
   */
  function handleDesignerDirtyChange(dirty) {
    coverDirty.value = dirty
  }

  // ---------- 监听变化 ----------

  watch(
    [publishTitle, coverTitleMain, coverTitleSub, publishDescription, publishTags, coverPath],
    () => {
      updatePipelineData({
        publishTitle: publishTitle.value,
        coverTitleMain: coverTitleMain.value,
        coverTitleSub: coverTitleSub.value,
        publishDescription: publishDescription.value,
        publishTags: [...publishTags.value],
        coverPath: coverPath.value
      })
    },
    { deep: true }
  )

  /**
   * 当视频路径变化时，重置设计器配置
   */
  watch(
    designerVideoPath,
    (newPath, oldPath) => {
      if (newPath && newPath !== oldPath) {
        if (designerRef.value) {
          designerRef.value?.refreshAutoFrame()
        }
      }
    },
    { immediate: true }
  )

  // ---------- 初始化 ----------
  function init() {
    restoreFromPipeline()

    // 如果有封面，设置预览
    if (coverPath.value) {
      coverPreviewSrc.value = coverPath.value
    }
  }

  onMounted(() => {
    // 自动初始化
    init()
  })

  // ===== 返回暴露的 API =====
  return {
    // 状态
    publishTitle,
    coverTitleMain,
    coverTitleSub,
    publishDescription,
    publishTags,

    aiGenerating,
    coverPath,
    coverGenerating,
    coverTemplate,

    coverPreviewOpen,
    coverPreviewSrc,
    progressText,
    designerConfig,
    designerRevision,
    designerVideoPath,
    designerVideoSrc,
    sourceVideoName,
    exportingCoverVideo,
    exportCoverVideoPath,
    coverDirty,
    showGenerateGuide,
    canGenerateTitle,

    // 方法
    generateTitleOnly,
    generateCover,

    handleGenerateTitle,
    handleSelectVideoSource,
    onDesignerConfirm,
    handleDesignerDirtyChange,
    handleOpenCover,
    handleExportCover,
    handleExportCoverVideo,

    restoreFromPipeline,
    init,

    onCoverUpdated,

    // 引用（用于模板）
    designerRef: designerRef
  }
}
