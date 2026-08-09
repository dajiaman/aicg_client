// publish:*  —  发布相关
import logger from '../log'
import { publishToSingleAccount } from '../services/publishService'
import { models } from '../database/services'

/**
 * 注册 publish:* 通道
 */
export function registerPublishIpc(ipcMain) {
  logger.info('[publish] registering publish ipc')
  // ------------------------------------------------------------
  // ---------- 发布视频 ----------
  /**
   * 发布视频
   */
  ipcMain.handle('publish:publish-video', async (_, params) => {
    logger.info(`[ipc] publish:publish-video`, params)
    const {
      accountId,
      platform,
      videoPath,
      title,
      description,
      tags,
      isDraft,
      coverPath,
      autoCloseBrowser
    } = params

    try {
      const account = await models.account.get(accountId)
      if (!account) return { success: false, error: '账号不存在' }

      const result = await publishToSingleAccount(account, {
        videoPath,
        title,
        platform,
        description,
        tags,
        isDraft,
        coverPath,
        autoCloseBrowser
      })

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

      logger.info(`[ipc] publish:publish-video done: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      return { success: true }
    } catch (e) {
      logger.error(`[ipc] publish:publish-video error: ${e.message}`)
      return { success: false, error: e.message || String(e) }
    }
  })
}
