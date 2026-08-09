// 通过分享链接解析抖音视频信息
// 入参：url: string  （支持完整链接或 v.douyin.com 短链）
// 返回：{
//   success: boolean,
//   data?: {
//     awemeId,        // 视频 id
//     title,          // 视频标题
//     author,         // 作者昵称
//     authorId,       // 作者 id
//     cover,          // 封面图
//     duration,       // 时长(ms)
//     videoUrl,       // 无水印播放地址
//     musicUrl,       // 背景音乐
//     shareUrl        // 原始分享链接
//   },
//   error?: string
// }
//
// 实现思路：
//   1. 用 playwright 打开短链（自动跟随 302 跳转到 www.iesdouyin.com/web/api/v1/aweme/iteminfo/?item_ids=...）
//   2. 拦截该 API 请求，从响应 JSON 中拿到 aweme 详情
//   3. 从详情中提取 title / video / cover / music / duration，并替换 playwm URL 为无水印地址
import { chromium } from 'playwright'
import logger from '../log'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import https from 'https'
import http from 'http'
import { URL } from 'url'
import { getTempPath } from '../ipc/file.ipc'
import { resolveExecutablePath } from './utils'
import { speechRecognition } from '../services/asrService'

// 移动端 User-Agent
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android; 5.1; Nexus 5 Build Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Mobile/537.36'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

/**
 * 从原始分享文本中提取 URL
 * 兼容：完整 http(s)、纯 v.douyin.com/xxx
 */
function pickUrl(input) {
  if (!input) return ''
  const text = String(input).trim()
  const m = text.match(/https?:\/\/[^\s]+/i)
  if (m) return m[0].replace(/[)\]】。」』,，]+$/, '')
  // 支持短链（v.douyin.com/xxxx/），不截断尾部斜杠与后续路径
  const m2 = text.match(/(?:https?:\/\/)?(?:v\.|www\.)?douyin\.com\/[A-Za-z0-9/_-]+/i)
  if (m2) return m2[0].startsWith('http') ? m2[0] : 'https://' + m2[0]
  return ''
}

/**
 * 把 playwm 替换为 play，得到无水印地址
 */
function stripWatermark(url) {
  if (!url) return ''
  return String(url).replace(/playwm/gi, 'play')
}

/**
 * 解析单个抖音视频
 *
 * 实现策略（参考 yzfly/douyin-mcp-server 的 parse_share_url）：
 *   1) 首选：HTTP 请求 + iesdouyin 旧版页面 + window._ROUTER_DATA 正则解析
 *      - 优势：无需 chromium，速度快（几百毫秒），不依赖页面渲染
 *   2) 兜底：playwright 打开新版 douyin.com 详情页 + 拦截 aweme 详情 API
 *      - 优势：能应对新版页面的改动
 */
export async function parseDouyinVideoInfo(url) {
  const shareUrl = pickUrl(url)
  if (!shareUrl) {
    return { success: false, error: '未识别到有效的抖音链接' }
  }

  logger.info(`[douyin-parser] start: ${shareUrl}`)

  // ---------- 1. 首选：HTTP 解析 ----------
  const t0 = Date.now()
  try {
    const httpRes = await parseShareUrlByHttp(shareUrl)
    if (httpRes) {
      logger.info(`[douyin-parser] http path ok aweme=${httpRes.awemeId} (${Date.now() - t0}ms)`)
      return { success: true, data: httpRes }
    }
    logger.warn(`[douyin-parser] http path miss, fallback to playwright`)
  } catch (e) {
    logger.warn(`[douyin-parser] http path failed: ${e.message}, fallback to playwright`)
  }

  // ---------- 2. 兜底：playwright ----------
  const tp = Date.now()
  const pwRes = await parseShareUrlByPlaywright(shareUrl)
  logger.info(`[douyin-parser] playwright path ${pwRes ? 'ok' : 'fail'} (${Date.now() - tp}ms)`)
  if (pwRes) return { success: true, data: pwRes }
  return { success: false, message: '未能从抖音页面解析出视频信息' }
}

// =============================================================================
// 首选通道：HTTP + iesdouyin 旧版接口 + window._ROUTER_DATA
// 移植自 https://github.com/yzfly/douyin-mcp-server/blob/main/douyin_mcp_server/server.py
// =============================================================================

