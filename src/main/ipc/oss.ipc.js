import logger from '../log'

/**
 * oss 上传相关
 * @param {*} ipcMain
 */
export function registerOssIpc(ipcMain) {
  logger.info('[oss] registering oss ipc')
  // ------------------------------------------------------------
  // ---------- 上传 ----------
  ipcMain.handle('oss:upload', async (_, localPath, remoteKey) => {
    return {
      success: true,
      data: {
        url: ''
      }
    }
  })

  ipcMain.handle('oss:delete', async (_, remoteKey) => {
    return {
      success: true
    }
  })
}
