// shell:*  —  系统 shell 相关 IPC（用系统默认浏览器打开 URL 等）
import { shell } from 'electron'
import logger from '../log'

/**
 * 注册 shell:* 通道
 *
 * 暴露：
 *   shell:openExternal(url)
 *     → { success: true } | { success: false, error }
 *
 * 用系统默认浏览器打开外部 URL。禁止打开本地文件（防 path traversal）。
 */
export function registerShellIpc(ipcMain) {
  logger.info('[shell] registering shell ipc')
  // ------------------------------------------------------------
  // ---------- 打开外部 URL ----------
  ipcMain.handle('shell:openExternal', async (_, url) => {
    try {
      if (!url || typeof url !== 'string') {
        return { success: false, error: 'url 不能为空' }
      }

      const trimmed = url.trim()

      // 白名单：只允许 http / https 协议
      if (!/^https?:\/\//i.test(trimmed)) {
        return {
          success: false,
          error: `不支持的协议，仅允许 http(s): ${trimmed}`
        }
      }

      // 防御性：禁止 localhost / 127.0.0.1 / 0.0.0.0 / 私有 IP（防 SSRF）
      try {
        const u = new URL(trimmed)
        const host = u.hostname.toLowerCase()
        const blockedHosts = [
          'localhost',
          '127.0.0.1',
          '0.0.0.0',
          '::1',
          '169.254.169.254' // AWS metadata
        ]
        if (
          blockedHosts.includes(host) ||
          /^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)
        ) {
          return {
            success: false,
            error: `禁止打开内网地址: ${host}`
          }
        }
      } catch {
        return { success: false, error: `URL 格式无效: ${trimmed}` }
      }

      logger.info(`[shell:openExternal] ${trimmed}`)
      await shell.openExternal(trimmed)
      return { success: true }
    } catch (e) {
      logger.error(`[shell:openExternal] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })
}
