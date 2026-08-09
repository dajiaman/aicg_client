import fs from 'fs/promises'
import { copyFile, stat as fstat, readdir } from 'fs/promises'
import path, { join, dirname, isAbsolute } from 'path'
import { app, BrowserWindow, dialog, shell } from 'electron'
import logger from '../log'
import { ensureDir } from '../utils/index'
import { models } from '../database/services'

/**
 * 获取应用安装目录
 */
export function getAppRootPath() {
  let appRoot
  if (!app.isPackaged) {
    appRoot = process.cwd()
  } else {
    appRoot = dirname(app.getAppPath())
  }
  return appRoot
}

/**
 * 获取数据目录
 */
export function getDataDir() {
  return join(app.getPath('userData'), 'data')
}

/**
 * 获取临时目录
 */
export function getTempPath() {
  const tempDir = join(getAppRootPath(), 'temp')
  ensureDir(tempDir)
  return tempDir
}

/**
 * 获取字体目录
 */
export function getFontsDir() {
  return join(getAppRootPath(), 'resources', 'fonts')
}

/**
 * 获取输出目录
 */
export function getOutputsPath() {
  const baseOutput = models.config.get('paths.baseOutput')
  return baseOutput
}

/**
 * 注册 fs:* / dialog:* / file:* 通道
 */
