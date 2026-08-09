// 通过分享链接解析快手视频信息
// 入参：url: string  （支持完整链接或 v.kuaishou.com 短链）
// 返回：{
//   success: boolean,
//   data?: {
//     photoId,        // 视频 id
//     title,          // 视频标题/描述
//     author,         // 作者昵称
//     cover,          // 封面图
//     duration,       // 时长(ms)
//     videoUrl,       // 播放地址（视频直链）
//     shareUrl        // 原始分享链接
//   },
//   error?: string
// }
//
// 实现思路（移植自 D:\code_project\video-downloader\app\parsers\kuaishou.py）：
//   1. 短链 v.kuaishou.com/<token> 跟随重定向
//   2. HTTP GET 拉取页面 HTML（移动 UA + 短链重定向）
//   3. 用括号配对从 HTML 中抠 window.__APOLLO_STATE__ / __INITIAL_STATE__ /
//      __PRELOADED_STATE__ / __INITIAL_DATA__ 中的 JSON
//   4. 在 state 树里查找第一个看起来像视频直链的 URL（.mp4/.flv/.m3u8/ks-cdn/playback/playurl 等）
//   5. 兜底从 <meta property="og:video"> / <video src> 抽视频地址
//   6. 提取 photoId / title / author / cover / duration 并归一化返回
import logger from '../log'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import https from 'https'
import http from 'http'
import { URL } from 'url'
import { chromium } from 'playwright'
import { getTempPath } from '../ipc/file.ipc'
import { resolveExecutablePath } from './utils'
import { speechRecognition } from '../services/asrService'

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const REFERER = 'https://www.kuaishou.com/'

/**
 * 从原始分享文本中提取 URL
 * 支持：
 *   - 完整 http(s)://...
 *   - v.kuaishou.com/<token>   短链
 *   - www.kuaishou.com/f/<photoId> / short-video/<id> 等长链
 */
function pickUrl(input) {
  if (!input) return ''
  const text = String(input).trim()
  const m = text.match(/https?:\/\/[^\s]+/i)
  if (m) return m[0].replace(/[)\]】。」』,，]+$/, '')
  const m2 = text.match(
    /(?:https?:\/\/)?(?:v\.|www\.|m\.)?kuaishou\.com\/[A-Za-z0-9/_-]+/i
  )
  if (m2) return m2[0].startsWith('http') ? m2[0] : 'https://' + m2[0]
  return ''
}

/**
 * 解析单个快手视频
 *
 * 实现策略（参考 D:\code_project\video-downloader\app\parsers\kuaishou.py）：
 *   1) HTTP GET 拉取页面（自动跟随短链重定向），解析 HTML 中的
 *      window.__APOLLO_STATE__ / __INITIAL_STATE__ / __PRELOADED_STATE__ / __INITIAL_DATA__
 *   2) 提取 state 里的 title / author / cover / videoUrl（找第一个像视频直链的 URL）
 *   3) 兜底从 <meta property="og:video"> / <video src> 抽取视频地址
 *   4) 若 HTTP 路径拿不到（页面是 SPA 壳子），用 playwright 渲染页面再读 outerHTML，重复 1~3
 *
 * @param {string} url  分享文本或 URL
 */
export async function parseKuaishouVideoInfo(url) {
  const shareUrl = pickUrl(url)
  if (!shareUrl) {
    return { success: false, error: '未识别到有效的快手链接' }
  }

  logger.info(`[kuaishou-parser] start: ${shareUrl}`)

  // ---------- 1. 短链跟随重定向 ----------
  let realUrl = shareUrl
  try {
    const r = await httpGetText(shareUrl, MOBILE_USER_AGENT, 15000)
    if (r.finalUrl && r.finalUrl !== shareUrl) {
      logger.info(`[kuaishou-parser] redirect: ${shareUrl} -> ${r.finalUrl}`)
      realUrl = r.finalUrl
    }
  } catch (e) {
    logger.warn(`[kuaishou-parser] http redirect failed: ${e.message}`)
  }

  // ---------- 2. HTTP 解析 ----------
  const t0 = Date.now()
  try {
    const httpRes = await parseByHttp(realUrl)
    if (httpRes && httpRes.videoUrl) {
      httpRes.shareUrl = shareUrl
      logger.info(`[kuaishou-parser] http ok (${Date.now() - t0}ms)`)
      return { success: true, data: httpRes }
    }
    logger.warn(`[kuaishou-parser] http miss (${Date.now() - t0}ms), fallback to playwright`)
  } catch (e) {
    logger.warn(`[kuaishou-parser] http failed: ${e.message}, fallback to playwright`)
  }

  // ---------- 3. playwright 兜底：渲染后读 outerHTML 再走同一套解析 ----------
  const tp = Date.now()
  try {
    const pwRes = await parseByPlaywright(realUrl, shareUrl)
    if (pwRes && pwRes.videoUrl) {
      logger.info(`[kuaishou-parser] playwright ok (${Date.now() - tp}ms)`)
      return { success: true, data: pwRes }
    }
    logger.warn(`[kuaishou-parser] playwright miss (${Date.now() - tp}ms)`)
  } catch (e) {
    logger.error(`[kuaishou-parser] playwright failed: ${e.message}`)
  }

  return { success: false, error: '未能从快手页面解析出视频信息' }
}

