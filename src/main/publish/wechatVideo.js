import logger from '../log'

const UPLOAD_URL = 'https://channels.weixin.qq.com/platform/post/create'
const MANAGE_URL = 'https://channels.weixin.qq.com/platform/post/list'

async function findFileInput(page) {
  for (const frame of page.frames()) {
    try {
      const fi = frame.locator('input[type="file"]')
      if (await fi.count()) return fi.first()
    } catch (e) {
      logger.error(`[wechat_video] find file input failed: ${e.message}`)
    }
  }
  return null
}

async function waitUploadReady(page, maxWaitMs = 300000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    try {
      const publishBtn = page.locator('button:has-text("发表")').first()
      if (await publishBtn.count()) {
        const cls = await publishBtn.getAttribute('class')
        if (!cls || !cls.includes('weui-desktop-btn_disabled')) {
          logger.info('[wechat_video] video upload ready')
          return true
        }
      }
      const failed = await page.locator('div.status-msg.error').count()
      const delBtn = await page
        .locator('div.media-status-content div.tag-inner:has-text("删除")')
        .count()
      if (failed && delBtn) {
        logger.warn('[wechat_video] upload failed, retrying...')
        await page.locator('div.media-status-content div.tag-inner:has-text("删除")').click()
        await page.getByRole('button', { name: '删除', exact: true }).click()
        return false
      }
      logger.info('[wechat_video] waiting for upload...')
    } catch {
      logger.info('[wechat_video] waiting for upload...')
    }
    await page.waitForTimeout(3000)
  }
  logger.warn('[wechat_video] upload wait timed out')
  return true
}

async function removeShepherdOverlays(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll('[class*="shepherd"], [class*="tooltip"], [class*="popover"]')
      .forEach((el) => el.remove())
  })
}


