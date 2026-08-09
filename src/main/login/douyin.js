/**
 * 抖音平台登录实现
 */
import { getChromeExecutablePath, launchBrowserWithCookies } from '../publish/utils.js'
import logger from '../log'

/**
 * 固定的 Chrome User-Agent
 * 统一登录环境特征，避免被平台风控识别为非常规客户端
 */
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/**
 * 抖音平台
 */
export class DouyinPlatform {
  name = '抖音'
  key = 'douyin'

  config = {
    loginUrl: 'https://creator.douyin.com/',
    successUrlIncludes: ['creator.douyin.com/creator-micro', 'creator.douyin.com/content'],
    keyCookies: ['sessionid', 'sessionid_ss', 'sid_tt'],
    nicknameSelectors: ['.name-_lSSDc', '.account-name', 'span.name'],
    loginBoxSelector: "div[class*='login'], div[class*='qrcode']",
    validation: {
      verifyUrl: 'https://creator.douyin.com/creator-micro/content/manage',
      loggedInSelectors: [
        'div[class*="content"]',
        'div[class*="upload"]',
        'button:has-text("发布")',
        'div[class*="manage"]'
      ],
      notLoggedInSelectors: [
        'div[class*="login"]',
        'div[class*="qrcode"]',
        'button:has-text("登录")'
      ]
    }
  }

  /**
   * 检测是否已登录
   */
  async detectLogin(page, context) {
    const cookies = await context.cookies()
    const cookieNames = new Set(cookies.map((c) => c.name))
    const hasKeyCookies = this.config.keyCookies.some((k) => cookieNames.has(k))

    const url = page.url()
    const urlMatched = this.config.successUrlIncludes.some((u) => url.includes(u))

    let loginBoxGone = true
    try {
      const box = await page.$(this.config.loginBoxSelector)
      if (box) {
        loginBoxGone = !(await box.isVisible())
      }
    } catch {
      loginBoxGone = true
    }

    let hasLoggedInElements = false
    for (const selector of this.config.validation.loggedInSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const isVisible = await element.isVisible().catch(() => false)
          if (isVisible) {
            hasLoggedInElements = true
            break
          }
        }
      } catch (error) {
        log.error(`[douyin] 检测登录状态时出错: ${error.message}`)
      }
    }

    return (hasKeyCookies && urlMatched) || (loginBoxGone && hasLoggedInElements)
  }

  /**
   * 验证 Cookie 是否有效
   */
  async validateCookie(context, page) {
    await page.goto(this.config.loginUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    const loginUrl = page.url()
    if (!loginUrl.includes('/login')) {
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
        logger.error(`[douyin] 检测登录状态时出错: ${error.message}`)
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
        logger.error(`[douyin] 检测登录状态时出错: ${error.message}`)
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
   * 登录抖音
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
      const context = await browser.newContext({
        viewport: null,
        userAgent: CHROME_USER_AGENT
      })
      const page = await context.newPage()

      onProgress(`正在打开${this.name}登录页，请在浏览器中扫码/登录...`)
      await page.goto(this.config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      const timeoutMs = 5 * 60 * 1000
      const start = Date.now()
      let loggedIn = false

      while (Date.now() - start < timeoutMs) {
        if (browser.isConnected() === false) {
          return { success: false, message: '浏览器已关闭' }
        }
        loggedIn = await this.detectLogin(page, context)
        if (loggedIn) break
        await page.waitForTimeout(1500)
      }

      if (!loggedIn) {
        throw new Error('登录超时，请重试')
      }

      onProgress('登录成功，正在获取账号信息...')
      await page.waitForTimeout(1200)

      const cookies = await context.cookies()
      const nickname = await this.detectNickname(page)

      let account_name = ''
      for (const c of cookies) {
        if (/(sessionid|sid_tt)/i.test(c.name) && c.value) {
          account_name = c.value
          break
        }
      }

      if (!account_name) {
        const sess = cookies.find((c) => this.config.keyCookies.includes(c.name))
        account_name = sess ? String(sess.value).slice(0, 16) : `${this.name}账号`
      }

      return {
        success: true,
        data: {
          platform: this.key,
          account_name: account_name,
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
        logger.error(`[douyin] 检测昵称时出错: ${error.message}`)
      }
    }
    return ''
  }

  /**
   * 测试登录
   * @param {*} options
   */
  async testLogin(platform, cookieStr) {
    try {
      const { context } = await launchBrowserWithCookies(platform, cookieStr)

      const page = await context.newPage()
      await page.goto('https://creator.douyin.com/creator-micro/content/upload', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      })

      const timeoutMs = 5 * 60 * 1000
      const start = Date.now()
      let loggedIn = false

      while (Date.now() - start < timeoutMs) {
        if (browser.isConnected() === false) {
          return { success: false, message: '浏览器已关闭' }
        }
        loggedIn = await this.detectLogin(page, context)
        if (loggedIn) break
        await page.waitForTimeout(1500)
      }

      return {
        success: true,
        loggedIn: loggedIn
      }
    } catch (error) {
      console.error('testLogin', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * 测试登录
   * @param {*} options
   */
  async openAccount(platform, cookieStr) {
    const { context } = await launchBrowserWithCookies(platform, cookieStr)
    const page = await context.newPage()
    await page.goto('https://creator.douyin.com/creator-micro/home', {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    })

    return {
      success: true
    }
  }
}

export default new DouyinPlatform()
