// 主进程通用工具函数
import fs from 'fs'
import path, { join } from 'path'
import { spawn } from 'child_process'
import { getAppRootPath } from '../ipc/file.ipc'

/**
 * 确保目录存在，不存在则递归创建
 */
export function ensureDir(dir) {
  if (!dir) return
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 获取 ffmpeg 目录下的可执行文件路径
 */
function getFfmpegBinDir() {
  const dir = join(getAppRootPath(), 'resources', 'ffmpeg', 'bin')
  const isWin = process.platform === 'win32'
  const exe = isWin ? 'ffmpeg.exe' : 'ffmpeg'
  if (fs.existsSync(join(dir, exe))) return { dir, exe }
  return null
}

/**
 * 解析 ffmpeg / ffprobe 等可执行路径；找不到返回 null
 */
export function getFFmpegBin(name) {
  const found = getFfmpegBinDir()
  if (!found) return null
  const isWin = process.platform === 'win32'
  const candidates = isWin ? [`${name}.exe`, `${name}.bat`, name] : [name]
  for (const exe of candidates) {
    const p = join(found.dir, exe)
    if (fs.existsSync(p)) return p
  }
  return null
}

/**
 * spawn 子进程并收集 stdout/stderr；exit 0 resolve，否则 reject
 */
export function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      const child = spawn(cmd, args, { windowsHide: true, ...opts })
      let stdout = ''
      let stderr = ''
      child.stdout?.on('data', (d) => (stdout += d.toString()))
      child.stderr?.on('data', (d) => (stderr += d.toString()))
      child.on('error', reject)
      child.on('close', (code) => {
        if (code === 0) resolve({ stdout, stderr })
        else reject(new Error(`exit ${code}: ${stderr.slice(-400)}`))
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * 路径分隔符清洗 + 文件名提取
 */
export function pathFileName(p) {
  return (
    String(p || '')
      .split(/[\\/]/)
      .pop() || ''
  )
}

/**
 * 文件名去扩展名
 */
export function stripExt(name) {
  return String(name || '').replace(/\.[^.]+$/, '')
}

/**
 * 文件名安全化（去除路径分隔符与 Windows 非法字符）
 */
export function safeFileName(name) {
  return String(name || '').replace(/[\\/:*?"<>|]/g, '_')
}

/**
 * 路径归一化
 *
 * 用途：把外部传入的路径字符串（可能是 Windows 反斜杠、混合分隔符、
 * file:// URL、含 query/hash、多余 . / .. 段、首尾空白/引号）统一成
 * 平台原生、可被 Node fs / ffmpeg / Electron 等直接使用的绝对路径。
 *
 * 行为：
 *  - 非字符串直接抛 TypeError（避免静默吞错）
 *  - 自动去除 BOM、首尾空白与包裹引号
 *  - 兼容 file:// URL（'file:///C:/a/b' → 'C:\\a\\b'）
 *  - 正斜杠/反斜杠统一替换为当前平台分隔符
 *  - 使用 path.resolve 转成绝对路径（相对路径相对 process.cwd()）
 *  - 调用 path.normalize 折叠多余分隔符、解析 . / .. 段
 *
 * 注意：
 *  - 不会做 fs.existsSync 检查；调用方按需自检
 *  - 不会处理超长路径前缀（\\?\），按需由调用方处理
 *
 * @param {string} rawPath 原始路径
 * @returns {string} 归一化后的绝对路径
 */
export function normalizePath(rawPath) {
  if (typeof rawPath !== 'string') {
    throw new TypeError(`normalizePath: expected string, got ${typeof rawPath}`)
  }

  let s = rawPath

  // 1. 去 BOM
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1)

  // 2. 去除首尾空白
  s = s.trim()
  if (!s) return ''

  // 3. 去除包裹的引号（"..." 或 '...'）
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    if (s.length >= 2) s = s.slice(1, -1)
  }

  // 4. 处理 file:// URL
  if (/^file:\/\/\//i.test(s)) {
    try {
      // URL 在 Windows 上需要把 /C:/ 转成 C:/
      const u = new URL(s)
      let p = decodeURIComponent(u.pathname || '')
      // Windows: /C:/foo → C:/foo
      if (process.platform === 'win32' && /^\/[A-Za-z]:\//.test(p)) {
        p = p.slice(1)
      }
      s = p
    } catch (_) {
      // 解析失败则按字符串处理
      s = s.replace(/^file:\/\/\//i, '')
    }
  } else if (/^file:\/\//i.test(s)) {
    s = s.replace(/^file:\/\//i, '')
  }

  // 5. 统一分隔符为当前平台原生分隔符
  //    - Windows: '\\'
  //    - POSIX:   '/'
  const sep = process.platform === 'win32' ? '\\' : '/'
  // 把非平台分隔符替换为平台分隔符；保留 UNC 前缀 \\server\share 中的 \\
  if (process.platform === 'win32') {
    // 把所有正斜杠换成反斜杠
    s = s.replace(/\//g, '\\')
  } else {
    // POSIX：把反斜杠换成正斜杠
    s = s.replace(/\\/g, '/')
  }

  // 6. 转成绝对路径并 normalize（折叠 .. 与 . 段）
  //    path.resolve 同时处理跨平台的驱动器盘符大小写
  //    UNC 路径（\\server\share）在 Windows 下会被 path.resolve 保留
  if (process.platform === 'win32') {
    // 保留盘符大小写：node path 会把 c: 规范化成 C:，这里保持原样
    const driveMatch = /^([A-Za-z]):[\\/]/.exec(s)
    const drive = driveMatch ? driveMatch[1].toUpperCase() + ':' : null
    let resolved = path.resolve(s)
    if (drive) {
      const m = /^([A-Za-z]):/.exec(resolved)
      if (m) resolved = drive + resolved.slice(2)
    }
    s = path.normalize(resolved)
  } else {
    s = path.resolve(path.normalize(s))
  }

  // 7. 最终再做一次分隔符规整（防止 path.normalize 在边界情况下混用）
  if (process.platform === 'win32') {
    s = s.replace(/\//g, '\\')
  } else {
    s = s.replace(/\\/g, '/')
  }

  // 去除结果末端的分隔符（除根目录外）
  if (s.length > 1 && (s.endsWith(sep) || s.endsWith(sep === '\\' ? '/' : '\\'))) {
    s = s.replace(/[\\/]+$/, '')
    // 根目录特例：C:\、/ 等保留单个分隔符
    if (
      (process.platform === 'win32' && /^[A-Za-z]:$/.test(s)) ||
      (process.platform !== 'win32' && s === '')
    ) {
      s = s + sep
    }
  }

  return s
}