/**
 * playwright 通道：打开页面 → 等 JS 渲染完（Apollo 把数据 hydrate 到 window.__APOLLO_STATE__）→
 * 读 outerHTML → 复用 HTTP 解析路径。和 Python BrowserService.parse_kuaishou 思路一致。
 */
async function parseByPlaywright(url, shareUrl) {
  const executablePath = resolveExecutablePath()
  logger.info(`[kuaishou-parser] chrome: ${executablePath || '(playwright default)'}`)

  const browser = await chromium.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: ['--disable-blink-features=AutomationControlled']
  })

  try {
    const context = await browser.newContext({ userAgent: USER_AGENT })
    const page = await context.newPage()
    const target = toPcVideoUrl(url) || url
    logger.info(`[kuaishou-parser] goto ${target}`)
    await page.goto(target, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
      referer: REFERER
    })

    // 等 Apollo client hydrate 数据到 window.__APOLLO_STATE__
    try {
      await page.waitForFunction(
        () =>
          !!(
            window.__APOLLO_STATE__ ||
            window.__INITIAL_STATE__ ||
            window.__PRELOADED_STATE__ ||
            window.__INITIAL_DATA__
          ),
        { timeout: 15000 }
      )
    } catch {
      /* 仍尝试一次 */
    }

    const html = await page.content()
    return parseByHttpInner(html, url, shareUrl)
  } catch (e) {
    logger.error(`[kuaishou-parser] playwright failed: ${e.message}`)
    return null
  } finally {
    await browser.close().catch(() => {})
  }
}

/**
 * 与 parseByHttp 相同，但允许 shareUrl 直接传入（playwright 通道复用）
 */
function parseByHttpInner(html, url, shareUrl) {
  if (!html) return null

  const rawStateJson = findRawApollostateJson(html) || ''
  const state = extractApollostate(html)

  // 1) 视频地址
  let videoUrl = ''
  if (rawStateJson) videoUrl = pickVideoUrlFromRawJson(rawStateJson)
  if (!videoUrl) videoUrl = findFirstVideoUrl(state)
  if (!videoUrl) videoUrl = findMeta(html, 'og:video') || findMeta(html, 'og:video:secure_url')
  if (!videoUrl) videoUrl = findVideoSrc(html)
  if (!videoUrl) return null
  if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl
  videoUrl = cleanUrl(videoUrl)

  // 2) photoId
  const photoId =
    extractPhotoIdFromUrl(url) ||
    extractPhotoIdFromHtml(html) ||
    findPhotoIdFromState(state) ||
    pickPhotoIdFromRawJson(rawStateJson)

  // 3) 视频元数据
  const photoNode = photoId ? findPhotoNodeById(state, photoId) : null

  const caption =
    readStr(photoNode?.caption) ||
    pickFieldFromRawJson(rawStateJson, 'caption') ||
    ''
  const coverUrl =
    cleanUrl(readStr(photoNode?.coverUrl) || '') ||
    cleanUrl(pickFieldFromRawJson(rawStateJson, 'coverUrl') || '')
  let duration = Number(photoNode?.duration) || 0
  if (!duration && photoNode?.manifest?.adaptationSet?.[0]?.duration) {
    duration = Number(photoNode.manifest.adaptationSet[0].duration) || 0
  }
  if (!duration) {
    const d = pickFieldFromRawJson(rawStateJson, 'duration')
    if (d) duration = Number(d) || 0
  }
  const author =
    readStr(photoNode?.author?.name) ||
    pickFieldFromRawJson(rawStateJson, 'name') ||
    ''

  const title = caption || findMeta(html, 'og:title') || '快手视频'
  let cover = coverUrl
  if (!cover) cover = cleanUrl(findMeta(html, 'og:image'))

  return {
    photoId: photoId || '',
    title,
    author,
    cover,
    duration,
    videoUrl,
    shareUrl: shareUrl || ''
  }
}

