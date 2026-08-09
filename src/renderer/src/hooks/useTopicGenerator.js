import { message } from 'ant-design-vue'
import { reactive, ref } from 'vue'
import { getAIConfig } from '../utils'

// 爆款选题
export function useTopicGenerator() {
  const topicForm = reactive({
    keyword: '',
    persona: undefined,
    customPersona: '',
    targetAudience: ''
  })

  const keywordAnalysis = ref('')
  const topics = ref([])
  const generating = ref(false)
  const generatedTopicHistory = ref([])
  const copyGenerating = ref(false)
  const generatedCopies = ref([])

  const personaOptions = [
    { label: '老板型IP', value: '老板型IP' },
    { label: '专家型IP', value: '专家型IP' },
    { label: '创业者IP', value: '创业者IP' },
    { label: '创始人IP', value: '创始人IP' },
    { label: '顾问型IP', value: '顾问型IP' },
    { label: '从业者经验派', value: '从业者经验派' },
    { label: '知识科普型', value: '知识科普型' },
    { label: '测评种草型', value: '测评种草型' },
    { label: '避坑顾问型', value: '避坑顾问型' },
    { label: '通用个人IP', value: '通用个人IP' }
  ]

  /**
   * 构建 LLM 提示词
   * @param {*} history
   */
  const buildTopicPrompt = (history = []) => {
    let prompt = `你是短视频爆款选题策划专家，擅长为个人IP设计真人出镜口播短视频选题。\n\n`

    prompt += `
用户输入：
关键词：${topicForm.keyword}
人设方向：${topicForm.persona || '未提供'}
目标人群：${topicForm.targetAudience || '未提供'}
我的人设：${topicForm.customPersona || '未提供'}\n`

    prompt += `平台：按通用口播短视频/抖音爆款逻辑处理`

    prompt += `\n请生成5个适合真人口播短视频的选题。\n`
    prompt += `要求：
1. 选题必须适合口播。
2. 选题要利于打造个人IP，能体现观点、经验、专业度、真实经历或方法论。
3. 每个选题都要符合爆款逻辑，例如痛点、反常识、避坑、误区、清单、对比、故事、争议观点。
4. 标题要像短视频标题，不要像文章标题。
5. 不要使用绝对化、夸大承诺、违规引导表达。
6. 如果提供了【我的人设】，请优先围绕该人设的身份、经验、表达风格和内容边界设计选题。
7. 只返回 JSON，不要返回 Markdown。
8. topics 数组必须刚好返回 5 条。
9. 不要返回开头钩子或 hook 字段，开头钩子会在生成文案时再设计。
10. JSON 必须能被 JSON.parse 直接解析，不要尾逗号，不要注释，不要在 JSON 前后添加任何解释。\n`

    if (history && history.length > 0) {
      prompt += `\n\n【本轮已生成过的选题】\n${history.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      prompt += '\n\n请避开以上选题，不要生成标题相同或角度高度相似的内容。'
    }

    prompt += `JSON 格式：
{
  "keyword_analysis": "这个关键词适合做个人IP的内容机会分析，100字以内",
  "topics": [
    {
      "title": "选题标题",
      "persona_angle": "这个选题如何强化个人IP"
    }
  ]
`

    return prompt
  }

  /**
   * 构建 LLM 提示词
   */
  const buildPrompt = (topicTitle, personaAngle, wordCount = 200) => {
    let prompt = `你是一个专业的短视频口播文案创作者。请根据以下选题创作一篇适合真人出镜的口播短视频文案。\n\n`

    prompt += `
关键词：${topicForm.keyword}
人设方向：${topicForm.persona || '未提供'}
目标人群：${topicForm.targetAudience || '未提供'}
我的人设：${topicForm.customPersona || '未提供'}`

    prompt += `\n选题标题：${topicTitle}
人设角度：${personaAngle || '未设置'}
`

    prompt += `\n
创作要求：
1. 基于选题标题设计一个爆款开头钩子，开头3秒必须抓人，直接戳痛点或抛出反常识观点。
2. 中段要有个人IP表达，体现经验、观点、专业判断或方法论。
3. 语言口语化，有短视频节奏，适合真人直接照着拍。
4. 不要夸大承诺，不使用绝对化、违规或高风险表达。
5. 如果提供了【我的人设】，请优先贴合该人设的身份、经历和表达风格。
6. 篇幅控制在${wordCount}字左右\n`

    prompt += `\n
【输出格式强约束】
1. 只输出最终文案正文，不得输出标题。
2. 不得输出任何话题标签/文案标签（如 #xxx、【xxx】等）。
3. 不得输出 emoji 表情。
4. 不得输出解释、过程、分析、注释或任何与文案无关的内容。
5. 输出内容不用换行`

    return prompt
  }

  /**
   * 根据关键词生成选题
   */
  const generateTopicsByKeyword = async (options) => {
    const { resetHistory = true } = options

    const keyword = topicForm.keyword.trim()

    if (!keyword) {
      message.warning('请输入行业、行业类别或产品关键词')
      return
    }

    generating.value = true
    topics.value = []

    try {
      // 构建 prompt
      const history = resetHistory ? [] : generatedTopicHistory.value
      let prompt = buildTopicPrompt(history)

      // 调用 LLM
      const requestId = 'topic_gen_' + Date.now()
      let responseText = ''

      const streamCleanup = window.api.llm.onStreamChunk(({ requestId: rid, chunk }) => {
        if (rid === requestId && chunk) {
          responseText += chunk
        }
      })

      const config = await window.api.config.getAll()
      const aiConfig = config.success ? config.data.ai : {}
      const model = aiConfig.model || 'doubao-seed-2-0-lite-260215'
      const temperature = aiConfig.temperature || 0.8
      const maxTokens = aiConfig.maxTokens || 2000

      const result = await window.api.llm.sendStreamMessage(prompt, {
        model,
        temperature,
        maxTokens,
        thinking: { type: 'disabled' },
        requestId
      })

      streamCleanup()

      if (!result?.success) {
        throw new Error(result?.error || '生成失败')
      }

      const text = responseText || result.data?.response || ''
      let jsonText = text.replace(/```json\n?|\n?```/g, '').trim()
      const jsonStart = jsonText.indexOf('{')
      const jsonEnd = jsonText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
      }

      const parsed = JSON.parse(jsonText)
      keywordAnalysis.value = parsed.keyword_analysis || ''

      const newTopics = Array.isArray(parsed.topics)
        ? parsed.topics.map((t, idx) => ({
            id: 'topic_' + Date.now() + Math.random().toString(36).slice(2, 8) + '_' + idx,
            title: String(t.title || t)
              .replace(/[《》【】""']/g, '')
              .replace(/^(标题|文案|主题)[:：]\s*/, '')
              .trim(),
            personaAngle: String(t.persona_angle || '')
          }))
        : []

      // 去重（基于标题）
      const existingTitles = new Set(generatedTopicHistory.value)
      const uniqueTopics = newTopics.filter((t) => !existingTitles.has(t.title))

      topics.value = uniqueTopics

      // 更新历史
      if (resetHistory) {
        generatedTopicHistory.value = uniqueTopics.map((t) => t.title)
      } else {
        generatedTopicHistory.value = [
          ...generatedTopicHistory.value,
          ...uniqueTopics.map((t) => t.title)
        ]
      }

      if (uniqueTopics.length === 0) {
        throw new Error('未生成新的选题，请尝试换一批关键词')
      }

      return { success: true, data: uniqueTopics }
    } catch (err) {
      console.error('选题生成失败:', err)
      message.error('生成失败：' + (err.message || '未知错误'))
      return { success: false, error: err.message }
    } finally {
      generating.value = false
    }
  }

  /**
   * 刷新选题
   */
  const refreshTopics = async () => {
    return await generateTopicsByKeyword({ resetHistory: false })
  }

  /**
   * 从选题生成文案
   */
  const generateCopyFromTopic = async (topic, wordCount = 300, count = 3) => {
    const topicTitle = typeof topic === 'string' ? topic : topic.title
    const personaAngle = typeof topic === 'string' ? '' : topic.personaAngle

    if (!topicTitle) {
      message.warning('请选择选题')
      return
    }

    copyGenerating.value = true
    generatedCopies.value = []

    try {
      // 构建 prompt
      let prompt = buildPrompt(topicTitle, personaAngle, wordCount)

      // 并行生成 2 个版本
      const copies = []
      for (let i = 0; i < count; i++) {
        const id = 'copy_' + Date.now() + '_' + i
        copies.push({ id, text: '', generating: true, completed: false })
      }

      generatedCopies.value = copies

      const aiConfig = await getAIConfig()

      const promises = copies.map((copy, idx) => {
        return new Promise((resolve) => {
          let text = ''
          const rid = 'copy_gen_' + Date.now() + '_' + idx

          const unsubscribe = window.api.llm.onStreamChunk(({ requestId: rid2, chunk }) => {
            if (rid2 === rid && chunk) {
              text += chunk
              const current = generatedCopies.value.find((c) => c.id === copy.id)
              if (current) {
                current.text = text
              }
            }
          })

          window.api.llm
            .sendStreamMessage(prompt, {
              model: aiConfig.model,
              temperature: aiConfig.temperature,
              maxTokens: aiConfig.maxTokens,
              thinking: { type: 'disabled' },
              requestId: rid
            })
            .then(() => {
              unsubscribe?.()
              const current = generatedCopies.value.find((c) => c.id === copy.id)
              if (current) {
                current.generating = false
                current.completed = true
                if (!current.text) {
                  current.text = '生成失败：未返回内容'
                }
              }
              resolve()
            })
            .catch((err) => {
              unsubscribe?.()
              const current = generatedCopies.value.find((c) => c.id === copy.id)
              if (current) {
                current.generating = false
                current.completed = false
                current.text = '生成失败：' + (err.message || '未知错误')
              }
              resolve()
            })
        })
      })

      await Promise.all(promises)
      message.success('文案生成完成')
    } catch (err) {
      console.error('文案生成失败:', err)
      message.error('生成失败：' + err.message)
    } finally {
      copyGenerating.value = false
    }
  }

  /**
   * 保存自定义人设
   */
  const saveCustomPersona = async () => {
    console.log('saveCustomPersona')
    try {
      const key = 'topicGenerator.customPersona'
      const value = topicForm.customPersona
      await window.api.config.set(key, value, 'topicGenerator', 'customPersona')
    } catch (err) {
      console.error('保存人设失败:', err)
    }
  }

  return {
    topicForm,
    keywordAnalysis,
    topics,
    generating,
    generatedTopicHistory,
    copyGenerating,
    generatedCopies,
    personaOptions,
    generateTopicsByKeyword,
    refreshTopics,
    generateCopyFromTopic,
    saveCustomPersona
  }
}
