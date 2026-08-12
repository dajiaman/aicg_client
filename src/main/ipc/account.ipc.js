import logger from '../log'
import { loginViaBrowser, openAccountBrowser, testLoginBrowser } from '../services/accountService'
import { models } from '../database/services'
import { SUPPORTED_PLATFORMS } from '../constants'

/**
 * 注册 account:* / accounts:* 通道
 */
export function registerAccountIpc(ipcMain) {
  logger.info('[account] registering account ipc')

  /**
   * 获取支持的平台
   *   * → { success, data: platforms }
   */
  ipcMain.handle('account:get-supported-platforms', () => {
    return {
      success: true,
      data: SUPPORTED_PLATFORMS
    }
  })

  /**
   * 设置登录账号
   */
  ipcMain.handle('account:setup-login', async (_, accountId) => {
    logger.info(`[account:setup-login]: ${accountId}`)
    if (!accountId) {
      return { success: false, error: 'accountId 不能为空' }
    }

    const accountRecord = await models.account.get(accountId)
    if (!accountRecord) {
      return { success: false, error: '账号不存在' }
    }

    const { platform } = accountRecord

    try {
      const loginRes = await loginViaBrowser(platform)
      if (!loginRes.success || !loginRes.data.cookies) {
        return { success: false, error: loginRes.error }
      }

      // 更新账号记录
      await models.account.update(accountId, {
        cookies: JSON.stringify(loginRes.data.cookies),
        last_login_at: new Date().toISOString(),
        status: 'active'
      })

      return { success: true, message: '登录成功' }
    } catch (error) {
      console.log('error', error)
      logger.error(`[account:setup-login]: ${error.message}`)
      return { success: false, error: error.message }
    }
  })

  /**
   * 测试登录
   */
  ipcMain.handle('account:test-login', async (_, accountId) => {
    logger.info(`[account:test-login]: ${accountId}`)

    if (!accountId) {
      return { success: false, error: 'accountId 不能为空' }
    }

    const accountRecord = await models.account.get(accountId)
    if (!accountRecord) {
      return { success: false, error: '账号不存在' }
    }

    const { platform, cookies } = accountRecord

    try {
      const res = await testLoginBrowser(platform, cookies)
      if (!res.success) {
        // 登录失效，改成 inactive 状态
        await models.account.update(accountId, {
          status: 'inactive',
          last_login_at: new Date().toISOString()
        })
        return { success: false, error: '未登录或已失效' }
      }
      return { success: true, message: '连接成功' }
    } catch (error) {
      console.error('[account:test-login]', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * 打开账号
   */
  ipcMain.handle('account:open-account', async (_, accountId) => {
    logger.info(`[account:open-account]: ${accountId}`)

    if (!accountId) {
      return { success: false, error: 'accountId 不能为空' }
    }

    const accountRecord = await models.account.get(accountId)
    if (!accountRecord) {
      return { success: false, error: '账号不存在' }
    }

    const { platform, cookies } = accountRecord

    try {
      // 打开账户页面
      await openAccountBrowser(platform, cookies)
      return {
        success: true
      }
    } catch (error) {
      console.log('error', error)
      logger.error(`[account:open-account]: ${error.message}`)
      return { success: false, error: error.message }
    }
  })

  /**
   * 刷新登录
   */
  ipcMain.handle('account:refresh-login', async (_, accountId) => {
    logger.info(`[account:refresh-login]: ${accountId}`)

    if (!accountId) {
      return { success: false, error: 'accountId 不能为空' }
    }

    const accountRecord = await models.account.get(accountId)
    if (!accountRecord) {
      return { success: false, error: '账号不存在' }
    }

    return {
      success: true,
      data: []
    }
  })

  /**
   * 获取发布记录
   */
  ipcMain.handle('account:get-publish-records', async (_, accountId, options) => {
    return {
      success: true,
      data: []
    }
  })
}