/**
 * HTTP 通道：用桌面 UA 拉页面，正则抠 __APOLLO_STATE__ / __INITIAL_STATE__ / __PRELOADED_STATE__
 * 移植自 video-downloader/app/parsers/kuaishou.py 的 _extract_state / _find_video_url 等
 */
async function parseByHttp(url) {
  // 把任何 m.gifshow.com / v.kuaishou.com 域的链接统一收敛到 www.kuaishou.com/f/<photoId>。
  // m.gifshow.com 即使桌面 UA 也是 SPA 壳子，没有 __APOLLO_STATE__。
  const pcUrl = toPcVideoUrl(url)
  logger.info(`[kuaishou-parser] pc url: ${pcUrl}`)
  const html = await fetchPageHtml(pcUrl)
  logger.info(`[kuaishou-parser] html length: ${html ? html.length : 0}`)
  if (!html) return null
  return parseByHttpInner(html, url, '')
}

/**
 * 直接从 HTML 里找到 window.__APOLLO_STATE__={...} 的 JSON 字符串子串（不做括号匹配）
 */
function findRawApollostateJson(html) {
  if (!html) return ''
  const candidates = [
    'window.__APOLLO_STATE__',
    'window.__INITIAL_STATE__',
    'window.__PRELOADED_STATE__',
    'window.__INITIAL_DATA__'
  ]
  for (const key of candidates) {
    const pos = html.indexOf(key)
    if (pos < 0) continue
    // 找 key 后第一个 '{'
    const braceStart = html.indexOf('{', pos)
    if (braceStart < 0) continue
    // 找对应的 '}'（用括号配对；JSON 是单值，结束时深度回到 0）
    const json = extractJsonObject(html, braceStart)
    if (json) return json
  }
  return ''
}

/**
 * 从原始 JSON 字符串中查找第一个像视频直链的 URL
 * 优先 photoUrl，再 backupUrl[]，再 manifestH265.json.adaptationSet[].representation[].url
 */
