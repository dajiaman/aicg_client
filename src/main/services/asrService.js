// asrService  —  调用 python-modules/asrModule/app.exe 实现 ASR
//
// 调用方式（基于项目内已有的 app.exe，pyinstaller 打包）：
//   1. 临时写入 config.json（modelConfig.type=speechRecognition + param）
//   2. spawn app.exe --config <config.json> --output <output.json>
//   3. 读取 output.json 解析
//
// config.json 格式（来自 python-modules/asrModule/config.json + test.py）：
// {
//   "modelConfig": {
//     "type": "speechRecognition",
//     "param": { "audio_file": "...", "language": "auto", "use_itn": true }
//   }
// }
//
// 输出格式（来自 result.json 样本）：
// [
//   {
//     "key": "...",
//     "text": "<|zh|><|NEUTRAL|><|Speech|><|withitn|>家人们，快看...",
//     "timestamp": [[0, 330], [330, 510], ...],
//     "words": ["家", "人", "们", ...]
//   }
// ]

import { spawn } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { getAppRootPath, getTempPath } from '../ipc/file.ipc.js'
import { ensureDir } from '../utils/index.js'
import logger from '../log'

const PYTHON_MODULE_DIR = path.join(getAppRootPath(), 'python-modules')
const ASR_MODULE_DIR = path.join(PYTHON_MODULE_DIR, 'asrModule')
const APP_EXE = path.join(ASR_MODULE_DIR, 'app.exe')
const ASR_CACHE_DIR = path.join(getTempPath(), 'asr_cache')
const CONFIG_DIR = path.join(getTempPath(), 'configs')

// 当前运行的进程引用（用于 stopAsrProcess）
let currentProcess = null

/**
 * 主入口：调用 ASR 识别
 *
 * @param {Object} opts
 * @param {string} opts.audio_file        音频文件绝对路径（必填）
 * @param {string} [opts.language='auto']  语言：auto / zh / en / ja / ...
 * @param {boolean} [opts.use_itn=true]   是否做 ITN（逆文本规范化）
 * @param {number} [opts.timeoutMs=300000] 超时毫秒（5 分钟）
 * @param {Function} [opts.onProgress]   (percent, message) => void
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function speechRecognition(opts = {}) {
  // 兼容多种命名：snake_case (audio_file / use_itn) / camelCase (audioFile / useItn)
  const {
    audio_file,
    audioFile,
    language = 'auto',
    use_itn,
    useItn,
    timeoutMs = 300000,
    onProgress = null
  } = opts

  const finalAudioFile = audio_file || audioFile
  const finalUseItn = use_itn !== undefined ? use_itn : useItn !== undefined ? useItn : true

  // 记录本次调用开始的时间戳（毫秒），与 sentences / timestamp 单位一致
  const startMs = Date.now()

  // ---------- 1. 参数校验 ----------
  if (!finalAudioFile || typeof finalAudioFile !== 'string') {
    return { success: false, error: 'audioFile / audio_file 不能为空' }
  }
  if (!fs.existsSync(finalAudioFile)) {
    return { success: false, error: `音频文件不存在: ${finalAudioFile}` }
  }

  // ---------- 2. 检查 app.exe ----------
  if (!fs.existsSync(APP_EXE)) {
    return {
      success: false,
      error: `未找到 app.exe: ${APP_EXE}。请确认 python-modules/asrModule/app.exe 存在`
    }
  }

  const fileHash = await getFileSha1(finalAudioFile)
  const cacheFile = path.join(ASR_CACHE_DIR, `${fileHash}.json`)
  if (fs.existsSync(cacheFile)) {
    return {
      success: true,
      data: {
        type: 'success',
        start: startMs,
        end: Date.now(),
        data: JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
      }
    }
  }

  const ts = Date.now()
  const taskId = `task_${ts}_${Math.random().toString(36).slice(2, 12)}`

  // ---------- 3. 准备临时目录 ----------
  const tmpDir = getTempPath()
  const configPath = path.join(CONFIG_DIR, `config_${Date.now()}.json`)
  const outputPath = path.join(tmpDir, 'asr_cache', `${fileHash}.json`)

  // 确保目录存在
  ensureDir(CONFIG_DIR)
  ensureDir(ASR_CACHE_DIR)

  try {
    // ---------- 4. 写 config.json ----------
    const config = {
      id: taskId,
      mode: 'local',
      moduleName: 'asrModule',
      modelConfig: {
        type: 'speechRecognition',
        param: {
          audio_file: finalAudioFile,
          language,
          use_itn: finalUseItn
        }
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')

    // ---------- 5. 调用 app.exe ----------
    const args = ['--config', configPath, '--output', outputPath]
    logger.info(`[asrService] spawn ${APP_EXE} ${args.join(' ')}`)

    const result = await runAppExe({
      exePath: APP_EXE,
      args,
      cwd: ASR_MODULE_DIR,
      timeoutMs,
      onProgress,
      outputPath
    })

    if (!result.success) return result

    // ---------- 6. 解析输出 ----------
    if (!fs.existsSync(outputPath)) {
      return {
        success: false,
        message: `app.exe 退出但未生成结果文件: ${outputPath}}`
      }
    }

    const rawText = fs.readFileSync(outputPath, 'utf-8')
    let rawResult
    try {
      rawResult = JSON.parse(rawText)
    } catch (e) {
      return {
        success: false,
        message: `解析 result.json 失败: ${e.message}。原始内容前 500 字: ${rawText.slice(0, 500)}`
      }
    }

    const data = normalizeResult(rawResult, language)

    return {
      success: true,
      data: {
        type: 'success',
        start: startMs,
        end: Date.now(),
        data: data
      }
    }
  } catch (e) {
    log.error('[asrService] failed:', e)
    return { success: false, message: e.message || 'ASR 识别失败' }
  } finally {
    // 清理临时文件
    fs.unlinkSync(configPath)
  }
}

/**
 * 停止当前运行的 ASR 进程
 */
