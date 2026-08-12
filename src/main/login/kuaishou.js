/**
 * 快手平台登录实现
 */
import logger from '../log/index.js'

export class KuaishouPlatform {
  name = '快手'
  key = 'kuaishou'

  config = {
    loginUrl: 'https://passport.kuaishou.com/pc/account/login/?sid=kuaishou.web.cp.api&callback=https%3A%2F%2Fcp.kuaishou.com%2Frest%2Finfra%2Fsts%3FfollowUrl%3Dhttps%253A%252F%252Fcp.kuaishou.com%252Fprofile%26setRootDomain%3Dtrue',
    successUrlIncludes: ['cp.kuaishou.com/article', 'cp.kuaishou.com/profile'],
    keyCookies: ['kuaishou.web.cp.api_st', 'userId'],
    nicknameSelectors: ['.user-name', '.name'],
    loginBoxSelector: "div[class*='login'], div[class*='qrcode']",
    validation: {
      verifyUrl: 'https://cp.kuaishou.com/article/video',
      loggedInSelectors: [
        'div[class*="article"]',
        'div[class*="upload"]',
        'button:has-text("发布")',
        'div[class*="video-list"]'
      ],
      notLoggedInSelectors: [
        'div[class*="login"]',
        'div[class*="login-content"]',
        'div[class*="qrcode"]',
        'button:has-text("登录")'
      ]
    }
  }

  /**
   * 检测登录状态
   */
  async detectLogin(page, context) {
    logger.info(`[kuaishou] Detect login status...`)
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
      } catch {}
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
      } catch {}
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
      } catch {}
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
   * 登录快手
   */
  async login(context, browser) {
    try {
      const page = await context.newPage()

      logger.info(`正在打开${this.name}登录页，请在浏览器中扫码/登录...`)
      await page.goto(this.config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      const timeoutMs = 5 * 60 * 1000
      const start = Date.now()
      let loggedIn = false

      while (Date.now() - start < timeoutMs) {
        if (browser.isConnected() === false) {
          throw new Error('浏览器已关闭')
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

      let accountId = ''
      for (const c of cookies) {
        if (/(kuaishou\.web\.cp\.api_st|userId)/i.test(c.name) && c.value) {
          accountId = c.value
          break
        }
      }
      if (!accountId) {
        const sess = cookies.find((c) => this.config.keyCookies.includes(c.name))
        accountId = sess ? String(sess.value).slice(0, 16) : `${this.name}账号`
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
   * 从页面中提取昵称
   */
  async detectNickname(page) {
    for (const sel of this.config.nicknameSelectors) {
      try {
        const el = await page.$(sel)
        if (el) {
          const text = (await el.innerText())?.trim()
          if (text) return text
        }
      } catch {}
    }
    return ''
  }

  /**
   * 打开快手账号页面
   */
  async openAccount(context, browser) {
    try {
      const page = await context.newPage()
      // 快手创作者平台网页
      await page.goto('https://cp.kuaishou.com/profile', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      })

      return {
        success: true
      }
    } catch (error) {
      logger.error('testLogin', error)
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
  async testLogin(context, browser) {
    try {
      const page = await context.newPage()
      // 快手创作者平台网页
      await page.goto('https://cp.kuaishou.com/profile', {
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
}

export default new KuaishouPlatform()