/**
 * 仅用 HTTP 解析分享链接：
 *   1) requests.get(share_url, allow_redirects=True) 拿到最终 URL，从路径里取 video_id
 *   2) 用移动端 UA 拉 https://www.iesdouyin.com/share/video/<id>，从 HTML 里正则提取
 *      window._ROUTER_DATA = {...}</script>
 *   3) 解析 loaderData["video_(id)/page"] 或 loaderData["note_(id)/page"] → videoInfoRes.item_list[0]
 *   4) video.play_addr.url_list[0]，playwm → play
 *
 * @param {string} shareUrl  原始 https://... 链接
 * @returns {Promise<object|null>}  命中返回完整 data；未命中返回 null
 */
async function parseShareUrlByHttp(shareUrl) {
  // ---------- step 1: 跟随短链重定向，提取 video_id ----------
  const redirectHtml = await httpGetText(shareUrl, MOBILE_USER_AGENT, 15000)
  const videoId = extractVideoIdFromUrl(redirectHtml.finalUrl || shareUrl)
  if (!videoId) {
    logger.warn(`[douyin-parser] cannot extract video_id from ${redirectHtml.finalUrl}`)
    return null
  }

  logger.debug(`[douyin-parser] video_id=${videoId}`)

  // ---------- step 2: 拉 iesdouyin 旧版详情页 ----------
  const iesUrl = `https://www.iesdouyin.com/share/video/${videoId}`
  const html = await httpGetText(iesUrl, MOBILE_USER_AGENT, 20000)
  if (!html.body) return null

  // ---------- step 3: 从 window._ROUTER_DATA = ...; 提取 JSON ----------
  const m = html.body.match(/window\._ROUTER_DATA\s*=\s*(.*?)<\/script>/s)
  if (!m || !m[1]) {
    logger.warn('[douyin-parser] no _ROUTER_DATA in iesdouyin page')
    return null
  }

  let json
  try {
    json = JSON.parse(m[1].trim())
  } catch (e) {
    logger.warn(`[douyin-parser] parse _ROUTER_DATA failed: ${e.message}`)
    return null
  }

  const loaderData = json?.loaderData || {}
  const VIDEO_ID_PAGE_KEY = 'video_(id)/page'
  const NOTE_ID_PAGE_KEY = 'note_(id)/page'

  let itemList
  if (VIDEO_ID_PAGE_KEY in loaderData) {
    itemList = loaderData[VIDEO_ID_PAGE_KEY]?.videodebugRes?.item_list
  } else if (NOTE_ID_PAGE_KEY in loaderData) {
    itemList = loaderData[NOTE_ID_PAGE_KEY]?.videoInfoRes?.item_list
  }
  if (!Array.isArray(itemList) || !itemList.length) {
    logger.warn('[douyin-parser] no item_list in videoInfoRes')
    return null
  }
  return normalizeAweme(itemList[0], shareUrl)
}

/**
 * 从重定向后的 URL 中提取 video_id
 *   https://www.douyin.com/video/7651438976956282277?xxx → 7651438976956282277
 *   https://www.iesdouyin.com/share/video/7651438976956282277 → 7651438976956282277
 */
function extractVideoIdFromUrl(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/+$/, '')
    const segs = path.split('/').filter(Boolean)
    // 取最后一个纯数字段（视频 id 都是纯数字）
    for (let i = segs.length - 1; i >= 0; i--) {
      if (/^\d{10,}$/.test(segs[i])) return segs[i]
    }
    return ''
  } catch {
    return ''
  }
}

/**
 * 用 http/https 发一个 GET 请求，follow 重定向，返回 { finalUrl, body }。
 */
function httpGetText(url, userAgent, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let settled = false
    const done = (fn, val) => {
      if (settled) return
      settled = true
      fn(val)
    }
    const doRequest = (target, redirects = 0) => {
      let parsed
      try {
        parsed = new URL(target)
      } catch (e) {
        return done(reject, new Error(`非法 URL: ${target}`))
      }
      const lib = parsed.protocol === 'https:' ? https : http
      const req = lib.request(
        {
          method: 'GET',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9'
          },
          timeout: timeoutMs
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume()
            if (redirects >= 5) return done(reject, new Error('重定向次数过多'))
            const next = new URL(res.headers.location, parsed).toString()
            doRequest(next, redirects + 1)
            return
          }
          if (res.statusCode !== 200) {
            res.resume()
            return done(resolve, { finalUrl: target, body: '' })
          }
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => {
            done(resolve, {
              finalUrl: target,
              body: Buffer.concat(chunks).toString('utf-8')
            })
          })
          res.on('error', (e) => done(reject, e))
        }
      )
      req.on('error', (e) => done(reject, e))
      req.on('timeout', () => {
        try {
          req.destroy()
        } catch {
          /* ignore */
        }
        done(reject, new Error(`请求超时（${timeoutMs}ms）`))
      })
      req.end()
    }
    doRequest(url)
  })
}

