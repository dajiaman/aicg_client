/**
 * 快手平台登录实现
 */

import { getChromeExecutablePath, launchBrowserWithCookies } from '../publish/utils.js'

export class KuaishouPlatform {
  name = '快手'
  key = 'kuaishou'

  config = {
    loginUrl: 'https://cp.kuaishou.com/',
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
        'div[class*="qrcode"]',
        'button:has-text("登录")'
      ]
    }
  }

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
      } catch {}
    }

    return (hasKeyCookies && urlMatched) || (loginBoxGone && hasLoggedInElements)
  }

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
   * 等待视频上传完成
   */
  async waitUploadComplete(page, options = {}) {
    const { timeout = 300000, onProgress = () => {} } = options
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      try {
        // 快手上传完成后会出现视频预览
        const previewExists = await page
          .locator('div[class*="preview"], video')
          .first()
          .isVisible()
          .catch(() => false)
        if (previewExists) {
          logger.info('[kuaishou] video upload complete')
          onProgress('视频上传完成')
          return true
        }

        // 检查上传进度
        const progressText = await page
          .locator('span[class*="progress"], div[class*="progress"]')
          .first()
          .innerText()
          .catch(() => '')
        if (progressText.includes('100%') || progressText.includes('上传成功')) {
          logger.info('[kuaishou] video upload complete')
          onProgress('视频上传完成')
          return true
        }

        // 标题输入框出现说明已进入编辑状态
        const titleBox = page.locator('input[class*="title"], textarea[class*="title"]').first()
        if ((await titleBox.count()) > 0 && (await titleBox.isVisible())) {
          logger.info('[kuaishou] title box visible, upload assumed complete')
          onProgress('视频上传完成（标题框已出现）')
          return true
        }

        onProgress('等待视频上传...')
      } catch (e) {
        logger.debug(`[kuaishou] upload check error: ${e.message}`)
      }

      await page.waitForTimeout(2000)
    }

    throw new Error('视频上传超时')
  }

  // 打开
  async openAccount(platform, cookieStr) {
    try {
      const { context } = await launchBrowserWithCookies(platform, cookieStr)

      const page = await context.newPage()
      await page.goto('https://creator.douyin.com/creator-micro/home', {
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
}

export default new KuaishouPlatform()
