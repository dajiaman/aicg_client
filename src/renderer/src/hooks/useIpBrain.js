import { message } from 'ant-design-vue'
import { computed, reactive, ref } from 'vue'
import { getAIConfig } from '../utils/index.js'

/**
 * 在一段混杂的 LLM 文本里，找出**第一个完整且合法的顶层 JSON 对象**
 *
 * 解决的问题：
 *   - 之前用 `{[\s\S]*}` 贪婪匹配 → 把第一行 '{' 到最后一行的 '}' 之间所有内容当作 JSON，
 *     当 LLM 在 JSON 之外还说了"为... 为什么你越懂事越没人..."等说明文字时，解析报错：
 *     `SyntaxError: Unexpected token '为'... is not valid JSON`
 *   - 现在按字符扫描括号深度（注意跳过字符串内部与转义），遇到完整的顶层 `{...}`
 *     立刻用 JSON.parse 验证合法性，不合法则继续向后寻找。
 *
 * @param {string} text
 * @returns {string|null}
 */
function extractFirstJsonObject(text) {
  if (!text || typeof text !== 'string') return null
  let depth = 0
  let inStr = false
  let escape = false
  let start = -1
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (inStr) {
      if (c === '\\') {
        escape = true
        continue
      }
      if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === '{') {
      if (depth === 0) start = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1)
        try {
          JSON.parse(candidate)
          return candidate
        } catch {
          start = -1
        }
      } else if (depth < 0) {
        depth = 0
        start = -1
      }
    }
  }
  return null
}

/**
 * 清洗 LLM 输出中残留的 markdown 代码块标记
 */
