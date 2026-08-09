import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { app } from 'electron'
import logger from '../log'
import { getAppRootPath, getDataDir } from '../ipc/file.ipc'
import { ensureDir } from '../utils/index'

/**
 * ChromaDB 守护进程模块
 *
 * - chroma.exe 是打包在 resources/chromadb 下的独立进程
 * - 默认端口 8521
 * - 数据持久化在 userData/data/chromadb
 *
 * 设计目标：
 *   1. 仅启动一次（全局单例 child 句柄）
 *   2. 关闭应用时优雅退出，避免残留进程
 *   3. 提供 health check：启动后轮询 http://127.0.0.1:8521/api/v2/heartbeat
 *   4. 所有 IO 错误通过 logger 记录，不抛到主进程
 */

// ============================================================
// 1. 常量配置
// ============================================================
// 进程绑定地址（接受任意接口的连接）
const CHROMA_HOST = process.env.CHROMA_HOST || '0.0.0.0'
// 本机回环地址，用于健康检查 / SDK 客户端连接。
// 解决 Windows 上连接 0.0.0.0:port 被拒（ECONNREFUSED）的问题。
const CHROMA_LOOPBACK_HOST = '127.0.0.1'
// 默认 / 备选端口区间
const CHROMA_DEFAULT_PORT = 8521
const CHROMA_PORT_RANGE_START = 8521
const CHROMA_PORT_RANGE_END = 9000
const HEALTH_TIMEOUT_MS = 30_000 // 启动超时 30s
const HEALTH_POLL_INTERVAL_MS = 500

// ============================================================
// 1b. 运行期心跳监控（启动成功之后定时探测，发现挂掉自动重启）
// ============================================================
const RUNTIME_HEARTBEAT_INTERVAL_MS = 30_000 // 每 30s 发一次心跳
const RUNTIME_HEARTBEAT_FAILURE_THRESHOLD = 3 // 连续失败 N 次判定为死亡

// ============================================================
// 2. 进程状态
// ============================================================
let chromaProcess = null
let assignedPort = null // 当前实际分配的端口（动态）
let startingPromise = null
let stoppingPromise = null
let heartbeatTimer = null // 运行期心跳定时器
let heartbeatStopRequested = false
let heartbeatFailStreak = 0
let autoRestarting = false

/**
 * 获取 ChromaDB 数据目录
 */
function getChromaDbDir() {
  return path.join(getDataDir(), 'chromadb')
}

/**
 * 获取 ChromaDB 可执行文件路径
 */
function getChromaExePath() {
  // 打包路径：resources/chromadb/<exe>
  // 开发路径：与生产一致（resources 目录随源码分发）
  return path.join(
    getAppRootPath(),
    'resources',
    'chromadb',
    process.platform === 'win32' ? 'chroma-windows.exe' : 'chroma'
  )
}

/**
 * 从 env / 参数 / 默认端口中解析出最终端口（不使用 get-port）
 * 优先级：
 *   1. options.port
 *   2. process.env.CHROMA_PORT
 *   3. 默认 8521
 */
function resolvePreferredPort(overridePort) {
  if (overridePort && Number.isFinite(overridePort)) return overridePort
  const envPort = Number(process.env.CHROMA_PORT)
  if (Number.isFinite(envPort) && envPort > 0) return envPort
  return CHROMA_DEFAULT_PORT
}

/**
 * 简单探活首选端口（不分配新端口）：如果端口已被占用直接抛错
 */
async function probePortAvailable(port) {
  return new Promise((resolve) => {
    const net = require('net')
    const tester = net
      .createServer()
      .once('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          resolve(false)
        } else {
          resolve(false) // 其他错误也按不可用处理
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close()
      })
      .listen(port, CHROMA_HOST)
  })
}

/**
 * 根据首选端口获取最终端口
 * - 探测首选端口是否可用，优先使用
 * - 区间 [8521, 9000] 内顺序探测，找到第一个空闲端口
 * - 全部占用则抛错（不再 fallback 随机分配，避免行为不可控）
 */
