// llm:*  —  LLM 调用（流式 chat / 法务审核）
import { BrowserWindow } from 'electron'
import logger from '../log'
import { streamChat, legalReview, llmChat } from '../services/llmService'

/**
 * 注册 llm:* 通道
 *
 * 暴露：
 *   llm:sendStreamMessage(prompt, opts)    → { success, data: { response, requestId } }
 *     opts: { model?, temperature?, maxTokens?, requestId?, thinking? }
 *   llm:legalReview(content)                → { success, data: { risks, cleanedContent, analysis, hasRisk } }
 *
 * 流式 chunk 通过事件 `llm:stream-chunk` 推送，payload: { requestId, chunk, delta }。
 */
export function registerLlmIpc(ipcMain) {
  logger.info('[llm] registering llm ipc')

  ipcMain.handle('llm:send-message', async (_, message, options) => {
    logger.info(`[llm:send-message] message ${message}`)
    return await llmChat(message, {
      ...options
    })
  })

  // ------------------------------------------------------------
  /**
   * 流式 chat 调用
   */
  ipcMain.handle('llm:send-stream-message', async (_, message, options) => {
    logger.info(`[llm:send-stream-message]`)
    const wins = BrowserWindow.getAllWindows()

    const { requestId } = options

    const onStreamChunk = ({ requestId, chunk }) => {
      wins.forEach((win) => {
        win.webContents.send('llm:stream-chunk', { requestId, chunk })
      })
    }

    const onStreamComplete = ({ requestId, data }) => {
      wins.forEach((win) => {
        win.webContents.send('llm:stream-complete', { requestId, data })
      })
    }

    try {
      const result = await streamChat(message, {
        ...options,
        onStreamChunk
      })

      // ========== 流式正常结束：发送结束事件 ==========
      onStreamComplete({ requestId, data: result })
      return result
    } catch (e) {
      logger.error('llm:send-stream-message failed', e)
      return { success: false, error: e.message }
    }
  })

  /**
   * 法务审核（结构化输出）
   */
  ipcMain.handle('llm:legal-review', async (_, content) => {
    logger.info(`[llm:legal-review] ${(content || '').length}B`)
    try {
      return await legalReview(content)
    } catch (e) {
      logger.error('llm:legal-review failed', e)
      return { success: false, error: e.message }
    }
  })

  /**
   * 测试连接配置
   */
  ipcMain.handle('llm:test-connection-with-config', async (_, config) => {
    logger.info(`[llm:test-connection-with-config]`)

    const { apiKey, baseURL, maxTokens, model } = config

    try {
      const body = {
        model: model,
        messages: [{ role: 'user', content: 'hello' }],
        max_tokens: maxTokens,
        stream: false
      }

      const url = baseURL + '/chat/completions'

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      })

      return {
        success: true,
        message: '连接测试成功'
      }
    } catch (e) {
      logger.error('test-connection-with-config failed', e)
      return { success: false, error: e.message }
    }
  })
}
