/**
 * 抖音平台登录实现
 */
import logger from '../log/index.js'

/**
 * 固定的 Chrome User-Agent
 * 统一登录环境特征，避免被平台风控识别为非常规客户端
 */
export const CHROME_USER_AGENT =
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
   * 判定条件(全部满足才算登录成功):
   *   1. 关键 cookies 存在且 value 非空
   *   2. URL 已跳转到 creator-micro 内部页面
   *   3. 没有"未登录"标志元素(登录框 / 登录按钮)
   */
  async detectLogin(page, context) {
    logger.info('检测登录状态...')
    const cookies = await context.cookies()
    const cookieNames = new Set(cookies.map((c) => c.name))

    // 1. 关键 cookies 必须全部存在且 value 非空
    const keyCookieValues = cookies
      .filter((c) => this.config.keyCookies.includes(c.name))
      .map((c) => c.value)
    const hasKeyCookies =
      keyCookieValues.length > 0 && keyCookieValues.every((v) => v && String(v).length > 0)

    // 2. URL 必须在 creator-micro 内部页面
    const url = page.url()
    const urlMatched = this.config.successUrlIncludes.some((u) => url.includes(u))

    // 3. 不能出现"未登录"标志元素(登录框 / 登录按钮)
    let hasNotLoggedInElement = false
    for (const selector of this.config.validation.notLoggedInSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          const isVisible = await element.isVisible().catch(() => false)
          if (isVisible) {
            hasNotLoggedInElement = true
            break
          }
        }
      } catch {
        // ignore
      }
    }

    return hasKeyCookies && urlMatched && !hasNotLoggedInElement
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
  async login(context, browser) {
    try {
      const page = await context.newPage()
      logger.info(`正在打开${this.name}登录页，请在浏览器中扫码/登录...`)
      await page.goto(this.config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      // 等待登录页加载完成
      await page.waitForTimeout(2000)

      // 等待登录完成
      const timeoutMs = 2 * 60 * 1000
      const start = Date.now()
      let loggedIn = false

      while (Date.now() - start < timeoutMs) {
        if (browser.isConnected() === false) {
          logger.error('浏览器已关闭')
          return { success: false, message: '浏览器已关闭' }
        }
        loggedIn = await this.detectLogin(page, context)
        if (loggedIn) break
        await page.waitForTimeout(1500)
      }

      if (!loggedIn) {
        throw new Error('登录超时，请重试')
      }

      logger.info('登录成功，正在获取账号信息...')
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
  async testLogin(context, browser) {
    try {
      const page = await context.newPage()
      await page.goto('https://creator.douyin.com/creator-micro/home', {
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
  async openAccount(context, browser) {
    try {
      logger.info(`正在打开${this.name}账号页`)
      const page = await context.newPage()
      await page.goto('https://creator.douyin.com/creator-micro/home', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      })

      return {
        success: true
      }
    } catch (error) {
      logger.error('openAccount', error)
      return {
        success: false,
        message: error.message
      }
    }
  }
}

export default new DouyinPlatform()
