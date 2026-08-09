import { chromium } from 'playwright'
import { join } from 'path'
import logger from '../log'
import { getAppRootPath } from '../ipc/file.ipc'

const COOKIE_DOMAINS = {
  douyin: '.douyin.com',
  kuaishou: '.kuaishou.com',
  wechat_video: '.weixin.qq.com',
  xiaohongshu: '.xiaohongshu.com'
}

/**
 * 获取 Chrome 可执行文件路径
 */
export function getChromeExecutablePath() {
  const chromeRelativePath = join('chromium-1200', 'chrome-win64', 'chrome.exe')
  return join(getAppRootPath(), 'resources', 'playwright', chromeRelativePath)
}

/**
 * 把cookie字符串转换为json数组
 * @param {*} cookies
 * @returns
 */
function cookiesToJson(cookies) {
  if (!cookies) return []
  if (typeof cookies === 'string') {
    try {
      return JSON.parse(cookies)
    } catch {
      return []
    }
  }
  if (Array.isArray(cookies)) return cookies
  return []
}

/**
 * 带cookie启动
 * @param {*} platform
 * @param {*} cookiesStr
 * @returns
 */
export async function launchBrowserWithCookies(platform, cookiesStr) {
  const cookies = cookiesToJson(cookiesStr)
  if (!cookies.length) {
    console.log('cookiesStr is null')
  }

  logger.info(`launching browser for ${platform}, ${cookies.length} cookies`)
  const executablePath = getChromeExecutablePath()
  logger.info(`chrome executable: ${executablePath}`)

  const browser = await chromium.launch({
    headless: false,
    executablePath,
    args: ['--disable-blink-features=AutomationControlled']
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  })

  const playwrightCookies = cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain || COOKIE_DOMAINS[platform] || '',
    path: c.path || '/',
    httpOnly: c.httpOnly || false,
    secure: c.secure || false,
    sameSite: c.sameSite || 'Lax'
  }))

  await context.addCookies(playwrightCookies)
  logger.info(`browser launched, cookies injected for ${platform}`)
  return { browser, context }
}

export async function waitForUploadComplete(page, platform, timeout = 300000) {
  const start = Date.now()
  logger.info(`[${platform}] waiting for upload to complete...`)
  while (Date.now() - start < timeout) {
    try {
      const reuploadCount = await page
        .locator('[class^="long-card"] div:has-text("重新上传")')
        .count()
      if (reuploadCount > 0) {
        logger.info(`[${platform}] upload complete: re-upload button visible`)
        return true
      }
      const failCount = await page.locator('div.progress-div > div:has-text("上传失败")').count()
      if (failCount > 0) {
        log.warn(`[${platform}] upload failed detected`)
        return false
      }
    } catch {
      // page may be transitioning
    }
    const uploading = await page.$(
      '[class*="upload-progress"], [class*="uploading"], [class*="progress-bar"], [class*="uploading-percent"]'
    )
    if (uploading) {
      const text = await uploading.textContent().catch(() => '')
      logger.info(`[${platform}] upload progress: ${text}`)
      if (/100%|完成|上传成功/.test(text)) {
        logger.info(`[${platform}] upload reached 100%`)
        return true
      }
    }
    await page.waitForTimeout(2000)
  }
  logger.warn(`[${platform}] waitForUploadComplete timed out`)
  return false
}

/**
 *
 * @param {*} page
 * @param {*} selector
 * @param {*} timeout
 * @returns
 */
export async function waitForSuccess(page, selector, timeout = 120000) {
  try {
    await page.waitForSelector(selector, { timeout })
    return true
  } catch {
    return false
  }
}
