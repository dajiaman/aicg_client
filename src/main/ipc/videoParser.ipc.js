// videoParser:*  —  视频文案提取
//
// 当前实现：
//   - 抖音：通过 src/main/videoParser/douyin.js（playwright 抓取）
//   - 文案提取：通过 ASR 服务（python-modules/asrModule）转写视频音频
//
// 后续将对接：
//   - python-modules/videoParserModule（yt-dlp / 平台特定解析 + ASR）
//   - python-modules/asrModule（fast-whisper-server）
import logger from '../log'
import { parseDouyinVideoInfo, parseAndExtractDouyin } from '../videoParser/douyin.js'
import { parseKuaishouVideoInfo, parseAndExtractKuaishou } from '../videoParser/kuaishou.js'

/**
 * 平台识别规则（与 mock validateUrl 保持一致）
 */
const PLATFORM_PATTERNS = [
  {
    key: 'douyin',
    name: '抖音',
    re: /(?:^|\b)(?:https?:\/\/)?(?:v\.)?douyin\.com\/[A-Za-z0-9_-]+/i
  },
  {
    key: 'kuaishou',
    name: '快手',
    re: /(?:^|\b)(?:https?:\/\/)?(?:v\.)?kuaishou\.com\/[A-Za-z0-9_-]+/i
  },
  {
    key: 'wechat_video',
    name: '视频号',
    re: /(?:^|\b)(?:https?:\/\/)?(?:finder|channel)\.video\.qq\.com\/[^\s]+/i
  },
  {
    key: 'xiaohongshu',
    name: '小红书',
    re: /(?:^|\b)(?:https?:\/\/)?(?:www\.)?xiaohongshu\.com\/[^\s]+/i
  }
]

/**
 * URL 末尾常见的中英文标点 / 包裹符号（从匹配尾部清理）
 * 注：保留 URL 内部的查询字符串 ?、&、=
 */
const TRAILING_PUNCT_RE = /[`'"<>()\[\]「」『』《》【】。，、！？；：,\.!?;:\s]+$/

/**
 * 清洗 URL：去除末尾标点、包裹符号、空白等
 */
function cleanUrlTail(url) {
  if (!url) return url
  let cleaned = url
  // 反复清洗（最多 5 次，处理如 "... 。`" 多层包装的情况）
  for (let i = 0; i < 5; i++) {
    const next = cleaned.replace(TRAILING_PUNCT_RE, '')
    if (next === cleaned) break
    cleaned = next
  }
  return cleaned
}

/**
 * 从一段分享文本中提取 URL（按优先级匹配抖音/快手/视频号/小红书）
 *
 * 关键点：
 *  1. http(s):// 开头优先
 *  2. 无协议但有平台短链（如 v.douyin.com/xxx）退化匹配，自动补 https://
 *  3. 清除 URL 尾部的中英文标点 / 包裹符号 / 空白
 *  4. 真实抖音分享文本典型形式：
 *     "5.38 02/05 标题内容 https://v.douyin.com/Qjh2wH6cHkw/ 复制此链接，打开Dou音搜索..."
 */
function extractUrlFromText(text) {
  if (!text || typeof text !== 'string') return null

  // 1) 优先匹配 http(s):// 开头
  const httpMatch = /https?:\/\/[^\s]+/i.exec(text)
  if (httpMatch) {
    return cleanUrlTail(httpMatch[0])
  }

  // 2) 退化：尝试匹配无协议的短链（避免误匹配中文字符）
  //    抖音: v.douyin.com/xxx  或  www.douyin.com/xxx
  //    快手: v.kuaishou.com/xxx 或 kuaishou.com/xxx
  //    小红书: www.xiaohongshu.com/xxx
  const shortPatterns = [
    /(?:^|\s)((?:v\.|www\.)?douyin\.com\/[A-Za-z0-9_\-]+)/i,
    /(?:^|\s)((?:v\.|www\.)?kuaishou\.com\/[A-Za-z0-9_\-]+)/i,
    /(?:^|\s)((?:www\.)?xiaohongshu\.com\/[A-Za-z0-9_\-]+)/i
  ]
  for (const re of shortPatterns) {
    const m = re.exec(text)
    if (m) {
      return cleanUrlTail('https://' + m[1])
    }
  }

  return null
}

