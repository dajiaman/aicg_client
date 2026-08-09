// python:*  —  本地 Python 微服务调用（声音克隆、TTS、ASR、数字人 等）
import { BrowserWindow } from 'electron'
import logger from '../log'
import path from 'path'
import fs from 'fs'
import { getAppRootPath } from './file.ipc'
import { speechRecognition, stopAsrProcess } from '../services/asrService'
import { soundClone } from '../services/voiceCloneService.js'
import { generateDigitalHuman } from '../services/digitalHumanService.js'

/**
 * 注册 python:* 通道
 *
 * 暴露：
 *   python:asr:recognize(audio_file, language?, use_itn?)
 *     → { success, data: { text, processed_text, raw_text, sentences, language, provider, model } }
 *
 *   python:call-function(args)
 *     → 统一调度入口；args = { moduleName, functionName, params }
 */
export function registerPythonIpc(ipcMain) {
  logger.info('[python] registering python ipc')
  // ------------------------------------------------------------
  // ---------- 调用 Python 微服务 ----------

  /**
   * 统一调度入口
   * args = { moduleName, functionName, params }
   */
  ipcMain.handle('python:call-function', async (_, args = {}) => {
    logger.info('[python:call-function]', args)
    try {
      const { moduleName, functionName, params = {} } = args

      if (!moduleName || !functionName) {
        return { success: false, error: 'moduleName / functionName 不能为空' }
      }

      // module 文件夹是否存在
      const modulePath = path.join(getAppRootPath(), 'python-modules', moduleName, 'app.exe')
      if (!fs.existsSync(modulePath)) {
        return { success: false, error: `模块 ${moduleName} 不存在` }
      }

      // asr 识别
      if (moduleName === 'asrModule' && functionName === 'speechRecognition') {
        return await speechRecognition(params)
      }

      // 声音克隆 V2（voiceV2Module）
      if (moduleName === 'voiceV2Module' && functionName === 'soundClone') {
        // params 直接透传（renderer 已经按 voiceCloneService 的参数命名传了）
        return await soundClone(params)
      }

      // 数字人生成视频（hdModule）
      if (
        (moduleName === 'hdModule' || moduleName === 'humanModule') &&
        functionName === 'generateDigitalHuman'
      ) {
        const res = await generateDigitalHuman(params)
        console.log('generateDigitalHuman res:', res)
        return res
      }

      // 其他模块（暂未实现）
      return {
        success: false,
        error: `暂未实现: ${moduleName}.${functionName}`
      }
    } catch (e) {
      logger.error('[python:call-function] failed:', e)
      return { success: false, error: e.message || 'python 调用失败' }
    }
  })

  /**
   * python:call-function-with-progress
   * 进度通过 taskProgress event 推送
   */
  ipcMain.handle('python:call-function-with-progress', async (_, args = {}) => {
    logger.info('[python:call-function-with-progress]', args)
    try {
      const { moduleName, functionName, params = {} } = args

      if (!moduleName || !functionName) {
        return { success: false, error: 'moduleName / functionName 不能为空' }
      }

      const sendProgress = (percent, message) => {
        const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
        if (win && !win.isDestroyed()) {
          win.webContents.send('taskProgress', {
            moduleName,
            functionName,
            percent,
            message,
            timestamp: Date.now()
          })
        }
      }

      // asr 识别（带进度）
      if (moduleName === 'asrModule' && functionName === 'speechRecognition') {
        return await speechRecognition({
          audioFile: params.audio_file,
          language: params.language || 'auto',
          useItn: params.use_itn !== false,
          onProgress: sendProgress
        })
      }

      // 声音克隆 V2（带进度）
      if (moduleName === 'voiceV2Module' && functionName === 'soundClone') {
        // 透传所有 params（renderer 按 voiceCloneService 参数命名传）
        return await soundClone({
          ...params,
          onProgress: sendProgress
        })
      }

      // 数字人生成视频（hdModule）
      if (
        (moduleName === 'hdModule' || moduleName === 'humanModule') &&
        functionName === 'generateDigitalHuman'
      ) {
        const res = await generateDigitalHuman(params)
        return res
      }

      return {
        success: false,
        error: `暂未实现: ${moduleName}.${functionName}`
      }
    } catch (e) {
      logger.error('[python:call-function-with-progress] failed:', e)
      return { success: false, error: e.message || 'python 调用失败' }
    }
  })

  /**
   * python:check-module-exists
   * 检查模块是否存在
   */
  ipcMain.handle('python:check-module-exists', async (_, args = {}) => {
    logger.info('[python:check-module-exists]', args)
    const { moduleName } = args

    if (!moduleName) {
      return { success: false, error: 'moduleName 不能为空' }
    }

    // module 文件夹是否存在
    const modulePath = path.join(getAppRootPath(), 'python-modules', moduleName, 'app.exe')

    if (!fs.existsSync(modulePath)) {
      return { success: false, message: `模块 ${moduleName} 不存在` }
    }

    return { success: true, message: `模块 ${moduleName} 存在` }
  })

  /**
   * python:get-status
   * 获取 python 模块状态
   */
  ipcMain.handle('python:get-status', async (_, moduleName) => {
    logger.info('[python:get-status]', moduleName)
    if (!moduleName) {
      return { success: false, error: 'moduleName 不能为空' }
    }

    return {
      success: true,
      message: `模块 ${moduleName} 状态正常`
    }
  })

  /**
   * python:python:control-api
   * 控制 python 模块
   */
  ipcMain.handle('python:control-api', async (_, args) => {
    logger.info('[python:control-api]', args)
    const { moduleName, action } = args
    if (!moduleName || !action) {
      return { success: false, error: 'moduleName / action 不能为空' }
    }

    if (moduleName == 'voiceV2Module') {
      const pythonPath = path.join(getPythonModuleDir(), moduleName, 'venv', 'python.exe')

      // 利用 python 调用 api.py
    }

    return {
      success: true,
      message: `模块 ${moduleName} 控制成功`
    }
  })
}

export function getPythonModuleDir() {
  return path.join(getAppRootPath(), 'python-modules')
}