/**
 * 把 aweme 详情节点统一归一化成对外返回结构
 */
function normalizeAweme(detail, shareUrl) {
  if (!detail) return null
  const playUrl =
    detail.video?.play_addr?.url_list?.[0] || detail.video?.play_url?.url_list?.[0] || ''
  const cover =
    detail.video?.cover?.url_list?.[0] || detail.video?.dynamic_cover?.url_list?.[0] || ''
  const musicUrl =
    detail.music?.play_url?.url_list?.[0] || detail.music?.play_addr?.url_list?.[0] || ''

  return {
    id: detail.aweme_id || '',
    title: detail.desc || '',
    author: detail.author?.nickname || '',
    authorId: detail.author?.uid || '',
    cover,
    duration: detail.video?.duration || detail.duration || 0,
    videoUrl: stripWatermark(playUrl),
    shareUrl
  }
}

// =============================================================================
// 兜底通道：playwright 抓新版 douyin.com / aweme detail API
// =============================================================================
async function parseShareUrlByPlaywright(shareUrl) {
  const executablePath = resolveExecutablePath()
  logger.info(`[douyin-parser] chrome: ${executablePath || '(playwright default)'}`)
  const browser = await chromium.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: ['--disable-blink-features=AutomationControlled']
  })

  let detail = null
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT })
    const page = await context.newPage()

    // 监听 aweme 详情接口
    page.on('response', async (resp) => {
      try {
        const u = resp.url()
        if (
          /aweme\/iteminfo|aweme\/post|web\/api\/v1\/aweme|aweme\/v1\/web\/aweme\/detail/i.test(u)
        ) {
          const data = await resp.json()
          const list =
            data?.item_list ||
            data?.aweme_list ||
            data?.aweme_detail_list ||
            (data?.aweme_detail ? [data.aweme_detail] : null) ||
            (data?.aweme ? [data.aweme] : null)
          if (Array.isArray(list) && list.length) {
            detail = list[0]
          }
        }
      } catch {
        /* ignore */
      }
    })

    await page.goto(shareUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

    if (!detail) {
      try {
        await page.waitForLoadState('networkidle', { timeout: 8000 })
      } catch {
        /* ignore */
      }
      if (!detail) detail = await extractFromPage(page)
    }
  } catch (e) {
    logger.error(`[douyin-parser] playwright failed: ${e.message}`)
    return null
  } finally {
    await browser.close().catch(() => {})
  }

  if (!detail) return null
  return normalizeAweme(detail, shareUrl)
}

/**
 * 兜底：从页面脚本 / window 中解析 aweme 详情
 * 新版 douyin.com/video/<id> 的页面会把数据塞到 <script id="RENDER_DATA">
 */
async function extractFromPage(page) {
  try {
    const raw = await page.evaluate(() => {
      // 新版 douyin.com：<script id="RENDER_DATA"> 内是 URL-encoded JSON
      const script = document.querySelector('script#RENDER_DATA')
      if (script?.textContent) {
        try {
          return JSON.parse(decodeURIComponent(script.textContent.trim()))
        } catch {
          /* fallthrough */
        }
      }
      // 旧版 iesdouyin.com：window._ROUTER_DATA
      if (typeof window._ROUTER_DATA !== 'undefined') {
        return window._ROUTER_DATA
      }
      return null
    })
    if (!raw) {
      logger.warn('[douyin-parser] no RENDER_DATA / _ROUTER_DATA in page')
      return null
    }
    logger.info(`[douyin-parser] got page payload keys: ${Object.keys(raw).join(',')}`)

    // 深度优先找一个看起来像 aweme 详情（含 aweme_id/video.play_addr）的节点
    const stack = [raw]
    while (stack.length) {
      const node = stack.pop()
      if (!node || typeof node !== 'object') continue
      if (typeof node.aweme_id !== 'undefined' && node.video?.play_addr?.url_list?.length) {
        return node
      }
      for (const k of Object.keys(node)) {
        const v = node[k]
        if (v && typeof v === 'object') stack.push(v)
      }
    }

    logger.warn('[douyin-parser] no aweme node found in page payload')
    return null
  } catch (e) {
    logger.warn(`[douyin-parser] extractFromPage failed: ${e.message}`)
    return null
  }
}

