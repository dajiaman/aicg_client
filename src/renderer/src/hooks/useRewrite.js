import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { getAIConfig } from '../utils'

/**
 * 重写脚本 hook
 */
export function useRewrite() {
  const loading = ref(false)
  const rewrittenContent = ref('')
  const templateOptions = ref([])
  const selectedTemplateId = ref(null)
  const progressText = ref('')

  // 初始化改写模板选项
  const initTemplateOptions = async () => {
    try {
      const res = await window.api.config.getCategory('prompts')
      if (res.success) {
        const list = []
        Object.keys(res.data).forEach((key) => {
          const item = res.data[key]
          if (key !== 'currentPromptId' && key.startsWith('prompt_')) {
            list.push({
              id: key.replace('prompt_', ''),
              ...item
            })
          }
        })
        templateOptions.value = list
        if (!selectedTemplateId.value && list.length) {
          selectedTemplateId.value = list[0].id
        }
      }
    } catch (error) {
      selectedTemplateId.value = 'default'
    }
  }

  // 构建 prompt
  const buildPrompt = (template, original, wordCountLimit) => {
    let prompt = `【字数限制要求：请忽略以下用户附加要求中可能存在的字数要求的部分，严格遵循 ${wordCountLimit} 字进行文案输出。】\n`
    prompt += '以下是用户附加的要求：'
    prompt += `${template.content}`
    prompt += '\n'
    prompt += `请根据以下要求改写文案：
原始文案：${original}

请直接输出改写后的文案内容，不要包含任何解释或额外信息。

【输出格式强约束】
1. 只输出最终文案正文，不得输出标题。
2. 不得输出任何话题标签/文案标签（如 #xxx、【xxx】等）。
3. 不得输出 emoji 表情。
4. 不得输出解释、过程、分析、注释或任何与文案无关的内容。
5. 输出内容不用换行`

    return prompt
  }

  // 执行改写
  const rewriteContent = async (original, templateId, onProgress, options = {}) => {
    if (!original || !original.trim()) {
      message.warning('原文案为空')
      return { success: false, error: '原文案为空' }
    }

    if (!templateId) {
      message.warning('请选择改写模板')
      return { success: false, error: '未选择模板' }
    }

    loading.value = true
    progressText.value = 'AI正在处理文案...'
    try {
      // 构建 prompt
      const template = templateOptions.value.find((t) => t.id === templateId)
      const { wordCountLimit } = options

      let prompt = buildPrompt(template, original, wordCountLimit)

      // 流式调用
      const requestId = 'rewrite_' + Date.now()
      let fullText = ''
      let isFirst = true

      // 订阅 llm 流式 chunk（window.api.llm.onStreamChunk 返回 unsubscribe 函数）
      const unsubscribe = window.api.llm.onStreamChunk(({ requestId: rid, chunk }) => {
        if (rid === requestId && chunk) {
          if (isFirst) {
            onProgress?.('正在生成改写内容...')
            isFirst = false
          }
          fullText += chunk
          rewrittenContent.value = fullText
        }
      })

      // 获取 AI 配置
      const aiConfig = await getAIConfig()

      let result
      try {
        result = await window.api.llm.sendStreamMessage(prompt, {
          model: aiConfig.model,
          temperature: aiConfig.temperature,
          thinking: { type: 'disabled' },
          requestId
        })
      } finally {
        // 无论成功失败都要取消订阅，防止后续 chunk 污染结果 / 内存泄漏
        if (typeof unsubscribe === 'function') {
          try {
            unsubscribe()
          } catch (error) {
            console.error('取消订阅失败', error)
            /* ignore */
          }
        }
      }

      if (result.success) {
        const finalText = result.data.response || fullText
        rewrittenContent.value = finalText
        onProgress?.('改写完成！')
        message.success('文案改写完成')
        return { success: true, data: { content: finalText } }
      } else {
        throw new Error(result.error || '改写失败')
      }
    } catch (e) {
      message.error('改写失败：' + e.message)
      return { success: false, error: e.message }
    } finally {
      loading.value = false
      progressText.value = ''
    }
  }

  return {
    loading,
    rewrittenContent,
    templateOptions,
    selectedTemplateId,
    progressText,
    initTemplateOptions,
    rewriteContent
  }
}
