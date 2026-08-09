// audio:*  —  音频元信息查询
//
// 通过 ffprobe 读取音频文件元数据：
//   - duration    时长（秒）
//   - bitrate     码率（bps）
//   - sampleRate  采样率（Hz）
//   - channels    声道数
//   - codec       编码格式（mp3 / aac / pcm_s16le / ...）
//   - format      容器格式（mp3 / wav / m4a / ...）
//
// 入参：绝对路径或相对路径（相对当前工作目录）
// 返回：{ success: true, data: { duration, bitrate, sampleRate, channels, codec, format } }

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import logger from '../log'
import { getFFmpegBin } from '../utils/index'
import { getAppRootPath } from './file.ipc'

/**
 * ffprobe 输出 JSON
 */
function probeJSON(ffprobePath, audioPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      audioPath
    ]
    const child = spawn(ffprobePath, args, { windowsHide: true })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d.toString('utf8')))
    child.stderr.on('data', (d) => (stderr += d.toString('utf8')))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        try {
          resolve({ json: JSON.parse(stdout), stderr })
        } catch (e) {
          reject(new Error(`解析 ffprobe 输出失败: ${e.message}; stdout=${stdout.slice(0, 300)}`))
        }
      } else {
        reject(new Error(`ffprobe 退出码 ${code}: ${stderr || stdout.slice(0, 300)}`))
      }
    })
  })
}

/**
 * 执行 ffmpeg 命令并返回结果
 * @returns {Promise<{success: boolean, stdout?: string, stderr?: string, code?: number, error?: string}>}
 */
function runFFmpeg(ffmpegPath, args) {
  return new Promise((resolve) => {
    const child = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d.toString('utf8')))
    child.stderr.on('data', (d) => (stderr += d.toString('utf8')))

    child.on('error', (err) => {
      resolve({ success: false, error: `ffmpeg 启动失败: ${err.message}` })
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr, code })
      } else {
        // ffmpeg 的进度/警告都打到 stderr；只在真正失败时返回 stderr
        const tail = (stderr || stdout || '').slice(-1500)
        resolve({
          success: false,
          code,
          stderr,
          stdout,
          error: `ffmpeg 退出码 ${code}: ${tail}`
        })
      }
    })
  })
}

/**
 * 从 ffprobe JSON 抽取音频流关键字段
 */
function extractInfo(json) {
  // 找到第一个 audio 流
  const audioStream = (json.streams || []).find((s) => s.codec_type === 'audio') || null
  const fmt = json.format || {}

  const duration = parseFloat(fmt.duration ?? audioStream?.duration ?? '0') || 0

  const bitrate = parseInt(fmt.bit_rate ?? audioStream?.bit_rate ?? '0', 10) || 0

  const sampleRate = parseInt(audioStream?.sample_rate ?? '0', 10) || 0

  const channels = parseInt(audioStream?.channels ?? '0', 10) || 0

  const codec = audioStream?.codec_name || ''
  const format = fmt.format_name || ''

  return {
    duration, // 秒
    bitrate, // bps
    sampleRate, // Hz
    channels, // 声道数
    codec, // mp3 / aac / pcm_s16le ...
    format, // mp3 / wav / m4a ...
    size: parseInt(fmt.size ?? '0', 10) || 0
  }
}

/**
 * 注册 audio:* 通道
 */
