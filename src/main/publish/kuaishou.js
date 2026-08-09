import logger from '../log'
import { waitForUploadComplete, waitForSuccess } from './utils.js'

const CONFIG = {
  name: '快手',
  uploadUrl: 'https://cp.kuaishou.com/article/publish/video',
  fileInputSelector: 'input[type="file"][accept*="video"]',
  titleSelector: 'input[placeholder*="标题"], textarea[placeholder*="标题"]',
  descSelector: 'textarea[placeholder*="描述"], textarea[placeholder*="简介"]',
  submitSelector: 'button:has-text("发布")',
  draftSelector: 'button:has-text("存草稿")',
  waitForSelector: 'text="发布成功"'
}


// 上传快手
export default async function uploadToKuaishou(
  context,
  { videoPath, title, description, tags, isDraft, coverPath }
) {
  const page = await context.newPage()
  logger.info('[kuaishou] navigating to upload page')

  await page.goto(CONFIG.uploadUrl, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3000)

  const fileInput = await page.$(CONFIG.fileInputSelector)
  if (!fileInput) throw new Error('未找到视频上传入口')
  logger.info(`[kuaishou] setting video file: ${videoPath}`)
  await fileInput.setInputFiles(videoPath)

  await waitForUploadComplete(page, 'kuaishou', 300000)

  const titleEl = await page.$(CONFIG.titleSelector)
  if (titleEl) {
    await titleEl.click()
    await titleEl.fill('')
    await titleEl.fill(title)
    logger.info(`[kuaishou] title set: ${title}`)
  }

  if (description) {
    const descEl = await page.$(CONFIG.descSelector)
    if (descEl) {
      await descEl.click()
      await descEl.fill(description)
      logger.info('[kuaishou] description set')
    }
  }

  await page.waitForTimeout(2000)

  if (isDraft) {
    const draftBtn = await page.$(CONFIG.draftSelector)
    if (draftBtn) {
      await draftBtn.click()
      logger.info('[kuaishou] draft button clicked')
    }
  } else {
    const submitBtn = await page.$(CONFIG.submitSelector)
    if (submitBtn) {
      await submitBtn.click()
      logger.info('[kuaishou] submit button clicked')
    }
  }

  const success = await waitForSuccess(page, CONFIG.waitForSelector, 120000)
  if (success) {
    logger.info('[kuaishou] publish success indicator found')
  } else {
    logger.warn('[kuaishou] publish success indicator not found, waiting 10s fallback')
    await page.waitForTimeout(10000)
  }

  const url = page.url()
  logger.info(`[kuaishou] done, current url: ${url}`)
  return { success: true, url }
}