// 上传视频到微信视频号
export default async function uploadToWechatVideo(
  context,
  { videoPath, title, description, tags, isDraft, coverPath }
) {
  const page = await context.newPage()
  logger.info('[wx_channels] navigating to upload page')

  await page.goto(UPLOAD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForURL(UPLOAD_URL, { timeout: 120000 })

  let fi = await findFileInput(page)
  if (!fi) {
    const pubBtn = page.getByText('发表视频')
    if (await pubBtn.count()) {
      await pubBtn.first().click()
      await page.waitForTimeout(3000)
    }
    for (let i = 0; i < 20; i++) {
      fi = await findFileInput(page)
      if (fi) break
      await page.waitForTimeout(1000)
    }
  }
  if (!fi) throw new Error('未找到视频号文件上传框')

  logger.info(`[wechat_video] setting video file: ${videoPath}`)
  await fi.setInputFiles(videoPath)

  let ready = await waitUploadReady(page)
  if (ready === false) {
    fi = await findFileInput(page)
    if (fi) await fi.setInputFiles(videoPath)
    await waitUploadReady(page)
  }

  logger.info('[wechat_video] filling title and tags')
  const editor = page.locator('div.input-editor').first()
  await editor.click()
  await page.keyboard.type(title)
  await page.keyboard.press('Enter')
  if (tags && tags.length) {
    for (const tag of tags) {
      await page.keyboard.type('#' + tag)
      await page.keyboard.press('Space')
    }
    logger.info(`[wechat_video] tags added: ${tags.length}`)
  }

  if (description) {
    await page.keyboard.press('Enter')
    await page.keyboard.type(description)
    logger.info('[wechat_video] description set')
  }

  if (coverPath) {
    try {
      logger.info('[wechat_video] setting cover')

      // 横版封面选择器（4:3）
      const landscapeSelectors = [
        'div.horizontal-cover-wrap:has-text("4:3")',
        'div[class*="cover-wrap"]:has-text("4:3"):has-text("动态")',
        'div:has-text("视频号动态"):has-text("4:3")',
        'div:has-text("横版封面"):has-text("4:3")'
      ]

      // 竖版封面选择器（3:4）
      const portraitSelectors = [
        'div.vertical-cover-wrap:has-text("个人主页卡片"):has-text("3:4")',
        'div.vertical-cover-wrap:has-text("3:4")',
        'div.vertical-cover-wrap:has-text("个人主页卡片")'
      ]

      // 打开封面编辑弹窗
      async function openCoverDialog(selectors, dialogTitles) {
        for (const selector of selectors) {
          const coverEntry = page.locator(selector).first()
          try {
            if (!(await coverEntry.count())) continue
            await coverEntry.waitFor({ state: 'visible', timeout: 5000 })
            await coverEntry.click()
            await page.waitForTimeout(1000)
            break
          } catch {
            continue
          }
        }

        // 等待弹窗出现
        await page.waitForTimeout(1000)

        for (const title of dialogTitles) {
          const coverDialog = page
            .locator('div.weui-desktop-dialog:visible')
            .filter({ hasText: title })
            .first()
          try {
            if (await coverDialog.count()) {
              await coverDialog.waitFor({ state: 'visible', timeout: 5000 })
              return coverDialog
            }
          } catch {
            continue
          }
        }
        return null
      }

      // 上传封面图片并确认
      async function uploadCoverInDialog(coverDialog) {
        logger.info(`[wechat_video] uploading cover to dialog`)
        await coverDialog.waitFor({ state: 'visible', timeout: 10000 })

        // 等待文件输入框出现
        const fileInput = coverDialog
          .locator('.single-cover-uploader-wrap input[type="file"]')
          .first()

        // 尝试多种方式查找文件输入框
        let fileFound = false
        for (let i = 0; i < 5; i++) {
          if (await fileInput.count()) {
            fileFound = true
            break
          }
          await page.waitForTimeout(1000)
        }

        if (!fileFound) {
          logger.warn('[wechat_video] file input not found in cover dialog')
          return
        }

        await fileInput.setInputFiles(coverPath)
        await page.waitForTimeout(2000)

        // 处理裁剪封面弹窗
        const cropDialog = page
          .locator('div.weui-desktop-dialog')
          .filter({ hasText: '裁剪封面图' })
          .first()

        if (await cropDialog.count()) {
          try {
            // 等待弹窗完全显示
            await page.waitForTimeout(2000)
            await cropDialog.waitFor({ state: 'visible', timeout: 10000 })

            const cropConfirmBtn = cropDialog
              .locator('button.weui-desktop-btn_primary:has-text("确定")')
              .first()
            if (await cropConfirmBtn.count()) {
              // 使用 force click 避免被遮挡问题
              await cropConfirmBtn.click({ force: true })
              await page.waitForTimeout(2000)
            }
          } catch (e) {
            logger.warn(`[wechat_video] crop confirm error: ${e.message}`)
          }
        }

        // 等待一下再点击确认
        await page.waitForTimeout(1000)

        // 点击确认按钮
        const confirmBtn = coverDialog
          .locator('button.weui-desktop-btn_primary:has-text("确认")')
          .first()
        if (await confirmBtn.count()) {
          await confirmBtn.click({ force: true })
          await page.waitForTimeout(2000)
        }
      }

      // 设置单个封面
      async function setSingleThumbnail(selectors, dialogTitles, label) {
        const coverDialog = await openCoverDialog(selectors, dialogTitles)
        if (!coverDialog) {
          logger.info(`[wechat_video] ${label} cover dialog not found, skipping`)
          return
        }
        try {
          await uploadCoverInDialog(coverDialog)
          logger.info(`[wechat_video] ${label} cover set`)
        } catch (e) {
          logger.warn(`[wechat_video] ${label} cover set failed: ${e.message}`)
        }
      }

      // 设置横版封面（4:3）
      await setSingleThumbnail(
        landscapeSelectors,
        ['编辑视频号动态封面', '编辑动态封面', '编辑封面'],
        '4:3 landscape'
      )

      // 设置竖版封面（3:4）
      await setSingleThumbnail(portraitSelectors, ['编辑个人主页卡片', '编辑封面'], '3:4 portrait')
    } catch (e) {
      logger.warn(`[wechat_video] cover set failed: ${e.message}`)
    }
  }

  logger.info('[wx_channels] publishing...')
  logger.info(`[wx_channels] draft mode: ${isDraft}`)
  const publishStartTime = Date.now()
  while (Date.now() - publishStartTime < 120000) {
    try {
      await removeShepherdOverlays(page)
      // 保存到草稿
      if (isDraft) {
        const draftBtn = page.locator('button:has-text("保存草稿")').first()
        await draftBtn.waitFor({ state: 'visible', timeout: 10000 })
        await draftBtn.click({ force: true })
        logger.info('[wechat_video] draft button clicked')
        logger.info('[wechat_video] draft saved')
        const url = page.url()
        return { success: true, url }
      } else {
        const publishBtn = page.locator('button:has-text("发表")').first()
        await publishBtn.waitFor({ state: 'visible', timeout: 10000 })
        const cls = await publishBtn.getAttribute('class')
        if (cls && cls.includes('weui-desktop-btn_disabled')) {
          logger.info('[wechat_video] publish button disabled, waiting...')
          await page.waitForTimeout(2000)
          continue
        }
        await publishBtn.click({ force: true })
        logger.info('[wechat_video] publish button clicked')
        await page.waitForURL(`**${MANAGE_URL}**`, { timeout: 15000 })
        logger.info('[wechat_video] publish SUCCESS, redirected to manage page')
        const url = page.url()
        return { success: true, url }
      }
    } catch (e) {
      logger.warn(`[wechat_video] publish attempt failed: ${e.message}`)
      await page.waitForTimeout(2000)
    }
  }

  const url = page.url()
  logger.warn(`[wechat_video] publish timed out, current url: ${url}`)
  return { success: true, url }
}