/**
 * 平台识别
 */
function detectPlatform(url) {
  for (const p of PLATFORM_PATTERNS) {
    if (p.re.test(url)) return p
  }
  return null
}

/**
 * 注册 video-parser:*
 * 用于前端联调用的视频文案提取和 URL 校验
 */
export function registerVideoParserIpc(ipcMain) {
  logger.info('[video-parser] registering video parser ipc')
  // ------------------------------------------------------------
  // ---------- 视频文案提取 ----------
  // ------------------------------------------------------------
  // 视频文案提取
  // ------------------------------------------------------------
  // 入参：rawUrl: string（可能是一段分享文本或直接的 URL）
  // 返回：{ success: true, data: { url } } | { success: false, error }
  ipcMain.handle('video-parser:extract-url', async (_, rawUrl) => {
    logger.info(`[video-parser:extract-url] ${rawUrl}`)
    try {
      const text = String(rawUrl || '').trim()
      if (!text) {
        return { success: false, error: '输入为空' }
      }

      const url = extractUrlFromText(text)
      if (!url) {
        return { success: false, error: '未在文本中识别到有效链接' }
      }

      logger.info(`[video-parser:extract-url] ${url}`)
      return { success: true, data: { url } }
    } catch (e) {
      logger.error(`[video-parser:extract-url] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  // ------------------------------------------------------------
  // 校验 URL
  // ------------------------------------------------------------
  // 入参：url: string
  // 返回：{ success: true, data: { valid: boolean, platform?: string, reason?: string } }
  ipcMain.handle('video-parser:validate-url', async (_, url) => {
    logger.info(`[video-parser:validate-url] ${url}`)
    try {
      const u = String(url || '').trim()
      if (!u) {
        return { success: true, data: { valid: false, reason: 'url 为空' } }
      }

      const platform = detectPlatform(u)
      if (!platform) {
        return {
          success: false,
          error: '暂不支持该平台的视频链接',
          data: { valid: false, reason: '暂不支持该平台的视频链接' }
        }
      }

      return {
        success: true,
        data: { valid: true, platform: platform.key }
      }
    } catch (e) {
      logger.error(`[video-parser:validate-url] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  //
  // 解析视频 (douyin/kuaishou/xiaohongshu)
  // ------------------------------------------------------------
  //
  ipcMain.handle('video-parser:parse', async (_, url) => {
    logger.info(`[video-parser:parse] ${url}`)
    try {
      const text = String(url || '').trim()
      if (!text) {
        return { success: false, error: 'url 为空' }
      }

      // 抖音：调用 playwright 抓取实现
      if (/(?:v\.|www\.)?douyin\.com\//i.test(text)) {
        const res = await parseDouyinVideoInfo(text)
        if (!res.success) {
          return { success: false, error: res.error || '抖音解析失败' }
        }
        return { success: true, data: { videoInfo: res.data } }
      }

      // 快手：调用 playwright 抓取实现
      if (/(?:v\.|www\.)?kuaishou\.com\//i.test(text)) {
        const res = await parseKuaishouVideoInfo(text)
        if (!res.success) {
          return { success: false, error: res.error || '快手解析失败' }
        }
        return { success: true, data: { videoInfo: res.data } }
      }

      // 小红书 / 视频号：暂未实现
      return {
        success: false,
        error: '该平台暂未实现解析'
      }
    } catch (e) {
      logger.error(`[video-parser:parse] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  // ------------------------------------------------------------
  // 解析并提取视频文案
  // ------------------------------------------------------------
  // 入参：url: string
  // 返回：{ success: true, data: {  originalContent: string, videoInfo?: object } }
  // | { success: false, error: string }
  ipcMain.handle('video-parser:parse-and-extract', async (_, url) => {
    logger.info(`[video-parser:parse-and-extract] ${url}`)

    // 判断平台
    const platform = detectPlatform(url)
    if (!platform) {
      return { success: false, error: '暂不支持该平台的视频链接' }
    }

    // 抖音
    if (platform.key == 'douyin') {
      return await parseAndExtractDouyin(url)
    }

    return { success: false, error: '暂平台暂未实现解析' }
  })
}