export async function stopAsrProcess() {
  if (!currentProcess) return { stopped: false, reason: 'no running process' }
  try {
    const pid = currentProcess.pid
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pid), '/f', '/t'])
    } else {
      currentProcess.kill('SIGTERM')
    }
    currentProcess = null
    return { stopped: true, pid }
  } catch (e) {
    return { stopped: false, error: e.message }
  }
}

// =============================================================================
// spawn app.exe
// =============================================================================

function runAppExe({ exePath, args, cwd, timeoutMs, onProgress, outputPath }) {
  return new Promise((resolve) => {
    if (!outputPath) {
      resolve({
        success: false,
        error: 'runAppExe 必须传入 outputPath'
      })
      return
    }

    let stderrBuf = ''
    let timer

    // app.exe 是 Windows GUI 程序（pyinstaller --windowed 可能），需要隐藏窗口
    const child = spawn(exePath, args, {
      cwd,
      windowsHide: true,
      // 部分 pyinstaller exe 需要 detach，否则会同步阻塞
      detached: false,
      // 关键：强制 UTF-8 编码（Windows 中文系统默认 chcp 936 = GBK，
      //       app.exe 的 stdout 不能编码 emoji/中文 → UnicodeEncodeError）
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    })
    currentProcess = child

    // 超时控制
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        try {
          child.kill('SIGTERM')
        } catch (e) {
          logger.error('[timeout] kill failed:', e)
        }
        try {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'])
          }
        } catch (e) {
          logger.error('[timeout] taskkill failed:', e)
        }
        currentProcess = null
        logger.error(`[runAppExe] timeout after ${timeoutMs}ms`)
        resolve({
          success: false,
          error: `ASR 识别超时(${timeoutMs}ms)`
        })
      }, timeoutMs)
    }

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString()
      // 用 info 级别写日志（electron-log 自带换行）
      logger.info(`[stdout] ${text.trimEnd()}`)
      // 解析进度（如果有约定协议）
      const m = text.match(/progress[:\s]+(\d+)/i)
      if (m && onProgress) onProgress(Number(m[1]), 'ASR 识别中...')
    })

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString()
      stderrBuf += text
      // 用 warn 级别（stderr 通常是 progress + 警告）
      logger.warn(`[stderr] ${text.trimEnd()}`)
      // 解析 stderr 里的进度
      const m = stderrBuf.match(/(\d+)%/)
      if (m && onProgress) onProgress(Number(m[1]), 'ASR 识别中...')
    })

    child.on('error', (e) => {
      if (timer) clearTimeout(timer)
      currentProcess = null
      logger.error('[runAppExe] spawn error:', e)
      resolve({
        success: false,
        error: `spawn app.exe 失败: ${e.message}。请确认 ${exePath} 是有效的可执行文件`
      })
    })

    child.on('close', (code) => {
      if (timer) clearTimeout(timer)
      currentProcess = null
      logger.info(`[runAppExe] close code=${code}`)

      // app.exe 是 pyinstaller 打包的 GUI 程序，退出码可能不规范（经常返回 1 但实际成功）
      // 改为判断逻辑：以输出文件是否存在 + 可解析为准
      if (!fs.existsSync(outputPath)) {
        logger.error(`[runAppExe] output file not found: ${outputPath}`)
        resolve({
          success: false,
          error: `app.exe 退出码 ${code}，且未生成结果文件: ${outputPath}`
        })
        return
      }

      const outStat = fs.statSync(outputPath)
      if (outStat.size <= 0) {
        logger.error(`[runAppExe] output file is empty: ${outputPath}`)
        resolve({
          success: false,
          error: `app.exe 退出码 ${code}，输出文件为空: ${outputPath}`
        })
        return
      }

      // 推 100%
      if (onProgress) onProgress(100, '完成')

      // 即便 code 非 0（GUI 子系统特性），只要输出文件 OK 就视为成功
      if (code !== null && code !== 0) {
        logger.warn(`[runAppExe] exit code ${code} but output ok, treat as success`)
      } else {
        logger.info(`[runAppExe] success, output size=${outStat.size}`)
      }

      resolve({ success: true })
    })
  })
}

