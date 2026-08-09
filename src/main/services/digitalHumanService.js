// 数字人视频生成
// 通过命令行调用 python-modules/hdModule/app.exe（或 humanModule/app.exe）：
//   app.exe --config <config.json>
//
// 启动器（argparse）只接受 --config。配置 schema（来自 python-modules/hdModule/config.json）：
//   {
//     "id": "task_<ts>_<rand>",
//     "moduleName": "hdModule" | "humanModule",
//     "mode": "local",
//     "modelConfig": { "type": "generateDigitalHuman", "param": { ... } }
//   }
//
// 启动器以 stdout 流式输出 JSON 行（与 voiceV2Module 协议一致）：
//   [RESULT] {"text":"...", "output_path":"...", ...}      ← 结果行（实际是 video_path）
//   [RESULT] {"End": true}                                 ← 结束行
//   {progress: n}                                          ← 进度（视启动器实现而定）
//
// 单次任务完成后进程退出，每次调用 spawn 新进程。
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getAppRootPath, getTempPath } from '../ipc/file.ipc.js'
import { ensureDir } from '../utils/index.js'
import logger from '../log'

// ---------- 常量 ----------
const APP_ROOT = getAppRootPath()
const TEMP_ROOT = getTempPath()
const PYTHON_MODULE_DIR = path.join(APP_ROOT, 'python-modules')
const HD_MODULE_DIR = path.join(PYTHON_MODULE_DIR, 'hdModule')
const HUMAN_MODULE_DIR = path.join(PYTHON_MODULE_DIR, 'humanModule')
const HD_APP_EXE = path.join(HD_MODULE_DIR, 'app.exe')
const HUMAN_APP_EXE = path.join(HUMAN_MODULE_DIR, 'app.exe')

const CONFIG_DIR = path.join(TEMP_ROOT, 'configs')
const OUTPUT_DIR = path.join(TEMP_ROOT, 'human_cache')

const DEFAULT_TIMEOUT_MS = 1800000 // 单次推理超时（30 分钟，数字人比 TTS 慢得多）

/**
 * 数字人生成视频
 *
 * @param {Object} params
 * @param {string} params.audio_file            - 驱动音频绝对路径（必填）
 * @param {string} params.video_file            - 数字人底版视频绝对路径（必填）
 * @param {boolean} [params.watermark=false]    - 是否加水印
 * @param {string} [params.digital_auth]        - 数字人鉴权字符串
 * @param {string} [params.output_dir]          - 输出目录（必填，由调用方保证目录存在）
 * @param {string} [params.model_version='V2']  - V2 → hdModule，V1 → humanModule
 * @param {number} [params.timeoutMs=1800000]   - 超时
 * @param {Function} [params.onProgress]        - 进度回调 (percent, message)
 * @returns {Promise<{success:boolean,data?:object,error?:string}>}
 */
