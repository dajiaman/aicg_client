import logger from '../log'

export function registerCloudIpc(ipcMain) {
  logger.info('[cloud] registering cloud ipc')
  /**
   * 云端 asr
   */
  ipcMain.handle('cloud:asr', async (_, args) => {
    const { audioUrl, language } = args
    return {
      success: true,
      data: {
        text: ''
      }
    }
  })

  /**
   * 检查云端版本
   */
  ipcMain.handle('cloud:check-version', async (_) => {
    logger.info('[cloud:check-version]')
    return {
      success: true,
      message: '版本检查成功',
      data: {
        hasUpdate: false,
        latestVersion: '1.0.0',
        minVersion: '1.0.0',
        needForceUpdate: false,
        oemId: 'default',
        timestamp: new Date().toISOString(),
        updateDescription: '',
        upgradeInfo: {
          forceUpdate: false,
          latestVersion: '1.0.0',
          minVersion: '1.0.0',
          oemId: 'default',
          updateDescription: '',
          updateUrl: ''
        }
      }
    }
  })
}