async function allocatePort(preferredPort) {
  if (await probePortAvailable(preferredPort)) return preferredPort

  for (let p = CHROMA_PORT_RANGE_START; p <= CHROMA_PORT_RANGE_END; p++) {
    if (p === preferredPort) continue
    if (await probePortAvailable(p)) return p
  }
  throw new Error(
    `ChromaDB 端口区间 ${CHROMA_PORT_RANGE_START}-${CHROMA_PORT_RANGE_END} 内无可用端口`
  )
}

// ============================================================
// 3. 健康检查（轮询 /api/v1/heartbeat）
// ============================================================
function httpGet(url, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    try {
      const lib = url.startsWith('https') ? require('https') : require('http')
      const req = lib.get(url, { timeout: timeoutMs }, (res) => {
        // 消耗响应体以释放 socket
        res.resume()
        logger.info('[chroma] health check %s -> %s', url, res.statusCode)
        resolve(res.statusCode)
      })
      req.on('timeout', () => {
        req.destroy(new Error('timeout'))
      })
      req.on('error', (e) => {
        logger.error('[chroma] health check error: %s', (e && e.message) || e)
        reject(e)
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * 等待 ChromaDB 就绪（轮询 /api/v1/heartbeat）
 *
 * 注意：这里用 127.0.0.1 而不是绑定的 0.0.0.0，避免 Windows 上
 *   connect ECONNREFUSED 0.0.0.0:8521 这类回环到任意地址被拒的问题。
 */
async function waitForReady(timeoutMs = HEALTH_TIMEOUT_MS) {
  if (!assignedPort) throw new Error('chroma port 未分配')
  const deadline = Date.now() + timeoutMs
  const url = `http://${CHROMA_LOOPBACK_HOST}:${assignedPort}/api/v2/heartbeat`
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() > deadline) {
      throw new Error(
        `ChromaDB 在 ${timeoutMs}ms 内未就绪 (${url})，请检查端口 ${assignedPort} 是否被占用`
      )
    }
    if (!chromaProcess || chromaProcess.exitCode !== null) {
      throw new Error('ChromaDB 进程已退出')
    }
    try {
      const code = await httpGet(url, 1500)
      if (code && code >= 200 && code < 500) {
        return true
      }
    } catch (_) {
      // 还未启动或网络错误，继续轮询
    }
    await new Promise((r) => setTimeout(r, HEALTH_POLL_INTERVAL_MS))
  }
}

// ============================================================
// 4. 启动（单例 + 幂等）
// ============================================================
export async function startChromaDb(options = {}) {
  // 4.1 已启动 → 直接返回
  if (chromaProcess && chromaProcess.exitCode === null) {
    logger.info('[chroma] already running, skip start (pid=%s)', chromaProcess.pid)
    return { alreadyRunning: true, pid: chromaProcess.pid, port: assignedPort }
  }

  // 4.2 正在启动 → 等同一个 Promise
  if (startingPromise) return startingPromise

  startingPromise = (async () => {
    const chromaDbDir = getChromaDbDir()
    const exePath = getChromaExePath()

    logger.info('[chroma] db dir: %s', chromaDbDir)
    logger.info('[chroma] exe path: %s', exePath)

    // 确保数据目录存在
    try {
      ensureDir(chromaDbDir)
    } catch (e) {
      logger.error('[chroma] ensure dir failed: %s', (e && e.message) || e)
      throw e
    }

    // 4.3 exe 存在性检查
    if (!fs.existsSync(exePath)) {
      const msg = `[chroma] exe not found: ${exePath}`
      logger.error(msg)
      throw new Error(msg)
    }

    // 4.4 探测首选端口（默认 8521 → 区间 [8521, 9000] 顺序递增）
    const preferred = resolvePreferredPort(options.port)
    const port = await allocatePort(preferred)
    assignedPort = port
    logger.info('[chroma] using port: %s (preferred: %s)', port, preferred)

    const args = ['run', '--host', CHROMA_HOST, '--port', String(port), '--path', chromaDbDir]

    // 4.5 spawn 子进程
    let child
    try {
      child = spawn(exePath, args, {
        cwd: chromaDbDir,
        windowsHide: true,
        detached: false,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          // 把分配的端口注入子进程 env，方便 Python 端内部再次查询
          CHROMA_PORT: String(port)
        }
      })
      logger.info('[chroma] started')
    } catch (e) {
      logger.error('[chroma] spawn failed: %s', (e && e.message) || e)
      assignedPort = null
      throw e
    }

    chromaProcess = child

    child.stdout?.setEncoding('utf-8')
    child.stderr?.setEncoding('utf-8')
    child.stdout?.on('data', (chunk) => {
      logger.info('[chroma stdout] %s', String(chunk).trimEnd())
    })
    child.stderr?.on('data', (chunk) => {
      logger.warn('[chroma stderr] %s', String(chunk).trimEnd())
    })
    child.on('error', (err) => {
      logger.error('[chroma] process error: %s', (err && err.message) || err)
    })
    child.on('exit', (code, signal) => {
      logger.warn('[chroma] process exited code=%s signal=%s', code, signal)
      if (chromaProcess === child) {
        chromaProcess = null
        assignedPort = null
      }
    })

    // 4.6 等待就绪
    try {
      await waitForReady()
      logger.info('[chroma] ready pid=%s port=%s', child.pid, port)
      // 启动成功后开启运行期心跳监控
      startHeartbeatMonitor()
      return { alreadyRunning: false, pid: child.pid, port, host: CHROMA_HOST }
    } catch (e) {
      logger.error('[chroma] not ready: %s', (e && e.message) || e)
      // 启动失败尝试杀掉
      try {
        child.kill()
      } catch (_) {}
      chromaProcess = null
      assignedPort = null
      throw e
    }
  })()

  try {
    return await startingPromise
  } finally {
    startingPromise = null
  }
}

// ============================================================
// 5. 运行期心跳监控（每隔 N 秒探测，发现死亡则自动重启）
// ============================================================

/**
 * 启动运行期心跳监控定时器。已存在则忽略。
 */
function startHeartbeatMonitor() {
  if (heartbeatTimer) return
  heartbeatStopRequested = false
  heartbeatFailStreak = 0
  heartbeatTimer = setInterval(() => {
    void runHeartbeatTick()
  }, RUNTIME_HEARTBEAT_INTERVAL_MS)
  // 不阻止进程退出
  heartbeatTimer.unref?.()
  logger.info(
    '[chroma] heartbeat monitor started (interval=%dms, fail-threshold=%d)',
    RUNTIME_HEARTBEAT_INTERVAL_MS,
    RUNTIME_HEARTBEAT_FAILURE_THRESHOLD
  )
}

/**
 * 停止运行期心跳监控（仅清定时器，不影响 chroma 进程本身）
 */
function stopHeartbeatMonitor() {
  heartbeatStopRequested = true
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  heartbeatFailStreak = 0
}

/**
 * 单次心跳探测：失败累积计数，达到阈值触发自动重启
 */
async function runHeartbeatTick() {
  if (heartbeatStopRequested) return
  // 进程已退出的情况
  if (!chromaProcess || chromaProcess.exitCode !== null) {
    await handleHeartbeatFailure(new Error('chroma process not alive'))
    return
  }
  if (!assignedPort) {
    return // 还没就绪，不计入失败
  }
  const url = `http://${CHROMA_LOOPBACK_HOST}:${assignedPort}/api/v2/heartbeat`
  try {
    const code = await httpGet(url, 2000)
    if (code && code >= 200 && code < 500) {
      // 心跳成功，重置失败计数
      if (heartbeatFailStreak > 0) {
        logger.info('[chroma] heartbeat recovered (was failing streak=%d)', heartbeatFailStreak)
      }
      heartbeatFailStreak = 0
      return
    }
    await handleHeartbeatFailure(new Error(`unexpected status code ${code}`))
  } catch (e) {
    await handleHeartbeatFailure(e)
  }
}

/**
 * 累积心跳失败；达到阈值时自动重启 chroma
 */
async function handleHeartbeatFailure(err) {
  heartbeatFailStreak++
  logger.warn(
    '[chroma] heartbeat failed (%d/%d): %s',
    heartbeatFailStreak,
    RUNTIME_HEARTBEAT_FAILURE_THRESHOLD,
    (err && err.message) || err
  )
  if (heartbeatFailStreak < RUNTIME_HEARTBEAT_FAILURE_THRESHOLD) return
  if (autoRestarting) return

  // 达到阈值：杀掉当前进程并自动重启
  autoRestarting = true
  logger.error('[chroma] heartbeat threshold reached, auto-restarting chroma...')
  // 停掉当前心跳，避免在重启过程中重复触发
  stopHeartbeatMonitor()

  try {
    // 确保旧进程清理
    try {
      await stopChromaDb()
    } catch (e) {
      logger.warn('[chroma] stop before auto-restart failed: %s', (e && e.message) || e)
    }
    // 重启（startChromaDb 内部仍会启动心跳）
    try {
      await startChromaDb()
      logger.info('[chroma] auto-restart succeeded')
    } catch (e) {
      logger.error('[chroma] auto-restart failed: %s', (e && e.message) || e)
    }
  } finally {
    autoRestarting = false
  }
}

// ============================================================
// 6. 停止
// ============================================================
export async function stopChromaDb() {
  if (stoppingPromise) return stoppingPromise
  // 关闭运行期心跳监控（避免在停止过程中误触发自动重启）
  stopHeartbeatMonitor()
  if (!chromaProcess || chromaProcess.exitCode !== null) {
    chromaProcess = null
    assignedPort = null
    return { stopped: true, alreadyStopped: true }
  }

  stoppingPromise = (async () => {
    const child = chromaProcess
    logger.info('[chroma] stopping pid=%s port=%s', child.pid, assignedPort)

    // Windows 上 detached: false 的进程可以通过 .kill() 终止
    try {
      child.kill()
    } catch (e) {
      logger.warn('[chroma] kill failed: %s', (e && e.message) || e)
    }

    // 等待退出（最多 5s）
    const exited = await new Promise((resolve) => {
      const t = setTimeout(() => resolve(false), 5000)
      if (!child || child.exitCode !== null) {
        clearTimeout(t)
        resolve(true)
        return
      }
      child.once('exit', () => {
        clearTimeout(t)
        resolve(true)
      })
    })

    if (!exited) {
      logger.warn('[chroma] graceful exit timeout, sending SIGKILL')
      try {
        child.kill('SIGKILL')
      } catch (_) {}
    }
    chromaProcess = null
    assignedPort = null
    return { stopped: true }
  })()

  try {
    return await stoppingPromise
  } finally {
    stoppingPromise = null
  }
}

// ============================================================
// 7. 工具
// ============================================================
export function isChromaDbRunning() {
  return !!(chromaProcess && chromaProcess.exitCode === null)
}

/**
 * 获取 ChromaDB 进程信息（含实际分配的端口）
 */
export function getChromaDbInfo() {
  return {
    running: isChromaDbRunning(),
    pid: chromaProcess?.pid || null,
    port: assignedPort,
    host: CHROMA_HOST,
    dbDir: getChromaDbDir(),
    exePath: getChromaExePath(),
    baseUrl: `http://${CHROMA_HOST}:${assignedPort}`
  }
}

/**
 * 获取当前分配的端口（未启动返回 null）
 */
export function getChromaDbPort() {
  return assignedPort
}

/**
 * 获取 ChromaDB 当前 base URL（http://host:port），用于 SDK 客户端连接
 */
export function getChromaDbBaseUrl() {
  if (!assignedPort) return null
  return `http://${CHROMA_HOST}:${assignedPort}`
}

// ============================================================
// 8. 进程退出钩子（注册一次）
// ============================================================
let lifecycleRegistered = false

export function registerChromaDbLifecycle() {
  if (lifecycleRegistered) return
  lifecycleRegistered = true

  const cleanup = () => {
    try {
      stopHeartbeatMonitor()
    } catch (e) {
      logger.warn('[chroma] stop heartbeat failed: %s', (e && e.message) || e)
    }
    try {
      stopChromaDb()
    } catch (e) {
      logger.warn('[chroma] cleanup failed: %s', (e && e.message) || e)
    }
  }

  // Normal exit
  for (const ev of ['exit', 'SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(ev, () => {
      cleanup()
      if (ev !== 'exit') process.exit(0)
    })
  }

  // Electron app lifecycle
  try {
    if (app?.on) {
      app.on('before-quit', () => {
        cleanup()
      })
      app.on('will-quit', () => {
        cleanup()
      })
    }
  } catch (e) {
    logger.warn('[chroma] register electron lifecycle failed: %s', (e && e.message) || e)
  }

  logger.info('[chroma] lifecycle registered')
}

// 默认注册一次（典型场景：被 main 入口 require 时）
registerChromaDbLifecycle()
