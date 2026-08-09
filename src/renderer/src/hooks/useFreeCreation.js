import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { getAIConfig } from '../utils'

/**
 * 自由创作
 *
 * 设计要点：
 * 1. 并发 N 路流式请求（默认 3 路）—— 真正"多个文案"
 * 2. 每个 result slot 用独立 requestId，UI 进度互不干扰
 * 3. onStreamChunk 收到 chunk → 按 requestId 找到对应 slot → 追加文本
 * 4. await Promise.allSettled 后才 unsubscribe（重要：之前在 await 前 unsubscribe 会导致收不到任何 chunk）
 * 5. 失败隔离：单路失败不影响其他路
 */
export function useFreeCreation() {
  const generating = ref(false)
  const results = ref([])
  const templateOptions = ref([])
  const selectedTemplateId = ref('')

  /**
   * 初始化模板选项（保持原语义）
   */
  const initTemplateOptions = async () => {
    try {
      const result = await window.api.config.getCategory('prompts')
      const options = []

      if (result?.success && result?.data) {
        Object.keys(result.data).forEach((key) => {
          if (key !== 'default' && key.startsWith('prompt_')) {
            const item = result.data[key]
            if (item && typeof item === 'object' && item.name && item.content) {
              options.push({
                id: key.replace('prompts.', ''),
                label: item.name,
                value: key.replace('prompts.', ''),
                description: item.description || '',
                content: item.content,
                model: item.model || DEFAULT_MODEL
              })
            }
          }
        })
      }

      if (options.length === 0) {
        options.push({
          id: 'default',
          label: '默认助手',
          value: 'default',
          description: '通用文案改写'
        })
      }

      templateOptions.value = options

      if (!selectedTemplateId.value && options.length > 0) {
        selectedTemplateId.value = options[0].value
      }
    } catch (err) {
      console.error('加载模板失败:', err)
      templateOptions.value = [
        {
          id: 'default',
          label: '默认助手',
          value: 'default',
          description: '通用文案改写'
        }
      ]
      selectedTemplateId.value = 'default'
    }
  }

  /**
   * 构建 prompt 基础部分（不含"第 N 篇"差异化的部分）
   */
  const buildPromptBase = (form, templateContent, wordLimit) => {
    let prompt = `【字数限制要求：请严格将改写后的文案控制在 ${wordLimit} 字左右。`
    prompt += `\n`
    prompt += `${templateContent}\n`

    prompt += `以下是用户的产品信息，根据要求创作一篇吸引人的短视频口播文案：
    产品名称：${form.productName || '未提供'}
    产品卖点：${form.sellingPoints || '未提供'}
    适用人群：${form.targetAudience || '未提供'}
    优惠活动：${form.promotions || '未提供'}
    人设风格：${form.persona || '未提供'}\n
    `

    prompt += `要求：
1. 语言生动有趣，富有感染力，开头要能吸引人，直接戳痛点或抛出反常识观点。
2. 突出产品卖点和优惠信息
3. 符合指定的人设风格（如有）


请直接输出文案内容，不要包含任何解释或额外信息。

【输出格式强约束】
1. 只输出最终文案正文，不得输出标题。
2. 不得输出任何话题标签/文案标签（如 #xxx、【xxx】等）。
3. 不得输出 emoji 表情。
4. 不得输出解释、过程、分析、注释或任何与文案无关的内容。
5. 输出内容不用换行
    `

    return prompt
  }

  /**
   * 给每路加点轻微差异化（不同 temperature + 不同开场要求）
   * 这样 3 路输出不至于完全雷同
   */
  const decoratePrompt = (base, index, count) => {
    if (count <= 1) return base
    const styleHints = [
      '\n\n【本篇特别要求】请用"反常识开场 + 案例支撑"的写法。',
      '\n\n【本篇特别要求】请用"共情痛点开场 + 解决方案递进"的写法。',
      '\n\n【本篇特别要求】请用"悬念提问开场 + 金句收尾"的写法。'
    ]
    const hint = styleHints[index % styleHints.length]
    return base + hint
  }

  /**
   * 执行自由创作（并发 N 路流式）
   *
   * @param {object} form
   * @param {string} templateId
   * @param {number} wordLimit
   * @param {number} count  并发数量（默认 3）
   * @returns {Promise<Array<{success: boolean, data?: any, error?: string}>>}
   */
  const performFreeCreation = async (form, templateId, wordLimit, count = 3) => {
    // 校验
    if (!form.productName && !form.sellingPoints) {
      message.warning('请至少输入产品名称或卖点')
      return []
    }
    if (!templateId) {
      message.warning('请选择写作模板')
      return []
    }

    generating.value = true
    results.value = []

    // 拉 AI 配置
    const aiConfig = await getAIConfig()

    // 模板 + prompt
    const template = templateOptions.value.find((t) => t.value === templateId)
    const templateContent = template?.content || ''
    const promptBase = buildPromptBase(form, templateContent, wordLimit)

    // 准备 N 个 result slot（每个独立 requestId）
    const requestIdBase = 'free_' + Date.now()
    for (let i = 0; i < count; i++) {
      results.value.push({
        id: requestIdBase + '_' + i,
        index: i,
        text: '',
        generating: true,
        completed: false,
        selected: false,
        model,
        usedToken: 0
      })
    }

    // 订阅流式 chunk
    // 注意：onStreamChunk(cb) 返回 unsubscribe，必须等所有请求完成后再调用！
    const unsubscribe = window.api.llm.onStreamChunk(({ requestId, chunk }) => {
      if (!chunk) return
      const slot = results.value.find((r) => r.id === requestId)
      if (!slot) return
      slot.text = (slot.text || '') + chunk
    })

    // 并发 N 路
    const tasks = results.value.map((slot, idx) => {
      const slotPrompt = decoratePrompt(promptBase, idx, count)
      return window.api.llm
        .sendStreamMessage(slotPrompt, {
          model: aiConfig.model,
          temperature: aiConfig.temperature,
          maxTokens: aiConfig.maxTokens,
          thinking: { type: 'disabled' },
          requestId: slot.id
        })
        .then((res) => {
          slot.generating = false
          slot.completed = !!res?.success
          if (res?.success) {
            // 主进程 streamChat resolve({ success: true, data: { response, ... } })
            // 但 ipc.handle 可能再包一层 data，需要兜底
            const finalText = res.data?.response ?? res.data?.data?.response ?? slot.text
            if (finalText) slot.text = finalText
            if (res.data?.usage?.total_tokens) {
              slot.usedToken = res.data.usage.total_tokens
            }
          } else {
            slot.text = slot.text || '生成失败：' + (res?.error || '未知错误')
          }
          return { success: !!res?.success, data: res?.data, error: res?.error }
        })
        .catch((e) => {
          slot.generating = false
          slot.completed = false
          slot.text = slot.text || '生成异常：' + (e?.message || String(e))
          return { success: false, error: e?.message || String(e) }
        })
    })

    // 等所有完成（失败隔离）
    const settled = await Promise.allSettled(tasks)

    // await 完成后才取消订阅
    if (typeof unsubscribe === 'function') unsubscribe()

    generating.value = false

    // 提取结果
    const out = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value)
    const failedCount = out.filter((r) => !r.success).length
    if (failedCount > 0 && failedCount === count) {
      message.error('全部生成失败，请稍后重试')
    } else if (failedCount > 0) {
      message.warning(`已完成 ${count - failedCount} / ${count} 篇`)
    } else {
      message.success(`已生成 ${count} 篇文案，请选择一个使用`)
    }

    return out
  }

  return {
    generating,
    results,
    templateOptions,
    selectedTemplateId,
    initTemplateOptions,
    performFreeCreation
  }
}
