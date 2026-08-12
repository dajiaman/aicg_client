import fs from 'fs'
import logger from '../log'
import { launchBrowserWithCookies } from '../publish/utils.js'
import uploadToDouyin from '../publish/douyin.js'
import uploadToKuaishou from '../publish/kuaishou.js'
import uploadToWechatVideo from '../publish/wechatVideo.js'
import uploadToXiaohongshu from '../publish/xiaohongshu.js'

const PLATFORM_NAMES = {
  douyin: '抖音',
  kuaishou: '快手',
  wx_channels: '微信视频号',
  xiaohongshu: '小红书'
}

const UPLOAD_HANDLERS = {
  douyin: uploadToDouyin,
  kuaishou: uploadToKuaishou,
  wx_channels: uploadToWechatVideo,
  xiaxohongshu: uploadToXiaohongshu
}

/**
 * 发布到单个账户内
 * @param {*} account
 * @param {*} param1
 * @param {*} onProgress
 * @returns
 */
export async function publishToSingleAccount(
  account,
  { platform, videoPath, title, description, tags, isDraft, coverPath, autoCloseBrowser = false },
  onProgress
) {
  const handler = UPLOAD_HANDLERS[platform]
  if (!handler) {
    throw new Error(`不支持的平台: ${platform}`)
  }

  if (!account.cookies) {
    throw new Error(`${PLATFORM_NAMES[platform] || platform} 账号未登录`)
  }

  if (!fs.existsSync(videoPath)) {
    throw new Error(`视频文件不存在: ${videoPath}`)
  }

  logger.info(
    `[publish] === start publish to ${platform} (${account.display_name || account.account_name}) ===`
  )
  logger.info(`[publish] video: ${videoPath}`)
  logger.info(`[publish] title: ${title}, isDraft: ${isDraft}`)

  if (onProgress) onProgress({ message: `正在打开 ${PLATFORM_NAMES[platform]} 创作者平台...` })

  let browser, context
  try {
    const result = await launchBrowserWithCookies(platform, account.cookies)
    // eslint-disable-next-line no-unused-vars
    browser = result.browser
    context = result.context

    if (onProgress) onProgress({ message: `正在上传视频到 ${PLATFORM_NAMES[platform]}...` })

    const uploadResult = await handler(context, {
      videoPath,
      title,
      description,
      tags,
      isDraft,
      coverPath
    })

    if (onProgress) onProgress({ message: `${PLATFORM_NAMES[platform]} 发布完成` })

    // 如果自动关闭浏览器，关闭浏览器
    if (autoCloseBrowser) {
      await browser.close()
    }

    logger.info(`[publish] === ${platform} publish SUCCESS ===`)
    return {
      success: true,
      platform,
      account_id: account.id,
      nickname: account.display_name || account.account_name,
      url: uploadResult.url || ''
    }
  } catch (e) {
    logger.error(`[publish] === ${platform} publish FAILED: ${e.message} ===`)
    return {
      success: false,
      platform,
      account_id: account.id,
      nickname: account.display_name || account.account_name,
      error: e.message
    }
  } finally {
    // browser stays open for inspection
  }
}

export async function publishByAccounts(accounts, publishData, onProgress) {
  logger.info(`[publish] batch publish started, ${accounts.length} accounts`)
  const results = []
  let successCount = 0

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]
    if (onProgress) {
      onProgress({
        message: `正在发布到 ${PLATFORM_NAMES[account.platform] || account.platform} (${i + 1}/${accounts.length})...`,
        progress: Math.round((i / accounts.length) * 100)
      })
    }

    const result = await publishToSingleAccount(account, publishData)
    results.push(result)
    if (result.success) successCount++
    logger.info(
      `[publish] [${i + 1}/${accounts.length}] ${account.platform}: ${result.success ? 'SUCCESS' : 'FAILED'}`
    )
  }

  logger.info(`[publish] batch publish done: ${successCount}/${accounts.length} succeeded`)
  return {
    success: successCount > 0,
    success_count: successCount,
    total_count: accounts.length,
    results
  }
}