export function registerFileIpc(ipcMain) {
  logger.info('[file] registering file ipc')
  // ------------------------------------------------------------
  // 获取应用信息
  // 返回：{ success: true, data: { appName, appVersion, appPath } }
  ipcMain.handle('file:get-app-info', async () => {
    logger.info('[file:get-app-info]')
    const appName = app.getName()
    const appVersion = app.getVersion()
    // arch
    const arch = process.arch
    // electron version
    const electronVersion = process.versions.electron
    // node version
    const nodeVersion = process.versions.node
    // platform
    const platform = process.platform

    return {
      success: true,
      data: {
        nodeVersion,
        name: appName,
        version: appVersion,
        arch,
        electronVersion,
        platform
      }
    }
  })

  /**
   * 程序安装目录
   */
  ipcMain.handle('file:get-app-root', async () => {
    logger.info('[file:get-app-root]')
    return {
      success: true,
      data: {
        appRoot: getAppRootPath()
      }
    }
  })

  /**
   * 获取temp 目录
   * 程序安装目录下面的 temp 目录
   *
   */
  ipcMain.handle('file:get-temp-dir', async () => {
    logger.info('[file:get-temp-dir]')
    return {
      success: true,
      data: {
        tempDir: getTempPath()
      }
    }
  })

  /**
   * 获取数据目录
   * userData 下面的
   *
   */
  ipcMain.handle('file:get-data-dir', async () => {
    logger.info('[file:get-data-dir]')
    return {
      success: true,
      data: {
        dataDir: getDataDir()
      }
    }
  })

  /**
   * 文件写入（支持 text / Buffer / Uint8Array / ArrayBuffer）
   * 入参：(path, data, opts?)
   *   - data 类型：
   *       string                  → 写入 utf-8 文本
   *       Node Buffer             → 写入二进制
   *       Uint8Array              → 写入二进制（按 byteOffset / byteLength 切片）
   *       ArrayBuffer             → 写入二进制
   *       ArrayBuffer-like { byteLength, slice } → 尝试 slice 后写入
   *   - opts?: { encoding?: string }  当 data 是 string 时可选编码，默认 utf-8
   */
  ipcMain.handle('file:write', async (_, path, data, opts = {}) => {
    logger.info('[file:write]')
    if (!path || typeof path !== 'string') {
      return { success: false, error: 'path 不能为空或非字符串' }
    }

    if (data === null || data === undefined) {
      return { success: false, error: 'data 不能为空' }
    }

    let buffer
    try {
      if (typeof data === 'string') {
        const encoding = (opts && opts.encoding) || 'utf-8'
        buffer = Buffer.from(data, encoding)
      } else if (Buffer.isBuffer(data)) {
        buffer = data
      } else if (data instanceof Uint8Array) {
        buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
      } else if (data instanceof ArrayBuffer) {
        buffer = Buffer.from(data)
      } else if (data && typeof data === 'object') {
        // 兜底：IPC structured clone 后丢失 ArrayBuffer 原型的 plain object
        if (Number.isFinite(data.byteLength) && typeof data.slice === 'function') {
          buffer = Buffer.from(data.slice(0))
        } else {
          return {
            success: false,
            error:
              '不支持的数据类型（当前类型：' +
              (data.constructor && data.constructor.name) +
              '），请使用 string / Buffer / Uint8Array / ArrayBuffer'
          }
        }
      } else {
        return {
          success: false,
          error: '不支持的数据类型，请使用 string / Buffer / Uint8Array / ArrayBuffer'
        }
      }
    } catch (e) {
      logger.error('[file:write] 数据转换失败', e)
      return { success: false, error: '数据转换失败：' + (e.message || String(e)) }
    }

    try {
      // 自动创建父目录（之前 file:write 没做，现在补上对齐 file:write-buffer）
      const parentDir = path.dirname(path)
      await fs.mkdir(parentDir, { recursive: true })
      await fs.writeFile(path, buffer)

      return {
        success: true,
        data: { path, size: buffer.length }
      }
    } catch (err) {
      logger.error('[file:write] 写入异常', path, err)
      return { success: false, error: err.message || '文件写入失败' }
    }
  })

  /**
   * 读取文件
   * 入参：(path, opts?)
   *   - opts?: { encoding?: string | null, asText?: boolean }
   *       encoding：'utf-8' (默认) / 'ascii' / 'base64' / 'hex' / null（二进制）
   *       asText：true 时强制以 utf-8 读取（等价于 encoding='utf-8'）
   * 返回：{ success: true, data: string | Buffer }
   *
   * 默认按文本读取（保持向后兼容），需要二进制时传 opts.asText=false 或 encoding=null
   */
  ipcMain.handle('file:read', async (_, path, opts = {}) => {
    logger.info('[file:read]')
    if (!path || typeof path !== 'string') {
      return { success: false, error: 'path 不能为空或非字符串' }
    }

    try {
      // 默认 utf-8 文本；显式 asText=false 或 encoding=null 时返回 Buffer
      const asText =
        opts && Object.prototype.hasOwnProperty.call(opts, 'asText') ? !!opts.asText : true
      const encoding =
        opts && Object.prototype.hasOwnProperty.call(opts, 'encoding')
          ? opts.encoding
          : asText
            ? 'utf-8'
            : null

      const res = await fs.readFile(path, encoding)

      return {
        success: true,
        data: res,
        size: Buffer.isBuffer(res) ? res.length : Buffer.byteLength(res || '', 'utf-8')
      }
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        return { success: false, error: '文件不存在：' + path }
      }
      return {
        success: false,
        error: err.message || '文件读取失败'
      }
    }
  })

  /**
   * buffer 写入文件
   */
  ipcMain.handle('file:write-buffer', async (_, filePath, rawData) => {
    logger.info('[file:write-buffer] filePath is:', filePath)

    // 路径校验
    if (typeof filePath !== 'string' || filePath.trim() === '') {
      const msg = 'path 不能为空或非字符串'
      logger.warn('[file:write-buffer] 参数错误：', msg)
      return { success: false, error: msg }
    }

    // 兼容：前端传 Buffer / Uint8Array / ArrayBuffer 都支持
    //   - Buffer.isBuffer:  节点侧 Buffer
    //   - Uint8Array:       IPC structured clone 保留（视图）
    //   - ArrayBuffer:      file.arrayBuffer() 返回的底层内存，IPC 序列化后变成
    //                       普通对象 { byteLength, ... }，需要特殊处理
    let buffer
    if (Buffer.isBuffer(rawData)) {
      buffer = rawData
    } else if (rawData instanceof Uint8Array) {
      buffer = Buffer.from(rawData.buffer, rawData.byteOffset, rawData.byteLength)
    } else if (rawData instanceof ArrayBuffer) {
      buffer = Buffer.from(rawData)
    } else if (rawData && typeof rawData === 'object') {
      // 兜底：尝试识别 IPC structured clone 后的 ArrayBuffer-like 对象
      // 表现为 { byteLength, ... } 或者是 { 0: byte0, 1: byte1, ... } 的 plain object
      if (Number.isFinite(rawData.byteLength) && Number.isFinite(rawData.byteOffset)) {
        // 来自 Uint8Array.view 经过 clone 后丢失原型
        // 这种情况比较少见，提示调用方转换
        return {
          success: false,
          error:
            '数据格式无法识别：IPC 序列化丢失了 ArrayBuffer 原型。请调用前用 new Uint8Array(buffer) 包装'
        }
      } else if (Number.isFinite(rawData.byteLength) && typeof rawData.slice === 'function') {
        // ArrayBuffer-like：有 byteLength + slice（IPC structured clone 通常会保留 slice）
        try {
          buffer = Buffer.from(rawData.slice(0))
        } catch {
          return {
            success: false,
            error: '数据格式无法识别：ArrayBuffer-like 对象无法转换'
          }
        }
      } else {
        return {
          success: false,
          error:
            '数据必须为 Buffer / Uint8Array / ArrayBuffer 类型（当前类型：' +
            (rawData.constructor && rawData.constructor.name) +
            '）'
        }
      }
    } else {
      const msg = '数据必须为 Buffer 或 Uint8Array 类型'
      logger.warn('[file:write-buffer] 参数错误：', msg, rawData)
      return { success: false, error: msg }
    }

    try {
      const parentDir = path.dirname(filePath)
      await fs.mkdir(parentDir, { recursive: true })
      await fs.writeFile(filePath, buffer)

      logger.info('[file:write-buffer] success:', filePath)
      return {
        success: true,
        data: {
          outputPath: filePath
        }
      }
    } catch (err) {
      logger.error('[file:write-buffer] error:', filePath, err)
      return {
        success: false,
        error: err.message || '文件写入失败'
      }
    }
  })

  /**
   * 以 Uint8Array 形式读取文件
   */
  ipcMain.handle('file:read-buffer', async (_, path, opts = {}) => {
    logger.info('[file:read-buffer]', path, opts)
    if (!path || typeof path !== 'string') {
      return { success: false, error: 'path 不能为空或非字符串' }
    }

    // 文件存在性检查：fs/promises 没有 existsSync，直接读让 ENOENT 抛错
    try {
      const buf = await fs.readFile(path)

      return {
        success: true,
        data: new Uint8Array(buf)
      }
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        return { success: false, error: '文件不存在：' + path }
      }
      return { success: false, error: err.message || '文件读取失败' }
    }
  })

  /**
   * 复制文件或目录
   * 入参：(src, dst)
   * 返回：{ success: true }
   */
  ipcMain.handle('file:copy', async (_, src, dst) => {
    logger.info('[file:copy]', src, dst)
    if (!src || !dst) {
      return { success: false, error: 'src 或 dst 不能为空' }
    }

    // 验证 src 是否存在
    try {
      await fs.access(src)
    } catch (e) {
      return { success: false, error: '源文件不存在：' + src }
    }

    await copyFile(src, dst)

    return {
      success: true
    }
  })

  /**
   * 删除文件或目录
   * 入参：(path, opts?)
   *   - opts?: { recursive?: boolean, force?: boolean }
   *       recursive = true   → 递归删除（支持目录）
   *       force    = true    → 不存在不报错
   *   - 也支持字符串（'file' | 'dir'）快速指定：
   *       'file' 等价 { recursive: false }
   *       'dir'  等价 { recursive: true }
   *
   * 默认行为：
   *   - 不存在 → 报错
   *   - 仅删文件，不递归（防止误删整棵树）
   */
  ipcMain.handle('file:delete', async (_, path, opts) => {
    logger.info('[file:delete]', path, opts)
    if (!path || typeof path !== 'string') {
      return { success: false, error: 'path 不能为空或非字符串' }
    }

    let recursive = false
    let force = false
    if (typeof opts === 'string') {
      recursive = opts === 'dir'
    } else if (opts && typeof opts === 'object') {
      recursive = !!opts.recursive
      force = !!opts.force
    }

    try {
      // 先 stat 判断是文件还是目录，避免对不存在的路径报 ENOENT
      let stat
      try {
        stat = await fs.stat(path)
      } catch (e) {
        return { success: false, error: e.message || '文件不存在' }
      }

      if (stat.isDirectory()) {
        if (!recursive) {
          return {
            success: false,
            error: '目标为目录，请传 { recursive: true } 或 opts="dir"'
          }
        }
        await fs.rm(path, { recursive: true, force: !!force })
        return { success: true, data: { deleted: true, type: 'directory', path } }
      } else {
        await fs.unlink(path)
        return { success: true, data: { deleted: true, type: 'file', path } }
      }
    } catch (err) {
      logger.error('file:delete error:', err)
      return { success: false, error: err.message || '删除失败' }
    }
  })

  /**
   * 判断文件/文件夹是否存在
   * 入参：(path)
   * 返回：{ success: true, data: { exists: boolean } }
   */
  ipcMain.handle('file:exists', async (_, path) => {
    logger.info('[file:exists]', path)
    // 1. 校验路径合法性
    if (typeof path !== 'string' || path.trim() === '') {
      const msg = 'path 不能为空或非字符串'
      logger.warn('file:exists 参数错误：', msg)
      return { success: false, error: msg }
    }

    try {
      await fs.access(path, fs.constants.F_OK)
      // 无异常 = 存在
      return {
        success: true,
        data: { exists: true }
      }
    } catch (err) {
      // 文件/目录不存在，属于正常业务状态
      if (err.code === 'ENOENT') {
        return {
          success: true,
          data: { exists: false }
        }
      }

      // 权限错误、路径非法等系统异常
      logger.error('file:exists 检测异常', err)
      return {
        success: false,
        error: err.message || '文件检测失败'
      }
    }
  })

  /**
   * 获取文件信息
   *  - 入参: filePath（绝对路径）
   *  - 返回: { exists, name, ext, dir, base, size, isDirectory, isFile,
   *           createdAt, modifiedAt, accessedAt, path }
   */
  ipcMain.handle('file:get-info', async (_, filePath) => {
    logger.info('[file:get-info]', filePath)
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'path 不能为空' }
    }

    try {
      const stat = await fstat(filePath)
      // 兼容 Windows / macOS 的字段名差异
      const createdAt = stat.birthtime && stat.birthtimeMs > 0 ? stat.birthtime : stat.ctime
      return {
        success: true,
        data: {
          exists: true,
          path: filePath,
          name: path.basename(filePath),
          ext: path.extname(filePath),
          dir: path.dirname(filePath),
          size: stat.size,
          isDirectory: stat.isDirectory(),
          isFile: stat.isFile(),
          createdAt,
          modifiedAt: stat.mtime,
          accessedAt: stat.atime
        }
      }
    } catch (error) {
      // 文件不存在等错误统一返回友好结构（success=false）
      if (error.code === 'ENOENT') {
        return {
          success: true,
          data: {
            exists: false,
            path: filePath,
            name: path.basename(filePath),
            ext: path.extname(filePath),
            dir: path.dirname(filePath),
            size: 0,
            isDirectory: false,
            isFile: false,
            createdAt: null,
            modifiedAt: null,
            accessedAt: null
          }
        }
      }
      return { success: false, error: error.message }
    }
  })

  // ---------- file:mkdir ----------
  // 递归创建目录（类似 mkdir -p）。
  // 入参：dirPath（绝对路径或相对路径，相对路径以 appRoot 为基准）
  //   opts?: { mode?: number }  默认 mode = 0o755
  // 返回：{ success: true, data: { path } } | { success: false, error }
  //   - 若目录已存在，返回 success:true（不视为错误）
  //   - 禁止路径穿越（..）
  ipcMain.handle('file:mkdir', async (_, dirPath, opts = {}) => {
    logger.info('[file:mkdir]', dirPath, opts)
    try {
      if (!dirPath || typeof dirPath !== 'string') {
        return { success: false, error: 'dirPath 不能为空' }
      }

      // 解析绝对路径：绝对路径直接用，相对路径以 appRoot 为基准
      let absDir
      if (isAbsolute(dirPath)) {
        absDir = dirPath
      } else {
        const appRoot = !app.isPackaged ? process.cwd() : dirname(app.getAppPath())
        absDir = join(appRoot, dirPath)
      }

      // 路径穿越检测：规范化后若包含 .. 则拒绝
      const normalized = path.resolve(absDir)
      if (normalized.split(/[\\/]/).includes('..')) {
        return {
          success: false,
          error: `禁止路径穿越（包含 ..）: ${dirPath}`
        }
      }

      // Windows 系统敏感目录拦截
      const winSensitive = [
        'C:\\Windows',
        'C:\\Program Files',
        'C:\\Program Files (x86)',
        'C:\\System Volume Information'
      ]
      if (process.platform === 'win32') {
        const lower = normalized.toLowerCase().replace(/\\/g, '/')
        for (const s of winSensitive) {
          if (lower.startsWith(s.toLowerCase().replace(/\\/g, '/'))) {
            return {
              success: false,
              error: `禁止写入系统敏感目录: ${normalized}`
            }
          }
        }
      }

      const mode = opts && Number.isFinite(opts.mode) ? Number(opts.mode) : 0o755

      ensureDir(normalized, mode)
      logger.info(`[file:mkdir] ${normalized}`)
      return { success: true, data: { path: normalized } }
    } catch (e) {
      logger.error(`[file:mkdir] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  /**
   * 读取目录下的所有文件
   */
  ipcMain.handle('file:read-dir', async (_, dirPath) => {
    logger.info('[file:read-dir]', dirPath)
    if (!dirPath) {
      return { success: false, error: 'dirPath 不能为空' }
    }

    try {
      const files = await readdir(dirPath)

      return {
        success: true,
        data: files
      }
    } catch (error) {
      logger.error(`[file:read-dir] failed: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  })

  /**
   * 选择目录
   */
  ipcMain.handle('file:select-folder', async (_, options) => {
    logger.info('[file:select-folder]', options)
    const folder = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      ...options
    })

    return {
      success: true,
      data: {
        canceled: folder.canceled,
        filePaths: folder.filePaths || []
      }
    }
  })

  /**
   * 选择单个文件
   * 返回结构：{ success, data: { canceled, filePaths, filePath, fileName } }
   *   - filePath: 便捷访问，等价于 filePaths[0]
   *   - filePaths: 完整路径数组（与 select-files 保持一致，便于切换）
   *   - fileName: filePath 的 basename（仅文件名，不含目录）
   *   - canceled: 是否取消
   */
  ipcMain.handle('file:select-file', async (_, options = {}) => {
    logger.info('[file:select-file]', options)
    try {
      const file = await dialog.showOpenDialog({
        properties: ['openFile'],
        ...options
      })
      if (file.canceled || !file.filePaths?.length) {
        return {
          success: true,
          data: {
            canceled: true,
            filePaths: [],
            filePath: '',
            fileName: ''
          }
        }
      }
      const filePath = file.filePaths[0]
      return {
        success: true,
        data: {
          canceled: false,
          filePaths: [filePath],
          filePath,
          fileName: path.basename(filePath)
        }
      }
    } catch (e) {
      logger.error(`[file:select-file] failed: ${e.message || '选择文件失败'}`)
      return { success: false, error: e.message || '选择文件失败' }
    }
  })

  /**
   * 选择多个文件
   * 返回结构：{ success, data: { canceled, filePaths } }
   *
   * 选项扩展：
   *   - filters: { name, extensions: ['mp3', 'wav'] }  按扩展名过滤
   *   - extensions: ['mp3', 'wav']                      便捷写法，自动转 filters
   *   - maxSize: 524288000                              单文件最大字节数，超限剔除
   *   - checkExists: true                               过滤不存在的路径（默认 true）
   *   - title / defaultPath / buttonLabel: 透传 showOpenDialog
   */
  ipcMain.handle('file:select-files', async (_, options = {}) => {
    logger.info('[file:select-files]', options)
    try {
      // options.extensions → filters 转换
      let { filters, extensions, maxSize, checkExists = true, ...rest } = options
      if (!filters && Array.isArray(extensions) && extensions.length > 0) {
        filters = [{ name: extensions.map((e) => e.toUpperCase()).join(', '), extensions }]
      }

      const files = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        ...rest,
        ...(filters ? { filters } : {})
      })

      if (files.canceled || !files.filePaths?.length) {
        return {
          success: true,
          data: {
            canceled: true,
            filePaths: [],
            filePath: '',
            fileNames: []
          }
        }
      }

      // 可选：检查文件存在
      let validPaths = files.filePaths
      if (checkExists) {
        const fs = require('fs')
        validPaths = validPaths.filter((p) => {
          try {
            return fs.existsSync(p)
          } catch {
            return false
          }
        })
      }

      // 可选：按 size 过滤
      if (maxSize && Number.isFinite(maxSize)) {
        const fs = require('fs')
        validPaths = validPaths.filter((p) => {
          try {
            const stat = fs.statSync(p)
            return stat.size <= maxSize
          } catch {
            return false
          }
        })
      }

      return {
        success: true,
        data: {
          canceled: false,
          filePaths: validPaths,
          fileNames: validPaths.map((p) => path.basename(p)),
          filePath: validPaths[0] || '',
          skipped:
            validPaths.length < files.filePaths.length
              ? files.filePaths.length - validPaths.length
              : 0
        }
      }
    } catch (e) {
      return { success: false, error: e.message || '选择文件失败' }
    }
  })

  /**
   * 保存文件
   * 返回结构：{ success, data: { canceled, filePath } }
   *   - filePath: 保存访问路径
   *   - canceled: 是否取消
   */
  ipcMain.handle('file:save-dialog', async (_, options) => {
    logger.info(`[file:save-dialog] ${JSON.stringify(options)}`)
    try {
      const win = BrowserWindow.getFocusedWindow()
      const saveRes = await dialog.showSaveDialog(win, {
        defaultPath: options.defaultPath || '',
        title: options.title || '保存文件',
        filters: options.filters || []
      })

      // 已取消
      if (saveRes.canceled) {
        return {
          success: true,
          data: {
            canceled: true
          }
        }
      }

      return {
        success: true,
        data: {
          canceled: saveRes.canceled,
          filePath: saveRes.filePath || (saveRes.filePaths && saveRes.filePaths[0]) || ''
        }
      }
    } catch (e) {
      logger.error(`[file:save-dialog] failed: ${e.message || '保存文件失败'}`)
      return { success: false, error: e.message || '保存文件失败' }
    }
  })

  /**
   * 打开文件所在文件夹
   * 返回结构：{ success }
   *   - filePath: 目录访问路径
   *   - canceled: 是否取消
   */
  ipcMain.handle('file:show-in-folder', async (_, filePath) => {
    logger.info(`[file:show-in-folder] ${filePath}`)

    if (!filePath) return { success: false, error: '文件路径不能为空' }

    try {
      const dirName = path.dirname(filePath)
      await shell.openPath(dirName)
      return {
        success: true,
        data: {}
      }
    } catch (e) {
      return { success: false, error: e.message || '打开文件所在目录失败' }
    }
  })

  /**
   * 打开外部链接
   * 返回结构：{ success }
   *   - path: 外部链接路径
   */
  ipcMain.handle('file:open-external', async (_, path) => {
    logger.info(`[file:open-external] ${path}`)
    shell.openExternal(path)
    return { success: true }
  })

  /**
   * 打开路径
   * 返回结构：{ success }
   *   - path: 路径
   */
  ipcMain.handle('file:open-path', async (_, path) => {
    logger.info(`[file:open-path] ${path}`)
    shell.openPath(path)
    return { success: true }
  })

  /**
   * 打开今日日志
   * 返回结构：{ success }
   */
  ipcMain.handle('file:open-today-log', async () => {
    return { success: true }
  })

  // 上传今日日志
  ipcMain.handle('file:upload-today-log', async () => {
    return { success: true }
  })

  /**
   * 清除缓存
   *  - 删除 temp 目录下的所有内容（保留 temp 目录本身）
   *  - 不删除字体目录、输出目录等关键资源
   *  - 返回：{ success, deletedCount, freedBytes, failedFiles }
   */
  ipcMain.handle('file:clear-cache', async () => {
    logger.info('[file:clear-cache] start')
    const tempPath = getTempPath()
    let deletedCount = 0
    let freedBytes = 0
    const failedFiles = []

    try {
      // 防御：如果 tempPath 不存在（首次启动还没创建），直接返回成功
      try {
        await fs.access(tempPath)
      } catch {
        logger.info('[file:clear-cache] temp 目录不存在，无需清理')
        return { success: true, deletedCount: 0, freedBytes: 0, failedFiles: [] }
      }

      const entries = await fs.readdir(tempPath, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(tempPath, entry.name)
        try {
          // 先尝试 stat 取大小（即便后面删除失败也要计入 freedBytes 时取实际大小）
          let size = 0
          try {
            const st = await fs.lstat(fullPath)
            size = st.size
          } catch {}

          await fs.rm(fullPath, { recursive: true, force: true })

          deletedCount += 1
          // 文件系统实际释放可能大于 size（目录项、metadata），这里记录 stat 尺寸作为参考
          freedBytes += size
        } catch (e) {
          logger.warn(`[file:clear-cache] 删除失败: ${fullPath} -> ${e.message}`)
          failedFiles.push({ path: fullPath, error: e.message })
        }
      }

      logger.info(
        `[file:clear-cache] done, deleted=${deletedCount}, freed≈${freedBytes}B, failed=${failedFiles.length}`
      )
      return {
        success: true,
        deletedCount,
        freedBytes,
        failedFiles
      }
    } catch (e) {
      logger.error(`[file:clear-cache] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })
}