function stripMarkdownFence(text) {
  if (!text) return ''
  return text
    .replace(/^[\s\S]*?(?=\{)/, (m) => m) // 保留前面的内容
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim()
}

/**
 * 清洗选题标题（去引号、《》、前缀词）
 */
function cleanTopic(t) {
  return String(t || '')
    .replace(/[《》【】""'']/g, '')
    .replace(/^(标题|文案|主题|选题)[:：\s]+/, '')
    .trim()
}

// IP 大脑
export function useIpBrain() {
  const loading = ref(false)
  const archives = ref([])
  const createForm = reactive({
    url: '',
    deepLearning: true
  })

  const generating = ref(false)
  const analysisResult = ref(null)
  const styleAnalysis = ref('')
  const topics = ref([])
  const currentArchive = ref(null)
  const copyGenerating = ref(false)
  const generatedCopies = ref([])

  const hasIpArchives = computed(() => archives.value.length > 0)

  // ---------- 档案 CRUD ----------

  const loadArchives = async () => {
    try {
      const res = await window.api.ipBrain.list()
      if (res.success) {
        console.log('ipBrain list:', res.data)
        archives.value = res.data || []
      } else {
        console.error('加载IP档案失败:', res?.error)
        message.error('加载IP档案失败：' + (res?.error || '未知错误'))
        archives.value = []
      }
    } catch (err) {
      console.error('加载IP档案异常:', err)
      message.error('加载IP档案异常：' + err.message)
      archives.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建IP档案
   */
  const createArchive = async () => {
    if (!createForm.url) {
      message.warning('请输入博主主页链接')
      return false
    }
    if (!/^https?:\/\//i.test(createForm.url)) {
      message.warning('请输入有效的 http(s) 链接')
      return false
    }

    loading.value = true
    try {
      const result = await window.api.ipBrain.create({
        url: createForm.url,
        deepLearning: createForm.deepLearning
      })

      if (result?.success) {
        message.success('IP档案创建成功')
        createForm.url = ''
        createForm.deepLearning = true
        await loadArchives()
        return true
      } else {
        message.error('创建失败：' + (result?.error || '未知错误'))
        return false
      }
    } catch (err) {
      console.error('创建IP档案异常:', err)
      message.error('创建异常：' + err.message)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除IP档案
   */
  const deleteArchive = async (id) => {
    try {
      const result = await window.api.ipBrain.delete(id)
      if (result?.success) {
        message.success('删除成功')
        await loadArchives()
      } else {
        message.error('删除失败：' + (result?.error || '未知错误'))
      }
    } catch (err) {
      console.error('删除异常:', err)
      message.error('删除异常：' + err.message)
    }
  }

  /**
   * 构建分析提示
   */
  const buildAnalyzePrompt = (archive, excludeTopics) => {
    const name = archive.name
    const videos = archive.video_list || []
    const texts = []

    let prompt = `请分析该博主（${name}）的创作风格和选题思路。`
    prompt += `\n【热门视频参考】：\n`

    const sampledVideos = [...videos].sort(() => 0.5 - Math.random()).slice(0, 5)
    sampledVideos.forEach((video, index) => {
      const title = (video.title || video.desc || '').replace(/#\S+/g, '').trim()
      prompt += `${index + 1}. 标题：${title}（点赞：${video.digg_count}，评论：${video.comment_count}）\n`
    })

    // 如果有文案样例，取2个
    if (texts && texts.length > 0) {
      prompt += `\n【爆款视频详细文案风格】：\n`
      const sampledTexts = [...texts].sort(() => 0.5 - Math.random()).slice(0, 2)
      sampledTexts.forEach((text, i) => {
        prompt += `范文${i + 1}：\n${text.content}\n\n`
      })
    }

    if (excludeTopics && excludeTopics.length > 0) {
      prompt += `\n【排除选题】：\n请注意，以下是刚才已经生成过的选题，请**不要**重复生成类似的，换一批全新的视角和方向：\n`
      prompt += excludeTopics.join('\n') + '\n'
    }

    prompt += `根据以上信息进行创作，并以纯 JSON 格式返回、其中topics数组长度为5条。`
    prompt += `\n要求：
1. 不要包含 markdown 格式标记（\`\`\`json），直接返回 JSON 字符串，严格注意json的格式。
2. JSON 结构如下：
{
  "style_analysis": "这里是作者选题风格分析内容（要求详细，100字左右）",
  "topics": [
    "选题标题1",
    "选题标题2",
    "选题标题3",
    "选题标题4",
    "选题标题5"
  ]
}
3. 选题标题要纯净，不要包含《》、【】、""等符号，不要包含话题标签。
4. 选题要符合短视频爆款创作的逻辑，要求吸引人，符合抖音热门选题逻辑。
5. 如果提供了【排除选题】，请务必提供差异化的新选题。`

    return prompt
  }

  /**
   * 分析IP档案
   */
  const analyzeArchive = async (id, excludeTopics = []) => {
    generating.value = true
    analysisResult.value = null
    styleAnalysis.value = ''
    topics.value = []

    try {
      const archiveResult = await window.api.ipBrain.get(id)
      if (!archiveResult?.success) {
        throw new Error(archiveResult?.message || '获取档案失败')
      }
      currentArchive.value = archiveResult.data
      const archive = archiveResult.data

      // ---------------- Prompt ----------------
      let prompt = buildAnalyzePrompt(archive, excludeTopics)

      // ---------------- 调用 LLM ----------------
      const requestId = 'ip_analyze_' + Date.now()

      const aiConfig = await getAIConfig()

      const result = await window.api.llm.sendStreamMessage(prompt, {
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens,
        thinking: { type: 'disabled' },
        requestId
      })

      if (!result?.success) {
        throw new Error(result?.error || 'AI分析失败')
      }

      // ---------------- 最终解析 ----------------
      let finalText = result.data?.response || ''
      finalText = stripMarkdownFence(finalText)

      const jsonStr = extractFirstJsonObject(finalText)
      if (!jsonStr) {
        throw new Error('AI 输出中未找到合法 JSON（可能模型输出夹杂了大量说明文字）')
      }

      let parsed
      try {
        parsed = JSON.parse(jsonStr)
      } catch (e) {
        throw new Error('AI 输出 JSON 解析失败：' + e.message)
      }

      // 兜底处理：风格 + 选题
      const finalStyle = String(parsed.style_analysis || '').trim()
      const finalTopics = Array.isArray(parsed.topics)
        ? parsed.topics.map(cleanTopic).filter(Boolean)
        : []

      if (!finalStyle && finalTopics.length === 0) {
        throw new Error('AI 输出为空或字段缺失')
      }

      analysisResult.value = parsed
      styleAnalysis.value = finalStyle
      topics.value = finalTopics

      return { success: true, data: parsed }
    } catch (err) {
      console.error('AI分析失败:', err)
      message.error('AI分析失败：' + (err.message || '未知错误'))
      return { success: false, error: err.message }
    } finally {
      generating.value = false
    }
  }

  /**
   * 刷新选题
   */
  const refreshTopics = async (id) => {
    const existing = topics.value || []
    await analyzeArchive(id, existing)
  }

  /**
   * 构建文案创作提示
   */
  const buildPrompt = (topicText, styleAnalysis) => {
    let prompt = `你是一个专业的短视频文案创作者。请根据以下要求为选题创作一篇文案。`
    prompt += `\n选题：${topicText}\n\n`
    prompt += `【账号风格分析】：\n${styleAnalysis}`
    prompt += `【创作要求】：
1. 深度结合选题和参考范文的风格进行创作。
2. 语言要口语化，有网感，开头要吸引人（黄金3秒）。
3. 篇幅适中，适合短视频拍摄。
4. 字数260字左右。\n\n`

    prompt += `【输出格式强约束】
1. 只输出最终文案正文，不得输出标题。
2. 不得输出任何话题标签/文案标签（如 #xxx、【xxx】等）。
3. 不得输出 emoji 表情。
4. 不得输出解释、过程、分析、注释或任何与文案无关的内容。
5. 输出内容不用换行`
    return prompt
  }

  /**
   * 生成文案
   */
  const generateIpCopy = async (topic) => {
    if (!topic) {
      message.warning('请选择选题')
      return
    }
    const archive = currentArchive.value
    if (!archive) {
      message.warning('请先分析 IP 档案')
      return
    }

    copyGenerating.value = true
    generatedCopies.value = []

    try {
      // 选题兼容性
      const topicText = typeof topic === 'string' ? topic : topic.title || String(topic || '')

      // 准备 3 个 slot
      const baseRid = 'ip_copy_' + Date.now()
      const copies = []

      for (let i = 0; i < 3; i++) {
        copies.push({
          id: baseRid + '_' + i,
          text: '',
          generating: true,
          streaming: false,
          completed: false,
          usedToken: 0
        })
      }
      generatedCopies.value = copies

      // 拉 AI 配置
      const aiConfig = await getAIConfig()

      // 订阅 chunk（按 rid 路由）。每个 slot 的首 chunk 到达时翻转 streaming=true，
      // 触发模板里的"打字光标"提示。
      const unsubscribe = window.api.llm.onStreamChunk(({ requestId, chunk }) => {
        if (!chunk) return
        const slot = generatedCopies.value.find((c) => c.id === requestId)
        if (slot) {
          if (!slot.streaming) slot.streaming = true
          slot.text += chunk
        }
      })

      // 并发 3 路（流式：每个 task 的 .then/.catch 负责单路结束，
//   流式 chunk 通过 onStreamChunk 推送，slot.streaming/text 实时更新）
      const tasks = copies.map((slot) => {
        return window.api.llm
          .sendStreamMessage(buildPrompt(topicText, styleAnalysis.value), {
            model: aiConfig.model,
            temperature: aiConfig.temperature,
            maxTokens: aiConfig.maxTokens,
            thinking: { type: 'disabled' },
            requestId: slot.id
          })
          .then((res) => {
            slot.streaming = false
            slot.generating = false
            // 成功判定：接口 success，或已通过流拿到过内容（说明接口 success 标志位不一致）
            slot.completed = !!(res?.success || (slot.text && slot.text.length > 0))
            if (res?.success) {
              // 用接口返回的完整响应做最终覆盖，避免 chunk 拼接丢尾部
              const finalText = res.data?.response ?? res.data?.data?.response ?? slot.text
              if (finalText) slot.text = finalText
              if (res.data?.usage?.total_tokens) {
                slot.usedToken = res.data.usage.total_tokens
              }
            } else if (!slot.text) {
              slot.text = '生成失败：' + (res?.error || '未知错误')
            }
          })
          .catch((e) => {
            slot.streaming = false
            slot.generating = false
            // 异常时如果有 chunk 已写入，也视为成功（流到一半网络断）
            slot.completed = !!(slot.text && slot.text.length > 0)
            if (!slot.text) {
              slot.text = '生成异常：' + (e?.message || String(e))
            }
          })
      })

      // 等待所有流任务完成（IPC resolve / reject）
      await Promise.allSettled(tasks)
      // 兜底：仍处于 generating 的 slot（异常未触发回调）置为失败
      generatedCopies.value.forEach((slot) => {
        if (slot.generating) {
          slot.streaming = false
          slot.generating = false
          slot.completed = false
          if (!slot.text) slot.text = '生成失败：未收到响应'
        }
      })
      // 给最后的 chunk 一点缓冲时间
      await new Promise((r) => setTimeout(r, 200))
      if (typeof unsubscribe === 'function') unsubscribe()

      const totalCount = generatedCopies.value.length
      const successCount = generatedCopies.value.filter((c) => c.completed).length
      if (totalCount === 0) {
        message.warning('未启动任何生成任务')
      } else if (successCount === totalCount) {
        message.success(`已生成 ${totalCount} 篇文案，请选择一个使用`)
      } else if (successCount > 0) {
        message.warning(`已完成 ${successCount} / ${totalCount} 篇`)
      } else {
        message.error('全部生成失败')
      }
    } catch (err) {
      console.error('IP文案生成失败:', err)
      message.error('生成失败：' + err.message)
    } finally {
      copyGenerating.value = false
    }
  }

  return {
    loading,
    archives,
    createForm,
    generating,
    analysisResult,
    styleAnalysis,
    topics,
    currentArchive,
    copyGenerating,
    generatedCopies,
    hasIpArchives,
    loadArchives,
    createArchive,
    deleteArchive,
    analyzeArchive,
    refreshTopics,
    generateIpCopy
  }
}
