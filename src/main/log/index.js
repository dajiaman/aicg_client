import logger from 'electron-log'
import path from 'path'
import { app } from 'electron'

logger.transports.file.level = 'debug'
logger.transports.file.resolvePathFn = () => {
  const date = new Date()
  const name = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
  return path.join(app.getPath('logs'), name + '.log')
}

logger.transports.file.maxSize = 1024000

export default logger
