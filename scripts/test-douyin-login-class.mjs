/**
 * 独立测试 douyin 登录（不依赖 electron / 不依赖构建产物）
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
const douyinModule = await import('../src/main/login/douyin.js')
const classInstance = douyinModule.default
// ✅ 从同一模块解构出 CHROME_USER_AGENT(已 export)
const { CHROME_USER_AGENT } = douyinModule

async function main() {
  console.log('=== [test-douyin-login-class] starting ===')
  console.log(`[test] CHROME_USER_AGENT: ${CHROME_USER_AGENT?.slice(0, 40)}...`)
  console.log(`[test] classInstance.name: ${classInstance.name}`)
  console.log(`[test] classInstance.key: ${classInstance.key}`)

  console.log('[test] launching chromium ...')
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const context = await browser.newContext({ userAgent: CHROME_USER_AGENT })
    const res = await classInstance.login(context, browser)
    console.log('[test] login result:', res)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error('[test] FAILED:', e)
  process.exit(1)
})