/**
 * 下载抖音视频
 * @param {string|Object} input
 *   - string:  无水印视频 url
 *   - { url, awemeId?, title?, outputPath? }
 * @param {Object} [opts]
 * @param {string} [opts.outputPath]   自定义输出文件路径（绝对路径或目录）
 * @param {string} [opts.referer='https://www.douyin.com/']  下载 Referer
 * @param {Function} [opts.onProgress] (percent:int, downloaded:bytes, total:bytes)
 * @param {boolean} [opts.force=false]  为 true 时忽略本地缓存，强制重新下载
 * @returns {Promise<{success:boolean,data?:{filePath,fileSize,fileUrl,fromCache?:boolean},error?:string}>}
 */
export async function downloadDouyinVideo(input, opts = {}) {
  const args = typeof input === 'string' ? { url: input } : input || {}
  const { url, awemeId = '' } = args
  const { outputPath, referer = 'https://www.douyin.com/', onProgress, force = false } = opts

  if (!url || !/^https?:\/\//i.test(url)) {
    return { success: false, error: '无效的下载链接' }
  }

  // ---------- 1. 决定输出路径 ----------
  let targetPath = outputPath
  let cacheRoot = null

  if (!targetPath) {
    cacheRoot = path.join(getTempPath(), 'video_cache')
    ensureDirSync(cacheRoot)
    targetPath = path.join(cacheRoot, buildCacheFileName(awemeId, url))
  } else if (path.extname(targetPath) === '') {
    ensureDirSync(targetPath)
    cacheRoot = targetPath
    targetPath = path.join(targetPath, buildCacheFileName(awemeId, url))
  }

  ensureDirSync(path.dirname(targetPath))

  // ---------- 2. 缓存命中：跳过下载 ----------
  if (!force) {
    const cached = await checkCacheHit(targetPath, cacheRoot, awemeId, url)
    if (cached) {
      logger.info(`[douyin-parser] download cache hit: ${cached}`)
      const stat = await fsp.stat(cached)
      return {
        success: true,
        data: {
          filePath: cached,
          fileSize: stat.size,
          fileUrl: 'file:///' + cached.replace(/\\/g, '/'),
          fromCache: true
        }
      }
    }
  }

  // ---------- 3. 下载 ----------
  logger.info(`[douyin-parser] download start: ${url} -> ${targetPath}`)
  const t0 = Date.now()
  try {
    const { size, statusCode } = await streamDownload({
      url,
      dest: targetPath,
      referer,
      onProgress
    })
    if (statusCode && statusCode >= 400) {
      // 失败：清理半成品
      await fsp.rm(targetPath, { force: true }).catch(() => {})
      return { success: false, error: `下载失败 (HTTP ${statusCode})` }
    }
    if (!size) {
      return { success: false, error: '下载内容为空' }
    }
    logger.info(
      `[douyin-parser] download done: ${targetPath} ${(size / 1024 / 1024).toFixed(2)}MB in ${
        Date.now() - t0
      }ms`
    )
    return {
      success: true,
      data: {
        filePath: targetPath,
        fileSize: size,
        fileUrl: 'file:///' + targetPath.replace(/\\/g, '/'),
        fromCache: false
      }
    }
  } catch (e) {
    logger.error(`[douyin-parser] download failed: ${e.message}`)
    await fsp.rm(targetPath, { force: true }).catch(() => {})
    return { success: false, error: e.message || '下载失败' }
  }
}

/**
 * 生成缓存文件名：<douyin_><key>.mp4
 *   key 有 awemeId 就用 awemeId，否则用 url 的 sha1 前 16 位
 */
function buildCacheFileName(awemeId, url) {
  const key = awemeId || hashUrl(url).slice(0, 16)
  return `douyin_${key}.mp4`
}

/**
 * url 的稳定哈希（不依赖 node:crypto，sha1 兼容算法）
 */
function hashUrl(input) {
  const s = String(input || '')
  let h1 = 0xdeadbeef ^ 0
  let h2 = 0x41c6ce57 ^ 0
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  // 转成 8 字节 hex
  const a = (h2 >>> 0).toString(16).padStart(8, '0')
  const b = (h1 >>> 0).toString(16).padStart(8, '0')
  return (a + b).slice(0, 16)
}

