import { models } from '../database/services'
import logger from '../log'

export function registerUserIpc(ipcMain) {
  ipcMain.handle('user:register', async (_, params) => {
    const { username, email, password } = params
  })

  ipcMain.handle('user:login', async (_, params) => {
    const { email, password } = params
  })

  ipcMain.handle('user:profile', async (_) => {})

  ipcMain.handle('user:profile', async (_, params) => {
    const { username, email } = params
  })

  ipcMain.handle('user:update-password', async (_, params) => {
    const { currentPassword, newPassword } = params
  })

  /**
   * 激活用户
   */
  ipcMain.handle('user:activate', async (_, params) => {
    const { activationCode, token } = params
  })

  /**
   * 设置用户 token
   * @param {*} params
   * @returns
   */
  ipcMain.handle('user:set-token', async (_, params) => {
    const { token, signInfo } = params
    global.token = token
    models.config.set('auth.token', token, 'auth')
    return {
      success: true
    }
  })

  /**
   * 通知登录成功
   */
  ipcMain.handle('user:notify-login-success', async (_) => {})

  ipcMain.handle('user:send-reset-code', async (_, params) => {
    const { email } = params
  })

  ipcMain.handle('user:reset-password', async (_, params) => {
    const { email, oldPassword, newPassword } = params
  })
}