function pickVideoUrlFromRawJson(json) {
  if (!json) return ''
  // 1) "photoUrl":"<url>"
  let m = json.match(/"photoUrl"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
  if (m && looksLikeVideoUrl(m[1])) return m[1]
  // 2) "backupUrl":["<url1>","<url2>"]
  m = json.match(/"backupUrl"\s*:\s*\["([^"\\]*(?:\\.[^"\\]*)*)"(?:,[\s\S]*?)?\]/)
  if (m && looksLikeVideoUrl(m[1])) return m[1]
  // 3) "url":"<url>" within manifestH265
  m = json.match(/"manifestH265"\s*:\s*\{[\s\S]*?"url"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
  if (m && looksLikeVideoUrl(m[1])) return m[1]
  // 4) "url":"<url>" within adaptationSet
  m = json.match(/"adaptationSet"\s*:\s*\[[\s\S]*?"url"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
  if (m && looksLikeVideoUrl(m[1])) return m[1]
  return ''
}

/**
 * 从原始 JSON 字符串中按字段名抓第一个字符串值（返回未反转义的值）
 */
function pickFieldFromRawJson(json, field) {
  if (!json) return ''
  const m = json.match(new RegExp(`"${field}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`))
  return m ? m[1] : ''
}

/**
 * 从原始 JSON 字符串中找 VisionVideoDetailPhoto:<id> 的 id
 */
function pickPhotoIdFromRawJson(json) {
  if (!json) return ''
  const m = json.match(/"VisionVideoDetailPhoto:([A-Za-z0-9_-]+)"/)
  return m ? m[1] : ''
}

/**
 * 读取字符串字段（支持 \\u002F 等转义）
 */
function readStr(v) {
  if (typeof v !== 'string') return ''
  return cleanUrl(v)
}

/**
 * 从 state 中通过 photoId 定位 VisionVideoDetailPhoto:<photoId> 节点
 */
function findPhotoNodeById(state, photoId) {
  if (!state || !photoId) return null
  const dc = state.defaultClient || {}
  const key = `VisionVideoDetailPhoto:${photoId}`
  return dc[key] || null
}

/**
 * 从 state.defaultClient 里找 photoId（key 形如 VisionVideoDetailPhoto:<id>）
 */
function findPhotoIdFromState(state) {
  if (!state || !state.defaultClient) return ''
  for (const k of Object.keys(state.defaultClient)) {
    if (k.startsWith('VisionVideoDetailPhoto:')) {
      return k.slice('VisionVideoDetailPhoto:'.length)
    }
  }
  return ''
}

/**
 * 拉页面 HTML（桌面 UA，follow redirect）
 * 快手首屏会下发 Set-Cookie（kpf/kpn），第二次请求带 cookie 才返回 SSR 详情页。
 * 这里用两阶段请求：第一次拿 cookie，第二次带 cookie 重拉。
 */
async function fetchPageHtml(url) {
  // 第一次：拿 cookie + body
  const first = await httpFetchOnce(url, USER_AGENT, {}, 20000)
  if (!first) return ''
  if (!first.cookies.length) return first.body
  // 第二次：带 cookie 重拉
  const cookieHeader = first.cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  const second = await httpFetchOnce(url, USER_AGENT, { Cookie: cookieHeader }, 20000)
  return second?.body || first.body
}

function httpFetchOnce(target, ua, extraHeaders, timeoutMs) {
  return new Promise((resolve) => {
    const doReq = (url, redirects = 0, seen = new Set()) => {
      if (seen.has(url) || redirects > 5) return resolve(null)
      seen.add(url)
      let parsed
      try {
        parsed = new URL(url)
      } catch {
        return resolve(null)
      }
      const lib = parsed.protocol === 'https:' ? https : http
      const req = lib.request(
        {
          method: 'GET',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers: {
            'User-Agent': ua,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            Referer: REFERER,
            ...extraHeaders
          },
          timeout: timeoutMs
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume()
            return doReq(new URL(res.headers.location, parsed).toString(), redirects + 1, seen)
          }
          if (res.statusCode !== 200) {
            res.resume()
            return resolve(null)
          }
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () =>
            resolve({
              body: Buffer.concat(chunks).toString('utf-8'),
              cookies: parseSetCookie(res.headers['set-cookie'] || [])
            })
          )
          res.on('error', () => resolve(null))
        }
      )
      req.on('error', () => resolve(null))
      req.on('timeout', () => {
        try {
          req.destroy()
        } catch {
          /* ignore */
        }
        resolve(null)
      })
      req.end()
    }
    doReq(target)
  })
}

function parseSetCookie(arr) {
  const out = []
  for (const line of arr) {
    const [pair] = line.split(';')
    const eq = pair.indexOf('=')
    if (eq < 0) continue
    out.push({ name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() })
  }
  return out
}


/**
 * 从 HTML 里抠 __APOLLO_STATE__ / __INITIAL_STATE__ / __PRELOADED_STATE__
 * 对应 Python 的 _extract_state + _extract_json_object（带括号匹配）
 */
function extractApollostate(html) {
  if (!html) return {}
  const candidates = [
    'window.__APOLLO_STATE__',
    'window.__INITIAL_STATE__',
    'window.__PRELOADED_STATE__',
    'window.__INITIAL_DATA__'
  ]
  for (const key of candidates) {
    const pos = html.indexOf(key)
    if (pos < 0) continue
    const start = html.indexOf('{', pos)
    if (start < 0) continue
    const raw = extractJsonObject(html, start)
    if (!raw) continue
    try {
      return JSON.parse(raw)
    } catch {
      /* try next */
    }
  }
  return {}
}

/**
 * 从 start 位置开始向后扫描，匹配首个完整的 JSON 对象（用括号配对，跟 Python 版一致）
 */
function extractJsonObject(text, start) {
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === '\\') {
        escape = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return ''
}

/**
 * 在 state 树中查找第一个 key 名称（大小写不敏感）命中 keys 之一的字符串值
 */
function findInState(obj, keys) {
  if (!obj || typeof obj !== 'object') return null
  const lower = keys.map((k) => k.toLowerCase())
  const stack = [obj]
  const seen = new WeakSet()
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || seen.has(node)) continue
    seen.add(node)
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item)
      continue
    }
    for (const k of Object.keys(node)) {
      const v = node[k]
      if (lower.includes(k.toLowerCase()) && typeof v === 'string' && v.trim()) {
        return v.trim()
      }
      if (v && typeof v === 'object') stack.push(v)
    }
  }
  return null
}

/**
 * 找出 state 树里第一个看起来像视频直链的 URL
 * 对应 Python _collect_urls + _looks_like_video_url
 */