/**
 * 检查缓存命中：
 *   1) targetPath 存在且非空 → 命中
 *   2) 否则扫描 cacheRoot 下同 key 的其它文件 → 命中（兼容旧版本不同 title 生成的文件名）
 *   3) targetPath 存在但空 → 删除半成品，视为未命中
 */
async function checkCacheHit(targetPath, cacheRoot, awemeId, url) {
  try {
    const stat = await fsp.stat(targetPath)
    if (stat.isFile() && stat.size > 0) return targetPath
    if (stat.isFile() && stat.size === 0) {
      await fsp.rm(targetPath, { force: true }).catch(() => {})
    }
  } catch {
    /* 不存在 */
  }

  if (!cacheRoot) return null
  const cacheKey = buildCacheFileName(awemeId, url)

  try {
    const p = path.join(cacheRoot, cacheKey)
    try {
      const st = await fsp.stat(p)
      if (st.isFile() && st.size > 0) return p
    } catch {
      /* ignore */
    }
  } catch {
    /* 目录不存在等 */
  }
  return null
}

/**
 * 同步版 ensureDir（避免引入 utils 引发跨模块副作用）
 */
function ensureDirSync(dir) {
  if (!dir) return
  fs.mkdirSync(dir, { recursive: true })
}

/**
 * 流式下载到本地，自动跟随重定向
 */
function streamDownload({ url, dest, referer, onProgress }) {
  return new Promise((resolve, reject) => {
    let settled = false
    const done = (fn, val) => {
      if (settled) return
      settled = true
      fn(val)
    }

    const doRequest = (target, redirects = 0) => {
      let parsed
      try {
        parsed = new URL(target)
      } catch (e) {
        return done(reject, new Error(`非法 URL: ${target}`))
      }
      const lib = parsed.protocol === 'https:' ? https : http
      const req = lib.request(
        {
          method: 'GET',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers: {
            'User-Agent': USER_AGENT,
            Referer: referer,
            'Accept-Encoding': 'identity'
          }
        },
        (res) => {
          // 跟随 3xx
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume()
            if (redirects >= 5) {
              return done(reject, new Error('重定向次数过多'))
            }
            const next = new URL(res.headers.location, parsed).toString()
            doRequest(next, redirects + 1)
            return
          }
          if (res.statusCode !== 200 && res.statusCode !== 206) {
            res.resume()
            return done(resolve, { size: 0, statusCode: res.statusCode })
          }

          const total = Number(res.headers['content-length'] || 0)
          let downloaded = 0
          let lastEmit = 0

          const out = fs.createWriteStream(dest)
          res.on('data', (chunk) => {
            downloaded += chunk.length
            const now = Date.now()
            if (onProgress && (now - lastEmit > 200 || (total && downloaded >= total))) {
              lastEmit = now
              const percent = total ? Math.min(99, Math.floor((downloaded / total) * 100)) : 0
              try {
                onProgress(percent, downloaded, total)
              } catch {
                /* ignore */
              }
            }
          })
          res.on('error', (e) => {
            out.destroy()
            done(reject, e)
          })
          out.on('error', (e) => done(reject, e))
          out.on('finish', () => {
            if (onProgress) {
              try {
                onProgress(100, downloaded, total || downloaded)
              } catch {
                /* ignore */
              }
            }
            done(resolve, { size: downloaded, statusCode: res.statusCode })
          })
          res.pipe(out)
        }
      )
      req.on('error', (e) => done(reject, e))
      req.end()
    }

    doRequest(url)
  })
}

/**
 * 解析抖音用户页的数据
 * 包括用户昵称，用户头像，用户视频列表
 * @param {string} url - 抖音用户页 URL ( https://www.douyin.com/user/MS4wLjABAAAAxCGlTzccDT50SgAuXG0eqrCPoy1lXJSQ_E0HMtOYFaA?enter_from=author_card&from_gid=7663165640580140334&from_tab_name=main&tab_name=recommend&vid=7663165640580140334/ https://v.douyin.com/OMyuX1iruhw/)
 * @returns {Promise<Object>} - 解析后的用户数据
 *
 * 实现思路：
 *   1) 从分享文本/URL 里提取用户主页链接（douyin.com/user/<sec_uid>）
 *   2) playwright 打开新版 douyin.com/user/<sec_uid>，
 *      监听 aweme/v1/web/user/profile、other/v1/web/user/detail、aweme/post 等接口；
 *      没拦到则降级到页面 <script id="RENDER_DATA">
 *   3) 在 loaderData["user_(id)/page"] 或顶层 userInfo / userDetail 里取 userInfo，
 *      视频列表取自 aweme_post / aweme_list / item_list
 *
 * 返回结构：
 *   {
 *     success: boolean,
 *     data?: {
 *       secUid,                // 用户 sec_uid
 *       uid,                   // 用户 uid
 *       nickname,              // 昵称
 *       signature,             // 个性签名
 *       avatar,                // 头像 URL
 *       avatarThumb,           // 头像缩略图
 *       followCount,           // 关注数
 *       followerCount,         // 粉丝数
 *       totalFavorited,        // 累计获赞
 *       awemeCount,            // 作品数
 *       shareUrl,              // 原始分享链接
 *       videos: [{             // 用户视频列表（最多 limit 条）
 *         awemeId, title, cover, duration, videoUrl, createTime
 *       }]
 *     },
 *     error?: string
 *   }
 */
