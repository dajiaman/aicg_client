import logger from '../log/index.js'

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

/**
 * 检测"封面相关弹窗"是否存在
 */
async function hasCoverModal(page) {
  const detectors = [
    'text="请设置封面后再发布"',
    'text="设置横封面获取更多流量"', // 严格匹配
    'text="上传封面"'
  ]
  for (const sel of detectors) {
    const el = page.locator(sel).first()
    if ((await el.count()) && (await el.isVisible())) {
      return true
    }
  }
  return false
}

/**
 * 主动检测 + 关闭"设置横封面获/货更多流量"弹窗
 *  - 兼容 获/货 两种错别字
 *  - 兜底:点 X / Escape
 */
async function closeHorizontalCoverModal(page) {
  try {
    // 模糊匹配：包含 "设置横封面" + "更多流量"，中间字兼容
    const title = page.locator('text="设置横封面获取更多流量"').first()
    if (!((await title.count()) && (await title.isVisible()))) {
      return false
    }
    logger.info('[douyin] horizontal cover modal detected, closing...')

    // 1. 优先点"暂不设置"按钮
    const skipBtn = page.locator('button:has-text("暂不设置")').first()
    if (await skipBtn.count()) {
      await skipBtn.click()
      await page.waitForTimeout(800)
      logger.info('[douyin] horizontal modal: clicked 暂不设置')
      return true
    }

    // 2. 找弹窗的 X 关闭按钮
    const closeBtn = title
      .locator(
        'xpath=ancestor::*[contains(@class,"modal") or contains(@class,"Modal") or contains(@class,"dialog")][1]'
      )
      .locator('button:has(svg), [class*="close"], [aria-label*="close" i]')
      .first()
    if (await closeBtn.count()) {
      await closeBtn.click({ force: true })
      await page.waitForTimeout(800)
      logger.info('[douyin] horizontal modal: closed via X')
      return true
    }

    // 3. 兜底:点"完成"按钮（Escape 对抖音 modal 无效）
    const doneFallback = page.locator('button:has-text("完成")').first()
    if (await doneFallback.count()) {
      await doneFallback.click({ force: true })
      await page.waitForTimeout(800)
      logger.info('[douyin] horizontal modal: closed via 完成')
      return true
    }

    logger.warn('[douyin] horizontal modal: no close button found')
    return false
  } catch (e) {
    await page.keyboard.press('Escape')
    logger.warn(`[douyin] closeHorizontalCoverModal error: ${e.message}`)
    return false
  }
}

/**
 * 自动处理抖音的封面弹窗
 *
 * 策略：横封面引导弹窗出现时，点"暂不设置"按钮
 *  （之前改了点 X，但用户希望改回"暂不设置"）
 */
