import { models } from '../database/services'
import http from '../api/http'
import logger from '../log'

export function registerUserIpc(ipcMain) {
  /**
   * 注册
   *  - POST /api/user/register  form: username / password / email
   */
  ipcMain.handle('user:register', async (_, params) => {
    logger.info('user:register', { ...params, password: '***' })
    const res = await http.post(`/api/user/register`, params)
    if (res.code === 1) {
      const token = res.data?.userinfo?.token
      models.config.set('auth.token', token, 'auth')
      return {
        success: true,
        data: res.data
      }
    }
    return res
  })

  /**
   * 登录
   *  - POST /api/user/login  form: email / password
   */
  ipcMain.handle('user:login', async (_, params) => {
    logger.info('user:login', JSON.stringify(params))
    const { email, password } = params
    try {
      const res = await http.post(`/api/user/login`, {
        email,
        password
      })
      console.log(res)

      return res
    } catch (e) {
      logger.warn('user:login server failed: ' + e.message)
      return { success: false, data: null, error: e.message || '登录失败' }
    }
  })

  /**
   * 获取个人信息
   *  - GET /api/user/profile
   */
  ipcMain.handle('user:profile', async () => {
    logger.info('user:profile')
    try {
      const res = await http.get(`/api/user/profile`)
      return res
    } catch (e) {
      logger.warn('user:profile server failed: ' + e.message)
      return { success: false, data: null, error: e.message || '获取个人信息失败' }
    }
  })

  /**
   * 更新个人信息
   *  - POST /api/user/updateProfile  form: username / email
   */
  ipcMain.handle('user:update-profile', async (_, params) => {
    logger.info('user:update-profile', params)
    try {
      const res = await http.post(`/api/user/updateProfile`, params)
      return res
    } catch (e) {
      logger.warn('user:update-profile server failed: ' + e.message)
      return { success: false, data: null, error: e.message || '更新个人信息失败' }
    }
  })

  /**
   * 修改密码
   *  - POST /api/user/updatePassword  form: oldpassword / newpassword
   *  - 服务端会让旧 token 失效 → 清本地
   */
  ipcMain.handle('user:update-password', async (_, params) => {
    logger.info('user:update-password', JSON.stringify(params))
    try {
      const res = await http.post(`/api/user/updatePassword`, {
        oldpassword: params?.currentPassword.trim() || '',
        newpassword: params?.newPassword.trim() || ''
      })
      return res
    } catch (e) {
      logger.warn('user:update-password server failed: ' + e.message)
      return { success: false, data: null, error: e.message || '修改密码失败' }
    }
  })

  /**
   * 发送重置密码验证码（未登录场景）
   *  - POST /api/user/resetpwdCaptcha  form: email
   */
  ipcMain.handle('user:send-reset-code', async (_, params) => {
    logger.info('user:send-reset-code', params)
    try {
      const res = await http.post(`/api/user/resetpwdCaptcha`, {
        email: params?.email || ''
      })
      return res
    } catch (e) {
      logger.warn('user:send-reset-code server failed: ' + e.message)
      return { success: false, data: null, error: e.message || '发送重置密码验证码失败' }
    }
  })

  /**
   * 重置密码（未登录场景）
   *  - POST /api/user/resetpwd  form: email / captcha / newpassword
   */
  ipcMain.handle('user:reset-password', async (_, params) => {
    logger.info('user:reset-password', JSON.stringify(params))
    try {
      const res = await http.post(`/api/user/resetpwd`, {
        email: params?.email || '',
        captcha: params?.code || '',
        newpassword: params?.newPassword || ''
      })
      return res
    } catch (e) {
      logger.warn('user:reset-password server failed: ' + e.message)
      return { success: false, data: null, error: e.message || '重置密码失败' }
    }
  })

  /**
   * 激活码兑换
   *  - POST /api/activate_code/redeem  form: code
   *  - 兑换成功 → 主动拉一次 profile 更新 VIP 状态
   */
  ipcMain.handle('user:activate', async (_, params) => {
    logger.info('user:activate', JSON.stringify(params))
    try {
      if (!params?.activationCode) return { success: false, error: '激活码不能为空' }

      const res = await http.post(`/api/activate_code/redeem`, {
        code: params?.activationCode || ''
      })
      return res
    } catch (e) {
      logger.warn('user:activate server failed: ' + e.message)
      return { success: false, data: null, error: e.message || '激活码兑换失败' }
    }
  })

  /**
   * 通知登录成功（前端用来同步 UI）
   */
  ipcMain.handle('user:notify-login-success', async () => {
    logger.info('user:notify-login-success')
    return { success: true }
  })

  /**
   * 设置 / 覆盖 token（外部调用）
   */
  ipcMain.handle('user:set-token', async (_, params) => {
    logger.info('user:set-token')
    const token = params?.token || ''
    models.config.set('auth.token', token, 'auth')
    return { success: true }
  })
}
