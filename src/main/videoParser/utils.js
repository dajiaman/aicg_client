import { join } from 'path'
import { getAppRootPath } from '../ipc/file.ipc'

/**
 * 获取 Chrome 可执行文件路径
 */
export function resolveExecutablePath() {
  const chromeRelativePath = join('chromium-1200', 'chrome-win64', 'chrome.exe')
  return join(getAppRootPath(), 'resources', 'playwright', chromeRelativePath)
}