async function handleAutoVideoCover(page, hasCoverPath = false) {
  try {
    if (!(await hasCoverModal(page))) return false

    logger.info('[douyin] cover modal detected, attempting auto-handle')

    // 0. 横封面引导弹窗："设置横封面获更多流量"（兼容"获/货"错别字）
    //    策略:点"暂不设置"（让抖音自动抽帧，不影响用户已设的竖封面）
    const horizontalTitle = page.locator('text="设置横封面获取更多流量"').first()
    if ((await horizontalTitle.count()) && (await horizontalTitle.isVisible())) {
      logger.info('[douyin] horizontal cover modal detected')

      // 优先点"暂不设置"按钮
      const skipBtn = page.locator('button:has-text("暂不设置")').first()
      if (await skipBtn.count()) {
        await skipBtn.click()
        await page.waitForTimeout(1500)
        logger.info('[douyin] clicked 暂不设置 → use auto-frame cover')
        return true
      }

      // 兜底:点"完成"
      const doneBtn = page.locator('button:has-text("完成")').first()
      if ((await doneBtn.count()) && (await doneBtn.isVisible()) && !doneBtn.isDisabled()) {
        await doneBtn.click()
        await page.waitForTimeout(800)
        logger.warn('[douyin] horizontal cover modal closed via 完成')
        return true
      }

      // 兜底:点 X
      const closeBtn = horizontalTitle
        .locator(
          'xpath=ancestor::*[contains(@class,"modal") or contains(@class,"Modal") or contains(@class,"dialog")][1]'
        )
        .locator('button:has(svg), [class*="close"], [aria-label*="close" i]')
        .first()
      if (await closeBtn.count()) {
        await closeBtn.click({ force: true })
        await page.waitForTimeout(800)
        logger.info('[douyin] horizontal cover modal closed via X')
        return true
      }

      // 最兜底:点"完成"按钮（Escape 对抖音 modal 无效）
      const doneLast = page.locator('button:has-text("完成")').first()
      if (await doneLast.count()) {
        await doneLast.click({ force: true })
        await page.waitForTimeout(800)
        logger.info('[douyin] horizontal cover modal closed via 完成 (fallback)')
        return true
      }
      logger.warn('[douyin] horizontal cover modal: no close method worked')
      return false
    }

    // 1. 优先：点"选择封面"按钮 → 让外层 cover 上传逻辑接管
    const chooseBtn = page.locator('button:has-text("选择封面"), text="选择封面"').first()
    if (await chooseBtn.count()) {
      logger.info('[douyin] click "选择封面" to upload local cover instead')
      return false // 由调用方处理
    }

    // 2. 兜底：选推荐封面
    const recommendCover = page
      .locator('[class^="recommendCover-"], [class*="recommendCover"], img[class*="recommend"]')
      .first()
    if (await recommendCover.count()) {
      await recommendCover.click({ force: true })
      await page.waitForTimeout(800)
      const confirmBtn = page.locator('button:has-text("确定")').first()
      if (
        (await confirmBtn.count()) &&
        (await confirmBtn.isVisible()) &&
        !confirmBtn.isDisabled()
      ) {
        await confirmBtn.click()
        logger.info('[douyin] recommended cover applied')
        await page.waitForTimeout(800)
        return true
      }
    }

    // 3. 再兜底：试"完成"按钮直接关闭
    const doneBtn = page.locator('button:has-text("完成")').first()
    if ((await doneBtn.count()) && (await doneBtn.isVisible()) && !doneBtn.isDisabled()) {
      await doneBtn.click()
      await page.waitForTimeout(800)
      logger.warn('[douyin] cover modal closed by clicking 完成 without cover')
      return true
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

  await page.waitForSelector("div[class^='container'] input", {
    state: 'attached',
    timeout: 60000
  })
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
      logger.warn(`[douyin] upload incomplete, retry ${retry + 1}/${maxRetries}`)
      const fileInput = await page.$('div.progress-div [class^="upload-btn-input"]')
      if (fileInput) {
        await fileInput.setInputFiles(videoPath)
      }
    }
  }

  if (coverPath) {
    try {
      logger.info('[douyin] setting cover image')

      // 先尝试关掉可能存在的横封面引导弹窗
      await handleAutoVideoCover(page, true)

      await removeShepherdOverlays(page)
      await page.locator('text="选择封面"').first().click({ force: true })
      const coverModal = page.locator('div.dy-creator-content-modal').first()
      await coverModal.waitFor({ state: 'visible', timeout: 20000 })
      await page.waitForTimeout(1500)
      const coverUpload = coverModal.locator('input.semi-upload-hidden-input').nth(1)
      await coverUpload.setInputFiles(coverPath)
      await page.waitForTimeout(3000)
      // 点击"完成"按钮
      await coverModal.locator('button', { hasText: '完成' }).first().click()
      logger.info('[douyin] cover set')
      await page.waitForTimeout(1000)

      try {
        await page.keyboard.press('Escape')
        // 点击完成之后，才显示的"设置横封面获更多流量"弹窗
        // 主动检测 + 关闭"设置横封面获更多流量"弹窗
        logger.info('[douyin] try close horizontal cover modal')
        await closeHorizontalCoverModal(page)
      } catch {
        // escape
        logger.warn('[douyin] close horizontal cover modal failed')
      }

      logger.info('[douyin] click finish btn')
      // 点击"完成"按钮关闭封面 modal（不用 Escape，Escape 对抖音 modal 无效）
      await coverModal.locator('button', { hasText: '完成' }).first().click()

      // 给点时间让 modal 关闭
      await page.waitForTimeout(1500)

      try {
        await coverModal.waitFor({ state: 'detached', timeout: 5000 })
      } catch {
        // 点击没关闭：再试一次点"完成"
        logger.warn('[douyin] cover modal still attached, retry click 完成')
      }
    } catch (e) {
      logger.warn(`[douyin] cover set failed: ${e.message}`)
    }
  } else {
    // 没传 coverPath：提前处理"横封面引导弹窗"，避免卡在弹窗
    logger.info('[douyin] no coverPath, trying to dismiss horizontal cover modal')
    await handleAutoVideoCover(page, false)
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

      // 发布前主动检测封面弹窗，优先尝试处理
      if (await hasCoverModal(page)) {
        logger.warn('[douyin] cover modal still open before publish')
        const ok = await handleAutoVideoCover(page, !!coverPath)
        if (!ok) {
          logger.warn('[douyin] waiting for user to set cover manually')
          await page.waitForTimeout(3000)
          continue
        }
      }

      // 暂存
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
      await handleAutoVideoCover(page, !!coverPath)
      await page.waitForTimeout(500)
    }
  }

  const url = page.url()
  logger.warn(`[douyin] publish timed out, current url: ${url}`)
  return { success: true, url }
}
