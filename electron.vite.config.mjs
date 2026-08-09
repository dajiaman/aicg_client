import { resolve } from 'path'
import fs from 'fs'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

/**
 * 通用目录复制工具：
 *   - 先清空旧产物（避免删掉的模板残留）
 *   - 递归复制整个目录
 *   - 源目录不存在则打印 warning
 */
function copyDir(srcDir, outDir, tag) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`[${tag}] 源目录不存在: ${srcDir}`)
    return false
  }
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true })
  }
  fs.cpSync(srcDir, outDir, { recursive: true, force: true })
  console.log(`[${tag}] 已复制: ${srcDir} → ${outDir}`)
  return true
}

/**
 * viral-ass-engine: 混淆 CJS，内部 ~35 处动态 require('./templates/...')。
 * 必须 external（不让 rollup 打包），同时运行时需要这些模板文件存在于产物中。
 */
function doCopyViralAssEngine() {
  return copyDir(
    resolve('src/viral-ass-engine'),
    resolve('out/main/viral-ass-engine'),
    'copyViralAssEngine'
  )
}

/**
 * config: OEM 配置、字幕模板容量等运行时配置文件。
 * 同样不能被打包到主进程 bundle 里，必须以独立目录形式存在产物中。
 */
function doCopyConfig() {
  return copyDir(resolve('src/config'), resolve('out/config'), 'copyConfig')
}

/**
 * 自定义 rollup 插件：build 后把 src/<dir> 整个目录复制到 out/main/
 */
function copyDirPlugin(tag, doCopy) {
  return {
    name: tag,
    closeBundle() {
      doCopy()
    }
  }
}

// 模块加载时立即执行一次：dev 模式启动前也能拿到产物
doCopyViralAssEngine()
doCopyConfig()

export default defineConfig({
  main: {
    plugins: [
      copyDirPlugin('copy-viral-ass-engine', doCopyViralAssEngine),
      copyDirPlugin('copy-config', doCopyConfig)
    ],
    build: {
      rollupOptions: {
        // 1) 原生模块 / 含 .node / CJS-only 包 → 永远不走打包
        external: [
          'better-sqlite3',
          'playwright',
          'playwright-core',
          'sharp',
          'native-machine-id',
          // 2) viral-ass-engine: 混淆 CJS，含动态 require('./templates/...')，
          //    必须 external 让 Node.js 在运行时按 require 解析模板文件
          'viral-ass-engine',
          './viral-ass-engine',
          '../viral-ass-engine',
          /viral-ass-engine/,
          /viral-ass-engine\/.*/,
          // 3) config: 同理，OEM/容量配置是运行时 JSON/JS，不能被打包
          './config',
          '../config',
          /^\.\.?\/config$/,
          /^\.\.?\/config\/.*/
        ]
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
