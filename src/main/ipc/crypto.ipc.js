import crypto from 'crypto'
import logger from '../log'

/**

* 注册 crypto:* 通道
 */
export function registerCryptoIpc(ipcMain) {
  logger.info('[crypto] registering crypto ipc')
  // ------------------------------------------------------------
  // md5加密
  ipcMain.handle('crypto:md5', async (_, data) => {
    if (!data) {
      return { success: false, error: 'data 不能为空' }
    }

    // 加密
    const md5 = crypto.createHash('md5')
    md5.update(data)
    return { success: true, data: md5.digest('hex') }
  })

  // sha256加密
  ipcMain.handle('crypto:sha256', async (_, data) => {
    if (!data) {
      return { success: false, error: 'data 不能为空' }
    }

    // 加密
    const sha256 = crypto.createHash('sha256')
    sha256.update(data)
    return { success: true, data: sha256.digest('hex') }
  })
}
