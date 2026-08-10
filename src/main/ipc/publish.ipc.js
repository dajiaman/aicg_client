// publish:*  —  发布相关
import logger from '../log'
import { publishToSingleAccount } from '../services/publishService'
import { models } from '../database/services'

/**
 * 注册 publish:* 通道
 */
export function registerPublishIpc(ipcMain) {
  logger.info('[publish] registering publish ipc')

  /**
   * 发布视频
   */
  ipcMain.handle('publish:publish-video', async (_, params) => {
    logger.info(`[ipc] publish:publish-video`, JSON.stringify(params))
    return await publishVideo(params)
  })
}

/**
 * 发布视频核心逻辑（IPC + 本地测试共用）
 */
export async function publishVideo(params) {
  logger.info('[publish] === start publish ===')
  logger.info('[publish] params:', JSON.stringify(params))

  const {
    accountId,
    platform,
    videoPath,
    title,
    description,
    tags,
    isDraft,
    coverPath
    // ⚠️ autoCloseBrowser publishToSingleAccount 不接收,这里丢弃
  } = params

  try {
    const account = await models.account.get(accountId)
    if (!account) {
      logger.error('[publish] 账号不存在: ' + accountId)
      return { success: false, error: '账号不存在' }
    }

    logger.info(
      `[publish] 账号: ${account.account_name} (platform=${account.platform}, status=${account.status})`
    )

    // 文件存在性预检
    const fs = await import('fs')
    if (!fs.existsSync(videoPath)) {
      return { success: false, error: '视频文件不存在: ' + videoPath }
    }
    if (coverPath && !fs.existsSync(coverPath)) {
      logger.warn('[publish] 封面文件不存在,忽略: ' + coverPath)
    }

    const result = await publishToSingleAccount(account, {
      platform,
      videoPath,
      title,
      description,
      tags,
      isDraft,
      coverPath: coverPath && fs.existsSync(coverPath) ? coverPath : null
    })

    // 写入发布记录
    const recordId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    models.publishRecords.create({
      id: recordId,
      account_id: accountId,
      platform: account.platform,
      video_path: videoPath,
      title,
      description: description || '',
      tags: tags || [],
      is_draft: isDraft ? 1 : 0,
      status: result.success ? 'success' : 'failed',
      error_message: result.error || null,
      published_at: result.success ? new Date().toISOString() : null
    })

    logger.info(`[publish] done: ${result.success ? 'SUCCESS' : 'FAILED'}`)
    return result
  } catch (e) {
    logger.error(`[publish] error: ${e.message}`)
    logger.error(e.stack)
    return { success: false, error: e.message || String(e) }
  }
}
