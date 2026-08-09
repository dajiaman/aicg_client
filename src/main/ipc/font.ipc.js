import { join } from 'path'
import { getAppRootPath } from './file.ipc'
import fs from 'fs'
import fontkit from 'fontkit'
import logger from '../log'

export function registerFontIpc(ipcMain) {
  logger.info('[font] registering font ipc')

  // ------------------------------------------------------------
  // 获取可用字体
  ipcMain.handle('font:get-available', async () => {
    const fontList = []

    const fontsDir = getFontsDir()

    // 读取
    const entries = await fs.promises.readdir(fontsDir, { withFileTypes: true })

    entries.forEach((item) => {
      // 获取文件大小
      const fontPath = join(fontsDir, item.name)
      const fileName = item.name
      const font = fontkit.openSync(fontPath)
      const stat = fs.statSync(fontPath)

      fontList.push({
        available: true,
        displayName: fileName.split('.')[0].split('-')[0],
        fileSize: stat.size,
        fontFamily: font.familyName,
        fontFile: fileName,
        fontName: font.fullName,
        fontSubfamily: font.subfamilyName,
        fullFontName: font.fullName,
        postscriptName: font.postscriptName,
        path: join(fontsDir, fileName)
      })
    })

    return {
      success: true,
      data: fontList.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }
  })
}

/**
 * 获取字体目录
 * @returns
 */
function getFontsDir() {
  return join(getAppRootPath(), 'resources/fonts')
}
