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
        updateDescription:
          '版本升级，详情建文档 https://eyge2u9lbl.feishu.cn/wiki/OkFJwpdS7iAyivkB7LwcaLljnAb?from=from_copylink',
        updateUrl: 'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/update/default-8-5.zip',
        upgradeInfo: {
          forceUpdate: false,
          latestVersion: '1.0.0',
          minVersion: '1.0.0',
          oemId: 'default',
          updateDescription:
            '版本升级，详情建文档 https://eyge2u9lbl.feishu.cn/wiki/OkFJwpdS7iAyivkB7LwcaLljnAb?from=from_copylink',
          updateUrl:
            'https://static-1251729840.cos.ap-guangzhou.myqcloud.com/update/default-8-5.zip'
        }
      }
    }
  })

  /**
   * 下载更新
   */
  ipcMain.handle('cloud:download-update', async (_, args) => {
    const { updateUrl } = args

    // 下载更新文件

    return {
      success: true,
      message: '更新下载成功',
      data: {
        updateUrl
      }
    }
  })
}
