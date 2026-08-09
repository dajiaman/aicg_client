import logger from '../log'

const UPLOAD_URL = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=video'
const SUCCESS_URL = '**/publish/success?**'

/**
 * 等待视频上传完成
 */
async function waitUploadComplete(page, options = {}) {
  const { timeout = 300000, onProgress = () => {} } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      // 等待上传输入框出现
      const uploadInput = await page
        .waitForSelector('input.upload-input', { timeout: 3000 })
        .catch(() => null)

      if (uploadInput) {
        // 查找预览区域
        const previewNew = await uploadInput
          .evaluateHandle((el) => el.parentElement?.querySelector('.preview-new'))
          .catch(() => null)

        if (previewNew) {
          // 获取预览区域文本
          const allText = await previewNew.evaluate((el) => el.innerText).catch(() => '')

          // 检查上传成功关键词
          const successKeywords = [
            '上传成功',
            '分辨率',
            '重新上传',
            '编辑封面',
            '已上传',
            '已选择',
            '100%',
            '检测为'
          ]

          let uploadSuccess = successKeywords.some((keyword) => allText.includes(keyword))

          // 如果主文本没找到，检查 stage 元素
          if (!uploadSuccess) {
            const stageElements = await previewNew
              .evaluate((el) => {
                const stages = el.querySelectorAll('div.stage')
                return Array.from(stages).map((s) => s.textContent || '')
              })
              .catch(() => [])

            // 有上传成功文字, 则认为上传完成
            uploadSuccess = stageElements.some(
              (text) => text.includes('上传成功') || text.includes('分辨率')
            )
          }

          if (uploadSuccess) {
            // 等待一下，确保上传完成
            await page.waitForTimeout(5000)
            logger.info('[xiaohongshu] video upload complete')
            onProgress('视频上传完成')
            return true
          }

          logger.debug(`[xiaohongshu] preview content: ${allText.substring(0, 100)}`)
        }
      }

      onProgress('等待视频上传...')
    } catch (e) {
      logger.error(`[xiaohongshu] upload check error: ${e.message}`)
    }

    await page.waitForTimeout(2000)
  }

  throw new Error('视频上传超时')
}

/**
 * 上传视频到小红书
 * @param {*} context
 * @param {*} param1
 * @returns
 */
export default async function uploadToXiaohongshu(
  context,
  { videoPath, title, description, tags, isDraft, coverPath, onProgress = () => {} }
) {
  const page = await context.newPage()
  logger.info('[xiaohongshu] navigating to upload page')
  onProgress('正在打开发布页面...')

  // 前置劫持 attachShadow，强制open
  await page.addInitScript(`
    const old = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(opts) {
      return old.call(this, {...opts, mode: 'open'});
    }
  `)

  await page.goto(UPLOAD_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForURL(UPLOAD_URL, { timeout: 60000 })

  logger.info(`[xiaohongshu] setting video file: ${videoPath}`)
  onProgress('正在上传视频...')
  const fileInput = page.locator("div[class^='upload-content'] input[class='upload-input']").first()
  await fileInput.setInputFiles(videoPath)

  await waitUploadComplete(page, { onProgress })

  logger.info('[xiaohongshu] filling title')
  onProgress('正在填写标题...')
  const titleEl = page.locator('input[placeholder*="填写标题"]').first()
  await titleEl.fill(title.slice(0, 20))

  if (description) {
    logger.info('[xiaohongshu] filling description')
    onProgress('正在填写描述...')
    const descEl = page.locator('p[data-placeholder*="输入正文描述"]').first()
    await descEl.click()
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Control+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type(description)
    await page.keyboard.press('Enter')
  }

  if (tags && tags.length) {
    const maxTags = Math.min(tags.length, 10)
    logger.info(`[xiaohongshu] adding ${maxTags} tags`)
    onProgress(`正在添加 ${maxTags} 个话题...`)
    if (!description) {
      const descEl = page.locator('p[data-placeholder*="输入正文描述"]').first()
      await descEl.click()
    }
    for (const tag of tags.slice(0, maxTags)) {
      try {
        await page.keyboard.type('#' + tag, { delay: 30 })
        await page
          .locator('#creator-editor-topic-container')
          .waitFor({ state: 'visible', timeout: 6000 })
        const firstItem = page.locator('#creator-editor-topic-container .item').first()
        await firstItem.waitFor({ state: 'visible', timeout: 4000 })
        await firstItem.click()
      } catch (e) {
        logger.warn(`[xiaohongshu] tag '${tag}' not found, skipping: ${e.message}`)
        for (let i = 0; i < tag.length + 1; i++) {
          await page.keyboard.press('Backspace')
        }
      }
    }
  }

  if (coverPath) {
    try {
      logger.info('[xiaohongshu] setting cover')
      onProgress('正在设置封面...')
      const coverEntry = page
        .locator('div.cover-plugin-title')
        .filter({ hasText: '设置封面' })
        .locator('xpath=ancestor::div[contains(@class,"cover-plugin-preview")]')
        .locator('div.cover > div.default')
        .first()
      await coverEntry.waitFor({ state: 'visible', timeout: 30000 })
      await coverEntry.click({ force: true })

      const modal = page.locator('div.d-modal.cover-modal')
      await modal.waitFor({ state: 'visible', timeout: 30000 })
      const coverInput = modal.locator('input[type="file"][accept*="image"]').first()
      await coverInput.setInputFiles(coverPath)
      await page.waitForTimeout(2000)
      const confirmBtn = modal.locator('button.mojito-button').filter({ hasText: '确定' }).first()
      await confirmBtn.click()
      await modal.waitFor({ state: 'hidden', timeout: 30000 })
      logger.info('[xiaohongshu] cover set')
    } catch (e) {
      logger.warn(`[xiaohongshu] cover set failed: ${e.message}`)
    }
  }

  logger.info('[xiaohongshu] publishing...')
  onProgress('正在发布...')
  while (true) {
    try {
      // 小红书的草稿存在本地，关闭浏览器后就丢失了
      if (isDraft) {
        const draftBtn = page.locator('xhs-publish-btn')
        const count = await draftBtn.count()
        if (count > 0) {
          try {
            await page.evaluate(() => {
              const host = document.querySelector('xhs-publish-btn')
              if (host.shadowRoot) {
                // 第一个按钮是暂存离开按钮
                const btn = host.shadowRoot.querySelector('button:nth-child(1)')
                if (btn) {
                  btn.click()
                }
              }
            })
            logger.info('[xiaohongshu] draft button clicked')
          } catch (err) {
            logger.warn('[xiaohongshu] draft button exist but click failed', err.message)
          }
        } else {
          logger.warn('[xiaohongshu] draft button not found')
        }
        await page.waitForTimeout(5000)
        break
      } else {
        await page.evaluate(() => {
          const host = document.querySelector('xhs-publish-btn')
          if (host.shadowRoot) {
            // 第二个按钮是发布按钮
            const btn = host.shadowRoot.querySelector('button:nth-child(2)')
            if (btn) {
              btn.click()
            }
          }
        })
        await page.waitForURL(SUCCESS_URL, { timeout: 5000 })
        logger.info('[xiaohongshu] publish SUCCESS')
        onProgress('发布成功')
        break
      }
    } catch (error) {
      logger.error(`[xiaohongshu] publishing in progress...: ${error.message}`)
      await page.waitForTimeout(500)
    }
  }

  const url = page.url()
  logger.info(`[xiaohongshu] done, current url: ${url}`)
  return { success: true, url }
}