// =============================================================================
// 归一化输出
// =============================================================================

/**
 * 归一化 app.exe 输出为统一格式
 *
 * 实际输出格式（test-asr-inline.js 实测确认）：
 * {
 *   "key": "arstest",
 *   "audio_file": "...",
 *   "language": "auto",
 *   "raw_text": "<|zh|><|NEUTRAL|><|Speech|><|withitn|>薄暮时分...",
 *   "processed_text": "薄暮时分...",   // 已经清洗 <|...|> tags
 *   "confidence": 0.0,
 *   "timestamp": [[0, 270], ...],      // token 级（毫秒）
 *   "sentences": [                     // 句子级（毫秒）✅ app.exe 已经切好
 *     { "text": "薄暮时分", "start": 0, "end": 990, "duration": 990 },
 *     ...
 *   ]
 * }
 *
 * 输出（renderer 友好）：
 * {
 *   text / processed_text / raw_text:  各种形式的文本
 *   sentences: [{text, start(秒), end(秒), duration(秒)}, ...]
 *   language / provider / model / confidence / key / audio_file / timestamp(毫秒)
 * }
 */
function normalizeResult(raw, defaultLang = 'auto') {
  if (!raw || typeof raw !== 'object') return raw

  // processed_text 已经去除 <|...|> tags，直接用
  let processedText = String(raw.processed_text || raw.text || '')
    .trim()
    .replace(
      /[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0FF}\u{1F000}-\u{1F02F}]/gu,
      ''
    )

  // raw_text 保留 <|...|> tags（含语言/情感/ITN 标记）
  const rawText = String(raw.raw_text || raw.text || '').trim()

  // sentences（app.exe 已经切好，单位为毫秒；保留整型毫秒与 timestamp 一致）
  const sentencesMs = Array.isArray(raw.sentences) ? raw.sentences : []
  const sentences = sentencesMs
    .map((s) => {
      const start = Number(s.start) || 0
      const end = Number(s.end) || 0
      return {
        text: String(s.text || '').trim(),
        start, // 毫秒（与 timestamp 对齐）
        end, // 毫秒
        duration: end - start // 毫秒
      }
    })
    .filter((s) => s.text)

  // sentences 为空时（少数情况），用整段文本兜底
  if (sentences.length === 0 && processedText) {
    sentences.push({
      text: processedText,
      start: 0,
      end: 0,
      duration: 0
    })
  }

  // 提取语言
  const langMatch = rawText.match(/<\|([^|]*)\|>/)
  const detectedLang = langMatch
    ? langMatch[1]
    : raw.language || (defaultLang === 'auto' ? 'zh' : defaultLang)

  return {
    processed_text: processedText,
    raw_text: rawText,
    sentences,
    language: detectedLang,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : null,
    success: true,
    audio_file: raw.audio_file || null,
    timestamp: Array.isArray(raw.timestamp) ? raw.timestamp : [] // 毫秒
  }
}

/**
 * 获取文件 SHA1
 * @param {string} filePath 文件绝对路径
 * @returns {Promise<string>} sha1 十六进制小写字符串
 */
function getFileSha1(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    // 创建文件可读流
    const stream = fs.createReadStream(filePath)

    stream.on('data', (chunk) => {
      hash.update(chunk)
    })

    stream.on('end', () => {
      // 输出十六进制格式
      const sha1 = hash.digest('hex')
      resolve(sha1)
    })

    stream.on('error', (err) => {
      reject(err)
    })
  })
}