export async function parseDouyinUserPage(url) {
  const shareUrl = pickUrl(url)
  if (!shareUrl) {
    return { success: false, error: '未识别到有效的抖音链接' }
  }

  logger.info(`[douyin-user] start: ${shareUrl}`)

  // ---------- 1. 提取 sec_uid ----------
  // 支持：
  //   https://www.douyin.com/user/MS4wLjABAAAA...
  //   https://v.douyin.com/xxxx/  短链 -> 先跟随重定向  https://v.douyin.com/rCtC1rAtVac/
  const secUid = await resolveSecUid(shareUrl)
  if (!secUid) {
    return { success: false, error: '未从链接中识别到用户 sec_uid' }
  }
  logger.info(`[douyin-user] sec_uid=${secUid}`)

  // ---------- 2. playwright 抓新版 douyin.com/user/<sec_uid> ----------
  const t0 = Date.now()
  let payload = null
  try {
    payload = await fetchUserPayloadByPlaywright(secUid)
  } catch (e) {
    logger.warn(`[douyin-user] playwright failed: ${e.message}`)
  }

  if (!payload) {
    return { success: false, error: '未能从抖音页面解析出用户数据' }
  }
  logger.info(`[douyin-user] resolved in ${Date.now() - t0}ms`)

  // ---------- 4. 提取 userInfo + 视频列表 ----------
  const userInfo = pickUserInfo(payload)
  const videos = pickUserVideos(payload)

  if (!userInfo) {
    return { success: false, error: '页面中未找到用户信息' }
  }

  return {
    success: true,
    data: {
      secUid: userInfo.sec_uid || secUid,
      uid: userInfo.uid || userInfo.user_id || '',
      nickname: userInfo.nickname || '',
      signature: userInfo.signature || '',
      avatar:
        userInfo.avatar_larger?.url_list?.[0] ||
        userInfo.avatar_300?.url_list?.[0] ||
        userInfo.avatar_medium?.url_list?.[0] ||
        '',
      avatarThumb: userInfo.avatar_thumb?.url_list?.[0] || '',
      followCount: userInfo.following_count ?? userInfo.follow_count ?? 0,
      followerCount: userInfo.follower_count ?? 0,
      totalFavorited: userInfo.total_favorited ?? userInfo.favoriting_count ?? 0,
      awemeCount: userInfo.aweme_count ?? 0,
      shareUrl,
      videos
    }
  }
}

// ---------- 用户页内部辅助函数 ----------

/**
 * 解析出 sec_uid：
 *   - 直接是 /user/<sec_uid> → 取最后一段
 *   - 其它（含短链）→ 跟随重定向后再解析
 */
