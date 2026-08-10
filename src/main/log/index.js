import logger from 'electron-log'
import path from 'path'
import fs from 'fs'

/**
 * 日志模块
 *
 * - 默认使用 electron-log 写到 electron userData/logs/
 * - 非 electron 环境（脚本 / 单测）fallback 到 ./logs 相对目录
 */
let logsDir = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { app } = require('electron')
  if (app && typeof app.getPath === 'function') {
    logsDir = app.getPath('logs')
  }
} catch {
  // not in electron
}

if (!logsDir) {
  // 兼容脚本 / 单测：在当前 cwd 下创建 logs/ 目录
  const cwd = process.cwd()
  logsDir = path.join(cwd, 'logs')
  try {
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
  } catch {
    // ignore
  }
}

logger.transports.file.level = 'debug'
logger.transports.file.resolvePathFn = () => {
  const date = new Date()
  const name =
    date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
  return path.join(logsDir, name + '.log')
}

logger.transports.file.maxSize = 1024000

export default logger