import logger from '../log'

export function registerLoggerIpc(ipcMain) {
  logger.info('registerLoggerIpc')


  /**
   * 调试日志
   */
  ipcMain.handle('logger:debug', async (_, message, ...args) => {
    logger.debug(message, ...args)
    return { success: true }
  })

  /**
   * 日志
   */
  ipcMain.handle('logger:log', async (_, message, ...args) => {
    logger.log(message, ...args)
    return { success: true }
  })

  /**
   * 信息日志
   */
  ipcMain.handle('logger:info', async (_, message, ...args) => {
    logger.info(message, ...args)
    return { success: true }
  })

  /**
   * 警告日志
   */
  ipcMain.handle('logger:warn', async (_, message, ...args) => {
    logger.warn(message, ...args)
    return { success: true }
  })

  /**
   * 错误日志
   */
  ipcMain.handle('logger:error', async (_, message, ...args) => {
    logger.error(message, ...args)
    return { success: true }
  })
}