async function resolveSecUid(inputUrl) {
  // 直接是 douyin.com/user/<id>
  let m = inputUrl.match(/douyin\.com\/user\/([A-Za-z0-9_\-]+)/i)
  if (m) return m[1]

  // 否则当短链处理：跟随重定向，再从 finalUrl / body 里解析
  try {
    const r = await httpGetText(inputUrl, MOBILE_USER_AGENT, 15000)

    // 情况 1：重定向后 finalUrl 是标准用户页
    m = (r.finalUrl || '').match(/douyin\.com\/user\/([A-Za-z0-9_\-]+)/i)
    if (m) return m[1]

    // 情况 2：短链返回 200（非 3xx），但 HTML/JS 里含有跳转目标或 sec_uid
    const body = r.body || ''
    // 2a. 从 body 中搜标准用户页链接（a 标签 href、location.href、redirect 等）
    m = body.match(/douyin\.com\/user\/([A-Za-z0-9_\-]+)/i)
    if (m) return m[1]
    // 2b. 退而从 body 里直接提取 sec_uid 参数
    m = body.match(/sec_uid[=:]["']?([A-Za-z0-9_\-]+)/i)
    if (m) return m[1]

    // 情况 3：finalUrl 自身也可能携带 sec_uid 参数
    m = (r.finalUrl || '').match(/[?&]sec_uid=([A-Za-z0-9_\-]+)/i)
    if (m) return m[1]
  } catch {
    /* ignore */
  }
  return ''
}

/**
 * 从 _ROUTER_DATA / RENDER_DATA 里挑出 userInfo 节点
 *
 * 不依赖固定 key 路径，做一次深搜：
 *   - 命中条件：对象同时含 `nickname` 与 `sec_uid`
 *   - 命中后还会合并其父对象（如果父对象带 avatar / follower_count 等顶层字段）
 */
function pickUserInfo(payload) {
  if (!payload || typeof payload !== 'object') return null

  // 1) 先看常见顶层
  const directCandidates = [
    payload.userInfo?.userInfo,
    payload.userInfo,
    payload.userDetail,
    payload.user?.userInfo,
    payload.user?.info
  ]
  for (const c of directCandidates) {
    if (c && typeof c === 'object' && c.nickname && (c.sec_uid || c.uid)) {
      return c
    }
  }

  // 2) 深搜：找同时有 nickname + sec_uid 的对象
  let foundUser = null
  let foundUserParent = null
  const stack = [{ node: payload, parent: null }]
  const seen = new WeakSet()
  while (stack.length) {
    const { node, parent } = stack.pop()
    if (!node || typeof node !== 'object' || seen.has(node)) continue
    seen.add(node)
    if (node.nickname && (node.sec_uid || node.uid)) {
      foundUser = node
      foundUserParent = parent
      break
    }
    for (const k of Object.keys(node)) {
      const v = node[k]
      if (v && typeof v === 'object') stack.push({ node: v, parent: node })
    }
  }
  if (!foundUser) return null

  // 优先返回 userInfo 节点本身；如果父对象里也有顶层字段（avatar / follower_count 等），
  // 把它们合并进来（不覆盖已有值）
  if (foundUserParent && typeof foundUserParent === 'object') {
    return { ...foundUserParent, ...foundUser }
  }
  return foundUser
}

/**
 * 从 payload 里挑出用户视频列表
 *
 * 同样采用深搜：找形如 [{ aweme_id, video: {...} }, ...] 的数组。
 *   - 排除太短的数组（避免误命中 aweme_list 中单个错误结构）
 *   - 优先取包含 `aweme_id` 字段的数组
 */
function pickUserVideos(payload, limit = 30) {
  if (!payload || typeof payload !== 'object') return []

  let best = null
  const stack = [payload]
  const seen = new WeakSet()
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || seen.has(node)) continue
    seen.add(node)
    if (Array.isArray(node)) {
      const first = node[0]
      if (first && typeof first === 'object' && first.aweme_id) {
        if (!best || node.length > best.length) {
          best = node
        }
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k]
      if (v && typeof v === 'object') stack.push(v)
    }
  }
  if (!best) return []
  return best.slice(0, limit).map(normalizeUserVideo).filter(Boolean)
}

/**
 * 归一化单条视频
 */
function normalizeUserVideo(v) {
  if (!v) return null
  const playUrl = v.video?.play_addr?.url_list?.[0] || v.video?.play_url?.url_list?.[0] || ''
  return {
    id: v.aweme_id || '',
    title: v.desc || '',
    duration: v.video?.duration || v.duration || 0,
    videoUrl: stripWatermark(playUrl),
    createTime: v.create_time || 0,
    digg_count: v.statistics.digg_count || 0,
    comment_count: v.statistics.comment_count || 0,
    share_count: v.statistics.share_count || 0,
    recommend_count: v.statistics.recommend_count || 0,
    collect_count: v.statistics.collect_count || 0
  }
}

/**
 * 兜底：playwright 抓新版 douyin.com/user/<sec_uid>
 */
