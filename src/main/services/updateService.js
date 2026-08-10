/**
 * 更新服务
 *  - 基于 electron-updater 检测 / 下载 / 安装 GitHub Release
 *  - 自动从 package.json 读取 version
 *  - 单例模式（不要重复创建多个 updater 实例）
 */
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import logger from '../log'

export default class UpdateService {
  constructor() {
    // 仅在打包后的应用里检查更新，开发环境跳过（避免开发时被覆盖）
    this.isDev = !app.isPackaged

    // 状态：idle / checking / available / not-available / downloading /
    //       downloaded / error
    this.status = 'idle'

    // 进度（0-100）
    this.progress = 0

    // 状态变化监听器（前端通过 IPC 订阅）
    this._listeners = new Set()

    // 初始化日志
    autoUpdater.logger = logger
    autoUpdater.autoDownload = false // 默认不自动下载，让用户确认
    autoUpdater.autoInstallOnAppQuit = true // 用户退出前自动安装已下载的更新

    // 绑定事件
    this._bindEvents()
  }

  // ====== 事件订阅（IPC 推送用）======
  onStatusChange(listener) {
    this._listeners.add(listener)
    // 立即推一次当前状态
    try {
      listener(this.getState())
    } catch {}
    return () => this._listeners.delete(listener)
  }

  getState() {
    return {
      status: this.status,
      progress: this.progress,
      version: app.getVersion(),
      isDev: this.isDev,
      updateInfo: this._latestUpdateInfo || null
    }
  }

  _emit() {
    const state = this.getState()
    for (const fn of this._listeners) {
      try {
        fn(state)
      } catch (e) {
        logger.warn('[update] listener error: ' + e.message)
      }
    }
  }

  // ====== 内部事件绑定 ======
  _bindEvents() {
    autoUpdater.on('checking-for-update', () => {
      logger.info('[update] checking-for-update')
      this.status = 'checking'
      this._emit()
    })

    autoUpdater.on('update-available', (info) => {
      logger.info(`[update] update-available: ${info.version}`)
      this.status = 'available'
      this._latestUpdateInfo = info
      this._emit()
    })

    autoUpdater.on('update-not-available', (info) => {
      logger.info(`[update] update-not-available: current=${app.getVersion()}`)
      this.status = 'not-available'
      this._latestUpdateInfo = info
      this._emit()
    })

    autoUpdater.on('download-progress', (progress) => {
      this.status = 'downloading'
      this.progress = Number((progress.percent || 0).toFixed(2))
      this._emit()
    })

    autoUpdater.on('update-downloaded', (info) => {
      logger.info(`[update] update-downloaded: ${info.version}`)
      this.status = 'downloaded'
      this.progress = 100
      this._latestUpdateInfo = info
      this._emit()
    })

    autoUpdater.on('error', (err) => {
      logger.error(`[update] error: ${err && err.message}`)
      this.status = 'error'
      this._latestUpdate = { message: (err && err.message) || String(err) }
      this._emit()
    })
  }

  // ====== 对外 API ======

  /**
   * 检测更新（不下载）
   */
  async checkForUpdates() {
    if (this.isDev) {
      logger.info('[update] 跳过（开发模式）')
      return { success: false, error: '开发模式下不检查更新' }
    }
    try {
      this.status = 'checking'
      this._emit()
      const result = await autoUpdater.checkForUpdates()
      return {
        success: true,
        data: {
          updateInfo: result?.updateInfo || null,
          currentVersion: app.getVersion()
        }
      }
    } catch (e) {
      logger.error(`[update] check failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  }

  /**
   * 下载更新（用户确认后调用）
   */
  async downloadUpdate() {
    if (this.isDev) {
      return { success: false, error: '开发模式下不可下载' }
    }
    try {
      this.status = 'downloading'
      this.progress = 0
      this._emit()
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (e) {
      logger.error(`[update] download failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  }

  /**
   * 立即退出并安装更新
   */
  quitAndInstall() {
    if (this.isDev) {
      return { success: false, error: '开发模式下不可安装' }
    }
    try {
      // isForce=false, isSilent=false 让用户能看到安装过程
      autoUpdater.quitAndInstall(false, false)
      return { success: true }
    } catch (e) {
      logger.error(`[update] quitAndInstall failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion() {
    return app.getVersion()
  }
}
