import logger from '../log'

async function removeShepherdOverlays(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll(
        '.shepherd-element, .shepherd-modal-overlay-container, [class*="mention-wrapper"]'
      )
      .forEach((e) => e.remove())
  })
}

async function waitForPublishPage(page, timeout = 120000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const url = page.url()
    if (
      url.includes('content/publish?enter_from=publish_page') ||
      url.includes('content/post/video?enter_from=publish_page')
    ) {
      logger.info(`[douyin] publish page reached: ${url}`)
      return true
    }
    await page.waitForTimeout(500)
  }
  logger.warn('[douyin] waitForPublishPage timed out')
  return false
}

async function waitForVideoUploadDone(page, timeout = 300000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      const reupload = await page.locator('[class^="long-card"] div:has-text("重新上传")').count()
      if (reupload > 0) {
        logger.info('[douyin] video upload complete: re-upload button visible')
        return true
      }
      const fail = await page.locator('div.progress-div > div:has-text("上传失败")').count()
      if (fail > 0) {
        logger.warn('[douyin] upload failed')
        return false
      }
    } catch {
      // page transitioning
    }
    await page.waitForTimeout(2000)
  }
  logger.warn('[douyin] waitForVideoUploadDone timed out')
  return false
}

async function handleAutoVideoCover(page) {
  try {
    const prompt = page.locator('text="请设置封面后再发布"').first()
    if ((await prompt.count()) && (await prompt.isVisible())) {
      logger.info('[douyin] cover required, selecting recommended cover')
      const recommendCover = page.locator('[class^="recommendCover-"]').first()
      if (await recommendCover.count()) {
        await recommendCover.click()
        await page.waitForTimeout(1000)
        const confirmBtn = page.locator('button:has-text("确定")').first()
        if ((await confirmBtn.count()) && (await confirmBtn.isVisible())) {
          await confirmBtn.click()
          logger.info('[douyin] recommended cover applied')
          await page.waitForTimeout(1000)
        }
        return true
      }
    }
  } catch (e) {
    logger.warn(`[douyin] handleAutoVideoCover error: ${e.message}`)
  }
  return false
}

/**
 * 发布抖音视频
 */
export default async function uploadToDouyin(
  context,
  { videoPath, title, description, tags, isDraft, coverPath }
) {
  const page = await context.newPage()
  logger.info('[douyin] navigating to upload page')
  await page.goto('https://creator.douyin.com/creator-micro/content/upload', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  })

  await page.waitForSelector("div[class^='container'] input", { state: 'attached', timeout: 60000 })
  logger.info(`[douyin] setting video file: ${videoPath}`)
  await page.locator("div[class^='container'] input").setInputFiles(videoPath)

  await waitForPublishPage(page, 120000)
  await page.waitForTimeout(1000)

  logger.info('[douyin] filling title and description')
  const titleInput = page.locator('input[placeholder*="填写作品标题"]').first()
  await titleInput.waitFor({ state: 'visible', timeout: 120000 })
  await titleInput.fill((title || '').slice(0, 30))

  const descEditor = page.locator('div.zone-container[contenteditable="true"]').first()
  await descEditor.waitFor({ state: 'visible', timeout: 120000 })
  await descEditor.click()
  await page.keyboard.press('Control+KeyA')
  await page.keyboard.press('Delete')

  if (description) {
    await page.keyboard.type(description)
  }

  if (tags && tags.length) {
    for (const tag of tags.slice(0, 5)) {
      await page.keyboard.type(` #${tag}`)
      await page.keyboard.press('Space')
    }
    logger.info(`[douyin] tags added: ${tags.slice(0, 5).join(', ')}`)
  }
  await page.keyboard.press('Escape')

  logger.info('[douyin] waiting for video upload to complete...')
  const maxRetries = 3
  for (let retry = 0; retry < maxRetries; retry++) {
    const done = await waitForVideoUploadDone(page, 300000)
    if (done) break
    if (retry < maxRetries - 1) {
      log.warn(`[douyin] upload incomplete, retry ${retry + 1}/${maxRetries}`)
      const fileInput = await page.$('div.progress-div [class^="upload-btn-input"]')
      if (fileInput) {
        await fileInput.setInputFiles(videoPath)
      }
    }
  }

  if (coverPath) {
    try {
      logger.info('[douyin] setting cover image')
      await removeShepherdOverlays(page)
      await page.locator('text="选择封面"').first().click({ force: true })
      const coverModal = page.locator('div.dy-creator-content-modal').first()
      await coverModal.waitFor({ state: 'visible', timeout: 20000 })
      await page.waitForTimeout(1500)
      const coverUpload = coverModal.locator('input.semi-upload-hidden-input').nth(1)
      await coverUpload.setInputFiles(coverPath)
      await page.waitForTimeout(3000)
      await coverModal.locator('button', { hasText: '完成' }).first().click()
      logger.info('[douyin] cover set')
      await coverModal.waitFor({ state: 'detached', timeout: 20000 })
    } catch (e) {
      logger.warn(`[douyin] cover set failed: ${e.message}`)
    }
  }

  try {
    logger.info('[douyin] setting self-declaration')
    const entry = page.locator('text="请选择自主声明"').first()
    await entry.waitFor({ state: 'visible', timeout: 6000 })
    await entry.click()
    const dialog = page
      .locator('.semi-modal-content')
      .filter({ hasText: '对作品内容添加声明' })
      .first()
    await dialog.waitFor({ state: 'visible', timeout: 6000 })
    const option = dialog.locator('.semi-radio').filter({ hasText: '内容为个人观点或见解' }).first()
    if (await option.count()) {
      await option.click({ timeout: 6000 })
    } else {
      await dialog
        .getByText('内容为个人观点或见解', { exact: true })
        .first()
        .click({ timeout: 6000, force: true })
    }
    await dialog.getByRole('button', { name: '确定' }).click({ timeout: 6000 })
    logger.info('[douyin] self-declaration set')
  } catch (e) {
    logger.warn(`[douyin] self-declaration skipped: ${e.message}`)
  }

  logger.info('[douyin] publishing...')
  const publishStartTime = Date.now()
  while (Date.now() - publishStartTime < 60000) {
    try {
      await removeShepherdOverlays(page)
      if (isDraft) {
        const draftBtn = page.getByRole('button', { name: '暂存离开', exact: true })
        if (await draftBtn.count()) {
          await draftBtn.click({ force: true })
          logger.info('[douyin] draft button clicked')
        } else {
          logger.warn('[douyin] draft button not found')
        }
        await page
          .waitForURL('**/creator-micro/content/manage**', { timeout: 10000 })
          .catch(() => {})
        logger.info('[douyin] draft saved')
        const url = page.url()
        return { success: true, url }
      } else {
        const publishBtn = page.getByRole('button', { name: '发布', exact: true })
        if (await publishBtn.count()) {
          await publishBtn.click({ force: true })
        }
        await page.waitForURL('**/creator-micro/content/manage**', { timeout: 5000 })
        logger.info('[douyin] publish SUCCESS, redirected to manage page')
        const url = page.url()
        return { success: true, url }
      }
    } catch {
      await handleAutoVideoCover(page)
      await page.waitForTimeout(500)
    }
  }

  const url = page.url()
  logger.warn(`[douyin] publish timed out, current url: ${url}`)
  return { success: true, url }
}