async function fetchUserPayloadByPlaywright(secUid) {
  const executablePath = resolveExecutablePath()
  logger.info(`[douyin-user] chrome: ${executablePath || '(playwright default)'}`)
  const browser = await chromium.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: ['--disable-blink-features=AutomationControlled']
  })

  try {
    const context = await browser.newContext({ userAgent: USER_AGENT })
    const page = await context.newPage()
    // 监听用户详情/视频列表相关接口
    let payload = null
    page.on('response', async (resp) => {
      try {
        const u = resp.url()
        if (/aweme\/v1\/web\/user\/profile|other\/v1\/web\/user\/detail|aweme\/post/i.test(u)) {
          const data = await resp.json()
          if (data?.user || data?.userInfo) {
            payload = data
          } else if (data?.aweme_list) {
            payload = payload || {}
            payload.aweme_list = data.aweme_list
          }
        }
      } catch {
        /* ignore */
      }
    })

    const target = `https://www.douyin.com/user/${secUid}`
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 })

    if (!payload) {
      try {
        await page.waitForLoadState('networkidle', { timeout: 8000 })
      } catch {
        /* ignore */
      }
      if (!payload) {
        // 从页面 DOM 抓 RENDER_DATA
        const raw = await page.evaluate(() => {
          const s = document.querySelector('script#RENDER_DATA')
          if (s?.textContent) {
            try {
              return JSON.parse(decodeURIComponent(s.textContent.trim()))
            } catch {
              return null
            }
          }
          return null
        })
        if (raw) payload = raw
      }
    }
    return payload
  } finally {
    await browser.close().catch(() => {})
  }
}

/**
 * 解析抖音视频链接，提取视频文案
 * 1. 解析视频信息
 * 2. 下载视频
 * 3. 识别视频文案
 *
 * @param {*} url 抖音视频链接(网页链接)
 * @returns 解析结果
 */
export async function parseAndExtractDouyin(url) {
  // 1. 解析视频信息
  const parseRes = await parseDouyinVideoInfo(url)
  if (!parseRes.success) {
    return { success: false, message: parseRes.error || '抖音解析失败' }
  }

  // 2. 下载视频
  const downloadRes = await downloadDouyinVideo({
    url: parseRes.data.videoUrl,
    awemeId: parseRes.data.id ?? parseRes.data.awemeId
  })

  if (!downloadRes.success) {
    return { success: false, message: downloadRes.error || '抖音下载失败' }
  }

  // 下载的视频路径
  const filePath = downloadRes.data.filePath

  // 3. 识别视频文案
  const asrRes = await speechRecognition({ audio_file: filePath, language: 'auto' })
  if (!asrRes.success) {
    return { success: false, message: asrRes.error || 'asr识别失败' }
  }

  return {
    success: true,
    data: { extractedContent: asrRes.data?.data.processed_text || '', videoInfo: parseRes.data }
  }
}

/**
 * 从抖音视频链接提取视频文案
 *
 * @param {*} videoUrl 抖音无水印视频链接
 * @param {*} awemeId 抖音视频ID
 * @returns 解析结果
 */
async function extractDouyinByVideoUrl(videoUrl, awemeId) {
  // 2. 下载视频
  const downloadRes = await downloadDouyinVideo({
    url: videoUrl,
    awemeId: awemeId
  })

  if (!downloadRes.success) {
    return { success: false, message: downloadRes.error || '抖音下载失败' }
  }

  // 下载的视频路径
  const filePath = downloadRes.data.filePath

  // 3. 识别视频文案
  const asrRes = await speechRecognition({ audio_file: filePath, language: 'auto' })
  if (!asrRes.success) {
    return { success: false, message: asrRes.error || 'asr识别失败' }
  }

  return {
    content: asrRes.data?.data.processed_text || '',
    id: awemeId,
    videoUrl: videoUrl
  }
}

/**
 * 深度学习抖音视频 (多个)
 * 1. 下载抖音视频，asr识别抖音视频内容
 * 2. 串行执行（一个接一个），避免并发抢占下载/识别资源
 *
 * @param {Array<{videoUrl:string, id?:string, awemeId?:string}>} videoList
 * @returns {Promise<Array<object>>} 每个视频的识别结果（按入参顺序）
 */
export async function deeplearningDouyinVideo(videoList) {
  const list = []
  const slices = (videoList || []).slice(0, 5)

  // 串行：逐个 await，确保上一个完成才开始下一个
  for (const item of slices) {
    try {
      const res = await extractDouyinByVideoUrl(item.videoUrl, item.id ?? item.awemeId)
      list.push(res)
    } catch (e) {
      logger.error(`[deeplearningDouyinVideo] 单个视频处理失败: ${e.message}`)
      list.push({
        success: false,
        message: e.message,
        id: item.id ?? item.awemeId,
        videoUrl: item.videoUrl
      })
    }
  }

  return list
}
