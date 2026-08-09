import logger from '../log'
const currentOemJson = require('../config/oem/current-oem.json')

export function registerOemIpc(ipcMain) {
  logger.info('[oem] registering oem ipc')
  /**
   * 获取OEM信息
   */
  ipcMain.handle('oem:get-info', async (_) => {
    logger.info('[oem:get-info]')
    const currentOemId = currentOemJson.id || 'default'
    // 从 config/oem/current-oem.json 读取当前 OEM 信息
    const allOem = require(`../config/oem/oem-config.json`)
    const currentOemInfo = allOem[currentOemId] || {}

    return {
      success: true,
      data: currentOemInfo
    }
  })

  /**
   * 获取OEM ID
   */
  ipcMain.handle('oem:get-id', async (_) => {
    logger.info('[oem:get-id]')
    return {
      success: true,
      data: {
        id: currentOemJson.id || 'default'
      }
    }
  })
}
