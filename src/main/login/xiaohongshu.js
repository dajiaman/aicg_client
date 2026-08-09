/**
 * 小红书平台登录实现
 */

import { getChromeExecutablePath, launchBrowserWithCookies } from '../publish/utils.js'
import logger from '../log'

export class XiaohongshuPlatform {
  name = '小红书'
  key = 'xiaohongshu'

  config = {
    loginUrl: 'https://creator.xiaohongshu.com/login',
    successUrlIncludes: ['creator.xiaohongshu.com'],
    keyCookies: ['web_session', 'a1', 'gid'],
    nicknameSelectors: ['.name-box'],
    loginBoxSelector: "div[class*='login-box']",
    validation: {
      verifyUrl: 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=video',
      loggedInSelectors: [
        'input[placeholder*="标题"]',
        'div[class*="upload"]',
        'button:has-text("发布")',
        'div[class*="cover"]'
      ],
      notLoggedInSelectors: ["div[class*='login-box']", 'button:has-text("登录")']
    }
  }

  /**
   * 检测是否已登录
   */
  async detectLogin(page) {
    // 1. 如果是登录页，直接返回 false
    const loginUrl = page.url()
    if (loginUrl.includes('/login')) {
      return false
    }

    let loginBoxGone = true
    try {
      const box = await page.locator(this.config.loginBoxSelector)
      if (box) {
        loginBoxGone = !(await box.isVisible())
      } else {
        // 2. 如果登录框不存在，说明已登录
        return true
      }

      // 如果登录框存在，说明未登录
      if (!loginBoxGone) {
        return false
      }
    } catch (error) {
      logger.error(`[xiaohongshu] 检测登录状态时出错: ${error.message}`)
    }

    return true
  }

  /**
   * 验证 Cookie 是否有效
   */
  async validateCookie(context, page) {
    await page.goto(this.config.loginUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    const loginUrl = page.url()
    if (loginUrl.includes('/login')) {
      const loginBox = await page.$(this.config.loginBoxSelector)
      if (loginBox) {
        const isVisible = await loginBox.isVisible().catch(() => false)
        if (isVisible) {
          return { valid: false, message: '未登录' }
        }
      }
    }

    await page.goto(this.config.validation.verifyUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      return { valid: false, message: 'Cookie 已失效' }
    }

    for (const selector of this.config.validation.notLoggedInSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const isVisible = await element.isVisible().catch(() => false)
          if (isVisible) {
            return { valid: false, message: 'Cookie 无效' }
          }
        }
      } catch (error) {
        logger.error(`[xiaohongshu] 验证登录状态时出错: ${error.message}`)
      }
    }

    for (const selector of this.config.validation.loggedInSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const isVisible = await element.isVisible().catch(() => false)
          if (isVisible) {
            return { valid: true, message: 'Cookie 有效' }
          }
        }
      } catch (error) {
        logger.error(`[xiaohongshu] 验证登录状态时出错: ${error.message}`)
      }
    }

    const cookies = await context.cookies()
    const cookieNames = new Set(cookies.map((c) => c.name))
    const hasKeyCookies = this.config.keyCookies.some((k) => cookieNames.has(k))
    if (hasKeyCookies) {
      return { valid: true, message: 'Cookie 有效' }
    }

    return { valid: false, message: '无法确认登录状态' }
  }

  /**
   * 打开浏览器让用户登录
   */
  async login(options = {}, onProgress = () => {}) {
    const { chromium } = await import('playwright')

    onProgress('正在启动浏览器...')
    const browser = await chromium.launch({
      headless: options.headless || false,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
      executablePath: getChromeExecutablePath()
    })

    try {
      const context = await browser.newContext({ viewport: null })
      const page = await context.newPage()

      onProgress(`正在打开${this.name}登录页，请在浏览器中扫码/登录...`)
      await page.goto(this.config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      const timeoutMs = 5 * 60 * 1000
      const start = Date.now()
      let loggedIn = false

      while (Date.now() - start < timeoutMs) {
        if (browser.isConnected() === false) {
          throw new Error('浏览器已关闭')
        }
        loggedIn = await this.detectLogin(page, context)
        logger.info(`[xiaohongshu] Login status: ${loggedIn}`)

        if (loggedIn) {
          break
        }
        await page.waitForTimeout(1500)
      }

      if (!loggedIn) {
        throw new Error('登录超时，请重试')
      }

      onProgress('登录成功，正在获取账号信息...')
      await page.waitForTimeout(1200)

      const cookies = await context.cookies()
      const nickname = await this.detectNickname(page)

      let accountId = ''

      if (!accountId) {
        const sess = cookies.find((c) => c.name === 'x-user-id-creator.xiaohongshu.com')
        accountId = sess ? String(sess.value) : `${this.name}账号`
      }

      return {
        success: true,
        data: {
          platform: this.key,
          account_name: accountId,
          nickname: nickname || `${this.name}账号`,
          cookies
        }
      }
    } finally {
      await browser.close()
    }
  }

  /**
   * 检测昵称
   */
  async detectNickname(page) {
    for (const sel of this.config.nicknameSelectors) {
      try {
        const el = await page.$(sel)
        if (el) {
          const text = (await el.innerText())?.trim()
          if (text) return text
        }
      } catch (error) {
        logger.error(`[xiaohongshu] 检测昵称时出错: ${error.message}`)
      }
    }
    return ''
  }

  /**
   *
   * @param {*} platform
   * @param {*} cookieStr
   * @returns
   */
  async openAccount(platform, cookieStr) {
    try {
      const { context } = await launchBrowserWithCookies(platform, cookieStr)

      const page = await context.newPage()
      await page.goto('https://creator.xiaohongshu.com', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      })

      return {
        success: true
      }
    } catch (error) {
      console.error('testLogin', error)
      return {
        success: false,
        message: error.message
      }
    }
  }
}

export default new XiaohongshuPlatform()
