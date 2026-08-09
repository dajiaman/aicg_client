// ipBrain:*  —  对标账号 / IP 大脑档案管理（ip_archives 表）

import logger from '../log'
import { models } from '../database/services'
import { deeplearningDouyinVideo, parseDouyinUserPage } from '../videoParser/douyin'

/**
 * 注册 ipBrain:* 通道
 */
export function registerIpBrainIpc(ipcMain) {
  logger.info('[ip-brain] registering ip-brain ipc')

  /**
   * 获取档案列表
   * @param {object} opts - 查询参数
   * @param {number} opts.page - 页码，默认 1
   * @param {number} opts.pageSize - 每页数量，默认 500
   * @returns {Promise<{ success: boolean, message: string, data: IpArchive[] | null }>}
   */
  ipcMain.handle('ip-brain:list', async (_, opts = {}) => {
    logger.info(`[ip-brain:list] opts: ${JSON.stringify(opts)}`)
    try {
      const rows = await models.ipArchives.list(opts)
      return { success: true, data: rows }
    } catch (e) {
      logger.error(`[ip-brain:list] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 获取档案详情
   * @param {number} id - 档案 ID
   * @returns {Promise<{ success: boolean, message: string, data: IpArchive | null }>}
   */
  ipcMain.handle('ip-brain:get', async (_, id) => {
    logger.info(`[ip-brain:get] id: ${id}`)
    try {
      const row = await models.ipArchives.get(id)
      if (!row) return { success: false, error: '档案不存在' }
      return { success: true, data: row }
    } catch (e) {
      logger.error(`[ip-brain:get] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  // ---------- 创建（addIPBrain 的 service 接口） ----------
  // 入参：{ url: string, deepLearning?: boolean }
  // 返回：{ success: true, data: IpArchive }
  ipcMain.handle('ip-brain:create', async (_, params = {}) => {
    logger.info(`[ip-brain:create] params: ${JSON.stringify(params)}`)
    try {
      const url = String(params.url || '').trim()
      const deepLearning = !!params.deepLearning

      if (!url) {
        return { success: false, error: '主页链接不能为空' }
      }

      // 简单 URL 校验
      if (!/^https?:\/\//i.test(url)) {
        return {
          success: false,
          error: '请填写完整的 http(s) 链接，例如 https://v.douyin.com/xxx'
        }
      }

      // 解析抖音主页数据
      const userData = await parseDouyinUserPage(url)
      if (!userData.success) {
        return { success: false, error: '解析用户数据失败' }
      }

      // 提取昵称作为档案名（fallback 用 host）
      const name = userData.data.nickname || '未命名档案'
      const data = {
        name,
        homepage_url: url,
        video_list_json: JSON.stringify(userData.data.videos || []),
        deep_analysis_json: null,
        has_deep: deepLearning ? 1 : 0
      }

      // 深度学习模式
      if (deepLearning) {
        const videos = userData.data.videos || []
        const deepRes = await deeplearningDouyinVideo(videos)
        data.deep_analysis_json = JSON.stringify(deepRes || [], null, 2)
        data.has_deep = 1
      }

      const row = models.ipArchives.create(data)
      logger.info(`[ip-brain:create] id=${row?.id} name=${name} deep=${deepLearning}`)
      return { success: true, data: row }
    } catch (e) {
      logger.error(`[ip-brain:create] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 删除档案
   * @param {number} id - 档案 ID
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  ipcMain.handle('ip-brain:delete', async (_, id) => {
    logger.info(`[ip-brain:delete] id: ${id}`)
    try {
      const ok = models.ipArchives.delete(id)
      return { success: !!ok }
    } catch (e) {
      logger.error(`[ip-brain:delete] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })
}
