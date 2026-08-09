import { app } from 'electron'
import { join } from 'path'
import logger from '../log'

/**
 * 注册 path:* 通道
 */
export function registerPathIpc(ipcMain) {
  logger.info('[path] registering path ipc')
  // ------------------------------------------------------------
  // ---------- 路径操作 ----------
  // 路径拼接
  ipcMain.handle('path:join', async (_, args) => {
    logger.info(`[path:join] ${JSON.stringify(args)}`)
    if (!args.length) {
      return { success: false, error: 'args 不能为空' }
    }

    return { success: true, data: join(...args) }
  })

  // 获取用户数据路径
  ipcMain.handle('path:get-user-data-path', async () => {
    logger.info('[path] get user data path')
    const userDataPath = app.getPath('userData')
    return { success: true, data: userDataPath }
  })

  // 获取文档路径
  ipcMain.handle('path:get-documents-path', async () => {
    logger.info('[path] get documents path')
    return { success: true, data: app.getPath('documents') }
  })
}
