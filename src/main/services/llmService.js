// llmService.js
// OpenAI 兼容 LLM 客户端（支持流式 chat / 非流式 / 法务审核）
// 配置从 settings 读取：ai.apiKey / ai.baseURL / ai.model / ai.temperature / ai.maxTokens
import logger from '../log'
import { models } from '../database/services'

/**
 * 读取 AI 配置（带默认值兜底）
 */
function readAiConfig() {
  const apiKey = String(models.config.get('ai.apiKey') || '').trim()
  const baseURL = String(
    models.config.get('ai.baseURL') || 'https://ark.cn-beijing.volces.com/api/v3'
  ).trim()
  const model = String(models.config.get('ai.model') || 'doubao-seed-2-0-lite-260215').trim()
  const temperature = Number.isFinite(Number(models.config.get('ai.temperature')))
    ? Number(models.config.get('ai.temperature'))
    : 0.8
  const maxTokens = Number.isFinite(Number(models.config.get('ai.maxTokens')))
    ? Number(models.config.get('ai.maxTokens'))
    : 1500

  return { apiKey, baseURL, model, temperature, maxTokens }
}

/**
 * 提取 delta 文本内容（兼容 OpenAI / Anthropic / Doubao 三种 SSE 格式）
 */
function extractDeltaFromChunk(parsed) {
  if (!parsed) return ''
  // OpenAI / Doubao: choices[0].delta.content
  if (Array.isArray(parsed.choices) && parsed.choices.length > 0) {
    const choice = parsed.choices[0]
    if (choice?.delta && typeof choice.delta === 'object' && 'content' in choice.delta) {
      return String(choice.delta.content || '')
    }
    if (choice?.message && typeof choice.message === 'object') {
      return String(choice.message.content || '')
    }
    if (typeof choice?.text === 'string') return choice.text
  }
  // Anthropic: { type: 'content_block_delta', delta: { type: 'text_delta', text: '...' } }
  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
    return String(parsed.delta.text)
  }
  // Gemini: candidates[0].content.parts[0].text
  if (Array.isArray(parsed.candidates) && parsed.candidates[0]?.content?.parts?.[0]?.text) {
    return String(parsed.candidates[0].content.parts[0].text)
  }
  return ''
}

/**
 * 通用 chat completion（非流式）
 */
export async function llmChat(message, options) {
  const { model, temperature, maxTokens, requestId } = options || {}

  const {
    apiKey,
    baseURL,
    model: defaultModel,
    temperature: defaultTemperature,
    maxTokens: defaultMaxTokens
  } = readAiConfig()

  if (!message || typeof message !== 'string') {
    return { success: false, message: 'message 不能为空' }
  }

  if (!apiKey) {
    return { success: false, message: 'AI 服务未配置 apiKey' }
  }

  const url = baseURL.replace(/\/$/, '') + '/chat/completions'

  const finalModel = model || defaultModel
  const finalTemperature = temperature || defaultTemperature
  const finalMaxTokens = maxTokens || defaultMaxTokens

  const body = {
    messages: [{ role: 'user', content: message }],
    stream: false,
    ...options,
    model: finalModel,
    temperature: Number(finalTemperature),
    max_tokens: Number(finalMaxTokens)
  }

  logger.info(
    `[llm] streamChat ${body.model} -> ${url} (prompt ${message.length}B, mt ${body.max_tokens})`
  )

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!resp.ok || !resp.body) {
      return { success: false, message: 'API 响应错误' }
    }

    const parsed = await resp.json()

    logger.info(`[llm] chat done ${parsed}`)
    return { success: true, data: { response: parsed.choices[0].message.content || '', requestId } }
  } catch (e) {
    logger.error(`[llm] chat failed: ${e.message}`)
    return { success: false, error: e.message }
  }
}

/**
 * 通用 chat completion（流式）
 * @param {string} message
 * @param {object} [options]
 *   - model / temperature / maxTokens（可选，覆盖默认）
 *   - requestId：用于把流式 chunk 推回 renderer 时区分请求
 *   - onStreamChunk({ requestId, chunk }): 增量回调（同步调用，仍保留兼容）
 *   - signal: AbortSignal（可选）
 * @returns {{ success: true, data: { response, requestId } }}
 */