export function registerAudioIpc(ipcMain) {
  logger.info('[audio] registering audio ipc')
  /**
   * audio:getInfo(audioPath)
   *   → { success, data: { duration, bitrate, sampleRate, channels, codec, format, size } }
   */
  ipcMain.handle('audio:getInfo', async (_, audioPath) => {
    try {
      if (!audioPath || typeof audioPath !== 'string') {
        return { success: false, error: 'audioPath 不能为空' }
      }

      const absPath = path.isAbsolute(audioPath)
        ? audioPath
        : path.resolve(process.cwd(), audioPath)

      if (!fs.existsSync(absPath)) {
        return { success: false, error: `音频文件不存在: ${absPath}` }
      }

      const ffprobe = getFFmpegBin('ffprobe')
      if (!ffprobe) {
        return {
          success: false,
          error: '未找到 ffprobe.exe。请将 ffmpeg.exe / ffprobe.exe 放在 ./ffmpeg/bin/ 下'
        }
      }

      const { json } = await probeJSON(ffprobe, absPath)
      const info = extractInfo(json)

      if (!info.duration || info.duration <= 0) {
        return {
          success: false,
          error: '无法解析音频时长（文件可能已损坏或格式不受支持）'
        }
      }

      return { success: true, data: info }
    } catch (e) {
      logger.error(`[audio:getInfo] failed: ${e.message}`)
      return { success: false, error: e.message }
    }
  })

  // ------------------------------------------------------------
  // 音频裁剪（audio:trim）
  // ------------------------------------------------------------
  // 入参（两种形式都支持）：
  //   方式 A（位置参数）：(inputPath, outputPath, start, duration)
  //   方式 B（对象参数）：{ inputPath, outputPath, start, duration, opts? }
  //   opts?: {
  //     format?: string,                 // 输出容器（默认按输出后缀推断）
  //     codec?: string,                  // 音频编码（默认 copy 即不重编）
  //     sampleRate?: number,             // 重采样（仅 codec != 'copy' 时有效）
  //     channels?: 1 | 2,                // 单声道 / 立体声
  //     bitrate?: string,                // 码率，如 '128k'
  //     fadeIn?: number,                 // 淡入秒数
  //     fadeOut?: number,                // 淡出秒数
  //     normalize?: boolean,             // 响度归一化（loudnorm）
  //     overwrite?: boolean              // 存在则覆盖，默认 true
  //   }
  // 返回：
  //   { success: true, data: { outputPath, duration, format, size, codec } }
  //
  // 实现要点：
  //   - 默认走 stream copy（-c copy -ss before -t 精准片段），不重编码 → 速度极快
  //   - 若指定 codec != 'copy'，走 re-encode（精确裁剪 + 转码 + 淡入淡出等）
  //   - 自动保证 outputPath 父目录存在
  ipcMain.handle('audio:trim', async (_, ...args) => {
    logger.info('[audio:trim] args:', ...args)
    try {
      // ---------- 解析参数 ----------
      let params
      if (args.length === 1 && args[0] && typeof args[0] === 'object') {
        params = args[0]
      } else {
        params = {
          inputPath: args[0],
          outputPath: args[1],
          start: args[2],
          duration: args[3]
        }
      }

      const inputPath = params.inputPath
      const outputPath = params.outputPath
      const start = Number(params.start)
      const duration = Number(params.duration)
      const opts = params.opts || params.options || {}

      if (!inputPath || typeof inputPath !== 'string') {
        return { success: false, error: 'inputPath 不能为空' }
      }
      if (!outputPath || typeof outputPath !== 'string') {
        return { success: false, error: 'outputPath 不能为空' }
      }
      if (!Number.isFinite(start) || start < 0) {
        return { success: false, error: 'start 必须为非负数（秒）' }
      }
      if (!Number.isFinite(duration) || duration <= 0) {
        return { success: false, error: 'duration 必须为正数（秒）' }
      }

      // 路径：绝对路径直接用；相对路径以 cwd 为基准
      const absInput = path.isAbsolute(inputPath)
        ? inputPath
        : path.resolve(process.cwd(), inputPath)
      const absOutput = path.isAbsolute(outputPath)
        ? outputPath
        : path.resolve(process.cwd(), outputPath)

      // 输入校验
      if (!fs.existsSync(absInput)) {
        return { success: false, error: `输入文件不存在: ${absInput}` }
      }
      const inputStat = fs.statSync(absInput)
      if (inputStat.isDirectory()) {
        return { success: false, error: '输入不能是目录' }
      }

      // 输出目录
      fs.mkdirSync(path.dirname(absOutput), { recursive: true })

      // 是否覆盖
      const overwrite = opts.overwrite !== false
      if (!overwrite && fs.existsSync(absOutput)) {
        return { success: false, error: '输出文件已存在（overwrite=false）: ' + absOutput }
      }

      if (overwrite && fs.existsSync(absOutput)) {
        try {
          fs.unlinkSync(absOutput)
        } catch (err) {
          console.error('删除失败', err)
        }
      }

      const ffmpeg = getFFmpegBin('ffmpeg')
      if (!ffmpeg) {
        return {
          success: false,
          error: '未找到 ffmpeg.exe。请将 ffmpeg.exe / ffprobe.exe 放在 ./ffmpeg/bin/ 下'
        }
      }

      // ---------- 构建 ffmpeg 参数 ----------
      // codec 解析：
      //   - 显式传 opts.codec === 'copy' → stream copy（要求源编码与目标容器兼容）
      //   - 显式传其他 codec → 用指定编码
      //   - 未传 opts.codec → 按目标容器选默认编码（避免 opus→wav 这种容器不兼容场景）
      const outExt = path.extname(absOutput).toLowerCase().replace(/^\./, '') || 'wav'
      const format = opts.format || outExt
      const containerDefaultCodec = {
        wav: 'pcm_s16le',
        mp3: 'libmp3lame',
        m4a: 'aac',
        aac: 'aac',
        flac: 'flac',
        ogg: 'libvorbis',
        opus: 'libopus'
      }
      const codec =
        typeof opts.codec === 'string' && opts.codec.trim()
          ? opts.codec.trim()
          : containerDefaultCodec[outExt] || 'pcm_s16le'
      const wantReencode = codec !== 'copy'

      const args2 = ['-y']
      // stream copy 模式 -ss 放在 -i 之前（快速但不精确到帧）
      // re-encode 模式 -ss 放在 -i 之后（精确）
      if (!wantReencode) {
        args2.push('-ss', String(start))
        args2.push('-i', absInput)
        args2.push('-t', String(duration))
        args2.push('-c', 'copy')
        args2.push('-avoid_negative_ts', 'make_zero')
      } else {
        args2.push('-i', absInput)
        args2.push('-ss', String(start))
        args2.push('-t', String(duration))

        // 编码器
        args2.push('-c:a', codec)

        // 重采样
        if (opts.sampleRate && Number.isFinite(opts.sampleRate)) {
          args2.push('-ar', String(Math.floor(Number(opts.sampleRate))))
        }
        // 声道
        if (opts.channels && (opts.channels === 1 || opts.channels === 2)) {
          args2.push('-ac', String(opts.channels))
        }
        // 码率
        if (opts.bitrate && typeof opts.bitrate === 'string') {
          args2.push('-b:a', String(opts.bitrate))
        }
        // 容器格式
        args2.push('-f', format)

        // 淡入淡出（仅 re-encode 时支持）
        let audioFilter = []
        if (opts.fadeIn && Number(opts.fadeIn) > 0) {
          audioFilter.push(`afade=t=in:st=0:d=${Number(opts.fadeIn)}`)
        }
        if (opts.fadeOut && Number(opts.fadeOut) > 0) {
          // fadeOut 必须从 (duration - fadeOut) 开始
          const fadeOutStart = Math.max(0, duration - Number(opts.fadeOut))
          audioFilter.push(`afade=t=out:st=${fadeOutStart}:d=${Number(opts.fadeOut)}`)
        }
        if (audioFilter.length > 0) {
          args2.push('-af', audioFilter.join(','))
        }
        // 响度归一化
        if (opts.normalize) {
          // 二次扫描以保证准确；这里用单次简化
          args2.push(
            '-af',
            (audioFilter.length ? audioFilter.join(',') + ',' : '') +
              'loudnorm=I=-16:TP=-1.5:LRA=11'
          )
        }
      }

      args2.push(absOutput)

      logger.info(`[audio:trim] ffmpeg ${args2.join(' ')}`)

      // ---------- 执行 ----------
      const result = await runFFmpeg(ffmpeg, args2)
      if (!result.success) {
        return { success: false, error: result.error || 'ffmpeg 裁剪失败' }
      }

      // ---------- 校验输出 ----------
      if (!fs.existsSync(absOutput)) {
        return { success: false, error: '输出文件未生成' }
      }
      const outputStat = fs.statSync(absOutput)
      if (outputStat.size <= 0) {
        return { success: false, error: '输出文件为空' }
      }

      return {
        success: true,
        data: {
          outputPath: absOutput,
          duration,
          format,
          codec: wantReencode ? codec : 'copy',
          size: outputStat.size,
          start,
          mode: wantReencode ? 'reencode' : 'stream-copy'
        }
      }
    } catch (e) {
      logger.error(`[audio:trim] failed: ${e.message}`)
      return { success: false, error: e.message || '音频裁剪失败' }
    }
  })

  // ------------------------------------------------------------
  // 音频编码转换（audio:convert）
  // ------------------------------------------------------------
  // 入参：{
  //   inputPath: string,                    // 必填 输入音频路径
  //   outputPath: string,                   // 必填 输出音频路径
  //   codec?: string,                       // 可选 输出编码（mp3 / aac / wav / pcm_s16le ...），
  //                                          //       缺省按输出文件后缀自动选择
  //   bitrate?: string,                     // 可选 输出码率（如 '192k'），仅对有损编码生效
  //   sampleRate?: number,                  // 可选 采样率 Hz
  //   channels?: number,                    // 可选 声道数（1=mono, 2=stereo）
  // }
  // 返回：{ success, data: { outputPath, codec, format, size, duration? } }
  ipcMain.handle('audio:convert', async (_, params) => {
    logger.info('[audio:convert]', params)
    try {
      const { inputPath, outputPath } = params || {}
      if (!inputPath || typeof inputPath !== 'string') {
        return { success: false, error: 'inputPath 不能为空' }
      }
      if (!outputPath || typeof outputPath !== 'string') {
        return { success: false, error: 'outputPath 不能为空' }
      }
      if (!fs.existsSync(inputPath)) {
        return { success: false, error: `输入文件不存在: ${inputPath}` }
      }

      const ffmpeg = getFFmpegBin('ffmpeg')
      if (!ffmpeg) {
        return { success: false, error: '未找到 ffmpeg.exe，请确认 ./ffmpeg/bin/ 下已放置' }
      }

      const absInput = path.isAbsolute(inputPath) ? inputPath : path.resolve(inputPath)
      const absOutput = path.isAbsolute(outputPath) ? outputPath : path.resolve(outputPath)
      const outDir = path.dirname(absOutput)
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
      }

      // 按输出后缀推断编码器和容器；codec 显式传入优先
      const ext = path.extname(absOutput).slice(1).toLowerCase()
      const codecMap = {
        mp3: { codec: 'libmp3lame', format: 'mp3', lossy: true },
        wav: { codec: 'pcm_s16le', format: 'wav', lossy: false },
        m4a: { codec: 'aac', format: 'mp4', lossy: true },
        aac: { codec: 'aac', format: 'adts', lossy: true },
        flac: { codec: 'flac', format: 'flac', lossy: false },
        ogg: { codec: 'libvorbis', format: 'ogg', lossy: true },
        opus: { codec: 'libopus', format: 'ogg', lossy: true }
      }
      const fmtInfo = codecMap[ext] || codecMap.mp3
      const codec =
        typeof params.codec === 'string' && params.codec.trim() ? params.codec.trim() : fmtInfo.codec
      const format =
        typeof params.format === 'string' && params.format.trim() ? params.format.trim() : fmtInfo.format
      const bitrate =
        typeof params.bitrate === 'string' && /^\d{2,5}k$/i.test(params.bitrate)
          ? params.bitrate
          : '192k'

      const args = ['-y', '-i', absInput, '-vn', '-c:a', codec]
      // 采样率 / 声道
      if (Number.isFinite(params.sampleRate)) {
        args.push('-ar', String(Math.max(8000, Math.min(192000, Math.floor(params.sampleRate)))))
      }
      if (Number.isFinite(params.channels)) {
        args.push('-ac', String(Math.max(1, Math.min(8, Math.floor(params.channels)))))
      }
      // 码率：仅对有损编码生效（无损格式如 wav / flac 忽略）
      const isLossless = ['pcm_s16le', 'pcm_s24le', 'pcm_s32le', 'flac'].includes(codec)
      if (!isLossless) {
        args.push('-b:a', bitrate)
      }
      args.push('-f', format, absOutput)

      logger.info(`[audio:convert] ffmpeg ${args.join(' ')}`)

      const result = await runFFmpeg(ffmpeg, args)
      if (!result.success) {
        return { success: false, error: result.error || '音频转换失败' }
      }

      if (!fs.existsSync(absOutput)) {
        return { success: false, error: '输出文件未生成' }
      }
      const stat = fs.statSync(absOutput)
      if (stat.size <= 0) {
        return { success: false, error: '输出文件为空' }
      }

      return {
        success: true,
        data: {
          inputPath: absInput,
          outputPath: absOutput,
          codec,
          format,
          size: stat.size,
          bitrate: isLossless ? null : bitrate
        }
      }
    } catch (e) {
      logger.error(`[audio:convert] failed: ${e.message}`)
      return { success: false, error: e.message || '音频转换失败' }
    }
  })

  /**
   * audio:saveUpload(buffer, opts)
   *   - buffer: Uint8Array | ArrayBuffer | Buffer  录音 / 任意音频二进制
   *   - opts?:   { filename?: string, ext?: string }
   *   → { success, data: { audioPath, size, duration? } }
   *
   * 把音频二进制写入 `<appRoot>/audios/` 目录，文件名格式：
   *   record_<timestamp>_<random>.<ext>   （缺省 ext = webm）
   * 写入失败 / buffer 非法 → 返回 { success: false, error }
   */
  ipcMain.handle('audio:saveUpload', async (_, buffer, opts = {}) => {
    logger.info('[audio:saveUpload]')

    // 1. buffer 兼容：Uint8Array / ArrayBuffer / Buffer / plain object（IPC clone）
    let audioBuf
    try {
      if (Buffer.isBuffer(buffer)) {
        audioBuf = buffer
      } else if (buffer instanceof Uint8Array) {
        audioBuf = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      } else if (buffer instanceof ArrayBuffer) {
        audioBuf = Buffer.from(buffer)
      } else if (buffer && typeof buffer === 'object') {
        // 兜底：IPC structured clone 后的 plain object
        // 情况 1：{ 0: byte0, 1: byte1, ... } —— 类 TypedArray 视图
        // 情况 2：{ byteLength, slice } —— ArrayBuffer-like
        if (Number.isFinite(buffer.byteLength) && typeof buffer.slice === 'function') {
          audioBuf = Buffer.from(buffer.slice(0))
        } else if (Number.isFinite(buffer.byteLength)) {
          // 来自 TypedArray view 但原型丢失
          const arr = new Uint8Array(buffer.byteLength)
          for (let i = 0; i < buffer.byteLength; i++) {
            arr[i] = buffer[i] ?? 0
          }
          audioBuf = Buffer.from(arr)
        } else {
          return { success: false, error: '音频数据格式无法识别' }
        }
      } else {
        return { success: false, error: '音频数据为空' }
      }
    } catch (e) {
      logger.error('[audio:saveUpload] buffer 解析失败', e)
      return { success: false, error: '音频数据解析失败：' + e.message }
    }

    if (!audioBuf || audioBuf.length === 0) {
      return { success: false, error: '音频数据为空' }
    }

    // 2. 输出目录：<appRoot>/audios，不存在则创建
    let outputDir
    try {
      outputDir = path.join(getAppRootPath(), 'audios')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
    } catch (e) {
      logger.error('[audio:saveUpload] 创建输出目录失败', e)
      return { success: false, error: '创建输出目录失败：' + e.message }
    }

    // 3. 目标文件名
    const safeExt = (() => {
      const e = (opts?.ext || opts?.filename?.split('.').pop() || 'webm')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
      return e || 'webm'
    })()

    const baseName = (opts?.filename?.replace(/\.[^.]+$/, '') || 'record').replace(
      /[^a-zA-Z0-9_\-]/g,
      '_'
    )
    const stamp = Date.now()
    const rand = Math.floor(Math.random() * 1e6)
    const fileName = `${baseName}_${stamp}_${rand}.${safeExt}`
    const outputPath = path.join(outputDir, fileName)

    // 4. 写入文件
    try {
      fs.writeFileSync(outputPath, audioBuf)
      logger.info(`[audio:saveUpload] 写入完成 ${outputPath} (${audioBuf.length} bytes)`)
    } catch (e) {
      logger.error('[audio:saveUpload] 写入失败', outputPath, e)
      return { success: false, error: '写入音频失败：' + e.message }
    }

    return {
      success: true,
      data: {
        audioPath: outputPath,
        size: audioBuf.length
      }
    }
  })
}
