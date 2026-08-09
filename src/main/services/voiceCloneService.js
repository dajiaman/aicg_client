// 声音克隆 V2
// 通过命令行调用 python-modules/voiceV2Module/app.exe：
//   app.exe --config <config.json>
//
// 启动器（argparse）只接受 --config。配置 schema 来自 voiceV2Module/test.json：
//   {
//     "id": "task_<ts>_<rand>",
//     "moduleName": "voiceV2Module",
//     "mode": "local",
//     "modelConfig": { "type": "soundClone", "param": { ... } }
//   }
//
// 启动器以 stdout 流式输出 JSON 行：
//   { "RESULT": { ... }, "End": true }   → 任务结束（RESULT 通常含 code/msg/data.output_path）
//   { "progress": <num>, ... }           → 进度（视启动器实现而定）
//
// 单次任务完成后进程退出，每次调用 spawn 新进程（模型加载可由启动器内部缓存，
// 现阶段以一次一进程实现，与 asrService 保持一致）。
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getAppRootPath, getTempPath } from '../ipc/file.ipc.js'
import { ensureDir } from '../utils/index.js'
import logger from '../log'
import { v4 as uuidv4 } from 'uuid'

// ---------- 常量 ----------
const APP_ROOT = getAppRootPath()
const TEMP_ROOT = getTempPath()
const VOICE_CLONE_MODULE_DIR = path.join(APP_ROOT, 'python-modules', 'voiceV2Module')
const APP_EXE = path.join(VOICE_CLONE_MODULE_DIR, 'app.exe')

const CONFIG_DIR = path.join(TEMP_ROOT, 'configs')

const DEFAULT_TIMEOUT_MS = 600000 // 单次推理超时（10 分钟）