function findFirstVideoUrl(obj) {
  if (!obj || typeof obj !== 'object') return null
  const stack = [obj]
  const seen = new WeakSet()
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || seen.has(node)) continue
    seen.add(node)
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item)
      continue
    }
    for (const k of Object.keys(node)) {
      const v = node[k]
      if (typeof v === 'string' && looksLikeVideoUrl(v)) return v
      if (Array.isArray(v)) {
        for (const item of v) {
          if (typeof item === 'string' && looksLikeVideoUrl(item)) return item
        }
      }
      if (v && typeof v === 'object') stack.push(v)
    }
  }
  return null
}

function looksLikeVideoUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('http')) return false
  // 直接命中视频扩展名（mp4/flv/m3u8/hls）
  if (/\.(mp4|flv|m3u8)(\?|#|$)/i.test(url)) return true
  // 快手 CDN / 播放地址关键字（kwaicdn / oskwai / ksc2 / playback / playurl / upic）
  if (/kwaicdn\.com|oskwai\.com|\/ksc2\/|\/upic\/|\/playback\/|\/playurl\//i.test(url)) return true
  return false
}

/**
 * <meta property="og:xxx" content="..."> 抽取
 */
function findMeta(html, prop) {
  if (!html) return ''
  const re = new RegExp(
    `<meta[^>]+property=["']${prop.replace(':', '\\:')}["'][^>]+content=["']([^"']+)["']`,
    'i'
  )
  const m = html.match(re)
  return m ? m[1] : ''
}

function findVideoSrc(html) {
  if (!html) return ''
  const m = html.match(/<video[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : ''
}

function cleanUrl(url) {
  return String(url || '')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .trim()
}

function extractPhotoIdFromHtml(html) {
  if (!html) return ''
  const m = html.match(/\/photo\/([A-Za-z0-9_-]{6,})/i) || html.match(/\/f\/([A-Za-z0-9_-]{6,})/i)
  return m ? m[1] : ''
}

// =============================================================================
// photoId 提取 & 通用 HTTP 工具
// =============================================================================

/**
 * 把任意快手域的链接转换为 PC 域详情页 URL（以便 SSR 拿到 __APOLLO_STATE__）
 *   m.gifshow.com/fw/photo/<id>?...   → https://www.kuaishou.com/f/<id>
 *   v.kuaishou.com/<token>            → 先跟随重定向，再走 PC 域
 *   已经是 www.kuaishou.com/f/<id>    → 原样返回
 */
function toPcVideoUrl(url) {
  const photoId = extractPhotoIdFromUrl(url)
  if (photoId) return 'https://www.kuaishou.com/f/' + photoId
  return url
}

/**
 * 从 kuaishou / gifshow 链接提取 photoId
 *   https://www.kuaishou.com/f/X-21MbSVeOWsacpP        → X-21MbSVeOWsacpP
 *   https://www.kuaishou.com/short-video/<id>?...      → <id>
 *   https://m.gifshow.com/fw/photo/<photoId>?...       → <photoId>
 *   https://v.kuaishou.com/<token>                    → 不处理，让 HTTP 重定向
 *
 * 短链重定向后经常落在 m.gifshow.com/fw/photo/<id>?shareObjectId=<id>
 * 这里优先取 path 段，path 没有则退到 shareObjectId / photoId / pid
 */
function extractPhotoIdFromUrl(url) {
  if (!url) return ''
  try {
    const u = new URL(url)
    const segs = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean)

    // 1) 路径中提取
    // kuaishou.com /f/<id>
    const fIdx = segs.findIndex((s) => s === 'f')
    if (fIdx >= 0 && segs[fIdx + 1]) return segs[fIdx + 1]

    // m.gifshow.com /fw/photo/<id>
    const photoIdx = segs.findIndex((s) => s === 'photo')
    if (photoIdx >= 0 && segs[photoIdx + 1]) return segs[photoIdx + 1]

    // kuaishou.com /short-video/<id>
    if (segs[0] === 'short-video' && segs[1]) return segs[1]

    // 单段路径且长度足够
    if (segs.length === 1 && /^[A-Za-z0-9_-]{6,}$/.test(segs[0])) return segs[0]

    // 2) query 中提取（兜底）
    for (const key of ['shareObjectId', 'photoId', 'pid', 'id']) {
      const v = u.searchParams.get(key)
      if (v && /^[A-Za-z0-9_-]{6,}$/.test(v)) return v
    }
  } catch (e) {
    logger.warn(`[kuaishou-parser] extractPhotoIdFromUrl failed: ${e.message} url=${url}`)
  }
  return ''
}

// =============================================================================
// 通用 HTTP 工具
// =============================================================================
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
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () =>
            done(resolve, {
              finalUrl: target,
              body: Buffer.concat(chunks).toString('utf-8')
            })
          )
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

// =============================================================================
// 下载快手视频
// =============================================================================
export async function downloadKuaishouVideo(input, opts = {}) {
  const args = typeof input === 'string' ? { url: input } : input || {}
  const { url, photoId = '' } = args
  const {
    outputPath,
    referer = REFERER,
    onProgress,
    force = false
  } = opts

  if (!url || !/^https?:\/\//i.test(url)) {
    return { success: false, error: '无效的下载链接' }
  }

  let targetPath = outputPath
  let cacheRoot = null

  if (!targetPath) {
    cacheRoot = path.join(getTempPath(), 'video_cache')
    ensureDirSync(cacheRoot)
    targetPath = path.join(cacheRoot, buildCacheFileName(photoId, url))
  } else if (path.extname(targetPath) === '') {
    ensureDirSync(targetPath)
    cacheRoot = targetPath
    targetPath = path.join(targetPath, buildCacheFileName(photoId, url))
  }

  ensureDirSync(path.dirname(targetPath))

  if (!force) {
    const cached = await checkCacheHit(targetPath, cacheRoot, photoId, url)
    if (cached) {
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

  logger.info(`[kuaishou-parser] download start: ${url} -> ${targetPath}`)
  const t0 = Date.now()
  try {
    const { size, statusCode } = await streamDownload({
      url,
      dest: targetPath,
      referer,
      onProgress
    })
    if (statusCode && statusCode >= 400) {
      await fsp.rm(targetPath, { force: true }).catch(() => {})
      return { success: false, error: `下载失败 (HTTP ${statusCode})` }
    }
    if (!size) return { success: false, error: '下载内容为空' }
    logger.info(
      `[kuaishou-parser] download done: ${targetPath} ${(size / 1024 / 1024).toFixed(2)}MB in ${
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
    logger.error(`[kuaishou-parser] download failed: ${e.message}`)
    await fsp.rm(targetPath, { force: true }).catch(() => {})
    return { success: false, error: e.message || '下载失败' }
  }
}

function buildCacheFileName(photoId, url) {
  const key = photoId || hashUrl(url).slice(0, 16)
  return `kuaishou_${key}.mp4`
}

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
  const a = (h2 >>> 0).toString(16).padStart(8, '0')
  const b = (h1 >>> 0).toString(16).padStart(8, '0')
  return (a + b).slice(0, 16)
}

async function checkCacheHit(targetPath, cacheRoot, photoId, url) {
  try {
    const stat = await fsp.stat(targetPath)
    if (stat.isFile() && stat.size > 0) return targetPath
    if (stat.isFile() && stat.size === 0) {
      await fsp.rm(targetPath, { force: true }).catch(() => {})
    }
  } catch {
    /* ignore */
  }
  if (!cacheRoot) return null
  try {
    const p = path.join(cacheRoot, buildCacheFileName(photoId, url))
    const st = await fsp.stat(p)
    if (st.isFile() && st.size > 0) return p
  } catch {
    /* ignore */
  }
  return null
}

function ensureDirSync(dir) {
  if (!dir) return
  fs.mkdirSync(dir, { recursive: true })
}

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
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume()
            if (redirects >= 5) return done(reject, new Error('重定向次数过多'))
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

// =============================================================================
// 解析 + 下载 + ASR 一体化
// =============================================================================
export async function parseAndExtractKuaishou(url) {
  // 1. 解析视频信息
  const parseRes = await parseKuaishouVideoInfo(url)
  if (!parseRes.success) {
    return { success: false, message: parseRes.error || '快手解析失败' }
  }

  // 2. 下载视频
  const downloadRes = await downloadKuaishouVideo({
    url: parseRes.data.videoUrl,
    photoId: parseRes.data.photoId
  })
  if (!downloadRes.success) {
    return { success: false, message: downloadRes.error || '快手下载失败' }
  }

  // 3. ASR 识别
  const asrRes = await speechRecognition({
    audio_file: downloadRes.data.filePath,
    language: 'auto'
  })
  if (!asrRes.success) {
    return { success: false, message: asrRes.error || 'asr识别失败' }
  }

  return {
    success: true,
    data: {
      extractedContent: asrRes.data?.data?.processed_text || '',
      videoInfo: parseRes.data
    }
  }
}
