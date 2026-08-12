/**
 * 账号服务层
 * 只做服务调度，具体实现调用 login/ 下各平台类
 */

// 导入各平台类实例
import xiaohongshu from '../login/xiaohongshu.js'
import douyin from '../login/douyin.js'
import kuaishou from '../login/kuaishou.js'
import wxchannels from '../login/wxchannels.js'
import { SUPPORTED_PLATFORMS } from '../constants.js'
import { launchBrowserNoCookies, launchBrowserWithCookies } from '../publish/utils.js'

/**
 * 平台实例映射
 */
const PLATFORMS = {
  xiaohongshu,
  douyin,
  kuaishou,
  wx_channels: wxchannels
}

/**
 * 获取所有支持的平台
 */
export function getSupportedPlatforms() {
  return SUPPORTED_PLATFORMS
}

/**
 * 获取平台实例
 * @param {string} platform 平台 key
 */
function getPlatform(platform) {
  const instance = PLATFORMS[platform]
  if (!instance) {
    throw new Error(`不支持的平台: ${platform}`)
  }
  return instance
}

/**
 * 打开浏览器让用户登录
 * @param {string} platform 平台 key
 * @param {Function} onProgress 进度回调
 */
export async function loginViaBrowser(platform) {
  const platformClass = getPlatform(platform)
  try {
    const { browser, context } = await launchBrowserNoCookies(platform)
    return await platformClass.login(context, browser)
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 *
 * @param {*} platform
 * @returns
 */
export async function testLoginBrowser(platform, cookieStr) {
  const platformClass = getPlatform(platform)
  try {
    const { browser, context } = await launchBrowserWithCookies(platform, cookieStr)
    return await platformClass.testLogin(context, browser)
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 *
 * @param {*} platform
 * @returns
 */
export async function openAccountBrowser(platform, cookieStr) {
  const platformClass = getPlatform(platform)
  try {
    const { browser, context } = await launchBrowserWithCookies(platform, cookieStr)
    return await platformClass.openAccount(context, browser)
  } catch (error) {
    return { success: false, error: error.message }
  }
}
