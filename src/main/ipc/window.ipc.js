import { BrowserWindow } from 'electron'
import logger from '../log'

export function registerWindowIpc(ipcMain) {
  logger.info('[window] registering window ipc')

  /**
   * 窗口最小化（window-minimize）
   */
  ipcMain.handle('window-minimize', async () => {
    // 获取当前活动窗口
    const win = BrowserWindow.getFocusedWindow()
    win.minimize()

    return {
      isMinimized: true
    }
  })

  /**
   * 窗口最大化（window-maximize）
   */
  ipcMain.handle('window-maximize', async () => {
    // 获取当前活动窗口
    const win = BrowserWindow.getFocusedWindow()
    win.maximize()

    return {
      isMaximized: true
    }
  })

  /**
   * 窗口取消最大化（window-unmaximize）
   */
  ipcMain.handle('window-unmaximize', async () => {
    // 获取当前活动窗口
    const win = BrowserWindow.getFocusedWindow()
    win.unmaximize()

    return {
      isMaximized: false
    }
  })

  /**
   * 窗口关闭（window-close）
   */
  ipcMain.handle('window-close', () => {
    // 获取当前活动窗口
    const win = BrowserWindow.getFocusedWindow()
    win.close()

    return {
      isClosed: true
    }
  })
}
