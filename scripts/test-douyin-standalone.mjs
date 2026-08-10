/**
 * 独立测试 douyin 发布（不依赖 electron / 不依赖构建产物）
 *
 * 用法：
 *   1. 确保 playwright chromium 已安装：
 *      npx playwright install chromium
 *   2. 直接跑：
 *      node scripts/test-douyin-standalone.mjs
 *      # 或带 cookies:
 *      DOUYIN_COOKIES='[{"name":"...","value":"...","domain":".douyin.com"}]' \
 *        node scripts/test-douyin-standalone.mjs
 */

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
process.chdir(PROJECT_ROOT)

// 直接 import（ESM 模块）
const douyinModule = await import('../src/main/publish/douyin.js')
const uploadToDouyin = douyinModule.default

const TEST_COOKIES = process.env.DOUYIN_COOKIES || readFileSafe('cookies/douyin-cookie.json')

function readFileSafe(p) {
  try {
    return fs.readFileSync(path.resolve(PROJECT_ROOT, p), 'utf8')
  } catch {
    return '[]'
  }
}

async function main() {
  console.log('=== [test-douyin-standalone] starting ===')

  console.log('[test] launching chromium ...')
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const context = await browser.newContext({
    permissions: ['geolocation']
  })
  if (TEST_COOKIES && TEST_COOKIES !== '[]') {
    try {
      const cookies = JSON.parse(TEST_COOKIES)
      await context.addCookies(cookies)
      console.log(`[test] injected ${cookies.length} cookies`)
    } catch (e) {
      console.warn('[test] cookies parse failed:', e.message)
    }
  } else {
    console.warn('[test] ⚠️ 未注入 cookies,需要先用 DOUYIN_COOKIES 环境变量提供')
  }

  const params = {
    videoPath: 'D:\\code_project\\aigc-client\\demo.mp4',
    title: '独立测试-' + Date.now(),
    description: '这是独立测试脚本的视频',
    tags: ['测试'],
    isDraft: false, // ⚠️ 暂存,避免误发布
    coverPath: 'D:\\code_project\\aigc-client\\covers\\cover_1786347820263.jpg'
  }

  // 文件存在性预检
  for (const [key, p] of Object.entries(params)) {
    if (typeof p === 'string' && p.includes('\\') && !fs.existsSync(p)) {
      console.warn(`[test] ⚠️ ${key} 不存在: ${p}`)
    }
  }

  console.log('[test] 调用 uploadToDouyin ...')
  console.log('[test] ⏳ 可能需要 30-90s')

  const t0 = Date.now()
  let result
  try {
    result = await uploadToDouyin(context, params)
  } catch (e) {
    console.error('[test] ❌ uploadToDouyin 抛错:', e.message)
    console.error(e.stack)
    result = { success: false, error: e.message }
  }

  console.log('[test] ========== result ==========')
  console.log(JSON.stringify(result, null, 2))
  console.log(`[test] 用时: ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  console.log('[test] 浏览器保持打开,按 Ctrl+C 退出')
}

main().catch((e) => {
  console.error('[test] FAILED:', e)
  process.exit(1)
})