export async function generateDigitalHuman(params = {}) {
  const t0 = Date.now()

  const {
    audio_file = '',
    audioFile = '',
    video_file = '',
    videoFile = '',
    watermark = false,
    digital_auth = false,
    output_dir = '',
    outputDir = '',
    model_version = 'V2',
    modelVersion,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    onProgress = null
  } = params

  // 兼容 snake_case / camelCase
  const finalAudio = audio_file || audioFile
  const finalVideo = video_file || videoFile
  const finalAuth = digital_auth
  const finalOutDir = output_dir || outputDir
  const finalModelVersion = modelVersion || model_version || 'V2'

  // ---------- 1. 参数校验 ----------
  if (!finalAudio) {
    return { success: false, error: 'audio_file / audioFile 不能为空（驱动音频）' }
  }
  if (!finalVideo) {
    return { success: false, error: 'video_file / videoFile 不能为空（数字人底版视频）' }
  }

  if (!fs.existsSync(path.resolve(finalAudio))) {
    return { success: false, error: `音频文件不存在: ${finalAudio}` }
  }

  if (!fs.existsSync(path.resolve(finalVideo.trim()))) {
    return { success: false, error: `数字人底版视频不存在: ${finalVideo}` }
  }

  ensureDir(finalOutDir)

  // ---------- 2. 选模块 ----------
  const isV2 = String(finalModelVersion).toUpperCase() === 'V2'
  const moduleName = isV2 ? 'hdModule' : 'humanModule'
  const APP_EXE = isV2 ? HD_APP_EXE : HUMAN_APP_EXE
  const MODULE_DIR = isV2 ? HD_MODULE_DIR : HUMAN_MODULE_DIR

  if (!fs.existsSync(APP_EXE)) {
    return {
      success: false,
      error: `未找到 app.exe: ${APP_EXE}。请确认 ${MODULE_DIR}/app.exe 存在`
    }
  }

  // ---------- 3. 准备目录 ----------
  ensureDir(CONFIG_DIR)
  ensureDir(OUTPUT_DIR)

  const ts = Date.now()
  const taskId = `task_${ts}_${Math.random().toString(36).slice(2, 12)}`

  // ---------- 4. 写 config.json ----------
  // 统一 config.json 名为 时间戳_config.json，避免冲突
  const configPath = path.join(CONFIG_DIR, `${Date.now()}_config.json`)

  const config = {
    id: taskId,
    moduleName,
    mode: 'local',
    modelConfig: {
      type: 'generateDigitalHuman',
      param: {
        audio_file: finalAudio,
        video_file: finalVideo,
        watermark: !!watermark,
        digital_auth: !!finalAuth,
        output_dir: finalOutDir,
        model_version: finalModelVersion
      }
    }
  }

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    return { success: false, error: `写入 config 失败: ${e.message}` }
  }

  // ---------- 6. spawn app.exe --config <configPath> ----------
  if (onProgress) onProgress(0, '启动本地数字人任务...')

  // 在env中配置 config
  const env = {
    AIGC_SERVER_PLACEHOLDER_CONFIG: configPath
  }

  const result = await runAppExe({
    exePath: APP_EXE,
    args: ['--config', configPath],
    env,
    cwd: MODULE_DIR,
    timeoutMs,
    onProgress
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // ---------- 7. 解析启动器 RESULT ----------
  // 启动器实际输出两行（带 [RESULT] 前缀）：
  //   1) [RESULT] {"output_path":"...", "video_path":"...", "file_size":N, "duration":...}
  //   2) [RESULT] {"End": true}
  // runAppExe 把两行分别保存到 resultData 和 endFlag，统一装进 result.{End,data,lastResult}。
  const payload = result.result || {}
  const data = payload.data || {}

  // 成功判定：拿到结果行（含 result_path/video_path/output_path），或收到了 End 标记
  const hasEnd = !!payload.End
  const hasResultData = !!(
    data.result_path ||
    data.resultPath ||
    data.video_path ||
    data.videoPath ||
    data.output_path ||
    data.outputPath
  )

  // 错误判定（启动器可能用 success:false / type:error / error 字段）
  const type = data.type
  const msg = data.msg || data.message || ''
  const errMsg = data.error || ''

  if (type === 'error' || errMsg || data.success === false) {
    logger.error(
      `[digitalHuman] failed: type=${type} success=${data.success} errMsg=${errMsg} msg=${msg}`
    )
    return {
      success: false,
      error: `数字人生成失败: ${errMsg || msg || data.msg || '未知错误'}`
    }
  }

  if (!hasEnd && !hasResultData) {
    logger.error(`[digitalHuman] incomplete result: payload=${JSON.stringify(payload)}`)
    return {
      success: false,
      error: `数字人启动器未返回有效结果: ${JSON.stringify(payload).slice(0, 200)}`
    }
  }

  // ---------- 8. 校验输出文件 ----------
  // 优先取启动器返回的 result_path / video_path / output_path；
  //   兜底：在 finalOutDir 下找最新生成的视频（mp4/mov/avi）
  const returnedPath =
    data.result_path ||
    data.resultPath ||
    data.video_path ||
    data.videoPath ||
    data.output_path ||
    data.outputPath ||
    ''

  let finalPath = returnedPath
  if (!finalPath || !fs.existsSync(finalPath)) {
    finalPath = findLatestVideoInDir(finalOutDir)
  }

  if (!finalPath) {
    logger.error(`[digitalHuman] no output file in ${finalOutDir}`)
    return {
      success: false,
      error: `数字人启动器返回成功但在 ${finalOutDir} 下未找到输出文件`
    }
  }

  const outStat = fs.statSync(finalPath)
  if (outStat.size <= 0) {
    logger.error(`[digitalHuman] output file is empty: ${finalPath}`)
    return {
      success: false,
      error: `数字人输出文件为空: ${finalPath}`
    }
  }

  if (onProgress) onProgress(100, `完成（${((Date.now() - t0) / 1000).toFixed(1)}s）`)

  return {
    success: true,
    data: {
      // 启动器原始 RESULT 字段（兼容）
      type: 'success',
      data: {
        video_path: finalPath,
        output_path: finalPath,
        result_path: finalPath,
        work_id: data.work_id ?? null,
        file_size: outStat.size,
        // ⚠️ 启动器 RESULT 里没有"生成视频时长"字段，duration_seconds 实际是**推理耗时**
        //   duration 字段在没有视频时长数据时返回 null，避免误用推理耗时
        //   inference_seconds 单独表达推理耗时（语义明确）
        duration: typeof data.duration === 'number' ? data.duration : null,
        inference_seconds: typeof data.duration_seconds === 'number' ? data.duration_seconds : null,
        inference_formatted:
          typeof data.duration_formatted === 'string' ? data.duration_formatted : null,
        watermark: typeof data.watermark === 'boolean' ? data.watermark : !!watermark,
        digital_auth: typeof data.digital_auth === 'string' ? data.digital_auth : finalAuth || '',
        model_version: finalModelVersion
      },
      start: t0,
      end: Date.now()
    }
  }
}

// =============================================================================
// spawn app.exe --config <cfg>，从 stdout 抓取启动器 JSON 输出
// =============================================================================
function runAppExe({ exePath, args, cwd, timeoutMs, onProgress, env = {} }) {
  return new Promise((resolve) => {
    let stderrBuf = ''
    let stdoutBuf = ''
    let lastResult = null
    let resultData = null // 最近一次 [RESULT] {...} 的内容（结果行，含 video_path）
    let endFlag = false // 是否看到了 [RESULT] {"End": true}
    let timer

    const child = spawn(exePath, args, {
      cwd,
      windowsHide: true,
      detached: false,
      env: {
        ...process.env,
        ...env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    })

    logger.info(`[runAppExe] start pid=${child.pid} ${exePath} ${args.join(' ')}`)
    logger.info('[digitalHumanService] app.exe started pid=' + child.pid)

    // 超时
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        try {
          child.kill('SIGTERM')
        } catch (e) {
          logger.error('[timeout] kill failed:', e)
        }
        if (process.platform === 'win32') {
          try {
            spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'])
          } catch (e) {
            logger.error('[timeout] taskkill failed:', e)
          }
        }
        resolve({
          success: false,
          error: `数字人任务超时（${timeoutMs}ms）`
        })
      }, timeoutMs)
    }

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString()
      stdoutBuf += text
      logger.info(`[stdout] ${text.trimEnd()}`)

      // 按行尝试解析 JSON：
      //   [RESULT] {"text":...} / {"output_path":...}    → 结果行
      //   [RESULT] {"End": true}                          → 结束行
      //   {progress: N}                                    → 进度行
      const lines = stdoutBuf.split(/\r?\n/)
      stdoutBuf = lines.pop() || ''
      for (const line of lines) {
        let s = line.trim()
        if (!s) continue
        // 剥启动器前缀
        const m = s.match(/^\[(?:RESULT|PROGRESS|END)\]\s*(.*)$/i)
        if (m) s = m[1].trim()
        if (!s || s[0] !== '{') continue
        try {
          const obj = JSON.parse(s)
          if (obj && (obj.End === true || obj.END === true)) {
            // 结束标记行
            endFlag = true
            lastResult = obj
            if (onProgress) onProgress(95, '启动器上报完成')
          } else if (typeof obj.progress === 'number' && onProgress) {
            // 进度行
            onProgress(Math.min(95, Math.max(0, obj.progress)), '数字人合成中...')
          } else {
            // 结果行：保存最近一次
            resultData = obj
          }
        } catch {
          /* 不是 JSON 行，忽略 */
        }
      }
    })

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString()
      stderrBuf += text
      logger.warn(`[stderr] ${text.trimEnd()}`)
      const lower = text.toLowerCase()
      if (
        lower.includes('error') ||
        lower.includes('exception') ||
        lower.includes('traceback') ||
        lower.includes('失败')
      ) {
        logger.error('[app.exe:ERROR]', text.trimEnd())
      }
    })

    child.on('error', (e) => {
      if (timer) clearTimeout(timer)
      logger.error('[runAppExe] spawn error:', e)
      resolve({
        success: false,
        error: `启动 app.exe 失败: ${e.message}。请确认 ${exePath} 存在且可执行`
      })
    })

    child.on('close', (code) => {
      if (timer) clearTimeout(timer)
      logger.info(`[runAppExe] close code=${code}`)
      logger.info('[digitalHumanService] app.exe close code=' + code)

      // 处理最后一行残余
      if (stdoutBuf.trim()) {
        let s = stdoutBuf.trim()
        const m = s.match(/^\[(?:RESULT|PROGRESS|END)\]\s*(.*)$/i)
        if (m) s = m[1].trim()
        if (s && s[0] === '{') {
          try {
            const obj = JSON.parse(s)
            if (obj && (obj.End === true || obj.END === true)) {
              endFlag = true
              lastResult = obj
            } else if (typeof obj.progress !== 'number') {
              resultData = obj
            }
          } catch {
            /* ignore */
          }
        }
      }

      // 即便 code 非 0，如果启动器给出了 RESULT，优先信任 RESULT
      if (resultData || endFlag) {
        resolve({
          success: true,
          result: {
            End: endFlag,
            data: resultData,
            lastResult
          }
        })
        return
      }

      // 没拿到 RESULT → 失败
      const tail = stderrBuf.trim().slice(-400)
      resolve({
        success: false,
        error:
          `app.exe 退出码 ${code}，且未产生 RESULT 输出。` + (tail ? `\nstderr 末尾: ${tail}` : '')
      })
    })
  })
}

// =============================================================================
// 兜底：在 output_dir 下找最新生成的视频文件
// =============================================================================
function findLatestVideoInDir(dir) {
  const VIDEO_EXT = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
  try {
    if (!fs.existsSync(dir)) return ''
    const files = fs
      .readdirSync(dir)
      .map((name) => {
        const full = path.join(dir, name)
        try {
          const st = fs.statSync(full)
          return { full, mtime: st.mtimeMs, size: st.size }
        } catch {
          return null
        }
      })
      .filter((f) => f && f.size > 0 && VIDEO_EXT.includes(path.extname(f.full).toLowerCase()))
    if (!files.length) return ''
    files.sort((a, b) => b.mtime - a.mtime)
    return files[0].full
  } catch {
    return ''
  }
}