// =============================================================================
// 主入口：声音克隆
//
// @param {Object} opts
// @param {string} [opts.mode='fast']                          - 模式
// @param {string} opts.text                                   - 要合成的文本（必填）
// @param {string} [opts.promptText]                           - 参考音频对应的文本
// @param {string} opts.promptAudioPath                        - 参考音频路径（必填）
// @param {string} [opts.outputPath]                           - 输出文件路径；可空，目录或文件
// @param {number} [opts.speed=1.0]                            - 语速
// @param {number[]} [opts.emotions]                           - 8 维情感向量
// @param {number} [opts.emotionWeight=1.0]                    - 情感权重
// @param {string} [opts.emotionText]                          - 情感描述文本
// @param {string} [opts.emotionRefAudioPath]                  - 情感参考音频
// @param {number} [opts.timeoutMs=600000]                     - 超时
// @param {Function} [opts.onProgress]                         - 进度回调 (percent, message)
// @returns {Promise<{success:boolean,data?:object,error?:string?:string}>}
// =============================================================================
export async function soundClone(opts = {}) {
  const t0 = Date.now()

  const {
    mode = 'slow',
    text = '',
    promptText = '',
    prompt_text = '',
    promptAudioPath = '',
    prompt_audio_path = '',
    outputPath = '',
    output_path = '',
    speed = 1.0,
    emotions = null,
    emotionWeight = 1.0,
    emotion_weight = 1.0,
    emotionText = '',
    emotion_text = '',
    emotionRefAudioPath = '',
    emotion_ref_audio_path = '',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    onProgress = null
  } = opts

  const finalPromptText = prompt_text || promptText || ''
  const finalPromptAudio = prompt_audio_path || promptAudioPath || ''
  const finalOutputPath = output_path || outputPath || ''
  const finalEmotionWeight = emotion_weight ?? emotionWeight ?? 1.0
  const finalEmotionText = emotion_text || emotionText || ''
  const finalEmotionRefAudio = emotion_ref_audio_path || emotionRefAudioPath || ''

  // ---------- 1. 参数校验 ----------
  if (!text) {
    return { success: false, error: 'text 不能为空（要合成的文本）' }
  }
  if (!finalPromptAudio) {
    return { success: false, error: 'prompt_audio_path / promptAudioPath 不能为空（参考音频）' }
  }
  if (!fs.existsSync(finalPromptAudio)) {
    return { success: false, error: `参考音频不存在: ${finalPromptAudio}` }
  }
  if (Array.isArray(emotions) && emotions.length !== 8) {
    return { success: false, error: 'emotions 必须是 8 维向量' }
  }
  if (finalEmotionRefAudio && !fs.existsSync(finalEmotionRefAudio)) {
    return { success: false, error: `情感参考音频不存在: ${finalEmotionRefAudio}` }
  }
  if (!fs.existsSync(APP_EXE)) {
    return { success: false, error: `未找到 app.exe: ${APP_EXE}` }
  }

  // ---------- 2. 准备目录 ----------
  ensureDir(CONFIG_DIR)
  ensureDir(finalOutputPath)

  const ts = Date.now()
  const taskId = `task_${ts}_${Math.random().toString(36).slice(2, 12)}`

  // 自己生成文件名
  let outputFilePath = path.join(finalOutputPath, `${uuidv4()}.wav`)

  // ---------- 4. 写 config.json ----------
  const configPath = path.join(CONFIG_DIR, `config_${Date.now()}.json`)
  const config = {
    id: taskId,
    moduleName: 'voiceV2Module',
    mode: 'local',
    modelConfig: {
      type: 'soundClone',
      param: {
        mode,
        text,
        prompt_text: finalPromptText,
        prompt_audio_path: finalPromptAudio,
        output_path: outputFilePath,
        speed: Number(speed) || 1.0,
        emotions: Array.isArray(emotions) ? emotions : null,
        emotion_weight: Number(finalEmotionWeight) || 1.0,
        emotion_text: finalEmotionText || null,
        emotion_ref_audio_path: finalEmotionRefAudio || null
      }
    }
  }
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    return { success: false, error: `写入 config 失败: ${e.message}` }
  }

  // ---------- 6. spawn app.exe --config <configPath> ----------
  if (onProgress) onProgress(0, 'start voiceClone')

  const result = await runAppExe({
    exePath: APP_EXE,
    args: ['--config', configPath],
    cwd: VOICE_CLONE_MODULE_DIR,
    timeoutMs,
    onProgress
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // ---------- 7. 解析启动器 RESULT ----------
  // 启动器实际输出两行（带 [RESULT] 前缀）：
  //   1) [RESULT] {"text":"...", "output_path":"...", "file_size":N, "speed":1}   ← 结果行
  //   2) [RESULT] {"End": true}                                                  ← 结束行
  // runAppExe 把两行分别保存到 resultData 和 endFlag，统一装进 result.{End,data,lastResult}。
  const payload = result.result || {}
  const data = payload.data || {}

  // 成功判定：拿到结果行，或收到了 End 标记
  const hasEnd = !!payload.End
  const hasResultData = !!(data.output_path || data.audio_path)

  // 错误判定：data.type === 'error' / msg / error 非空
  const type = data.type
  const msg = data.msg || data.message || ''
  const errMsg = data.error || ''

  if (type === 'error' || errMsg) {
    logger.error(`[voiceClone] failed: type=${type} errMsg=${errMsg} msg=${msg}`)
    return {
      success: false,
      error: `TTS 失败: ${errMsg || msg || '未知错误'}`
    }
  }

  if (!hasEnd && !hasResultData) {
    logger.error(`[voiceClone] incomplete result: payload=${JSON.stringify(payload)}`)
    return {
      success: false,
      error: `TTS 启动器未返回有效结果: ${JSON.stringify(payload).slice(0, 200)}`
    }
  }

  let finalPath = outputFilePath

  // 若启动器返回（或我们传入）的是文件夹，则在其中查找最新生成的音频文件
  if (finalPath && fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
    const candidates = fs
      .readdirSync(finalPath)
      .filter((f) => /\.(wav|mp3|flac|m4a|ogg|aac)$/i.test(f))
      .map((f) => ({ f, mtime: fs.statSync(path.join(finalPath, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
    if (candidates.length) {
      finalPath = path.join(finalPath, candidates[0].f)
      logger.info(`[voiceClone] picked latest audio in folder: ${finalPath}`)
    }
  }

  if (!finalPath || !fs.existsSync(finalPath) || fs.statSync(finalPath).isDirectory()) {
    logger.error(`[voiceClone] output file not found: ${finalPath}`)
    return {
      success: false,
      error: `TTS 返回成功但输出文件不存在: ${finalPath}`
    }
  }

  const outStat = fs.statSync(finalPath)
  if (outStat.size <= 0) {
    logger.error(`[voiceClone] output file is empty: ${finalPath}`)
    return {
      success: false,
      error: `TTS 输出文件为空: ${finalPath}`
    }
  }

  if (onProgress) onProgress(100, `complete! cost:${((Date.now() - t0) / 1000).toFixed(1)}s`)

  return {
    success: true,
    data: {
      // 启动器原始 RESULT 字段（保持向后兼容的字段命名）
      type: 'success',
      data: {
        text: data.text ?? text,
        prompt_text: data.prompt_text ?? finalPromptText,
        output_path: finalPath,
        file_size: outStat.size,
        speed: data.speed ? Number(data.speed) : 1.0,
        file_name: path.basename(finalPath, path.extname(finalPath))
      },
      start: t0,
      end: Date.now()
    }
  }
}

// =============================================================================
// spawn app.exe --config <cfg>，从 stdout 抓取启动器 JSON 输出
// =============================================================================
function runAppExe({ exePath, args, cwd, timeoutMs, onProgress }) {
  return new Promise((resolve) => {
    let stderrBuf = ''
    let stdoutBuf = ''
    let lastResult = null
    let resultData = null // 最近一次 [RESULT] {...} 的内容（结果行，含 output_path）
    let endFlag = false // 是否看到了 [RESULT] {"End": true}
    let timer

    const child = spawn(exePath, args, {
      cwd,
      windowsHide: true,
      detached: false,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    })

    logger.info(`[runAppExe] start pid=${child.pid} ${exePath} ${args.join(' ')}`)
    logger.info(`[voiceCloneService] app.exe started pid=${child.pid}`)

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
          error: `TTS 任务超时（${timeoutMs}ms）`
        })
      }, timeoutMs)
    }

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString()
      stdoutBuf += text
      logger.info(`[stdout] ${text.trimEnd()}`)
      // 按行尝试解析 JSON：找到最后一个 End:true 的对象作为 RESULT
      // 启动器输出格式： { "RESULT": {...}, "End": true } | { "progress": n, ... }
      // 实际观察到的格式： [RESULT] {"text":..., "End":true}  ← 带 [RESULT] 前缀
      // 两行结果：先打结果行，再打结束行。
      const lines = stdoutBuf.split(/\r?\n/)
      stdoutBuf = lines.pop() || ''
      for (const line of lines) {
        let s = line.trim()
        if (!s) continue
        // 剥启动器前缀：[RESULT] / [PROGRESS] / 启动器调试: / etc.
        const m = s.match(/^\[(?:RESULT|PROGRESS|END)\]\s*(.*)$/i)
        if (m) s = m[1].trim()
        // 跳过非 JSON 的说明行（"启动器调试: ..." 等）
        if (!s || s[0] !== '{') continue
        try {
          const obj = JSON.parse(s)
          if (obj && (obj.End === true || obj.END === true)) {
            // 结束标记行
            endFlag = true
            lastResult = obj
            if (onProgress) onProgress(95, 'running')
          } else if (typeof obj.progress === 'number' && onProgress) {
            // 进度行
            onProgress(Math.min(95, Math.max(0, obj.progress)), 'running')
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
      logger.info(`[voiceCloneService] app.exe close code=${code}`)

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