export async function streamChat(message, options) {
  const { model, temperature, maxTokens, requestId, onStreamChunk } = options || {}

  const {
    apiKey,
    baseURL,
    model: defaultModel,
    temperature: defaultTemperature,
    maxTokens: defaultMaxTokens
  } = readAiConfig()

  if (!message || typeof message !== 'string') {
    return { success: false, message: 'message 不能为空' }
  }

  if (!apiKey) {
    return { success: false, message: 'AI 服务未配置 apiKey' }
  }

  const url = baseURL.replace(/\/$/, '') + '/chat/completions'

  const finalModel = model || defaultModel
  const finalTemperature = temperature || defaultTemperature
  const finalMaxTokens = maxTokens || defaultMaxTokens

  const body = {
    messages: [{ role: 'user', content: message }],
    stream: true,
    ...options,
    model: finalModel,
    temperature: Number(finalTemperature),
    max_tokens: Number(finalMaxTokens)
  }

  logger.info(
    `[llm] streamChat ${body.model} -> ${url} (prompt ${message.length}B, mt ${body.max_tokens})`
  )

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => '')
      logger.error(`[llm] HTTP ${resp.status}: ${text.slice(0, 500)}`)
      return { success: false, error: `LLM HTTP ${resp.status}: ${text.slice(0, 200)}` }
    }

    // SSE 流式解析
    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let full = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // 按 \n 分割，逐行处理
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '').trim()
        if (!line) continue
        if (line.startsWith(':')) continue // SSE 注释
        if (line === 'data: [DONE]') continue

        // 兼容 `data: {...}` 与直接 JSON
        let data = line.startsWith('data:') ? line.slice(5).trim() : line
        if (!data) continue
        let parsed
        try {
          parsed = JSON.parse(data)
        } catch {
          continue
        }

        const delta = extractDeltaFromChunk(parsed)
        if (delta) {
          full += delta
          if (typeof onStreamChunk === 'function') {
            try {
              onStreamChunk({ requestId, chunk: delta })
            } catch (e) {
              logger.warn(`[llm] onStreamChunk error: ${e.message}`)
            }
          }
        }
      }
    }

    logger.info(`[llm] streamChat done ${requestId}, ${full.length} chars`)
    return { success: true, data: { response: full, requestId } }
  } catch (e) {
    logger.error(`[llm] streamChat failed: ${e.message}`)
    return { success: false, error: e.message }
  }
}

/**
 * 法务审核（结构化输出）
 * 调用 LLM 让模型输出 JSON：{ risks, cleanedContent, analysis, hasRisk }
 *
 * @param {string} content 待审核的文案
 */
export async function legalReview(content) {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return { success: false, error: '审核内容不能为空' }
  }

  const { apiKey, baseURL, model } = readAiConfig()
  if (!apiKey) {
    return { success: false, error: 'AI 服务未配置 apiKey' }
  }

  const url = baseURL.replace(/\/$/, '') + '/chat/completions'

  // Prompt：要求模型严格输出 JSON，不要任何解释
  const systemPrompt = `你是专业合规法务审核专员，精准识别文本内广告法违禁表述、平台违规内容、法律风险语句。
工作职责：
1.排查违规类型：广告极限绝对化用词、虚假效果承诺、医疗保健夸大宣传、金融保本稳赚类误导话术、低俗色情、暴力诱导、侵权表述、违规引流、不适宜未成年人内容、违规宣称资质等各类违规内容。
2.analysis控制在150字符以内，简明总结整体风险情况。
硬性约束：全程仅输出标准JSON字符串，禁止额外文字、注释、Markdown、代码块、换行说明、前后缀话术。`

  const userPrompt = `对下方指定文案开展合规审核，严格遵照规定格式输出纯JSON：
待审核文案：
"""
${content}
"""
固定JSON字段结构不可修改、字段名称固定：
{
  "hasRisk":布尔值（true存在风险/false无风险）,
  "risks":[
    {
      "word":"违规原文词汇/语句",
      "reason":"违规对应的法规/规范依据与问题说明",
      "recommendation":"针对性修改建议"
    }
  ],无风险时risks为空数组,
  "analysis":"简短整体风险评述，150字以内"
}`

  logger.info(`[llm] legalReview ${model} ${content.length}B`)

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
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' } // 兼容 OpenAI；不支持的会自动忽略
      })
    })

    const text = await resp.text()
    if (!resp.ok) {
      logger.error(`[llm] legalReview HTTP ${resp.status}: ${text.slice(0, 500)}`)
      return { success: false, error: `LLM HTTP ${resp.status}: ${text.slice(0, 200)}` }
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
      // 去除 markdown 代码块包裹
      const cleaned = String(messageContent)
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      result = JSON.parse(cleaned)
    } catch {
      logger.error(`[llm] legalReview parse failed: ${String(messageContent).slice(0, 300)}`)
      return { success: false, error: '法务结果解析失败' }
    }

    // 标准化字段
    const data = {
      hasRisk: !!result.hasRisk,
      risks: Array.isArray(result.risks)
        ? result.risks.map((r) => ({
            word: String(r.word || '').trim(),
            reason: String(r.reason || '').trim(),
            recommendation: String(r.recommendation ?? '').trim()
          }))
        : [],
      analysis: String(result.analysis || '')
    }

    return { success: true, data }
  } catch (e) {
    logger.error(`[llm] legalReview failed: ${e.message}`)
    return { success: false, error: e.message }
  }
}
